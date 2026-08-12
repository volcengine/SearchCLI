# GetRecommendScene

## Overview

- API name: `GetRecommendScene`
- Category: Control Plane - Scene
- Description: Gets Recommend Scene.

## IDL Definition

```proto
message GetRecommendSceneReq {

  string AppID = 1;
  string ProjectName = 20;

  string SceneID = 2;
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
| `SceneID` | string | See service validation | Scene ID. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `SceneID` | string | See service validation | Scene ID. |
| `Type` | string | See service validation | Type. |
| `Name` | string | See service validation | Name. |
| `Description` | string | See service validation | Description. |
| `ItemDatasetID` | string | See service validation | Item dataset ID. |
| `CreatedAt` | string | See service validation | Created at. |
| `UpdatedAt` | string | See service validation | Updated at. |
| `UpdatedBy` | string | See service validation | Updated by. |
| `Status` | string | See service validation | Status. |
| `RecommendModel` | RecommendModelEnum | See service validation | Recommend model. |
| `RecommendOptimizationTarget` | RecommendOptimizationTargetEnum | See service validation | Recommend optimization target. |
| `SceneConfigPhase` | SceneConfigPhaseEnum | See service validation | Scene config phase. |
| `BhvSceneTypes[]` | array<string> | No | Bhv scene types. |
| `ClickEventTypes[]` | array<string> | No | Click event types. |
| `PositiveEventTypes[]` | array<string> | No | Positive event types. |
| `NegativeEventTypes[]` | array<string> | No | Negative event types. |
| `Config` | RecommendSceneConfig | See service validation | Config. |
| `Config.Count` | int64 | See service validation | Count. |
| `Config.FilterRuleID` | string | See service validation | Filter rule id. |
| `Config.Impression` | ImpressionConfig | See service validation | Impression. |
| `Config.DegradeRuleID` | string | See service validation | Degrade rule id. |
| `Config.Suggest` | SuggestConfig | See service validation | Suggest. |
| `Config.ForceItemRuleID` | string | See service validation | Force item rule id. |
| `Config.BoostBuryConfig` | BoostBuryConfig | See service validation | Boost bury config. |
| `Config.Shuffle` | ShuffleConfig | See service validation | Shuffle. |
| `Config.BoostBuryCondConfig` | BoostBuryCondConfig | See service validation | Boost bury cond config. |
| `Config.ColdStartConfig` | ColdStartConfig | See service validation | Cold start config. |
| `Config.MergeConfigs[]` | array<MergeConfig> | No | Merge configs. |
| `Config.ReasonTemplate` | ReasonTemplateConfig | See service validation | Reason template. |
| `Config.Impression.TimeWindowSeconds` | int64 | See service validation | Time window seconds. |
| `Config.Impression.MaxSize` | int64 | See service validation | Max size. |
| `Config.Impression.ExposureCfg` | ExposureConfig | See service validation | Exposure cfg. |
| `Config.Suggest.SuggestRawPrompt` | string | See service validation | Suggest raw prompt. |
| `Config.BoostBuryConfig.Enabled` | bool | See service validation | Enabled. |
| `Config.BoostBuryConfig.Rules[]` | array<BoostBuryRule> | No | Rules. |
| `Config.BoostBuryConfig.Deprecated` | bool | See service validation | Deprecated. |
| `Config.Shuffle.Rules[]` | array<ShuffleRule> | No | Rules. |
| `Config.BoostBuryCondConfig.Rules[]` | array<BoostBuryCondRule> | No | Rules. |
| `Config.ColdStartConfig.Enable` | bool | See service validation | Enable. |
| `Config.ColdStartConfig.ItemConditionType` | string | See service validation | Item condition type. |
| `Config.ColdStartConfig.ImportTimeWindowHours` | int64 | See service validation | Import time window hours. |
| `Config.ColdStartConfig.ItemFilter` | Value | See service validation | Item filter. |
| `Config.ColdStartConfig.ExposureThreshold` | int64 | See service validation | Exposure threshold. |
| `Config.ColdStartConfig.MaxInjectCount` | int64 | See service validation | Max inject count. |
| `Config.ColdStartConfig.Name` | string | See service validation | Name. |
| `Config.MergeConfigs[].Strategy` | string | See service validation | Strategy. |
| `Config.MergeConfigs[].Weights` | map<string, float> | See service validation | Weights. |
| `Config.ReasonTemplate.Enable` | bool | See service validation | Enable. |
| `Config.ReasonTemplate.Templates[]` | array<ReasonTemplateRule> | No | Templates. |
| `Config.ReasonTemplate.FallbackReason` | string | See service validation | Fallback reason. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
