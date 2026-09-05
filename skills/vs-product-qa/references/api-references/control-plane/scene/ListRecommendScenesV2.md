# ListRecommendScenesV2

## Overview

- API name: `ListRecommendScenesV2`
- Category: Control Plane - Scene
- Description: Lists V2 recommend scenes under an application.

## IDL Definition

```proto
message ListRecommendScenesV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  repeated string Types = 3;
}

message ListRecommendScenesV2Resp {
  repeated RecommendSceneV2 Scenes = 1;
}

message RecommendSceneV2 {
  string ApplicationId = 1;
  string SceneId       = 2;
  string Type          = 3;
  string Name          = 4;
  string Description   = 5;
  string ItemDatasetId = 6;
  string CreateTime    = 7;
  string UpdateTime    = 8;
  string Status        = 9;

  string          RecommendModel              = 11;
  string          RecommendOptimizationTarget = 12;
  string          SceneConfigPhase            = 13;
  repeated string UserEventScenes             = 14;
  repeated string ClickEventTypes             = 15;
  repeated string PositiveEventTypes          = 16;
  repeated string NegativeEventTypes          = 17;

  RecommendSceneConfigV2 Config = 21;
}

message RecommendSceneConfigV2 {
  int64                      MaxResults           = 1;
  string                     FilterRuleId         = 2;
  ImpressionConfig           ImpressionConfig     = 3;
  string                     DegradeRuleId        = 4;
  SuggestConfig              SuggestConfig        = 5;
  string                     ForceItemRuleId      = 6;
  rule.ShuffleConfigV2       ShuffleConfig        = 7;
  rule.BoostBuryCondConfigV2 BoostBuryCondConfig  = 8;
  rule.ColdStartConfig       ColdStartConfig      = 9;
  repeated MergeConfigV2     MergeConfigs         = 10;
  ReasonTemplateConfig       ReasonTemplateConfig = 11;
  FilterConfig               FilterConfig         = 12;
  RecAssistantConfig         RecAssistantConfig   = 13;
}

message ImpressionConfig {
  int64 TimeWindowSeconds = 1;
  int64 MaxSize           = 2;
  ExposureConfig ExposureCfg = 3;
}

message ExposureConfig {
  int64 TimeWindowSeconds = 1;
  int64 MaxSize           = 2;
}

message SuggestConfig {
  string SuggestRawPrompt = 1;
}

message CustomMergeWeight {
  string RecallChannel = 1;
  float  Weight        = 2;
}

message MergeConfigV2 {
  string Strategy = 1;
  repeated CustomMergeWeight CustomWeights = 2;
}

message FilterConfig {
  ItemTypeFilter ItemTypeFilter = 3;
}

message ItemTypeFilter {
  bool ForParent = 1;
  optional google.protobuf.Struct Filter = 3;
}

message RecAssistantConfig {
  bool Enable = 1;
  string AssistantRole = 2;
  string AnswerStyle   = 3;
  string FollowUpStyle = 4;
}

message ReasonTemplateConfig {
  bool Enable = 1;
  repeated ReasonTemplateRule Templates = 2;
  string FallbackReason = 3;
}

message ReasonTemplateRule {
  bool Enable = 1;
  string RecallChannel = 2;
  string Template = 3;
  repeated string Variables = 4;
}

message ColdStartConfig {
  bool   Enable                = 1;
  string ItemConditionType     = 2;
  int64  ImportTimeWindowHours = 3;
  google.protobuf.Value ItemFilter = 4;
  int64 ExposureThreshold = 5;
  int64 MaxInjectCount = 6;
  string Name = 7;
}

message BoostBuryCondConfigV2 {
  repeated BoostBuryCondRuleV2 Rules = 2;
}

message BoostBuryCondRuleV2 {
  uint32 Id = 1;
  bool Enable = 2;
  string Name = 3;
  google.protobuf.Struct Config = 4;
  double Boost = 5;
}

message ShuffleConfigV2 {
  repeated ShuffleRuleV2 Rules = 1;
}

message ShuffleRuleV2 {
  uint32 Id = 1;
  optional bool Enable = 2;
  string Name = 3;
  string WindowType = 4;
  int64 WindowSize = 5;
  int64 MaxSize = 6;
  string ShuffleType = 7;
  string FieldName = 8;
  google.protobuf.Struct ShuffleExpression = 9;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `Types[]` | array<string> | No | Scene type filter: `for_you`, `related`, `shopping_cart`; empty means all. |

## Response Parameters

| Field | Type | Description |
| --- | --- | --- |
| `Scenes[]` | array<RecommendSceneV2> | Recommend scene list. List responses do not guarantee full `Config`. |

V2 removed the V1 `TotalCount` and `Items[]` response fields. Use `Scenes[]`.

## Field Semantics

- `Types[]` accepts `for_you`, `related`, and `shopping_cart`; empty means all scene types.
- `Scenes[].Status` values are `unpublished`, `configuring`, `activating`, and `published`.
- `Scenes[].RecommendModel` values are `default` and `long_sequence`.
- `Scenes[].RecommendOptimizationTarget` is `ctr` or empty.
- `Scenes[].SceneConfigPhase` values are `sample_prepare`, `prepare_train`, `training`, and `serving`; empty means not applicable.
- List responses do not guarantee full `Config`; call `GetRecommendSceneV2` before building a `PublishRecommendSceneV2` payload.
