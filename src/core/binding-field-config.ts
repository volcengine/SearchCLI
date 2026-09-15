// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import {
  inferBindingFieldSelectionsWithPrompt,
  type PromptInferenceField,
} from './schema-prompt-inference';

export interface PrepareBindingFieldConfigOptions {
  datasetType: 'item' | 'video';
  fields: PromptInferenceField[];
  records: Array<Record<string, unknown>>;
  existingConfig?: Record<string, unknown>;
  datasetDescription?: string;
  primaryKeyField?: string;
}

export interface PreparedBindingFieldConfig {
  fieldConfig: Record<string, unknown>;
  inferenceApplied: boolean;
  indexFields: string[];
  filterFields: string[];
  suggestFields: string[];
  imageIndexFields: string[];
  videoIndexFields: string[];
}

export async function prepareBindingFieldConfig(
  options: PrepareBindingFieldConfigOptions
): Promise<PreparedBindingFieldConfig> {
  const existingConfig = isRecord(options.existingConfig) ? options.existingConfig : {};
  // Historical datasets may carry legacy bind-time field groups that do not follow
  // the current conventions. Keep using FieldDescMap, but re-infer bind-time groups.
  const titleField =
    typeof existingConfig.TitleField === 'string' && existingConfig.TitleField.trim().length > 0
      ? existingConfig.TitleField.trim()
      : undefined;
  const fieldDescMap = extractFieldDescMap(existingConfig);

  const allowed = new Set(flattenFieldPaths(options.fields));
  const fieldTypes = buildFieldTypeMap(options.fields);
  const needsInference = true;

  const promptInference =
    needsInference
      ? await inferBindingFieldSelectionsWithPrompt({
          fields: options.fields,
          records: options.records,
          datasetType: options.datasetType,
          datasetDescription: options.datasetDescription,
          fieldMeanings: fieldDescMap
        })
      : undefined;

  const notUse = new Set((promptInference?.notUseFields ?? []).filter(path => allowed.has(path)));
  const inferredIndexFields = filterPromptFields(promptInference?.indexFields, allowed, notUse, fieldTypes, isIndexFieldType);
  const inferredFilterFields = filterPromptFields(promptInference?.filterFields, allowed, notUse, fieldTypes, isFilterFieldType);
  const inferredItemTypeFields = filterPromptFields(promptInference?.attrFields?.ImageItemType, allowed, notUse, fieldTypes, isFilterFieldType);
  const inferredSuggestFields = filterPromptFields(promptInference?.suggestFields, allowed, notUse, fieldTypes, isSuggestFieldType);
  const inferredImageIndexFields = inferImageIndexFields({
    datasetType: options.datasetType,
    fields: options.fields,
    records: options.records,
    fieldDescMap,
    attrFields: promptInference?.attrFields,
    allowed,
    notUse
  });
  const inferredVideoIndexFields = inferVideoIndexFields({
    datasetType: options.datasetType,
    fields: options.fields,
    records: options.records,
    fieldDescMap,
    attrFields: promptInference?.attrFields,
    allowed,
    notUse
  });

  const resolved = applyDatasetTypeRules({
    datasetType: options.datasetType,
    allowed,
    fieldTypes,
    primaryKeyField: options.primaryKeyField,
    indexFields: inferredIndexFields,
    filterFields: inferredFilterFields,
    itemTypeFields: inferredItemTypeFields,
    suggestFields: inferredSuggestFields,
    imageIndexFields: inferredImageIndexFields,
    videoIndexFields: inferredVideoIndexFields
  });

  const fieldConfig = compactObject({
    ...(titleField ? { TitleField: titleField } : {}),
    ...(resolved.indexFields.length > 0 ? { IndexFields: resolved.indexFields } : {}),
    ...(resolved.filterFields.length > 0 ? { FilterFields: resolved.filterFields } : {}),
    ...(resolved.suggestFields.length > 0 ? { SuggestFields: resolved.suggestFields } : {}),
    ...(resolved.imageIndexFields.length > 0 ? { ImageIndexFields: resolved.imageIndexFields } : {}),
    ...(resolved.videoIndexFields.length > 0 ? { VideoIndexFields: resolved.videoIndexFields } : {}),
    ...(Object.keys(fieldDescMap).length > 0 ? { FieldDescMap: fieldDescMap } : {})
  });

  return {
    fieldConfig,
    inferenceApplied: needsInference,
    indexFields: resolved.indexFields,
    filterFields: resolved.filterFields,
    suggestFields: resolved.suggestFields,
    imageIndexFields: resolved.imageIndexFields,
    videoIndexFields: resolved.videoIndexFields
  };
}

