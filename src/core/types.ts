// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import type {
  SearchMode,
  SearchModeValue,
  UserDefinedRecallModeName,
  UserDefinedRecallModeValue
} from './search-mode';

export interface SpellCorrectionConfig {
  mode?: 'auto' | 'suggestion_only' | 'off';
}

export interface SynonymGroup {
  words: string[];
}

export interface SortRule {
  field: string;
  order?: 'asc' | 'desc';
  enable?: boolean;
}

export interface BoostBuryRule {
  name?: string;
  field: string;
  operator: string;
  value: unknown;
  weight: number;
  enable?: boolean;
}

export interface BoostBuryConfig {
  enabled?: boolean;
  rules?: BoostBuryRule[];
}

export interface ShuffleRule {
  disable?: boolean;
  name?: string;
  window_size?: number;
  recall_max?: number;
  field_name?: string;
  shuffle_type?: string;
  shuffle_expr?: Record<string, unknown>;
}

export interface ShuffleConfig {
  rules?: ShuffleRule[];
}

export interface UserInterest {
  user_interest_id: string;
  interest_field: string;
}

export interface PersonalizedRecall {
  enabled?: boolean;
  mode?: 'strong' | 'weak' | string;
  user_interest?: UserInterest[];
}

export interface AuxiliaryPool {
  name: string;
  filter?: Record<string, unknown>;
  enable?: boolean;
}

export interface RerankDoubaoConfig {
  item_feature?: string;
  instruction?: string;
}

export interface QueryConfig {
  image_instruction?: string;
  instruction_type?: string;
}

export interface FilterConfig {
  rule_id?: string;
  config?: Record<string, unknown>;
}

export interface BoostBuryCondConfig {
  rules?: unknown[];
}

export interface ServingControl {
  query_condition?: Record<string, unknown>;
  recall_weight?: unknown;
  auxiliary_pools?: unknown;
  sort_rules?: unknown;
  shuffle_config?: unknown;
  filter_config?: unknown;
  boost_bury_cond_config?: unknown;
  name?: string;
  enable?: boolean;
}

export interface RetrieveConfig {
  dataset_id?: string;
  dataset_name?: string;
  max_recall_num?: number;
  enable_image?: boolean;
  dataset_type?: number;
  dense_weight?: number;
  rerank_enabled?: boolean;
  rerank_topk?: number;
  text_weight?: number;
  mode?: SearchMode | SearchModeValue;
  sort_rules?: SortRule[];
  synonyms?: SynonymGroup[];
  correction_config?: SpellCorrectionConfig;
  boost_bury_config?: BoostBuryConfig;
  query_config?: QueryConfig;
  auxiliary_pools?: AuxiliaryPool[];
  shuffle_config?: ShuffleConfig;
  personalized_recall?: PersonalizedRecall;
  enable_rerank_with_hot?: boolean;
  rerank_model?: string;
  rerank_doubao_config?: RerankDoubaoConfig;
  filter_config?: FilterConfig;
  boost_bury_cond_config?: BoostBuryCondConfig;
  serving_controls?: ServingControl[];
  user_defined_recall_mode?: UserDefinedRecallModeName | UserDefinedRecallModeValue;
}

export interface SearchConfig {
  retrieve_configs?: RetrieveConfig[];
}

export interface QueryCompletionConfig {
  sug_max_recall_num?: number;
  sug_min_num?: number;
  enable?: boolean;
}

export interface WantToSearchConfig {
  min_word_length?: number;
  max_word_length?: number;
  word_num?: number;
  enable?: boolean;
}

export interface OverviewConfig {
  mode?: string;
  trigger_prompt?: string;
  content_prompt?: string;
}

export interface SearchSceneConfig {
  search_config?: SearchConfig;
  query_completion_config?: QueryCompletionConfig;
  want_to_search_config?: WantToSearchConfig;
  overview_config?: OverviewConfig;
}

export interface SearchScene {
  app_id: string;
  scene_id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
  is_default?: boolean;
  status?: string;
  config?: SearchSceneConfig;
}

