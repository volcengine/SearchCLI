// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import './node-bootstrap';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { jsonrepair } from 'jsonrepair';
import { resolveCliDefaults } from './user-config';

export interface PromptInferenceField {
  name: string;
  inferredType: string;
  fields?: PromptInferenceField[];
}

export interface PromptSchemaInferenceResult {
  fieldMeanings: Record<string, string>;
  datasetDescription?: string;
  filterFields?: string[];
  suggestFields?: string[];
  indexFields?: string[];
  notUseFields?: string[];
  attrFields?: Record<string, string[]>;
}

interface SchemaPromptFile {
  schema_agent?: {
    meaning_infer_prompt?: string;
    user_event_meaning_infer_prompt?: string;
    desc_infer_prompt?: string;
    filter_infer_prompt?: string;
    suggest_infer_prompt?: string;
    index_infer_prompt?: string;
    chat_infer_prompt?: string;
    attr_infer_prompts?: Record<string, string>;
  };
}

interface LlmClientConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  accessKeyId?: string;
  secretKey?: string;
  region: string;
  service: string;
  timeoutMs: number;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

let cachedPromptFile: SchemaPromptFile | null | undefined;

export async function inferSchemaMetadataWithPrompt(options: {
  fields: PromptInferenceField[];
  records: Array<Record<string, unknown>>;
  datasetType?: 'item' | 'video' | 'user_event';
  attrPromptKey?: string;
}): Promise<PromptSchemaInferenceResult> {
  const promptFile = await loadSchemaPromptFile();
  const llmConfig = resolveLlmClientConfig();
  const sampleRecords = options.records.slice(0, 10);
  const datasetType = options.datasetType ?? 'item';
  const language = detectPromptLanguage(sampleRecords);
  const fallback = buildLocalPromptFallback({
    fields: options.fields,
    records: sampleRecords,
    datasetType,
    attrPromptKey: options.attrPromptKey,
    language
  });

  if (sampleRecords.length === 0) {
    return { fieldMeanings: {} };
  }
  if (!promptFile?.schema_agent) {
    return fallback;
  }
  if (!llmConfig) {
    return fallback;
  }

  const schema = buildPromptSchema(options.fields);
  const fieldPaths = flattenFieldPaths(options.fields);
  const fieldMeanings: Record<string, string> = {};
  const meaningPrompt =
    datasetType === 'user_event'
      ? promptFile.schema_agent.user_event_meaning_infer_prompt
      : promptFile.schema_agent.meaning_infer_prompt;

  if (meaningPrompt) {
    for (const fieldPath of fieldPaths) {
      const prompt = renderPrompt(meaningPrompt, {
        field: fieldPath,
        language
      });
      try {
        const raw = await requestChatCompletion(llmConfig, prompt, {
          Data: sampleRecords,
          Schema: schema
        });
        const parsed = parseJsonResponse(raw);
        const meaning = extractMeaning(parsed);
        if (meaning) {
          fieldMeanings[fieldPath] = meaning;
        }
      } catch {
        // Fall back to heuristic descriptions when LLM inference fails.
      }
    }
  }

  let datasetDescription: string | undefined;
  if (promptFile.schema_agent.desc_infer_prompt) {
    const prompt = renderPrompt(promptFile.schema_agent.desc_infer_prompt, { language });
    try {
      const raw = await requestChatCompletion(llmConfig, prompt, {
        Data: sampleRecords,
        Schema: schema
      });
      const parsed = parseJsonResponse(raw);
      if (parsed && typeof parsed === 'object' && typeof (parsed as Record<string, unknown>).Dataset_Description === 'string') {
        const value = String((parsed as Record<string, unknown>).Dataset_Description).trim();
        if (value.length > 0) {
          datasetDescription = value;
        }
      }
    } catch {
      // Fall back to the existing generated dataset description.
    }
  }

  const meaningTree = buildMeaningTreeFromMap(fieldMeanings, options.fields);

  const filterFields = await inferNamedFieldPathGroups(
    llmConfig,
    promptFile.schema_agent.filter_infer_prompt,
    { language },
    { Dataset_Description: datasetDescription ?? '', Data: sampleRecords, Meaning: meaningTree },
    ['filter', 'enum', 'num', 'time', 'lon', 'lat']
  );

  const suggestFields = await inferSimpleStringArrayFieldPaths(
    llmConfig,
    promptFile.schema_agent.suggest_infer_prompt,
    { language },
    { Dataset_Description: datasetDescription ?? '', Data: sampleRecords, Meaning: meaningTree },
    'suggest'
  );

  const indexFields = await inferSimpleStringArrayFieldPaths(
    llmConfig,
    promptFile.schema_agent.index_infer_prompt,
    { language },
    { Dataset_Description: datasetDescription ?? '', Data: sampleRecords, Meaning: meaningTree },
    'search'
  );

  const notUseFields = await inferSimpleStringArrayFieldPaths(
    llmConfig,
    promptFile.schema_agent.chat_infer_prompt,
    { language },
    { Dataset_Description: datasetDescription ?? '', Data: sampleRecords, Meaning: meaningTree },
    'NotUse'
  );

  const attrFields = await inferAttrFieldGroups(
    llmConfig,
    promptFile.schema_agent.attr_infer_prompts,
    options.attrPromptKey ?? datasetType,
    { language },
    { Dataset_Description: datasetDescription ?? '', Data: sampleRecords, Meaning: meaningTree }
  );

  return {
    fieldMeanings: { ...fallback.fieldMeanings, ...fieldMeanings },
    datasetDescription: datasetDescription ?? fallback.datasetDescription,
    filterFields: filterFields ?? fallback.filterFields,
    suggestFields: suggestFields ?? fallback.suggestFields,
    indexFields: indexFields ?? fallback.indexFields,
    notUseFields: notUseFields ?? fallback.notUseFields,
    attrFields: attrFields ?? fallback.attrFields
  };
}