export function schemaFieldsToPromptInferenceFields(schema: unknown): PromptInferenceField[] {
  if (!Array.isArray(schema)) {
    return [];
  }
  return schema
    .filter(isRecord)
    .map(field => {
      const name =
        typeof field.Name === 'string'
          ? field.Name
          : typeof field.FieldName === 'string'
            ? field.FieldName
            : undefined;
      if (!name) {
        return undefined;
      }
      const nested = schemaFieldsToPromptInferenceFields(field.Fields ?? field.SubFields ?? field.fields ?? field.subFields);
      return compactObject({
        name,
        inferredType: normalizePromptFieldType(field.Type ?? field.FieldType),
        ...(nested.length > 0 ? { fields: nested } : {})
      }) as PromptInferenceField;
    })
    .filter((field): field is PromptInferenceField => Boolean(field));
}

function extractFieldDescMap(config: Record<string, unknown>): Record<string, string> {
  const value = config.FieldDescMap;
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[0] === 'string' && typeof entry[1] === 'string')
      .map(([key, desc]) => [key.trim(), desc.trim()])
      .filter(([key, desc]) => key.length > 0 && desc.length > 0)
  );
}

function flattenFieldPaths(fields: PromptInferenceField[], prefix = ''): string[] {
  const results: string[] = [];
  for (const field of fields) {
    const fieldPath = prefix ? `${prefix}.${field.name}` : field.name;
    results.push(fieldPath);
    if (field.fields && field.fields.length > 0) {
      results.push(...flattenFieldPaths(field.fields, fieldPath));
    }
  }
  return results;
}

function filterPromptFields(
  values: string[] | undefined,
  allowed: Set<string>,
  notUse: Set<string>,
  fieldTypes: Map<string, string>,
  isSupportedType: (fieldType: string) => boolean
): string[] {
  if (!values) return [];
  return [
    ...new Set(
      values
        .map(value => value.trim())
        .filter(value => allowed.has(value) && !notUse.has(value) && isSupportedType(fieldTypes.get(value) ?? ''))
    )
  ];
}

function inferImageIndexFields(options: {
  datasetType: 'item' | 'video';
  fields: PromptInferenceField[];
  records: Array<Record<string, unknown>>;
  fieldDescMap: Record<string, string>;
  attrFields?: Record<string, string[]>;
  allowed: Set<string>;
  notUse: Set<string>;
}): string[] {
  const attrCandidates = pickAttrImageFields(options.datasetType, options.attrFields, options.allowed);
  const heuristicCandidates = flattenFieldDefinitions(options.fields)
    .map(field => ({
      path: field.path,
      score: scoreImageFieldCandidate(field.path, field.inferredType, options.fieldDescMap[field.path], options.records)
    }))
    .filter(candidate => candidate.score > 0 && options.allowed.has(candidate.path) && !options.notUse.has(candidate.path))
    .sort((left, right) => right.score - left.score)
    .map(candidate => candidate.path);
  return [...new Set([...attrCandidates, ...heuristicCandidates])];
}