export interface SearchDynamic {
  rerank_enabled?: boolean;
  rerank_topk?: number;
  max_retrieved_num?: number;
  enable_image?: boolean;
  dense_weight?: number;
  mode?: SearchMode | SearchModeValue;
  text_weight?: number;
  sort_rules?: SortRule[];
  synonyms?: SynonymGroup[];
  boost_bury_config?: BoostBuryConfig;
  spell_correction_config?: SpellCorrectionConfig;
  auxiliary_pools?: AuxiliaryPool[];
  shuffle_config?: ShuffleConfig;
  personalized_recall?: PersonalizedRecall;
  enable_rerank_with_hot?: boolean;
  rerank_model?: string;
  rerank_doubao_config?: RerankDoubaoConfig;
  user_defined_recall_mode?: UserDefinedRecallModeName | UserDefinedRecallModeValue;
}

export interface SearchCase {
  id?: string;
  query: {
    text?: string;
    image_url?: string;
    image_query_instruction?: string;
  };
  dataset_id?: string;
  page_size?: number;
  page_number?: number;
  user?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  context?: Record<string, unknown>;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  output_fields?: string[];
  conditional_boost?: unknown[];
  disable_personalize?: boolean;
  query_keyword_match_percent?: number;
  expected_ids?: string[];
  relevance_tiers?: string[][];
  notes?: string;
}

export interface SearchResultItem {
  id: string;
  score?: number;
  title?: string;
  displayFields: Record<string, unknown>;
}

export interface SearchResponseShape {
  requestId?: string;
  totalItems: number;
  spellCorrection?: Record<string, unknown>;
  results: SearchResultItem[];
  raw: unknown;
}

export interface TuningObjective {
  name: string;
  metric: 'relevance' | 'qualitative';
  description: string;
  customerGoal: string;
  themes: string[];
}

export interface CandidateStrategy {
  id: string;
  title: string;
  rationale: string;
  searchDynamic: SearchDynamic;
}

export interface CaseEvaluation {
  caseId: string;
  notes?: string;
  query: SearchCase['query'];
  expectedIds: string[];
  relevanceTiers: string[][];
  topIds: string[];
  ndcgAt10: number;
  reciprocalRank: number;
  recallAt10: number;
}

export interface QualitativeDiff {
  caseId: string;
  notes?: string;
  query: SearchCase['query'];
  baselineTopIds: string[];
  candidateTopIds: string[];
  baselineTitles: string[];
  candidateTitles: string[];
}

export interface CandidateEvaluationSummary {
  candidate: CandidateStrategy;
  labeledCount: number;
  unlabeledCount: number;
  averageNdcgAt10?: number;
  averageReciprocalRank?: number;
  averageRecallAt10?: number;
  labeledCases: CaseEvaluation[];
  unlabeledCases: QualitativeDiff[];
}

export interface TuningPlanStep {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  detail?: string;
}

export interface TuningPlanArtifact {
  id: string;
  goal: string;
  summary?: string;
  steps: TuningPlanStep[];
}

export interface RunCaseInsight {
  id: string;
  runId: string;
  caseId: string;
  issueType: 'lexical_gap' | 'rerank_gap' | 'recall_gap' | 'hotness_bias' | 'diversity_gap' | 'unknown';
  severity: 'low' | 'medium' | 'high';
  queryText: string;
  summary: string;
  recommendation?: string;
  evidence: string[];
  baselineTopIds: string[];
  candidateTopIds?: string[];
  deltaNdcg?: number;
  deltaMrr?: number;
  deltaRecall?: number;
  candidateId?: string;
}

export interface TuningArtifactManifest {
  generatedAt: string;
  runId: string;
  reportMarkdownPath: string;
  reportJsonPath: string;
  planPath?: string;
  caseInsightsPath?: string;
  recommendedCandidatePath?: string;
}

