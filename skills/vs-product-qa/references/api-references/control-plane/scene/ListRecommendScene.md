# ListRecommendScene

## Overview

- API name: `ListRecommendScene`
- Category: Control Plane - Scene
- Description: Lists Recommend Scene.

## IDL Definition

```proto
message ListRecommendSceneReq {

  string AppID = 1;
  string ProjectName = 20;

  repeated string Types = 2;
}

message ListRecommendSceneResp {

  int64 TotalCount = 1;

  repeated RecommendScene Items = 2;
}

message RecommendScene {

  string AppID = 1;

  string SceneID = 2;

  string Type = 3;

  string Name = 4;

  string Description = 5;

  string ItemDatasetID = 6;

  string CreatedAt = 7;

  string UpdatedAt = 8;

  string UpdatedBy = 9;

  string Status = 10;

  RecommendModelEnum RecommendModel = 11;

  RecommendOptimizationTargetEnum RecommendOptimizationTarget = 12;

  SceneConfigPhaseEnum SceneConfigPhase = 13;

  repeated string BhvSceneTypes = 14;

  repeated string  ClickEventTypes = 15;

  repeated string  PositiveEventTypes = 16;

  repeated string  NegativeEventTypes = 17;

  RecommendSceneConfig Config = 20;
}

enum RecommendModelEnum {
  Default = 0;
  LongSequence = 1;
}

enum RecommendOptimizationTargetEnum {
  RecommendOptimizationTargetNone = 0;
  Ctr = 1;
}

enum SceneConfigPhaseEnum {
  SceneConfigPhaseNone = 0;
  SamplePrepare = 1;
  PrepareTrain = 2;
  Training = 3;
  Serving = 4;
}

message RecommendSceneConfig {

  int64 Count = 1;

  string FilterRuleID = 2;

  ImpressionConfig Impression = 3;

  string DegradeRuleID = 4;

  SuggestConfig Suggest = 5;

  string ForceItemRuleID = 6;

  rule.BoostBuryConfig BoostBuryConfig = 7;

  rule.ShuffleConfig Shuffle = 8;

  rule.BoostBuryCondConfig BoostBuryCondConfig = 9;

  rule.ColdStartConfig ColdStartConfig = 10;

  repeated MergeConfig MergeConfigs = 21;

  ReasonTemplateConfig ReasonTemplate = 22;
}

message ImpressionConfig {

  int64 TimeWindowSeconds = 1;

  int64 MaxSize = 2;

  ExposureConfig ExposureCfg = 3;
}

message SuggestConfig {

  string SuggestRawPrompt = 1;
}

message BoostBuryConfig {

  bool Enabled = 1;
  repeated BoostBuryRule Rules = 2;
  bool Deprecated = 3;
}

message ShuffleConfig {
  repeated ShuffleRule Rules = 1;
}

message BoostBuryCondConfig {
  repeated BoostBuryCondRule Rules = 2;
}

message ColdStartConfig {

  bool Enable = 1;

  string ItemConditionType = 2;

  int64 ImportTimeWindowHours = 3;

  google.protobuf.Value ItemFilter = 4;

  int64 ExposureThreshold = 5;

  int64 MaxInjectCount = 6;

  string Name = 7;
}

message MergeConfig {

  string Strategy = 1;

  map<string, float> Weights = 2;
}

message ReasonTemplateConfig {

  bool Enable = 1;

  repeated ReasonTemplateRule Templates = 2;

  string FallbackReason = 3;
}

message ExposureConfig {

  int64 TimeWindowSeconds = 1;

  int64 MaxSize = 2;
}

message BoostBuryRule {
  string Name = 1;
  string Field = 2;
  string Operator = 3;
  google.protobuf.Value Value = 4;
  double Weight = 5;

  optional bool Enable = 6;
}

message ShuffleRule {

  uint32 ID = 1;

  bool Disable = 2;

  string Name = 3;

  string WindowType = 4;

  int64 WindowSize = 5;

  int64 MaxSize = 6;

  string FieldName = 8;

  string ShuffleType = 9;

  google.protobuf.Struct ShuffleExpr = 10;

  int64 RecallMax = 11;
}

message BoostBuryCondRule {
  uint32 ID = 1;
  bool Enable = 2;
  string Name = 3;
  google.protobuf.Struct Config = 4;
  double Boost = 5;
}

message ReasonTemplateRule {

  bool Enable = 1;

  string RecallChannel = 2;

  string Template = 3;

  repeated string Variables = 4;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `ProjectName` | string | See service validation | Project name. |
| `Types[]` | array<string> | No | Types. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TotalCount` | int64 | See service validation | Total count. |
| `Items[]` | array<RecommendScene> | No | Items. |
| `Items[].AppID` | string | See service validation | Application ID. |
| `Items[].SceneID` | string | See service validation | Scene ID. |
| `Items[].Type` | string | See service validation | Type. |
| `Items[].Name` | string | See service validation | Name. |
| `Items[].Description` | string | See service validation | Description. |
| `Items[].ItemDatasetID` | string | See service validation | Item dataset ID. |
| `Items[].CreatedAt` | string | See service validation | Created at. |
| `Items[].UpdatedAt` | string | See service validation | Updated at. |
| `Items[].UpdatedBy` | string | See service validation | Updated by. |
| `Items[].Status` | string | See service validation | Status. |
| `Items[].RecommendModel` | RecommendModelEnum | See service validation | Recommend model. |
| `Items[].RecommendOptimizationTarget` | RecommendOptimizationTargetEnum | See service validation | Recommend optimization target. |
| `Items[].SceneConfigPhase` | SceneConfigPhaseEnum | See service validation | Scene config phase. |
| `Items[].BhvSceneTypes[]` | array<string> | No | Bhv scene types. |
| `Items[].ClickEventTypes[]` | array<string> | No | Click event types. |
| `Items[].PositiveEventTypes[]` | array<string> | No | Positive event types. |
| `Items[].NegativeEventTypes[]` | array<string> | No | Negative event types. |
| `Items[].Config` | RecommendSceneConfig | See service validation | Config. |
| `Items[].Config.Count` | int64 | See service validation | Count. |
| `Items[].Config.FilterRuleID` | string | See service validation | Filter rule id. |
| `Items[].Config.Impression` | ImpressionConfig | See service validation | Impression. |
| `Items[].Config.DegradeRuleID` | string | See service validation | Degrade rule id. |
| `Items[].Config.Suggest` | SuggestConfig | See service validation | Suggest. |
| `Items[].Config.ForceItemRuleID` | string | See service validation | Force item rule id. |
| `Items[].Config.BoostBuryConfig` | BoostBuryConfig | See service validation | Boost bury config. |
| `Items[].Config.Shuffle` | ShuffleConfig | See service validation | Shuffle. |
| `Items[].Config.BoostBuryCondConfig` | BoostBuryCondConfig | See service validation | Boost bury cond config. |
| `Items[].Config.ColdStartConfig` | ColdStartConfig | See service validation | Cold start config. |
| `Items[].Config.MergeConfigs[]` | array<MergeConfig> | No | Merge configs. |
| `Items[].Config.ReasonTemplate` | ReasonTemplateConfig | See service validation | Reason template. |

