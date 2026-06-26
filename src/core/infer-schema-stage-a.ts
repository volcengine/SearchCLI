// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

const PK_BIZ_ATTRS = new Set(['ImagePK', 'VideoContentID', 'QueryPK', 'MultiModalID']);

const ROLE_KEYS = [
  ['IndexFields', 'index'],
  ['FilterFields', 'filter'],
  ['SuggestFields', 'suggest'],
  ['ImageIndexFields', 'imageIndex'],
  ['VideoIndexFields', 'videoIndex'],
  ['ChatFields', 'chat']
] as const;

export interface StageAField {
  name: string;
  type: string;
  bizAttr: string;
  required: string;
  description: string;
}

export interface StageARoles {
  index: string[];
  filter: string[];
  suggest: string[];
  imageIndex: string[];
  videoIndex: string[];
  chat: string[];
  filterTypes: Array<{ field: string; type: string }>;
}

export interface StageASummary {
  fieldCount: number;
  primaryKey: string | null;
  primaryKeyBizAttr: string | null;
  status: string;
}

export interface InferSchemaStageA {
  summary: StageASummary;
  fields: StageAField[];
  roles: StageARoles;
  warnings: string[];
}

export function buildInferSchemaStageA(envelope: unknown): InferSchemaStageA {
  const result = extractResult(envelope);
  const schema = toArray(pick(result, ['Schema', 'schema']));
  const topFieldDescMap = toRecord(pick(result, ['FieldDescMap', 'fieldDescMap']));
  const dataFieldConfig = toRecord(pick(result, ['DataFieldConfig', 'dataFieldConfig', 'FieldConfig', 'fieldConfig']));
  const dfcDescMap = toRecord(pick(dataFieldConfig, ['FieldDescMap', 'fieldDescMap']));
  const mergedDescMap: Record<string, string> = {};
  for (const [key, value] of Object.entries(topFieldDescMap)) {
    if (typeof value === 'string' && value.trim() !== '') {
      mergedDescMap[key] = value;
    }
  }
  for (const [key, value] of Object.entries(dfcDescMap)) {
    if (mergedDescMap[key]) continue;
    if (typeof value === 'string' && value.trim() !== '') {
      mergedDescMap[key] = value;
    }
  }

  const fields: StageAField[] = schema.map(entry => normalizeField(entry, mergedDescMap));
  const seenNames = new Set<string>();
  for (const field of fields) {
    seenNames.add(field.name);
  }
  let primaryKey: string | null = null;
  let primaryKeyBizAttr: string | null = null;
  for (const field of fields) {
    if (field.bizAttr && PK_BIZ_ATTRS.has(field.bizAttr)) {
      primaryKey = field.name;
      primaryKeyBizAttr = field.bizAttr;
      break;
    }
  }

  const roles: StageARoles = {
    index: [],
    filter: [],
    suggest: [],
    imageIndex: [],
    videoIndex: [],
    chat: [],
    filterTypes: []
  };
  for (const [sourceKey, roleKey] of ROLE_KEYS) {
    const values = toArray(pick(dataFieldConfig, [sourceKey, lowerFirst(sourceKey)]))
      .map(stringifyScalar)
      .filter(value => value.length > 0);
    roles[roleKey] = dedupe(values);
  }
  const filterFieldsMap = toRecord(pick(dataFieldConfig, ['FilterFieldsMap', 'filterFieldsMap']));
  for (const [field, raw] of Object.entries(filterFieldsMap)) {
    const obj = toRecord(raw);
    const type = stringifyScalar(pick(obj, ['Type', 'type']));
    if (type) {
      roles.filterTypes.push({ field, type });
    }
  }
  roles.filterTypes.sort((a, b) => a.field.localeCompare(b.field));

  const status = stringifyScalar(pick(result, ['Status', 'status'])) || 'Unknown';
  const summary: StageASummary = {
    fieldCount: fields.length,
    primaryKey,
    primaryKeyBizAttr,
    status
  };

  const warnings = collectWarnings({ fields, roles, mergedDescMap, seenNames, primaryKey, schemaProvided: schema.length > 0 });

  return { summary, fields, roles, warnings };
}

function normalizeField(entry: unknown, descMap: Record<string, string>): StageAField {
  const record = toRecord(entry);
  const name =
    stringifyScalar(pick(record, ['Name', 'name', 'FieldName', 'fieldName'])) || '(unnamed)';
  const type =
    stringifyScalar(pick(record, ['Type', 'type', 'FieldType', 'fieldType'])) || '(unknown)';
  const bizAttr = stringifyScalar(pick(record, ['BizAttr', 'bizAttr']));
  const requiredRaw = pick(record, ['Required', 'required', 'IsRequired']);
  const required = formatRequired(requiredRaw);
  const inlineDesc = stringifyScalar(pick(record, ['Description', 'description', 'Desc', 'desc']));
  const description = sanitizeCell(inlineDesc || descMap[name] || '');
  return { name: sanitizeCell(name), type: sanitizeCell(type), bizAttr: sanitizeCell(bizAttr), required, description };
}

