# StreamChatSearch

## Overview

- API name: `StreamChatSearch`
- Category: Data Plane - OnlineAPI
- Description: Runs streaming chat search.

## IDL Definition

```proto
message ChatSearchRequestV1 {
  string session_id = 1;
  common.InputMessage input_message = 2;
  ai_search_rec.online.common.User user = 3;
  SearchParam search_param = 4;

  bool enable_suggestions = 5;

  bool opening_remarks = 6;
  ChatSearchDynamic chat_search_dynamic = 7;
  int32 suggestion_size = 8;
  optional ai_search_rec.online.common.Context context = 9;

  string reply_mode = 10;

  map<string,ai_search_rec.search_api.common.ExperimentInfo> experiment_group = 100;

  string application = 1002;
  string authorization = 2001;
}

message ChatSearchResponseV1 {
  StepInfo step_info = 1;

  optional string content = 2;

  PayloadV1 payload = 3;

  string stop_reason = 4;

  repeated Citation citation = 5;
}

message ExperimentInfo {
  string name = 1;
  string version = 2;
}

message InputMessage {
  repeated Content content = 1;
}

message User {
  optional string _user_id = 1;
  string nickname = 2;
  string user_profile = 3;
}

message SearchParam {
  int32 page_size = 1;
  repeated string dataset_ids = 2 [(api.example) = "[\"0999281902\", \"099281972\"]"];
  map<string, google.protobuf.Struct> filters = 3 [(api.example) = "{\"0999281902\":{\"op\":\"must\",\"field\":\"parent_content_id\",\"conds\":[\"123\"]}}"];

  google.protobuf.Struct output_fields = 4 [(api.example) = "{\"10299201\":[\"product_code\",\"product_name\",\"description\"],\"10299202\":[\"content_id\",\"title\",\"keywords\",\"summary\"]}"];
}

message ChatSearchDynamic {

  repeated string prohibited_words = 1;

  string user_role_info = 2;

  string answer_info = 3;

  OpeningRemarksConfig opening_remarks_config = 4;

  string network_search_mode = 5;

  string search_scene_id = 6;

  string follow_up_info = 7;
}

message Context {
  Location location = 1;
  google.protobuf.Struct extra = 2;
}

message StepInfo {
  string step = 1;
  google.protobuf.Struct step_payload = 2;
}

message PayloadV1 {

  map<string, search.SearchWrapper> search = 1;

  repeated string suggestions = 2;

  map<string, VideoDeepAnswer> video_deep_answer = 3;

  repeated RelatedSearchResult related_items = 4;

  repeated rec.RecResult related_rec_items = 5;

  rec.RecResponse rec = 6;

  OverviewPayload overview = 7;

  map<string, RecallFilterResponse> recall_filter = 8;
}

message Citation {

  string type = 1;

  string dataset_id = 2;

  string _id = 3;

  google.protobuf.Struct display_fields = 4;
}

message Content {

  string type = 1;
  string text = 2;
  ImageURL image_url = 3;
}

message OpeningRemarksConfig {

  bool enable_recommend = 1;

  string recommend_scene_id = 2;

  string recommend_item_dataset_id = 3;

  string user_prompt = 4;

  string user_prompt_without_rec = 5;

  int32 suggestion_limit = 6;

  optional CustomizedQuestionConfig customized_question_config = 7;
  optional bool enable_opening_suggestion = 8;
}

message Location {
  string longitude = 1;
  string latitude = 2;
}

message SearchWrapper {
  Query query = 1;
  int32 page_size = 2;
  int32 page_number = 3;
  int32 offset = 4;
  int32 limit = 5;
  ai_search_rec.online.common.User user = 6;
  string dataset_id = 7;
  repeated string output_fields = 8 [(api.example) = "[\"title\", \"price\", \"category\"]"];
  google.protobuf.Struct filter = 9;
  string sort_by = 10;
  string sort_order = 11;
  repeated SearchResult search_results = 12;
  optional int32 total_items = 13;
  optional int32 next_offset = 14;

  optional ExtraInfo extra_info = 100;
}

message VideoDeepAnswer {
  google.protobuf.Struct related_video = 1;
  repeated Highlight highlights = 2;
}

message RecallFilterResponse {

  repeated search.SearchResult filter_results = 1;

  optional int32 total_items = 2;
}

message RelatedSearchResult {
  string _id = 1;
  google.protobuf.Struct display_fields = 2;
  double score = 3;
  repeated search.RecallInfo recall_info = 4;
  search.RerankInfo rerank_info = 5;
  string dataset_id = 6;
}

message RecResult {
    string _id = 1;
    google.protobuf.Struct display_fields = 2;
    string _rsp_reason = 3;
    double boost = 4;

    optional double score = 5;

    repeated RecallReason rec_info = 6;

    optional google.protobuf.Struct extra_info = 100;
}

message RecResponse {
    repeated RecResult rec_results = 1;

    ExtraInfo extra_info = 100;
}

message OverviewPayload {
  bool enabled = 1;
  string session_id = 2;
}

message ImageURL {
  string url = 1;
  string query_instruction = 2;
}

message CustomizedQuestionConfig {

  repeated string customized_questions = 1;
}

message Query {
  string text = 1;
  string image_url = 2;
  string image_query_instruction = 3;
}

message SearchResult {
  string _id = 1;
  google.protobuf.Struct display_fields = 2;
  double score = 3;

  repeated RecallInfo recall_info = 4;

  RerankInfo rerank_info = 5;
  double boost = 6;
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

message Highlight {
  string content_id = 1;
  string generated_title = 2;
  string video_title = 3;
  repeated Snippet snippets = 4;
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

message RecallReason {
    string recall_channel = 1;
    string reason = 2;
}

message ExtraInfo {
  repeated string omitted_params = 1;
  repeated string boost_status = 2;
  ForcedItemInfo forced_item_info = 3;
  bool disable_personalize = 4;
  ai_search_rec.online.common.DiversityRule diversity_rule = 5;
  ai_search_rec.online.common.EffectiveBoostBuryRule effective_boost_bury_rule = 6;
  repeated ParentItem invalid_parent_items = 7;
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

message Snippet {
  int64 start_timestamp = 1;
  int64 end_timestamp = 2;
  string summary = 3;
  string cover = 4 [(api.example) = "https:
}

message ForcedItemInfo {
  bool skipped = 1;
  repeated string item_ids = 2;
}

message ParentItem {
    google.protobuf.Value _id = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `session_id` | string | See service validation | Session id. |
| `input_message` | InputMessage | See service validation | Input message. |
| `user` | User | See service validation | User. |
| `search_param` | SearchParam | See service validation | Search param. |
| `enable_suggestions` | bool | See service validation | Enable suggestions. |
| `opening_remarks` | bool | See service validation | Opening remarks. |
| `chat_search_dynamic` | ChatSearchDynamic | See service validation | Chat search dynamic. |
| `suggestion_size` | int32 | See service validation | Suggestion size. |
| `context` | Context | No | Context. |
| `reply_mode` | string | See service validation | Reply mode. |
| `experiment_group` | ExperimentInfo> | See service validation | Experiment group. |
| `application` | string | See service validation | Application. |
| `authorization` | string | See service validation | Authorization. |
| `input_message.content[]` | array<Content> | No | Content. |
| `user._user_id` | string | No | User id. |
| `user.nickname` | string | See service validation | Nickname. |
| `user.user_profile` | string | See service validation | User profile. |
| `search_param.page_size` | int32 | See service validation | Page size. |
| `chat_search_dynamic.prohibited_words[]` | array<string> | No | Prohibited words. |
| `chat_search_dynamic.user_role_info` | string | See service validation | User role info. |
| `chat_search_dynamic.answer_info` | string | See service validation | Answer info. |
| `chat_search_dynamic.opening_remarks_config` | OpeningRemarksConfig | See service validation | Opening remarks config. |
| `chat_search_dynamic.network_search_mode` | string | See service validation | Network search mode. |
| `chat_search_dynamic.search_scene_id` | string | See service validation | Search scene ID. |
| `chat_search_dynamic.follow_up_info` | string | See service validation | Follow up info. |
| `context.location` | Location | See service validation | Location. |
| `context.extra` | Struct | See service validation | Extra. |
| `experiment_group.name` | string | See service validation | Name. |
| `experiment_group.version` | string | See service validation | Version. |
| `input_message.content[].type` | string | See service validation | Type. |
| `input_message.content[].text` | string | See service validation | Text. |
| `input_message.content[].image_url` | ImageURL | See service validation | Image url. |
| `chat_search_dynamic.opening_remarks_config.enable_recommend` | bool | See service validation | Enable recommend. |
| `chat_search_dynamic.opening_remarks_config.recommend_scene_id` | string | See service validation | Recommend scene ID. |
| `chat_search_dynamic.opening_remarks_config.recommend_item_dataset_id` | string | See service validation | Recommend item dataset ID. |
| `chat_search_dynamic.opening_remarks_config.user_prompt` | string | See service validation | User prompt. |
| `chat_search_dynamic.opening_remarks_config.user_prompt_without_rec` | string | See service validation | User prompt without rec. |
| `chat_search_dynamic.opening_remarks_config.suggestion_limit` | int32 | See service validation | Suggestion limit. |
| `chat_search_dynamic.opening_remarks_config.customized_question_config` | CustomizedQuestionConfig | No | Customized question config. |
| `chat_search_dynamic.opening_remarks_config.enable_opening_suggestion` | bool | No | Enable opening suggestion. |
| `context.location.longitude` | string | See service validation | Longitude. |
| `context.location.latitude` | string | See service validation | Latitude. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `step_info` | StepInfo | See service validation | Step info. |
| `content` | string | No | Content. |
| `payload` | PayloadV1 | See service validation | Payload. |
| `stop_reason` | string | See service validation | Stop reason. |
| `citation[]` | array<Citation> | No | Citation. |
| `step_info.step` | string | See service validation | Step. |
| `step_info.step_payload` | Struct | See service validation | Step payload. |
| `payload.search` | SearchWrapper> | See service validation | Search. |
| `payload.suggestions[]` | array<string> | No | Suggestions. |
| `payload.video_deep_answer` | map<string, VideoDeepAnswer> | See service validation | Video deep answer. |
| `payload.related_items[]` | array<RelatedSearchResult> | No | Related items. |
| `payload.related_rec_items[]` | array<RecResult> | No | Related rec items. |
| `payload.rec` | RecResponse | See service validation | Rec. |
| `payload.overview` | OverviewPayload | See service validation | Overview. |
| `payload.recall_filter` | map<string, RecallFilterResponse> | See service validation | Recall filter. |
| `citation[].type` | string | See service validation | Type. |
| `citation[].dataset_id` | string | See service validation | Dataset ID. |
| `citation[]._id` | string | See service validation | Id. |
| `citation[].display_fields` | Struct | See service validation | Display fields. |
| `payload.search.query` | Query | See service validation | Query. |
| `payload.search.page_size` | int32 | See service validation | Page size. |
| `payload.search.page_number` | int32 | See service validation | Page number. |
| `payload.search.offset` | int32 | See service validation | Offset. |
| `payload.search.limit` | int32 | See service validation | Limit. |
| `payload.search.user` | User | See service validation | User. |
| `payload.search.dataset_id` | string | See service validation | Dataset ID. |
| `payload.search.filter` | Struct | See service validation | Filter. |
| `payload.search.sort_by` | string | See service validation | Sort by. |
| `payload.search.sort_order` | string | See service validation | Sort order. |
| `payload.search.search_results[]` | array<SearchResult> | No | Search results. |
| `payload.search.total_items` | int32 | No | Total items. |
| `payload.search.next_offset` | int32 | No | Next offset. |
| `payload.search.extra_info` | ExtraInfo | No | Extra info. |
| `payload.video_deep_answer.related_video` | Struct | See service validation | Related video. |
| `payload.video_deep_answer.highlights[]` | array<Highlight> | No | Highlights. |
| `payload.related_items[]._id` | string | See service validation | Id. |
| `payload.related_items[].display_fields` | Struct | See service validation | Display fields. |
| `payload.related_items[].score` | double | See service validation | Score. |
| `payload.related_items[].recall_info[]` | array<RecallInfo> | No | Recall info. |
| `payload.related_items[].rerank_info` | RerankInfo | See service validation | Rerank info. |
| `payload.related_items[].dataset_id` | string | See service validation | Dataset ID. |
| `payload.related_rec_items[]._id` | string | See service validation | Id. |
| `payload.related_rec_items[].display_fields` | Struct | See service validation | Display fields. |
| `payload.related_rec_items[]._rsp_reason` | string | See service validation | Rsp reason. |
| `payload.related_rec_items[].boost` | double | See service validation | Boost. |
| `payload.related_rec_items[].score` | double | No | Score. |
| `payload.related_rec_items[].rec_info[]` | array<RecallReason> | No | Rec info. |
| `payload.related_rec_items[].extra_info` | Struct | No | Extra info. |
| `payload.rec.rec_results[]` | array<RecResult> | No | Rec results. |
| `payload.rec.extra_info` | ExtraInfo | See service validation | Extra info. |
| `payload.overview.enabled` | bool | See service validation | Enabled. |
| `payload.overview.session_id` | string | See service validation | Session id. |
| `payload.recall_filter.filter_results[]` | array<SearchResult> | No | Filter results. |
| `payload.recall_filter.total_items` | int32 | No | Total items. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