export async function inferBindingFieldSelectionsWithPrompt(options: {
  fields: PromptInferenceField[];
  records: Array<Record<string, unknown>>;
  datasetType?: 'item' | 'video';
  datasetDescription?: string;
  fieldMeanings?: Record<string, string>;
}): Promise<PromptSchemaInferenceResult> {
  const promptFile = await loadSchemaPromptFile();
  const llmConfig = resolveLlmClientConfig();
  const sampleRecords = options.records.slice(0, 10);
  const datasetType = options.datasetType ?? 'item';
  const language = detectPromptLanguage(sampleRecords);
  const fallback = buildLocalPromptFallback({
    fields: options.fields,
    records: sampleRecords,
    datasetType,
    attrPromptKey: datasetType,
    language
  });
  const mergedFieldMeanings = {
    ...fallback.fieldMeanings,
    ...sanitizeFieldMeanings(options.fieldMeanings)
  };
  const datasetDescription =
    typeof options.datasetDescription === 'string' && options.datasetDescription.trim().length > 0
      ? options.datasetDescription.trim()
      : fallback.datasetDescription;

  if (sampleRecords.length === 0) {
    return {
      fieldMeanings: mergedFieldMeanings,
      datasetDescription,
      filterFields: fallback.filterFields,
      suggestFields: fallback.suggestFields,
      indexFields: fallback.indexFields,
      notUseFields: fallback.notUseFields,
      attrFields: fallback.attrFields
    };
  }
  if (!promptFile?.schema_agent || !llmConfig) {
    return {
      fieldMeanings: mergedFieldMeanings,
      datasetDescription,
      filterFields: fallback.filterFields,
      suggestFields: fallback.suggestFields,
      indexFields: fallback.indexFields,
      notUseFields: fallback.notUseFields,
      attrFields: fallback.attrFields
    };
  }

  const meaningTree = buildMeaningTreeFromMap(mergedFieldMeanings, options.fields);
  const promptPayload = {
    Dataset_Description: datasetDescription ?? '',
    Data: sampleRecords,
    Meaning: meaningTree
  };

  const filterFields = await inferNamedFieldPathGroups(
    llmConfig,
    promptFile.schema_agent.filter_infer_prompt,
    { language },
    promptPayload,
    ['filter', 'enum', 'num', 'time', 'lon', 'lat']
  );

  const suggestFields = await inferSimpleStringArrayFieldPaths(
    llmConfig,
    promptFile.schema_agent.suggest_infer_prompt,
    { language },
    promptPayload,
    'suggest'
  );

  const indexFields = await inferSimpleStringArrayFieldPaths(
    llmConfig,
    promptFile.schema_agent.index_infer_prompt,
    { language },
    promptPayload,
    'search'
  );

  return {
    fieldMeanings: mergedFieldMeanings,
    datasetDescription,
    filterFields: filterFields ?? fallback.filterFields,
    suggestFields: suggestFields ?? fallback.suggestFields,
    indexFields: indexFields ?? fallback.indexFields,
    notUseFields: fallback.notUseFields,
    attrFields: fallback.attrFields
  };
}

async function inferSimpleStringArrayFieldPaths(
  llmConfig: LlmClientConfig,
  promptTemplate: string | undefined,
  replacements: Record<string, string>,
  inputPayload: Record<string, unknown>,
  outputKey: string
): Promise<string[] | undefined> {
  if (!promptTemplate) return undefined;
  const prompt = renderPrompt(promptTemplate, replacements);
  try {
    const raw = await requestChatCompletion(llmConfig, prompt, inputPayload);
    const parsed = parseJsonResponse(raw);
    if (!isRecord(parsed)) return undefined;
    const value = parsed[outputKey];
    if (!Array.isArray(value)) return undefined;
    return value.filter(v => typeof v === 'string' && v.trim().length > 0).map(v => v.trim());
  } catch {
    return undefined;
  }
}