function inferVideoIndexFields(options: {
  datasetType: 'item' | 'video';
  fields: PromptInferenceField[];
  records: Array<Record<string, unknown>>;
  fieldDescMap: Record<string, string>;
  attrFields?: Record<string, string[]>;
  allowed: Set<string>;
  notUse: Set<string>;
}): string[] {
  if (options.datasetType !== 'video') {
    return [];
  }
  const attrCandidates = [...new Set(['video_url', 'multi_modal_video_url'].flatMap(name => options.attrFields?.[name] ?? []))]
    .filter(value => options.allowed.has(value) && !options.notUse.has(value));
  const heuristicCandidates = flattenFieldDefinitions(options.fields)
    .map(field => ({
      path: field.path,
      score: scoreVideoFieldCandidate(field.path, field.inferredType, options.fieldDescMap[field.path], options.records)
    }))
    .filter(candidate => candidate.score > 0 && options.allowed.has(candidate.path) && !options.notUse.has(candidate.path))
    .sort((left, right) => right.score - left.score)
    .map(candidate => candidate.path);
  return [...new Set([...attrCandidates, ...heuristicCandidates])];
}

function pickAttrImageFields(
  datasetType: 'item' | 'video',
  attrFields: Record<string, string[]> | undefined,
  allowed: Set<string>
): string[] {
  const attrNames =
    datasetType === 'video'
      ? ['VideoMediaCoverURL', 'multi_modal_image_url', 'ImageURL']
      : ['ImageURL', 'ImageBase64', 'multi_modal_image_url'];
  return [...new Set(attrNames.flatMap(name => (attrFields?.[name] ?? []).filter(value => allowed.has(value))))];
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

function buildFieldTypeMap(fields: PromptInferenceField[]): Map<string, string> {
  return new Map(flattenFieldDefinitions(fields).map(field => [field.path, field.inferredType]));
}

function isIndexFieldType(fieldType: string): boolean {
  return fieldType === 'string' || fieldType === 'array<string>';
}

function isSuggestFieldType(fieldType: string): boolean {
  return fieldType === 'string' || fieldType === 'array<string>';
}

function isFilterFieldType(fieldType: string): boolean {
  return ['string', 'int32', 'int64', 'float', 'boolean'].includes(fieldType);
}

function scoreImageFieldCandidate(
  fieldPath: string,
  inferredType: string,
  meaning: string | undefined,
  records: Array<Record<string, unknown>>
): number {
  if (!['string', 'array<string>'].includes(inferredType)) {
    return 0;
  }
  const token = lastToken(fieldPath).toLowerCase();
  let score = 0;
  if (/(^|_)(image|img|cover|poster|thumbnail|thumb|picture|avatar|icon)($|_)/u.test(token)) {
    score += 3;
  }
  if (meaning && /(图片|图像|封面|海报|缩略图|头像|image|cover|poster|thumbnail|avatar)/iu.test(meaning)) {
    score += 3;
  }

  const values = getValuesAtPath(records, fieldPath);
  if (values.some(value => typeof value === 'string' && looksLikeImageValue(value))) {
    score += 3;
  }
  if (token === 'image' || token.endsWith('_image') || token.endsWith('_cover')) {
    score += 1;
  }
  return score;
}

function scoreVideoFieldCandidate(
  fieldPath: string,
  inferredType: string,
  meaning: string | undefined,
  records: Array<Record<string, unknown>>
): number {
  if (!['string', 'array<string>'].includes(inferredType)) {
    return 0;
  }
  const token = lastToken(fieldPath).toLowerCase();
  let score = 0;
  if (token === 'video_url') {
    score += 5;
  }
  if (/(^|_)(video|media|play|stream|m3u8|mp4)($|_)/u.test(token)) {
    score += 3;
  }
  if (meaning && /(视频|播放|片源|媒体资源|video|playback|stream|m3u8|mp4)/iu.test(meaning)) {
    score += 3;
  }

  const values = getValuesAtPath(records, fieldPath);
  if (values.some(value => typeof value === 'string' && looksLikeVideoValue(value))) {
    score += 4;
  }
  return score;
}

function applyDatasetTypeRules(options: {
  datasetType: 'item' | 'video';
  allowed: Set<string>;
  fieldTypes: Map<string, string>;
  primaryKeyField?: string;
  indexFields: string[];
  filterFields: string[];
  itemTypeFields: string[];
  suggestFields: string[];
  imageIndexFields: string[];
  videoIndexFields: string[];
}): {
  indexFields: string[];
  filterFields: string[];
  suggestFields: string[];
  imageIndexFields: string[];
  videoIndexFields: string[];
} {
  let indexFields = options.indexFields.filter(value => options.allowed.has(value) && isTopLevelTextField(value, options.fieldTypes));
  let filterFields = options.filterFields.filter(value => options.allowed.has(value) && isTopLevelScalarFilterField(value, options.fieldTypes));
  let suggestFields = options.suggestFields.filter(value => options.allowed.has(value) && isTopLevelTextField(value, options.fieldTypes));
  let imageIndexFields = options.imageIndexFields.filter(value => options.allowed.has(value));
  let videoIndexFields = options.videoIndexFields.filter(value => options.allowed.has(value));

  if (options.datasetType === 'video') {
    const forbiddenIndexSuggest = new Set(['content_id', 'content_type', 'parent_content_id', 'sequence_index']);
    const forbiddenFilter = new Set(['video_url']);
    indexFields = indexFields.filter(value => !forbiddenIndexSuggest.has(value));
    suggestFields = suggestFields.filter(value => !forbiddenIndexSuggest.has(value) && !forbiddenFilter.has(value));
    filterFields = filterFields.filter(value => !forbiddenFilter.has(value));
    if (options.allowed.has('video_url') && !indexFields.includes('video_url')) {
      indexFields.push('video_url');
    }
    if (options.allowed.has('video_url') && !videoIndexFields.includes('video_url')) {
      videoIndexFields.push('video_url');
    }
    for (const required of [options.primaryKeyField, 'content_type', 'parent_content_id', 'sequence_index']) {
      if (required && options.allowed.has(required) && isTopLevelScalarFilterField(required, options.fieldTypes) && !filterFields.includes(required)) {
        filterFields.push(required);
      }
    }
  }
  if (options.datasetType === 'item') {
    for (const required of [options.primaryKeyField, ...options.itemTypeFields]) {
      if (required && options.allowed.has(required) && isTopLevelScalarFilterField(required, options.fieldTypes) && !filterFields.includes(required)) {
        filterFields.push(required);
      }
    }
  }

  return {
    indexFields: dedupeStrings(indexFields),
    filterFields: dedupeStrings(filterFields),
    suggestFields: dedupeStrings(suggestFields),
    imageIndexFields: dedupeStrings(imageIndexFields),
    videoIndexFields: dedupeStrings(videoIndexFields)
  };
}

function isTopLevelScalarFilterField(fieldPath: string, fieldTypes: Map<string, string>): boolean {
  return !fieldPath.includes('.') && isFilterFieldType(fieldTypes.get(fieldPath) ?? '');
}

function isTopLevelTextField(fieldPath: string, fieldTypes: Map<string, string>): boolean {
  return !fieldPath.includes('.') && isIndexFieldType(fieldTypes.get(fieldPath) ?? '');
}

function normalizePromptFieldType(value: unknown): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim().toLowerCase();
  }
  if (typeof value !== 'number') {
    return 'string';
  }
  switch (value) {
    case 1:
      return 'string';
    case 2:
      return 'int32';
    case 3:
      return 'int64';
    case 4:
      return 'float';
    case 5:
      return 'boolean';
    case 6:
      return 'array<string>';
    case 7:
      return 'array<int32>';
    case 8:
      return 'array<int64>';
    case 9:
      return 'array<float>';
    case 10:
      return 'object';
    case 11:
      return 'array<object>';
    default:
      return 'string';
  }
}

function getValuesAtPath(records: Array<Record<string, unknown>>, fieldPath: string): unknown[] {
  const segments = fieldPath.split('.');
  return records
    .flatMap(record => collectNestedValues(record, segments))
    .filter(value => value !== undefined && value !== null);
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

function looksLikeImageValue(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return (
    /^https?:\/\/.+/iu.test(normalized) &&
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/iu.test(normalized)
  ) || /^data:image\//iu.test(normalized);
}

function looksLikeVideoValue(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) return false;
  return /^https?:\/\/.+/iu.test(normalized) && /\.(mp4|m3u8|flv|mov|avi|mkv|webm)(\?.*)?$/iu.test(normalized);
}

function lastToken(value: string): string {
  const segments = value.split('.');
  return segments[segments.length - 1] ?? value;
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
