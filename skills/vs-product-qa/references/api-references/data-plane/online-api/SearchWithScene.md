# SearchWithScene

## Overview

- API name: `SearchWithScene`
- Category: Data Plane - OnlineAPI
- Description: Runs online search with a search scene.

## IDL Definition

```proto
message SearchRequest {
  Query query = 1;
  int32 page_size = 2;
  int32 page_number = 3;
  int32 offset = 4;
  int32 limit = 5;
  ai_search_rec.online.common.User user = 6;
  string dataset_id = 7;
  repeated string output_fields = 8 [(google.api.field_behavior) = OPTIONAL, (api.example) = "[\"title\", \"price\", \"category\"]"];
  google.protobuf.Struct filter = 9;
  string sort_by = 10;
  string sort_order = 11;
  SearchDynamic search_dynamic = 12;
  optional ai_search_rec.online.common.Context context = 13;
  repeated ConditionalBoostRule conditional_boost = 14;

  SubjectParam subject_param = 15;

  string from_request_id = 16;
  optional double query_keyword_match_percent = 17;
  bool disable_personalize = 18;

  SortRules sort_rules = 19;

  repeated ai_search_rec.online.common.BoostBuryCondRule boost_bury_rules = 20;

  common.Facet facet = 21;

  repeated string highlight_fields = 22 [(google.api.field_behavior) = OPTIONAL, (api.example) = "[\"title\", \"summary\"]"];

  bool debug = 99;

  map<string, ai_search_rec.search_api.common.ExperimentInfo> experiment_group = 100;

  string application = 1002;
  string scene_id = 1003;
  string authorization = 2001;
}

message SearchResponse {
  repeated SearchResult search_results = 1;
  optional int32 total_items = 2;
  optional int32 next_offset = 3;
  optional SpellCorrection spell_correction = 4;
  optional SubjectResults subject_results = 5;
  repeated common.FacetResult facet_results = 6;

  optional ExtraInfo extra_info = 100;
}

message ExperimentInfo {
  string name = 1;
  string version = 2;
}

message Query {
  string text = 1;
  string image_url = 2;
  string image_query_instruction = 3;
}

message User {
  optional string _user_id = 1;
  string nickname = 2;
  string user_profile = 3;
}

message SearchDynamic {

  bool rerank_enabled = 1;
  int64 rerank_topk = 2;
  int64 max_retrieved_num = 3;
  bool  enable_image = 4;
  double dense_weight = 5;
  SearchMode mode = 6;
  double text_weight = 7;
  repeated SortRule sort_rules = 8;
  repeated SynonymGroup synonyms = 9;
  BoostBuryConfig boost_bury_config = 10;
  SpellCorrectionConfig spell_correction_config = 11;
  repeated AuxiliaryPool auxiliary_pools = 12;
  ShuffleConfig shuffle_config = 13;
  PersonalizedRecall personalized_recall = 14;
  bool enable_rerank_with_hot = 15;
  string rerank_model = 16;
  RerankDoubaoConfig rerank_doubao_config = 17;
  FilterConfig filter_config = 18;
  BoostBuryCondConfig boost_bury_cond_config = 19;
  UserDefinedRecallMode user_defined_recall_mode = 20;
  repeated ServingControl serving_controls = 21;
  common.Facet facet = 22;
  optional double query_keyword_match_percent = 23;
  SynonymConfig synonym_config = 24;
  RelevanceCutoffConfig relevance_cutoff_config = 25;
}

message Context {
  Location location = 1;
  google.protobuf.Struct extra = 2;
}

message ConditionalBoostRule {
  repeated ConditionalBoostCondition conds = 1;
  double boost = 2;
}

message SubjectParam {
  bool crop = 1;
  repeated double bbox = 2;
  optional int32 limit = 3;
  bool exclude_search = 4;
}

message SortRules {

  string mode = 1;
  repeated SortRule rules = 2;
}

message BoostBuryCondRule {
  uint32 id = 1;
  bool enable = 2;
  string name = 3;
  google.protobuf.Struct config = 4;
  double boost = 5;
}

message Facet {
  optional bool enable = 1;
  repeated FacetConfig facets = 2;
  optional google.protobuf.Struct facet_filter = 3;
}

message SearchResult {
  string _id = 1;
  google.protobuf.Struct display_fields = 2;
  double score = 3;

  repeated RecallInfo recall_info = 4;

  RerankInfo rerank_info = 5;
  double boost = 6;
}

message SpellCorrection {

  string mode = 1;

  string corrected_query = 2;
}

message SubjectResults {
  int64 total_items = 1;
  repeated SubjectItem items = 2;
}

message FacetResult {
  string field = 1;
  repeated FacetBucket buckets = 2;
}

message ExtraInfo {
  string vlm_query_text = 1;
  int32 rrf_k = 2;
  repeated RecallConfig recall_config = 3;
  repeated string boost_status = 4;
  int32 total_items = 5;
  ai_search_rec.online.common.DiversityRule diversity_rule = 6;
  ai_search_rec.online.common.EffectiveBoostBuryRule effective_boost_bury_rule = 7;
}

enum SearchMode {
  ModeUnknown = 0;
  Balanced = 1;
  SemanticPriority = 2;
  KeywordPriority = 3;
  UserDefined = 4;
}

message SortRule {
  string field = 1;
  string order = 2;
  optional bool enable = 3;
}

message SynonymGroup {
  repeated string words = 1;
}

message BoostBuryConfig {
  bool enabled = 1;
  repeated BoostBuryRule rules = 2;
}

message SpellCorrectionConfig {
  string mode = 1;
  repeated common.RelatedDict dicts = 2;
  string match_mode = 3;
}

message AuxiliaryPool {
  string name = 1;
  google.protobuf.Struct filter = 2;
  optional bool enable = 3;
}

message ShuffleConfig {
  repeated ShuffleRule rules = 1;
}

message PersonalizedRecall {
  bool enabled = 1;
  string mode = 2;
  repeated UserInterest user_interest = 3;
}

message RerankDoubaoConfig {
  string item_feature = 1;
  string instruction = 2;
}

message FilterConfig {
  string rule_id = 1;
  google.protobuf.Struct config = 2;
}

message BoostBuryCondConfig {
  repeated ai_search_rec.online.common.BoostBuryCondRule rules = 2;
}

enum UserDefinedRecallMode {
  KeywordSemantic = 0;
  KeywordOnly = 1;
  SemanticOnly = 2;
}

message ServingControl {
  google.protobuf.Struct query_condition = 1;
  RecallWeightConfig recall_weight = 2;
  AuxiliaryPoolsConfig auxiliary_pools = 3;
  SortRulesConfig sort_rules = 4;
  ShuffleConfig shuffle_config = 5;
  string name = 6;
  FilterConfig filter_config = 7;
  BoostBuryCondConfig boost_bury_cond_config = 8;
  optional bool enable = 9;
  optional double query_keyword_match_percent = 10;
  RelevanceCutoffConfig relevance_cutoff_config = 11;
}

message SynonymConfig {
  repeated common.RelatedDict dicts = 1;
}

message RelevanceCutoffConfig {
  repeated RelevanceCutoffRule rules = 1;
  RelevanceCutoffFallback fallback = 2;
}

message Location {
  string longitude = 1;
  string latitude = 2;
}

message ConditionalBoostCondition {
  string field = 1;
  string op = 2;

  google.protobuf.Value conds = 3;
}

message FacetConfig {

  string field = 1;

  optional int64 max_facet_buckets = 2;

  repeated NumberRange number_ranges = 3;
}

message RecallInfo {
  string recall_reason = 1;
  double recall_score = 2;
  int32 recall_rank = 3;
}

message RerankInfo{
  bool is_reranked = 1;
  double rerank_score = 2;
}

message SubjectItem {
  repeated double bbox = 1;
  optional double score = 2;
  int32 rank = 3;
  optional string label = 4;
}

message FacetBucket {
  optional string value = 1;
  optional NumberRange number_range = 2;
  int64 count = 3;
}

message RecallConfig {
  string recall_name = 1;
  int64 limit = 2;
  int32 limit_coefficient = 3;
  double dense_weight = 4;
  double recall_weight = 5;
}

message DiversityRule {
  repeated string success_rules = 1;
  repeated string failure_rules = 2;
}

message EffectiveBoostBuryRule {

  google.protobuf.Struct effective_rule_info = 1;
}

message BoostBuryRule {
  string name = 1;
  string field = 2;
  string operator = 3;
  google.protobuf.Value value = 4;
  double weight = 5;
  optional bool enable = 6;
}

message RelatedDict {
  string dict_id = 1;
}

message ShuffleRule {

  uint32 id = 1;

  bool disable = 2;

  string name = 3;

  string window_type = 4;

  int64 window_size = 5;

  int64 max_size = 6;

  string field_name = 8;

  string shuffle_type = 9;

  google.protobuf.Struct shuffle_expr = 10;

  int64 recall_max = 11;
}

message UserInterest {
  string user_interest_id = 1;
  string interest_field = 2;
}

message RecallWeightConfig {
  SearchMode mode = 1;
  double dense_weight = 2;
  double text_weight = 3;
  UserDefinedRecallMode user_defined_recall_mode = 4;
}

message AuxiliaryPoolsConfig {
  repeated AuxiliaryPool pools = 1;
}

message SortRulesConfig {
  repeated SortRule rules = 1;
}

message RelevanceCutoffRule {
  string score_type = 1;
  string mode = 2;
  double threshold = 3;
  optional bool enable = 4;
}

message RelevanceCutoffFallback {
  bool enable = 1;
  int32 min_result_count = 2;
}

message NumberRange {
  optional float lt = 1;
  optional float lte = 2;
  optional float gt = 3;
  optional float gte = 4;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | Query | See service validation | Query. |
| `page_size` | int32 | See service validation | Page size. |
| `page_number` | int32 | See service validation | Page number. |
| `offset` | int32 | See service validation | Offset. |
| `limit` | int32 | See service validation | Limit. |
| `user` | User | See service validation | User. |
| `dataset_id` | string | See service validation | Dataset ID. |
| `filter` | Struct | See service validation | Filter. |
| `sort_by` | string | See service validation | Sort by. |
| `sort_order` | string | See service validation | Sort order. |
| `search_dynamic` | SearchDynamic | See service validation | Search dynamic. |
| `context` | Context | No | Context. |
| `conditional_boost[]` | array<ConditionalBoostRule> | No | Conditional boost. |
| `subject_param` | SubjectParam | See service validation | Subject param. |
| `from_request_id` | string | See service validation | From request id. |
| `query_keyword_match_percent` | double | No | Query keyword match percent. |
| `disable_personalize` | bool | See service validation | Disable personalize. |
| `sort_rules` | SortRules | See service validation | Sort rules. |
| `boost_bury_rules[]` | array<BoostBuryCondRule> | No | Boost bury rules. |
| `facet` | Facet | See service validation | Facet. |
| `debug` | bool | See service validation | Debug. |
| `experiment_group` | ExperimentInfo> | See service validation | Experiment group. |
| `application` | string | See service validation | Application. |
| `scene_id` | string | See service validation | Scene ID. |
| `authorization` | string | See service validation | Authorization. |
| `query.text` | string | See service validation | Text. |
| `query.image_url` | string | See service validation | Image url. |
| `query.image_query_instruction` | string | See service validation | Image query instruction. |
| `user._user_id` | string | No | User id. |
| `user.nickname` | string | See service validation | Nickname. |
| `user.user_profile` | string | See service validation | User profile. |
| `search_dynamic.rerank_enabled` | bool | See service validation | Rerank enabled. |
| `search_dynamic.rerank_topk` | int64 | See service validation | Rerank topk. |
| `search_dynamic.max_retrieved_num` | int64 | See service validation | Max retrieved num. |
| `search_dynamic.enable_image` | bool | See service validation | Enable image. |
| `search_dynamic.dense_weight` | double | See service validation | Dense weight. |
| `search_dynamic.mode` | SearchMode | See service validation | Mode. |
| `search_dynamic.text_weight` | double | See service validation | Text weight. |
| `search_dynamic.sort_rules[]` | array<SortRule> | No | Sort rules. |
| `search_dynamic.synonyms[]` | array<SynonymGroup> | No | Synonyms. |
| `search_dynamic.boost_bury_config` | BoostBuryConfig | See service validation | Boost bury config. |
| `search_dynamic.spell_correction_config` | SpellCorrectionConfig | See service validation | Spell correction config. |
| `search_dynamic.auxiliary_pools[]` | array<AuxiliaryPool> | No | Auxiliary pools. |
| `search_dynamic.shuffle_config` | ShuffleConfig | See service validation | Shuffle config. |
| `search_dynamic.personalized_recall` | PersonalizedRecall | See service validation | Personalized recall. |
| `search_dynamic.enable_rerank_with_hot` | bool | See service validation | Enable rerank with hot. |
| `search_dynamic.rerank_model` | string | See service validation | Rerank model. |
| `search_dynamic.rerank_doubao_config` | RerankDoubaoConfig | See service validation | Rerank doubao config. |
| `search_dynamic.filter_config` | FilterConfig | See service validation | Filter config. |
| `search_dynamic.boost_bury_cond_config` | BoostBuryCondConfig | See service validation | Boost bury cond config. |
| `search_dynamic.user_defined_recall_mode` | UserDefinedRecallMode | See service validation | User defined recall mode. |
| `search_dynamic.serving_controls[]` | array<ServingControl> | No | Serving controls. |
| `search_dynamic.facet` | Facet | See service validation | Facet. |
| `search_dynamic.query_keyword_match_percent` | double | No | Query keyword match percent. |
| `search_dynamic.synonym_config` | SynonymConfig | See service validation | Synonym config. |
| `search_dynamic.relevance_cutoff_config` | RelevanceCutoffConfig | See service validation | Relevance cutoff config. |
| `context.location` | Location | See service validation | Location. |
| `context.extra` | Struct | See service validation | Extra. |
| `conditional_boost[].conds[]` | array<ConditionalBoostCondition> | No | Conds. |
| `conditional_boost[].boost` | double | See service validation | Boost. |
| `subject_param.crop` | bool | See service validation | Crop. |
| `subject_param.bbox[]` | array<double> | No | Bbox. |
| `subject_param.limit` | int32 | No | Limit. |
| `subject_param.exclude_search` | bool | See service validation | Exclude search. |
| `sort_rules.mode` | string | See service validation | Mode. |
| `sort_rules.rules[]` | array<SortRule> | No | Rules. |
| `boost_bury_rules[].id` | uint32 | See service validation | Id. |
| `boost_bury_rules[].enable` | bool | See service validation | Enable. |
| `boost_bury_rules[].name` | string | See service validation | Name. |
| `boost_bury_rules[].config` | Struct | See service validation | Config. |
| `boost_bury_rules[].boost` | double | See service validation | Boost. |
| `facet.enable` | bool | No | Enable. |
| `facet.facets[]` | array<FacetConfig> | No | Facets. |
| `facet.facet_filter` | Struct | No | Facet filter. |
| `experiment_group.name` | string | See service validation | Name. |
| `experiment_group.version` | string | See service validation | Version. |
| `search_dynamic.sort_rules[].field` | string | See service validation | Field. |
| `search_dynamic.sort_rules[].order` | string | See service validation | Order. |
| `search_dynamic.sort_rules[].enable` | bool | No | Enable. |
| `search_dynamic.synonyms[].words[]` | array<string> | No | Words. |
| `search_dynamic.boost_bury_config.enabled` | bool | See service validation | Enabled. |
| `search_dynamic.boost_bury_config.rules[]` | array<BoostBuryRule> | No | Rules. |
| `search_dynamic.spell_correction_config.mode` | string | See service validation | Mode. |
| `search_dynamic.spell_correction_config.dicts[]` | array<RelatedDict> | No | Dicts. |
| `search_dynamic.spell_correction_config.match_mode` | string | See service validation | Match mode. |
| `search_dynamic.auxiliary_pools[].name` | string | See service validation | Name. |
| `search_dynamic.auxiliary_pools[].filter` | Struct | See service validation | Filter. |
| `search_dynamic.auxiliary_pools[].enable` | bool | No | Enable. |
| `search_dynamic.shuffle_config.rules[]` | array<ShuffleRule> | No | Rules. |
| `search_dynamic.personalized_recall.enabled` | bool | See service validation | Enabled. |
| `search_dynamic.personalized_recall.mode` | string | See service validation | Mode. |
| `search_dynamic.personalized_recall.user_interest[]` | array<UserInterest> | No | User interest. |
| `search_dynamic.rerank_doubao_config.item_feature` | string | See service validation | Item feature. |
| `search_dynamic.rerank_doubao_config.instruction` | string | See service validation | Instruction. |
| `search_dynamic.filter_config.rule_id` | string | See service validation | Rule id. |
| `search_dynamic.filter_config.config` | Struct | See service validation | Config. |
| `search_dynamic.boost_bury_cond_config.rules[]` | array<BoostBuryCondRule> | No | Rules. |
| `search_dynamic.serving_controls[].query_condition` | Struct | See service validation | Query condition. |
| `search_dynamic.serving_controls[].recall_weight` | RecallWeightConfig | See service validation | Recall weight. |
| `search_dynamic.serving_controls[].auxiliary_pools` | AuxiliaryPoolsConfig | See service validation | Auxiliary pools. |
| `search_dynamic.serving_controls[].sort_rules` | SortRulesConfig | See service validation | Sort rules. |
| `search_dynamic.serving_controls[].shuffle_config` | ShuffleConfig | See service validation | Shuffle config. |
| `search_dynamic.serving_controls[].name` | string | See service validation | Name. |
| `search_dynamic.serving_controls[].filter_config` | FilterConfig | See service validation | Filter config. |
| `search_dynamic.serving_controls[].boost_bury_cond_config` | BoostBuryCondConfig | See service validation | Boost bury cond config. |
| `search_dynamic.serving_controls[].enable` | bool | No | Enable. |
| `search_dynamic.serving_controls[].query_keyword_match_percent` | double | No | Query keyword match percent. |
| `search_dynamic.serving_controls[].relevance_cutoff_config` | RelevanceCutoffConfig | See service validation | Relevance cutoff config. |
| `search_dynamic.facet.enable` | bool | No | Enable. |
| `search_dynamic.facet.facets[]` | array<FacetConfig> | No | Facets. |
| `search_dynamic.facet.facet_filter` | Struct | No | Facet filter. |
| `search_dynamic.synonym_config.dicts[]` | array<RelatedDict> | No | Dicts. |
| `search_dynamic.relevance_cutoff_config.rules[]` | array<RelevanceCutoffRule> | No | Rules. |
| `search_dynamic.relevance_cutoff_config.fallback` | RelevanceCutoffFallback | See service validation | Fallback. |
| `context.location.longitude` | string | See service validation | Longitude. |
| `context.location.latitude` | string | See service validation | Latitude. |
| `conditional_boost[].conds[].field` | string | See service validation | Field. |
| `conditional_boost[].conds[].op` | string | See service validation | Op. |
| `conditional_boost[].conds[].conds` | Value | See service validation | Conds. |
| `sort_rules.rules[].field` | string | See service validation | Field. |
| `sort_rules.rules[].order` | string | See service validation | Order. |
| `sort_rules.rules[].enable` | bool | No | Enable. |
| `facet.facets[].field` | string | See service validation | Field. |
| `facet.facets[].max_facet_buckets` | int64 | No | Max facet buckets. |
| `facet.facets[].number_ranges[]` | array<NumberRange> | No | Number ranges. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `search_results[]` | array<SearchResult> | No | Search results. |
| `total_items` | int32 | No | Total items. |
| `next_offset` | int32 | No | Next offset. |
| `spell_correction` | SpellCorrection | No | Spell correction. |
| `subject_results` | SubjectResults | No | Subject results. |
| `facet_results[]` | array<FacetResult> | No | Facet results. |
| `extra_info` | ExtraInfo | No | Extra info. |
| `search_results[]._id` | string | See service validation | Id. |
| `search_results[].display_fields` | Struct | See service validation | Display fields. |
| `search_results[].score` | double | See service validation | Score. |
| `search_results[].recall_info[]` | array<RecallInfo> | No | Recall info. |
| `search_results[].rerank_info` | RerankInfo | See service validation | Rerank info. |
| `search_results[].boost` | double | See service validation | Boost. |
| `spell_correction.mode` | string | See service validation | Mode. |
| `spell_correction.corrected_query` | string | See service validation | Corrected query. |
| `subject_results.total_items` | int64 | See service validation | Total items. |
| `subject_results.items[]` | array<SubjectItem> | No | Items. |
| `facet_results[].field` | string | See service validation | Field. |
| `facet_results[].buckets[]` | array<FacetBucket> | No | Buckets. |
| `extra_info.vlm_query_text` | string | See service validation | Vlm query text. |
| `extra_info.rrf_k` | int32 | See service validation | Rrf k. |
| `extra_info.recall_config[]` | array<RecallConfig> | No | Recall config. |
| `extra_info.boost_status[]` | array<string> | No | Boost status. |
| `extra_info.total_items` | int32 | See service validation | Total items. |
| `extra_info.diversity_rule` | DiversityRule | See service validation | Diversity rule. |
| `extra_info.effective_boost_bury_rule` | EffectiveBoostBuryRule | See service validation | Effective boost bury rule. |
| `search_results[].recall_info[].recall_reason` | string | See service validation | Recall reason. |
| `search_results[].recall_info[].recall_score` | double | See service validation | Recall score. |
| `search_results[].recall_info[].recall_rank` | int32 | See service validation | Recall rank. |
| `search_results[].rerank_info.is_reranked` | bool | See service validation | Is reranked. |
| `search_results[].rerank_info.rerank_score` | double | See service validation | Rerank score. |
| `subject_results.items[].bbox[]` | array<double> | No | Bbox. |
| `subject_results.items[].score` | double | No | Score. |
| `subject_results.items[].rank` | int32 | See service validation | Rank. |
| `subject_results.items[].label` | string | No | Label. |
| `facet_results[].buckets[].value` | string | No | Value. |
| `facet_results[].buckets[].number_range` | NumberRange | No | Number range. |
| `facet_results[].buckets[].count` | int64 | See service validation | Count. |
| `extra_info.recall_config[].recall_name` | string | See service validation | Recall name. |
| `extra_info.recall_config[].limit` | int64 | See service validation | Limit. |
| `extra_info.recall_config[].limit_coefficient` | int32 | See service validation | Limit coefficient. |
| `extra_info.recall_config[].dense_weight` | double | See service validation | Dense weight. |
| `extra_info.recall_config[].recall_weight` | double | See service validation | Recall weight. |
| `extra_info.diversity_rule.success_rules[]` | array<string> | No | Success rules. |
| `extra_info.diversity_rule.failure_rules[]` | array<string> | No | Failure rules. |
| `extra_info.effective_boost_bury_rule.effective_rule_info` | Struct | See service validation | Effective rule info. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