async function inferNamedFieldPathGroups(
  llmConfig: LlmClientConfig,
  promptTemplate: string | undefined,
  replacements: Record<string, string>,
  inputPayload: Record<string, unknown>,
  keys: string[]
): Promise<string[] | undefined> {
  if (!promptTemplate) return undefined;
  const prompt = renderPrompt(promptTemplate, replacements);
  try {
    const raw = await requestChatCompletion(llmConfig, prompt, inputPayload);
    const parsed = parseJsonResponse(raw);
    if (!isRecord(parsed)) return undefined;
    const values = keys.flatMap(key => normalizeStringArray(parsed[key])); 
    return values.length > 0 ? dedupeStrings(values) : undefined;
  } catch {
    return undefined;
  }
}

async function inferAttrFieldGroups(
  llmConfig: LlmClientConfig,
  prompts: Record<string, string> | undefined,
  key: string,
  replacements: Record<string, string>,
  inputPayload: Record<string, unknown>
): Promise<Record<string, string[]> | undefined> {
  if (!prompts) return undefined;
  const template = prompts[key] ?? prompts.general;
  if (!template) return undefined;
  const prompt = renderPrompt(template, replacements);
  try {
    const raw = await requestChatCompletion(llmConfig, prompt, inputPayload);
    const parsed = parseJsonResponse(raw);
    if (!isRecord(parsed)) return undefined;
    const result: Record<string, string[]> = {};
    for (const [attrName, value] of Object.entries(parsed)) {
      const normalized = normalizeStringArray(value);
      if (normalized.length > 0) {
        result[attrName] = normalized;
      }
    }
    return Object.keys(result).length > 0 ? result : undefined;
  } catch {
    return undefined;
  }
}

function buildMeaningTreeFromMap(meanings: Record<string, string>, fields: PromptInferenceField[]): Array<Record<string, unknown>> {
  function walk(fieldList: PromptInferenceField[], prefix = ''): Array<Record<string, unknown>> {
    return fieldList.map(field => {
      const pathName = prefix ? `${prefix}.${field.name}` : field.name;
      const node: Record<string, unknown> = {
        Name: field.name,
        ...(meanings[pathName] ? { Meaning: meanings[pathName] } : {})
      };
      if (field.fields && field.fields.length > 0) {
        node.Fields = walk(field.fields, pathName);
      }
      return node;
    });
  }
  return walk(fields);
}

async function loadSchemaPromptFile(): Promise<SchemaPromptFile | null> {
  if (cachedPromptFile !== undefined) {
    return cachedPromptFile;
  }

  for (const candidate of candidatePromptPaths()) {
    try {
      const raw = await readFile(candidate, 'utf8');
      cachedPromptFile = JSON.parse(raw) as SchemaPromptFile;
      return cachedPromptFile;
    } catch {
      // Continue to the next candidate path.
    }
  }

  cachedPromptFile = null;
  return cachedPromptFile;
}

function candidatePromptPaths(): string[] {
  return [
    path.resolve(__dirname, '..', '..', 'skills', 'schema.prompt'),
    path.resolve(process.cwd(), 'skills', 'schema.prompt'),
    path.resolve(path.dirname(process.execPath), '..', 'skills', 'schema.prompt'),
    path.resolve(path.dirname(process.execPath), 'skills', 'schema.prompt')
  ];
}

function resolveLlmClientConfig(): LlmClientConfig | null {
  const defaults = resolveCliDefaults({});
  if (!defaults.llmBaseUrl || !defaults.llmModel) {
    return null;
  }
  if (!defaults.llmApiKey && !(defaults.llmAccessKeyId && defaults.llmSecretKey)) {
    return null;
  }

  return {
    baseUrl: defaults.llmBaseUrl,
    model: defaults.llmModel,
    apiKey: defaults.llmApiKey,
    accessKeyId: defaults.llmAccessKeyId,
    secretKey: defaults.llmSecretKey,
    region: defaults.llmRegion ?? 'cn-beijing',
    service: defaults.llmService ?? 'ark',
    timeoutMs: defaults.timeoutMs
  };
}