export interface TuningRunReport {
  runId: string;
  generatedAt: string;
  applicationId: string;
  datasetId: string;
  sceneId?: string;
  objective: TuningObjective;
  feedback: string;
  plan?: TuningPlanArtifact;
  baseline?: CandidateEvaluationSummary;
  candidates: CandidateEvaluationSummary[];
  caseInsights?: RunCaseInsight[];
  artifactManifest?: TuningArtifactManifest;
  recommendedCandidateId?: string;
  notes: string[];
}

export interface AppDataBacktrackConf {
  Enable?: boolean;
  IsAll?: boolean;
  StartDate?: string;
  EndDate?: string;
}

export interface FieldCatalog {
  filterableFields?: string[];
  sortableFields?: string[];
  searchableFields?: string[];
}

export const USER_EVENT_DATASET_TYPE = 4;

export const USER_EVENT_BIZ_ATTR: Record<string, number> = {
  item_id: 41,
  user_id: 42,
  event_type: 51,
  event_timestamp: 52,
  event_scene: 53,
};

export const USER_EVENT_REQUIRED_FIELDS = new Set([
  'user_id',
  'item_id',
  'event_type',
  'event_timestamp',
  'event_scene',
]);

export const USER_EVENT_FIELD_TYPES: Record<string, number> = {
  event_timestamp: 3,
};

export interface UserEventEnumerateEntry {
  EnumerateValue: string;
  Name: string;
  EnumerateBizAttr: number;
  Required: boolean;
}

export const USER_EVENT_TYPE_ENUMERATES: UserEventEnumerateEntry[] = [
  { EnumerateValue: '曝光', Name: '曝光', EnumerateBizAttr: 1, Required: true },
  { EnumerateValue: '点击', Name: '点击', EnumerateBizAttr: 2, Required: false },
  { EnumerateValue: '收藏', Name: '收藏', EnumerateBizAttr: 3, Required: false },
  { EnumerateValue: '分享', Name: '分享', EnumerateBizAttr: 4, Required: false },
  { EnumerateValue: '点赞', Name: '点赞', EnumerateBizAttr: 5, Required: false },
  { EnumerateValue: '加购', Name: '加购', EnumerateBizAttr: 6, Required: false },
  { EnumerateValue: '购买', Name: '购买', EnumerateBizAttr: 8, Required: false },
  { EnumerateValue: '访问', Name: '访问', EnumerateBizAttr: 9, Required: false },
];

export function isUserEventDatasetType(type: unknown): boolean {
  return type === USER_EVENT_DATASET_TYPE;
}

export function getUserEventBizAttr(fieldName: string): number | undefined {
  return USER_EVENT_BIZ_ATTR[fieldName];
}

export function isUserEventRequiredField(fieldName: string): boolean {
  return USER_EVENT_REQUIRED_FIELDS.has(fieldName);
}

export function getUserEventFieldType(fieldName: string): number | undefined {
  return USER_EVENT_FIELD_TYPES[fieldName];
}

export function buildEventTypeEnumerateMeta(customValues?: string[]): UserEventEnumerateEntry[] {
  if (!customValues || customValues.length === 0) {
    return USER_EVENT_TYPE_ENUMERATES;
  }
  const knownMap = new Map(USER_EVENT_TYPE_ENUMERATES.map(e => [e.EnumerateValue, e]));
  return customValues.map(value => {
    const known = knownMap.get(value);
    if (known) return known;
    return { EnumerateValue: value, Name: value, EnumerateBizAttr: 0, Required: false };
  });
}

export interface RuntimeConfig {
  controlPlaneBaseUrl: string;
  dataPlaneBaseUrl: string;
  dataPlaneHost?: string;
  xTtBackend?: string;
  service: string;
  applicationId: string;
  datasetId: string;
  sceneId?: string;
  accessKeyId?: string;
  secretKey?: string;
  region: string;
  timeoutMs: number;
  defaultPageSize: number;
  outputDir: string;
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmAccessKeyId?: string;
  llmSecretKey?: string;
  llmRegion?: string;
  llmService?: string;
  llmModel?: string;
}