function collectWarnings(input: {
  fields: StageAField[];
  roles: StageARoles;
  mergedDescMap: Record<string, string>;
  seenNames: Set<string>;
  primaryKey: string | null;
  schemaProvided: boolean;
}): string[] {
  const warnings: string[] = [];
  if (!input.schemaProvided) {
    warnings.push('Schema array is empty or missing — backend has not produced any field for this task.');
  }
  if (input.fields.length > 0 && !input.primaryKey) {
    warnings.push(
      'No field carries a primary-key BizAttr (ImagePK / VideoContentID / QueryPK / MultiModalID). Backend cannot derive a PK; check the source data.'
    );
  }
  const missingDesc = input.fields.filter(field => field.description === '').map(field => field.name);
  if (missingDesc.length > 0) {
    warnings.push(`FieldDescMap is missing entries for: ${missingDesc.join(', ')}.`);
  }
  if (input.roles.index.length === 0) {
    warnings.push('DataFieldConfig.IndexFields is empty — text search will not work until populated.');
  }
  const unknownRoles = collectUnknownRoleFields(input.roles, input.seenNames);
  if (unknownRoles.length > 0) {
    warnings.push(`Field roles reference unknown schema fields: ${unknownRoles.join(', ')}.`);
  }
  return warnings;
}

function collectUnknownRoleFields(roles: StageARoles, seenNames: Set<string>): string[] {
  const result = new Set<string>();
  const buckets: Array<string[]> = [
    roles.index,
    roles.filter,
    roles.suggest,
    roles.imageIndex,
    roles.videoIndex,
    roles.chat
  ];
  for (const bucket of buckets) {
    for (const name of bucket) {
      if (!seenNames.has(name)) result.add(name);
    }
  }
  for (const entry of roles.filterTypes) {
    if (!seenNames.has(entry.field)) result.add(entry.field);
  }
  return Array.from(result).sort();
}

function extractResult(envelope: unknown): Record<string, unknown> {
  if (!isRecord(envelope)) return {};
  const directResult = toRecord(pick(envelope, ['Result', 'result']));
  if (Object.keys(directResult).length > 0) return directResult;
  const data = toRecord(pick(envelope, ['data', 'Data']));
  const nested = toRecord(pick(data, ['Result', 'result']));
  if (Object.keys(nested).length > 0) return nested;
  return envelope as Record<string, unknown>;
}

function pick(record: unknown, keys: string[]): unknown {
  if (!isRecord(record)) return undefined;
  for (const key of keys) {
    if (key in record) return record[key];
  }
  return undefined;
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringifyScalar(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  return '';
}

function sanitizeCell(value: string): string {
  return value.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function formatRequired(value: unknown): string {
  if (value === true) return 'yes';
  if (value === false) return 'no';
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase();
    if (lower === 'true' || lower === 'yes') return 'yes';
    if (lower === 'false' || lower === 'no') return 'no';
  }
  return '-';
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

function lowerFirst(value: string): string {
  return value.length === 0 ? value : value[0].toLowerCase() + value.slice(1);
}

export function renderInferSchemaStageAText(stageA: InferSchemaStageA): string {
  const lines: string[] = [];
  lines.push('Stage A — Schema Confirmation');
  lines.push(`Status: ${stageA.summary.status}`);
  lines.push(`Field count: ${stageA.summary.fieldCount}`);
  lines.push(`Primary key: ${stageA.summary.primaryKey ?? '(none)'} ${stageA.summary.primaryKeyBizAttr ? `(${stageA.summary.primaryKeyBizAttr})` : ''}`.trimEnd());
  lines.push('');
  lines.push('Fields');
  lines.push(renderTable(
    ['name', 'type', 'BizAttr', 'required', 'description'],
    stageA.fields.map(field => [field.name, field.type, field.bizAttr || '-', field.required, field.description || '-'])
  ));
  lines.push('');
  lines.push('Field Roles');
  lines.push(`- IndexFields:      ${formatList(stageA.roles.index)}`);
  lines.push(`- FilterFields:     ${formatList(stageA.roles.filter)}`);
  lines.push(`- SuggestFields:    ${formatList(stageA.roles.suggest)}`);
  lines.push(`- ImageIndexFields: ${formatList(stageA.roles.imageIndex)}`);
  lines.push(`- VideoIndexFields: ${formatList(stageA.roles.videoIndex)}`);
  lines.push(`- ChatFields:       ${formatList(stageA.roles.chat)}`);
  if (stageA.roles.filterTypes.length > 0) {
    lines.push(`- FilterFieldsMap:  ${stageA.roles.filterTypes.map(entry => `${entry.field}:${entry.type}`).join(', ')}`);
  }
  if (stageA.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings');
    for (const warning of stageA.warnings) lines.push(`! ${warning}`);
  }
  return lines.join('\n');
}

function formatList(values: string[]): string {
  return values.length === 0 ? '(none)' : values.join(', ');
}

function renderTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map(row => (row[index] ?? '').length))
  );
  const renderRow = (row: string[]) =>
    row
      .map((cell, index) => (cell ?? '').padEnd(widths[index]))
      .join(' | ')
      .trimEnd();
  const divider = widths.map(width => '-'.repeat(width)).join('-+-');
  if (rows.length === 0) {
    return [renderRow(headers), divider, '(no fields)'].join('\n');
  }
  return [renderRow(headers), divider, ...rows.map(renderRow)].join('\n');
}