async function requestChatCompletion(
  config: LlmClientConfig,
  systemPrompt: string,
  inputPayload: Record<string, unknown>
): Promise<string> {
  const url = buildLlmChatCompletionUrl(config.baseUrl);
  const body = JSON.stringify({
    model: config.model,
    temperature: 0,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(inputPayload, null, 2) }
    ]
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: await buildLlmHeaders(config, url, body),
    body,
    signal: AbortSignal.timeout(config.timeoutMs)
  });

  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(`LLM request failed: ${response.status} ${response.statusText}\n${rawText}`);
  }

  const parsed = parseJsonResponse(rawText) as ChatCompletionResponse;
  const content = extractChatContent(parsed);
  if (!content) {
    throw new Error('LLM response did not include any message content.');
  }
  return content;
}

function buildLlmChatCompletionUrl(baseUrl: string): URL {
  const normalized = baseUrl.replace(/\/+$/u, '');
  if (/\/chat\/completions$/u.test(normalized)) {
    return new URL(normalized);
  }
  return new URL(`${normalized}/chat/completions`);
}

async function buildLlmHeaders(config: LlmClientConfig, url: URL, body: string): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    accept: 'application/json',
    'content-type': 'application/json'
  };

  if (config.apiKey) {
    headers.authorization = `Bearer ${config.apiKey}`;
    return headers;
  }

  if (!config.accessKeyId || !config.secretKey) {
    throw new Error('Missing LLM credentials.');
  }

  const { Signer } = await import('@volcengine/openapi');
  headers.host = url.host;
  const signer = new Signer(
    {
      region: config.region,
      method: 'POST',
      pathname: url.pathname,
      params: Object.fromEntries(url.searchParams.entries()),
      headers,
      body
    },
    config.service
  );

  signer.addAuthorization({
    accessKeyId: config.accessKeyId,
    secretKey: config.secretKey,
    sessionToken: ''
  });

  return headers;
}

function buildPromptSchema(fields: PromptInferenceField[]): Array<Record<string, unknown>> {
  return fields.map(field => ({
    Name: field.name,
    Type: field.inferredType,
    ...(field.fields && field.fields.length > 0 ? { Fields: buildPromptSchema(field.fields) } : {})
  }));
}

function flattenFieldPaths(fields: PromptInferenceField[], prefix = ''): string[] {
  const results: string[] = [];
  for (const field of fields) {
    const fullName = prefix ? `${prefix}.${field.name}` : field.name;
    results.push(fullName);
    if (field.fields && field.fields.length > 0) {
      results.push(...flattenFieldPaths(field.fields, fullName));
    }
  }
  return results;
}

function renderPrompt(template: string, replacements: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(replacements)) {
    rendered = rendered.replaceAll(`{${key}}`, value);
  }
  return rendered;
}

function parseJsonResponse(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const jsonSlice = extractJsonSlice(trimmed);
    const repaired = jsonrepair(jsonSlice);
    return JSON.parse(repaired) as unknown;
  }
}

function extractJsonSlice(text: string): string {
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let start = -1;
  if (firstBrace === -1) {
    start = firstBracket;
  } else if (firstBracket === -1) {
    start = firstBrace;
  } else {
    start = Math.min(firstBrace, firstBracket);
  }
  if (start === -1) {
    return text;
  }

  const lastBrace = text.lastIndexOf('}');
  const lastBracket = text.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  if (end === -1 || end < start) {
    return text.slice(start);
  }
  return text.slice(start, end + 1);
}

function extractChatContent(response: ChatCompletionResponse): string | undefined {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map(entry => (typeof entry?.text === 'string' ? entry.text : ''))
      .join('')
      .trim();
  }
  return undefined;
}

function extractMeaning(value: unknown): string | undefined {
  const schema = isRecord(value) ? value.Schema : undefined;
  if (!Array.isArray(schema) || schema.length === 0) {
    return undefined;
  }

  return walkMeaning(schema[0]);
}

function walkMeaning(node: unknown): string | undefined {
  if (!isRecord(node)) {
    return undefined;
  }
  const fields = Array.isArray(node.Fields) ? node.Fields : undefined;
  if (fields && fields.length > 0) {
    return walkMeaning(fields[0]);
  }
  if (typeof node.Meaning === 'string') {
    const value = node.Meaning.trim();
    return value.length > 0 ? value : undefined;
  }
  return undefined;
}

function detectPromptLanguage(records: Array<Record<string, unknown>>): string {
  const serialized = JSON.stringify(records);
  return /[\u4e00-\u9fff]/u.test(serialized) ? '中文' : 'English';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(v => typeof v === 'string' && v.trim().length > 0).map(v => v.trim());
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function sanitizeFieldMeanings(value: Record<string, string> | undefined): Record<string, string> {
  if (!value) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string')
      .map(([key, meaning]) => [key.trim(), meaning.trim()])
      .filter(([key, meaning]) => key.length > 0 && meaning.length > 0)
  );
}

