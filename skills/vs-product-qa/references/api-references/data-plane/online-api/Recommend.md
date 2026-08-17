# Recommend

## Overview

- API name: `Recommend`
- Category: Data Plane - OnlineAPI
- Description: Runs online recommendation.

## IDL Definition

```proto
message RecRequest {
    ai_search_rec.online.common.User user = 1;
    int32 page_size = 2;
    string scene_id = 3;
    string event_scene = 4;
    string session_id = 5;

    google.protobuf.Struct filter = 6;

    repeated ParentItem parent_items = 7;

    string dataset_id = 8;

    repeated string output_fields = 9;
    ai_search_rec.online.common.Context context = 10;

    CandidateItems items = 21;

    repeated ai_search_rec.online.common.ConditionalBoostRule conditional_boost = 11;

    bool disable_personalize = 12;

    repeated ai_search_rec.online.common.BoostBuryCondRule boost_bury_rules = 13;

    bool debug = 98;

    string scene_dynamic = 99;
    string _abtest_vid = 100;
    string _abtest_params = 101;
}

message RecResponse {
    repeated RecResult rec_results = 1;

    ExtraInfo extra_info = 100;
}

message User {
  optional string _user_id = 1;
  string nickname = 2;
  string user_profile = 3;
}

message ParentItem {
    google.protobuf.Value _id = 1;
}

message Context {
  Location location = 1;
  google.protobuf.Struct extra = 2;
}

message CandidateItems {
  repeated Item items = 1;
  float weight = 2;
}

message ConditionalBoostRule {
  repeated ConditionalBoostCondition conds = 1;
  double boost = 2;
}

message BoostBuryCondRule {
  uint32 id = 1;
  bool enable = 2;
  string name = 3;
  google.protobuf.Struct config = 4;
  double boost = 5;
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

message ExtraInfo {
  repeated string omitted_params = 1;
  repeated string boost_status = 2;
  ForcedItemInfo forced_item_info = 3;
  bool disable_personalize = 4;
  ai_search_rec.online.common.DiversityRule diversity_rule = 5;
  ai_search_rec.online.common.EffectiveBoostBuryRule effective_boost_bury_rule = 6;
  repeated ParentItem invalid_parent_items = 7;
}

message Location {
  string longitude = 1;
  string latitude = 2;
}

message Item {
  string _id = 1;
}

message ConditionalBoostCondition {
  string field = 1;
  string op = 2;

  google.protobuf.Value conds = 3;
}

message RecallReason {
    string recall_channel = 1;
    string reason = 2;
}

message ForcedItemInfo {
  bool skipped = 1;
  repeated string item_ids = 2;
}

message DiversityRule {
  repeated string success_rules = 1;
  repeated string failure_rules = 2;
}

message EffectiveBoostBuryRule {

  google.protobuf.Struct effective_rule_info = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `user` | User | See service validation | User. |
| `page_size` | int32 | See service validation | Page size. |
| `scene_id` | string | See service validation | Scene ID. |
| `event_scene` | string | See service validation | Event scene. |
| `session_id` | string | See service validation | Session id. |
| `filter` | Struct | See service validation | Filter. |
| `parent_items[]` | array<ParentItem> | No | Parent items. |
| `dataset_id` | string | See service validation | Dataset ID. |
| `output_fields[]` | array<string> | No | Output fields. |
| `context` | Context | See service validation | Context. |
| `items` | CandidateItems | See service validation | Items. |
| `conditional_boost[]` | array<ConditionalBoostRule> | No | Conditional boost. |
| `disable_personalize` | bool | See service validation | Disable personalize. |
| `boost_bury_rules[]` | array<BoostBuryCondRule> | No | Boost bury rules. |
| `debug` | bool | See service validation | Debug. |
| `scene_dynamic` | string | See service validation | Scene dynamic. |
| `_abtest_vid` | string | See service validation | Abtest vid. |
| `_abtest_params` | string | See service validation | Abtest params. |
| `user._user_id` | string | No | User id. |
| `user.nickname` | string | See service validation | Nickname. |
| `user.user_profile` | string | See service validation | User profile. |
| `parent_items[]._id` | Value | See service validation | Id. |
| `context.location` | Location | See service validation | Location. |
| `context.extra` | Struct | See service validation | Extra. |
| `items.items[]` | array<Item> | No | Items. |
| `items.weight` | float | See service validation | Weight. |
| `conditional_boost[].conds[]` | array<ConditionalBoostCondition> | No | Conds. |
| `conditional_boost[].boost` | double | See service validation | Boost. |
| `boost_bury_rules[].id` | uint32 | See service validation | Id. |
| `boost_bury_rules[].enable` | bool | See service validation | Enable. |
| `boost_bury_rules[].name` | string | See service validation | Name. |
| `boost_bury_rules[].config` | Struct | See service validation | Config. |
| `boost_bury_rules[].boost` | double | See service validation | Boost. |
| `context.location.longitude` | string | See service validation | Longitude. |
| `context.location.latitude` | string | See service validation | Latitude. |
| `items.items[]._id` | string | See service validation | Id. |
| `conditional_boost[].conds[].field` | string | See service validation | Field. |
| `conditional_boost[].conds[].op` | string | See service validation | Op. |
| `conditional_boost[].conds[].conds` | Value | See service validation | Conds. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `rec_results[]` | array<RecResult> | No | Rec results. |
| `extra_info` | ExtraInfo | See service validation | Extra info. |
| `rec_results[]._id` | string | See service validation | Id. |
| `rec_results[].display_fields` | Struct | See service validation | Display fields. |
| `rec_results[]._rsp_reason` | string | See service validation | Rsp reason. |
| `rec_results[].boost` | double | See service validation | Boost. |
| `rec_results[].score` | double | No | Score. |
| `rec_results[].rec_info[]` | array<RecallReason> | No | Rec info. |
| `rec_results[].extra_info` | Struct | No | Extra info. |
| `extra_info.omitted_params[]` | array<string> | No | Omitted params. |
| `extra_info.boost_status[]` | array<string> | No | Boost status. |
| `extra_info.forced_item_info` | ForcedItemInfo | See service validation | Forced item info. |
| `extra_info.disable_personalize` | bool | See service validation | Disable personalize. |
| `extra_info.diversity_rule` | DiversityRule | See service validation | Diversity rule. |
| `extra_info.effective_boost_bury_rule` | EffectiveBoostBuryRule | See service validation | Effective boost bury rule. |
| `extra_info.invalid_parent_items[]` | array<ParentItem> | No | Invalid parent items. |
| `rec_results[].rec_info[].recall_channel` | string | See service validation | Recall channel. |
| `rec_results[].rec_info[].reason` | string | See service validation | Reason. |
| `extra_info.forced_item_info.skipped` | bool | See service validation | Skipped. |
| `extra_info.forced_item_info.item_ids[]` | array<string> | No | Item ids. |
| `extra_info.diversity_rule.success_rules[]` | array<string> | No | Success rules. |
| `extra_info.diversity_rule.failure_rules[]` | array<string> | No | Failure rules. |
| `extra_info.effective_boost_bury_rule.effective_rule_info` | Struct | See service validation | Effective rule info. |
| `extra_info.invalid_parent_items[]._id` | Value | See service validation | Id. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