## Field Semantics and Validation Notes

### Enum and String Values

| Field | Allowed values | Notes |
| --- | --- | --- |
| `Types[]` | `for_you`, `related`, `shopping_cart` | Empty means all recommend scene types. |
| `Items[].Type` | `for_you`, `related`, `shopping_cart` | Recommend scene type. |
| `Items[].Status` | `unpublished`, `configuring`, `activating`, `published` | Recommend scene lifecycle status. |
| `Items[].RecommendModel` | `Default`, `LongSequence` | Proto enum values. Service/domain string equivalents are `default` and `long_sequence`. |
| `Items[].RecommendOptimizationTarget` | `RecommendOptimizationTargetNone`, `Ctr` | Proto enum values. Service/domain string equivalent for `Ctr` is `ctr`. |
| `Items[].SceneConfigPhase` | `SceneConfigPhaseNone`, `SamplePrepare`, `PrepareTrain`, `Training`, `Serving` | Domain string equivalents are empty string, `sample_prepare`, `prepare_train`, `training`, and `serving`. |

Behavior event constraints:

- `Items[].BhvSceneTypes[]` values come from the bound UserEvent dataset's `event_scene` enum values.
- `Items[].ClickEventTypes[]`, `Items[].PositiveEventTypes[]`, and `Items[].NegativeEventTypes[]` values come from the bound UserEvent dataset's `event_type` enum values.

`ListRecommendScene` may omit or trim `Items[].Config`; use `GetRecommendScene` for complete `RecommendSceneConfig` and its detailed field constraints.

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