function buildLocalPromptFallback(options: {
  fields: PromptInferenceField[];
  records: Array<Record<string, unknown>>;
  datasetType: 'item' | 'video' | 'user_event';
  attrPromptKey?: string;
  language: string;
}): PromptSchemaInferenceResult {
  const flattened = flattenFieldDefinitions(options.fields);
  const notUseFields = flattened
    .filter(field => isRedundantForSearch(field.path, getValuesAtPath(options.records, field.path)))
    .map(field => field.path);

  const attrFields = inferFallbackAttrFields(
    flattened,
    options.records,
    options.datasetType,
    options.attrPromptKey ?? options.datasetType
  );
  const fieldMeanings = Object.fromEntries(
    flattened.map(field => [
      field.path,
      inferFallbackMeaning(field.path, field.inferredType, getValuesAtPath(options.records, field.path), options.datasetType, options.language)
    ])
  );

  const filterFields = dedupeStrings(
    flattened
      .filter(field => isCandidateFilterField(field.path, field.inferredType, getValuesAtPath(options.records, field.path), notUseFields))
      .map(field => field.path)
  );

  const suggestFields = dedupeStrings(
    flattened
      .filter(field => isCandidateSuggestField(field.path, field.inferredType, getValuesAtPath(options.records, field.path), notUseFields))
      .map(field => field.path)
  );

  const indexFields = dedupeStrings(
    flattened
      .filter(field => isCandidateIndexField(field.path, field.inferredType, getValuesAtPath(options.records, field.path), notUseFields))
      .map(field => field.path)
  );

  return {
    fieldMeanings,
    datasetDescription: inferFallbackDatasetDescription(flattened.map(field => field.path), options.datasetType, options.language),
    filterFields,
    suggestFields,
    indexFields,
    notUseFields,
    attrFields
  };
}

function flattenFieldDefinitions(
  fields: PromptInferenceField[],
  prefix = ''
): Array<{ path: string; inferredType: string }> {
  const results: Array<{ path: string; inferredType: string }> = [];
  for (const field of fields) {
    const pathName = prefix ? `${prefix}.${field.name}` : field.name;
    results.push({ path: pathName, inferredType: field.inferredType });
    if (field.fields && field.fields.length > 0) {
      results.push(...flattenFieldDefinitions(field.fields, pathName));
    }
  }
  return results;
}

function getValuesAtPath(records: Array<Record<string, unknown>>, fieldPath: string): unknown[] {
  const segments = fieldPath.split('.');
  const values = records.flatMap(record => collectNestedValues(record, segments));
  return values.filter(value => value !== undefined && value !== null);
}

function collectNestedValues(value: unknown, segments: string[]): unknown[] {
  if (segments.length === 0) {
    if (Array.isArray(value)) {
      return value.flatMap(item => (item === undefined || item === null ? [] : [item]));
    }
    return value === undefined || value === null ? [] : [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => collectNestedValues(item, segments));
  }
  if (!isRecord(value)) {
    return [];
  }
  const [head, ...tail] = segments;
  return collectNestedValues(value[head], tail);
}

function inferFallbackDatasetDescription(
  fieldPaths: string[],
  datasetType: 'item' | 'video' | 'user_event',
  language: string
): string {
  const isZh = language === '中文';
  if (datasetType === 'user_event') {
    return isZh ? '用户行为事件数据集' : 'User behavior event dataset';
  }
  if (datasetType === 'video') {
    if (fieldPaths.some(path => ['director', 'actors', 'episode_summary', 'genres'].includes(lastToken(path)))) {
      return isZh ? '影视视频内容数据集' : 'Video content dataset for film and TV media';
    }
    return isZh ? '视频内容数据集' : 'Video content dataset';
  }
  if (fieldPaths.some(path => ['price', 'brand', 'category'].includes(lastToken(path)))) {
    return isZh ? '电商商品数据集' : 'E-commerce product dataset';
  }
  if (fieldPaths.some(path => ['summary', 'description', 'content', 'body'].includes(lastToken(path)))) {
    return isZh ? '内容数据集' : 'Content dataset';
  }
  return isZh ? '物品数据集' : 'Item dataset';
}

function inferFallbackMeaning(
  fieldPath: string,
  inferredType: string,
  values: unknown[],
  datasetType: 'item' | 'video' | 'user_event',
  language: string
): string {
  const isZh = language === '中文';
  const token = lastToken(fieldPath);
  const examples = values.slice(0, 3);

  const exact = isZh
    ? exactChineseMeaning(token, datasetType)
    : exactEnglishMeaning(token, datasetType);
  if (exact) return exact;

  if (looksLikeImageField(fieldPath, values)) {
    return isZh ? '图片或封面资源链接' : 'Image or cover resource URL';
  }
  if (looksLikeVideoField(fieldPath, values)) {
    return isZh ? '视频播放或下载链接' : 'Video playback or download URL';
  }
  if (looksLikeLinkField(fieldPath, values)) {
    return isZh ? '详情页或外部页面链接' : 'Detail page or external page URL';
  }
  if (looksLikeTimestampField(fieldPath, values)) {
    return isZh ? '时间戳时间信息' : 'Timestamp-based time information';
  }
  if (looksLikeDateField(fieldPath, values)) {
    return isZh ? '日期或时间信息' : 'Date or time information';
  }
  if (isLongTextValues(values)) {
    return isZh ? '详细文本内容描述' : 'Detailed text description';
  }
  if (inferredType.startsWith('array<')) {
    return isZh ? `${humanizeTokenZh(token)}列表` : `List of ${humanizeTokenEn(token)}`;
  }
  return isZh ? `${humanizeTokenZh(token)}信息` : `${humanizeTokenEn(token)} information`;
}

function exactChineseMeaning(token: string, datasetType: 'item' | 'video' | 'user_event'): string | undefined {
  const map: Record<string, string> = {
    id: '唯一标识',
    item_id: datasetType === 'user_event' ? '关联物品唯一标识' : '物品唯一标识',
    user_id: '用户唯一标识',
    content_id: datasetType === 'video' ? '视频内容唯一标识' : '内容唯一标识',
    content_type: datasetType === 'video' ? '视频内容类型' : '内容类型',
    title: datasetType === 'video' ? '视频标题' : '物品标题',
    name: '名称',
    image: datasetType === 'video' ? '视频封面图链接' : '图片链接',
    image_url: '图片链接',
    cover: datasetType === 'video' ? '视频封面图链接' : '封面图链接',
    video_url: '视频播放或下载链接',
    media_link: '视频详情页链接',
    link: '详情页链接',
    parent_content_id: '所属父内容标识',
    sequence_index: '在父内容中的排序序号或集数',
    director: '导演姓名',
    actors: '演员列表',
    actor_list: '演员列表',
    screenwriter: '编剧信息',
    genres: '内容题材或类型',
    genre: '内容题材或类型',
    episode_summary: '剧情简介',
    summary: '摘要内容',
    description: '详细描述',
    content: '正文内容',
    body: '正文内容',
    duration: datasetType === 'video' ? '视频时长' : '时长',
    language: datasetType === 'video' ? '视频语言' : '语言信息',
    alias: '别名',
    first_air_date: '首播日期',
    publish_time: '发布时间',
    brand: '品牌名称',
    category: '分类名称',
    cate: '分类名称',
    price: '价格',
    original_price: '原价',
    sale_price: '售价',
    final_price: '成交价',
    tag: '标签',
    tags: '标签列表',
    keyword: '关键词',
    keywords: '关键词列表',
    event_type: '行为类型',
    event_timestamp: '行为发生时间',
    event_scene: '行为发生场景',
    query: '搜索词',
    platform: '平台信息',
    location: '位置信息',
    session_id: '会话标识',
    page_id: '页面标识'
  };
  if (map[token]) return map[token];
  if (token.endsWith('_id')) return '唯一标识';
  if (token.endsWith('_url')) return '资源链接';
  if (token.endsWith('_time') || token.endsWith('_date')) return '时间信息';
  if (token.includes('rating')) return '评分信息';
  if (token.includes('lang')) return '语言信息';
  if (token.includes('price')) return '价格';
  if (token.includes('brand')) return '品牌名称';
  if (token.includes('category') || token.includes('cate')) return '分类名称';
  if (token.includes('tag')) return '标签信息';
  if (token.includes('summary') || token.includes('desc')) return '文本描述';
  if (token.includes('actor')) return '演员信息';
  if (token.includes('director')) return '导演信息';
  if (token.includes('video')) return '视频信息';
  if (token.includes('image') || token.includes('cover')) return '图片信息';
  if (token.includes('language')) return '语言信息';
  if (token.includes('duration')) return '时长信息';
  return undefined;
}

function exactEnglishMeaning(token: string, datasetType: 'item' | 'video' | 'user_event'): string | undefined {
  const map: Record<string, string> = {
    id: 'Unique identifier',
    item_id: datasetType === 'user_event' ? 'Associated item identifier' : 'Item identifier',
    user_id: 'User identifier',
    content_id: datasetType === 'video' ? 'Video content identifier' : 'Content identifier',
    content_type: datasetType === 'video' ? 'Video content type' : 'Content type',
    title: datasetType === 'video' ? 'Video title' : 'Item title',
    name: 'Name',
    image: datasetType === 'video' ? 'Video cover image URL' : 'Image URL',
    image_url: 'Image URL',
    cover: datasetType === 'video' ? 'Video cover image URL' : 'Cover image URL',
    video_url: 'Video playback or download URL',
    media_link: 'Video detail page URL',
    parent_content_id: 'Parent content identifier',
    sequence_index: 'Sequence index within the parent content',
    director: 'Director name',
    actors: 'Actor list',
    actor_list: 'Actor list',
    screenwriter: 'Screenwriter information',
    genres: 'Content genre or category',
    episode_summary: 'Episode summary',
    duration: datasetType === 'video' ? 'Video duration' : 'Duration',
    language: datasetType === 'video' ? 'Video language' : 'Language information',
    alias: 'Alias',
    first_air_date: 'First air date'
  };
  if (map[token]) return map[token];
  if (token.endsWith('_id')) return 'Unique identifier';
  if (token.endsWith('_url')) return 'Resource URL';
  if (token.endsWith('_time') || token.endsWith('_date')) return 'Time information';
  return undefined;
}

function inferFallbackAttrFields(
  flattened: Array<{ path: string; inferredType: string }>,
  records: Array<Record<string, unknown>>,
  datasetType: 'item' | 'video' | 'user_event',
  attrPromptKey: string
): Record<string, string[]> {
  const attrFields: Record<string, string[]> = {};
  const add = (attrName: string, fieldPath: string): void => {
    if (!attrFields[attrName]) attrFields[attrName] = [];
    if (!attrFields[attrName].includes(fieldPath)) attrFields[attrName].push(fieldPath);
  };

  for (const field of flattened) {
    const token = lastToken(field.path);
    const values = getValuesAtPath(records, field.path);
    if (datasetType === 'video') {
      if (token === 'content_id') add('VideoContentID', field.path);
      if (token === 'content_type') add('VideoContentType', field.path);
      if (token === 'video_url' || looksLikeVideoField(field.path, values)) add('video_url', field.path);
      if (token === 'parent_content_id') add('VideoParentContentID', field.path);
      if (token === 'sequence_index') add('VideoSequenceIndex', field.path);
      if (token === 'title' || token === 'name') add('VideoContentTitle', field.path);
      if (looksLikeImageField(field.path, values)) add('VideoMediaCoverURL', field.path);
      if (token === 'media_link' || (token.includes('link') && !looksLikeVideoField(field.path, values))) add('VideoMediaLink', field.path);
      if (token === 'duration') add('VideoDuration', field.path);
      if (token === 'language') add('VideoLanguage', field.path);
      continue;
    }

    if (datasetType === 'user_event') {
      if (token === 'user_id') add('user_id', field.path);
      if (token === 'item_id') add('item_id', field.path);
      if (token === 'event_type') add('event_type', field.path);
      if (token === 'event_timestamp') add('event_timestamp', field.path);
      if (token === 'event_scene') add('event_scene', field.path);
      continue;
    }

    if (token === 'title' || token === 'name') add('ImageTitle', field.path);
    if (token === 'item_type' || token === 'product_type') add('ImageItemType', field.path);
    if (token === 'parent_id' || token === 'parent_item_id') add('ImageParentId', field.path);
    if ((token.endsWith('_id') || token === 'id') && token !== 'parent_id' && token !== 'parent_item_id') add('ImagePK', field.path);
    if (looksLikeImageField(field.path, values)) add('ImageURL', field.path);
    if (token.includes('price')) add('multi_modal_price', field.path);
    if (token.includes('brand')) add('multi_modal_brand', field.path);
    if (token.includes('category') || token.includes('cate')) add('multi_modal_category', field.path);
    if (token.includes('tag') || token.includes('keyword') || token === 'genres') add('multi_modal_tag', field.path);
    if (isLongTextValues(values) || ['description', 'summary', 'content', 'body', 'episode_summary'].includes(token)) add('multi_modal_content', field.path);
    if (looksLikeVideoField(field.path, values)) add('multi_modal_video_url', field.path);
    if (token.includes('link') && !looksLikeVideoField(field.path, values) && !looksLikeImageField(field.path, values)) add('multi_modal_link', field.path);
    if (token === 'lon' || token === 'longitude') add('multi_modal_longitude', field.path);
    if (token === 'lat' || token === 'latitude') add('multi_modal_latitude', field.path);
  }

  if (attrPromptKey === 'general' && attrFields.ImagePK) {
    attrFields.multi_modal_id = [...attrFields.ImagePK];
  }
  return attrFields;
}

function isCandidateIndexField(fieldPath: string, inferredType: string, values: unknown[], notUseFields: string[]): boolean {
  if (notUseFields.includes(fieldPath)) return false;
  const token = lastToken(fieldPath);
  if (looksLikeImageField(fieldPath, values)) return false;
  if (looksLikeLinkField(fieldPath, values) && !looksLikeVideoField(fieldPath, values)) return false;
  if (token.endsWith('_id') || token === 'id') return false;
  if (['string', 'array<string>', 'int64', 'float'].includes(inferredType) === false) return false;
  if (isLongTextValues(values)) return true;
  return [
    'title', 'name', 'alias', 'brand', 'category', 'cate', 'genres', 'genre', 'tag', 'tags',
    'keyword', 'keywords', 'director', 'actors', 'actor_list', 'screenwriter', 'summary',
    'description', 'content', 'body', 'episode_summary', 'duration', 'language'
  ].includes(token);
}

function isCandidateSuggestField(fieldPath: string, inferredType: string, values: unknown[], notUseFields: string[]): boolean {
  if (notUseFields.includes(fieldPath)) return false;
  const token = lastToken(fieldPath);
  if (!['string', 'array<string>'].includes(inferredType)) return false;
  if (looksLikeImageField(fieldPath, values) || looksLikeVideoField(fieldPath, values) || looksLikeLinkField(fieldPath, values)) return false;
  if (token.endsWith('_id') || token === 'id') return false;
  return ['title', 'name', 'alias', 'brand', 'category', 'cate', 'genres', 'genre', 'tag', 'tags'].includes(token);
}

function isCandidateFilterField(fieldPath: string, inferredType: string, values: unknown[], notUseFields: string[]): boolean {
  if (notUseFields.includes(fieldPath)) return false;
  const token = lastToken(fieldPath);
  if (looksLikeImageField(fieldPath, values) || looksLikeVideoField(fieldPath, values)) return false;
  if (token === 'title' || token === 'name' || token === 'summary' || token === 'description' || token === 'episode_summary') return false;
  if (token.endsWith('_id') || token === 'id') return false;
  if (looksLikeTimestampField(fieldPath, values) || looksLikeDateField(fieldPath, values)) return true;
  if (['int64', 'float', 'boolean'].includes(inferredType)) return true;
  if (!['string', 'array<string>'].includes(inferredType)) return false;
  const distinct = new Set(values.map(value => stableSampleKey(value))).size;
  return distinct > 0 && distinct <= Math.max(10, values.length * 2) || ['language', 'genres', 'genre', 'category', 'cate', 'brand', 'content_type'].includes(token);
}

function isRedundantForSearch(fieldPath: string, values: unknown[]): boolean {
  const token = lastToken(fieldPath);
  if (token.endsWith('_id') || token === 'id' || token === 'session_id' || token === 'page_id') return true;
  if (looksLikeImageField(fieldPath, values) || looksLikeVideoField(fieldPath, values) || looksLikeLinkField(fieldPath, values)) return true;
  if (looksLikeOpaqueCode(values)) return true;
  return false;
}

function looksLikeImageField(fieldPath: string, values: unknown[]): boolean {
  const token = lastToken(fieldPath);
  return ['image', 'image_url', 'cover', 'cover_url', 'poster'].includes(token) || values.some(value => typeof value === 'string' && /\.(png|jpe?g|webp|gif)$/iu.test(value));
}

function looksLikeVideoField(fieldPath: string, values: unknown[]): boolean {
  const token = lastToken(fieldPath);
  return token === 'video_url' || values.some(value => typeof value === 'string' && /\.(mp4|m3u8|flv|mov|avi)$/iu.test(value));
}

function looksLikeLinkField(_fieldPath: string, values: unknown[]): boolean {
  return values.some(value => typeof value === 'string' && /^https?:\/\//iu.test(value));
}

function looksLikeTimestampField(fieldPath: string, values: unknown[]): boolean {
  const token = lastToken(fieldPath);
  return token.includes('timestamp') || values.some(value => typeof value === 'number' && (String(Math.trunc(value)).length === 10 || String(Math.trunc(value)).length === 13));
}

function looksLikeDateField(fieldPath: string, values: unknown[]): boolean {
  const token = lastToken(fieldPath);
  return token.includes('date') || token.includes('time') || values.some(value => typeof value === 'string' && /\d{4}-\d{2}-\d{2}/u.test(value));
}

function isLongTextValues(values: unknown[]): boolean {
  return values.some(value => typeof value === 'string' && value.length >= 30);
}

function looksLikeOpaqueCode(values: unknown[]): boolean {
  return values.some(value => typeof value === 'string' && /^[a-z0-9_-]{16,}$/iu.test(value));
}

function lastToken(pathValue: string): string {
  const segments = pathValue.split('.');
  return segments[segments.length - 1] ?? pathValue;
}

function humanizeTokenZh(token: string): string {
  return token
    .replace(/_/g, '')
    .replace(/id$/iu, '标识')
    .replace(/url$/iu, '链接');
}

function humanizeTokenEn(token: string): string {
  return token.replace(/_/g, ' ');
}

function stableSampleKey(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value);
  if (isRecord(value)) return JSON.stringify(value);
  return String(value);
}
