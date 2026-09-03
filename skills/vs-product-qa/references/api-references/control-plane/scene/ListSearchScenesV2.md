# ListSearchScenesV2

## Overview

- API name: `ListSearchScenesV2`
- Category: Control Plane - Scene
- Description: Lists Search Scenes V2.

## IDL Definition

```proto
message ListSearchScenesV2Req {
  string ProjectName = 1;
  string ApplicationId = 2;

  repeated string SceneIds = 11;
  repeated string Statuses = 12;

  repeated string ConfigLabels = 21;

  repeated string ConfigKeys = 22;
  repeated string DatasetIds = 23;
}

message ListSearchScenesV2Resp {
  repeated SearchSceneV2 Scenes = 2;
}

message SearchSceneV2 {
  string ApplicationId = 1;
  string SceneId = 2;
  string Name = 3;
  string Description = 4;
  string CreateTime = 5;
  string UpdateTime = 6;
  int64 UpdatedBy = 7;
  bool IsDefault = 8;
  string Status = 9;

  SearchSceneConfigV2 Config = 21;
  SearchSceneConfigV2 DraftConfig = 22;
}

message SearchSceneConfigV2 {
  WantToSearchConfigV2 WantToSearchConfig = 1;
  QueryCompletionConfigV2 QueryCompletionConfig = 2;
  OverviewConfig OverviewConfig = 3;
  repeated PerDatasetConfig PerDatasetConfigs = 11;
}

message WantToSearchConfigV2 {
  int64 MinWordLength = 1;
  int64 MaxWordLength = 2;
  int64 WordNum = 3;
  optional bool Enable = 4;
  repeated string DictIds = 5;

  optional bool EnableApiLog = 6;
}

message QueryCompletionConfigV2 {
  int64 SugMaxRecallNum = 1;
  int64 SugMinNum = 2;

  optional bool Enable = 3;
  repeated string DictIds = 4;

  optional bool EnableApiLog = 5;
}

message OverviewConfig {
  string Mode = 1;
  string TriggerPrompt = 2;
  string ContentPrompt = 3;
  bool EnableOverview = 4;
}

message PerDatasetConfig {
  string DatasetId = 1;

  TextSearchConfig TextSearchConfig = 11;
  ImageSearchConfig ImageSearchConfig = 12;
  optional int64 MaxRecallNum = 13;
  FilterConfigV2 FilterConfig = 14;
  AuxiliaryPoolsConfig AuxiliaryPoolsConfig = 15;
  PersonalizedRecall PersonalizedRecallConfig = 16;
  optional bool EnableRerankWithHot = 17;
  RerankConfig RerankConfig = 18;
  rule.BoostBuryCondConfig BoostBuryCondConfig = 19;
  SortRulesConfig SortRulesConfig = 20;
  rule.ShuffleConfig ShuffleConfig = 21;
  ServingControlConfig ServingControlConfig = 22;
  CorrectionConfigV2 CorrectionConfig = 23;
  SynonymConfigV2 SynonymConfig = 24;
  FacetConfig FacetConfig = 25;
  RelevanceCutoffConfig RelevanceCutoffConfig = 26;
}

message TextSearchConfig {

  string Mode = 1;
  optional double QueryKeywordMatchPercent = 2;
  string UserDefinedRecallMode = 3;
  double TextWeight = 4;
  double DenseWeight = 5;
}

message ImageSearchConfig {
  bool Enable = 1;
  string InstructionType = 2;
  string ImageInstruction = 3;
}

message FilterConfigV2 {
  optional string RuleId = 1;

  optional string Name = 2;
  google.protobuf.Struct Config = 3;
}

message AuxiliaryPoolsConfig {
  repeated search_scene.DatasetFilter Pools = 1;
}

message PersonalizedRecall {
  bool Enable = 1;
  string Mode = 2;
  repeated UserInterest UserInterest = 3;
}

message RerankConfig {
  bool Enable = 1;
  int64 RerankTopK = 2;
  string RerankModel = 3;
  RerankDoubaoConfig RerankDoubaoConfig = 4;
}

message BoostBuryCondConfig {
  repeated BoostBuryCondRule Rules = 2;
}

message SortRulesConfig {
  repeated SortRule Rules = 1;
}

message ShuffleConfig {
  repeated ShuffleRule Rules = 1;
}

message ServingControlConfig {
  repeated ServingControlV2 ServingControls = 1;
}

message CorrectionConfigV2 {
  bool Enable = 1;
  string Mode = 2;
  repeated string DictIds = 3;
  string MatchMode = 4;
}

message SynonymConfigV2 {
  repeated string DictIds = 1;
}

message FacetConfig {
  bool Enable = 1;
  repeated Facet Facets = 3;
}

message RelevanceCutoffConfig {
  repeated RelevanceCutoffRule Rules = 1;
  RelevanceCutoffFallback Fallback = 2;
}

message DatasetFilter {

  string Name = 1;

  google.protobuf.Struct Filter = 2;

  optional bool Enable = 3;
}

message UserInterest {
  string UserInterestId = 1;
  string InterestField = 2;
  bool Filterable = 3;
}

message RerankDoubaoConfig {
  string ItemFeature = 1;
  string Instruction = 2;
}

message BoostBuryCondRule {
  uint32 ID = 1;
  bool Enable = 2;
  string Name = 3;
  google.protobuf.Struct Config = 4;
  double Boost = 5;
}

message SortRule {
  string Field = 1;
  string Order = 2;

  optional bool Enable = 3;
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

message ServingControlV2 {
  optional bool Enable = 1;
  string Name = 2;

  google.protobuf.Struct QueryCondition = 11;

  TextSearchConfig TextSearchConfig = 21;
  AuxiliaryPoolsConfig AuxiliaryPoolsConfig = 22;
  SortRulesConfig SortRulesConfig = 23;
  rule.ShuffleConfig ShuffleConfig = 24;
  FilterConfigV2 FilterConfig = 25;
  rule.BoostBuryCondConfig BoostBuryCondConfig = 26;
  RelevanceCutoffConfig RelevanceCutoffConfig = 27;
}

message Facet {
  string Name = 1;

  string Field = 2;

  optional int64 MaxFacetBuckets = 3;

  repeated NumberRange NumberRanges = 4;
}

message RelevanceCutoffRule {
  string ScoreType = 1;
  string Mode = 2;
  double Threshold = 3;
  optional bool Enable = 4;
}

message RelevanceCutoffFallback {
  bool Enable = 1;
  int32 MinResultCount = 2;
}

message NumberRange {
  optional float Lt = 1;
  optional float Lte = 2;
  optional float Gt = 3;
  optional float Gte = 4;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |
| `ApplicationId` | string | See service validation | Application id. |
| `SceneIds[]` | array<string> | No | Scene ids. |
| `Statuses[]` | array<string> | No | Statuses. |
| `ConfigLabels[]` | array<string> | No | Config labels. |
| `ConfigKeys[]` | array<string> | No | Config keys. |
| `DatasetIds[]` | array<string> | No | Dataset ids. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Scenes[]` | array<SearchSceneV2> | No | Scenes. |
| `Scenes[].ApplicationId` | string | See service validation | Application id. |
| `Scenes[].SceneId` | string | See service validation | Scene ID. |
| `Scenes[].Name` | string | See service validation | Name. |
| `Scenes[].Description` | string | See service validation | Description. |
| `Scenes[].CreateTime` | string | See service validation | Create time. |
| `Scenes[].UpdateTime` | string | See service validation | Update time. |
| `Scenes[].UpdatedBy` | int64 | See service validation | Updated by. |
| `Scenes[].IsDefault` | bool | See service validation | Is default. |
| `Scenes[].Status` | string | See service validation | Status. |
| `Scenes[].Config` | SearchSceneConfigV2 | See service validation | Config. |
| `Scenes[].DraftConfig` | SearchSceneConfigV2 | See service validation | Draft config. |
| `Scenes[].Config.WantToSearchConfig` | WantToSearchConfigV2 | See service validation | Want to search config. |
| `Scenes[].Config.QueryCompletionConfig` | QueryCompletionConfigV2 | See service validation | Query completion config. |
| `Scenes[].Config.OverviewConfig` | OverviewConfig | See service validation | Overview config. |
| `Scenes[].Config.PerDatasetConfigs[]` | array<PerDatasetConfig> | No | Per dataset configs. |
| `Scenes[].DraftConfig.WantToSearchConfig` | WantToSearchConfigV2 | See service validation | Want to search config. |
| `Scenes[].DraftConfig.QueryCompletionConfig` | QueryCompletionConfigV2 | See service validation | Query completion config. |
| `Scenes[].DraftConfig.OverviewConfig` | OverviewConfig | See service validation | Overview config. |
| `Scenes[].DraftConfig.PerDatasetConfigs[]` | array<PerDatasetConfig> | No | Per dataset configs. |

## Field Semantics and Validation Notes

This API returns `SearchSceneConfigV2` for each scene, optionally narrowed by the request filters below. Returned `Config` and `DraftConfig` fields use the same enum-like string values and field-reference constraints as the publish API. For the complete config payload contract, see [PublishSearchSceneV2](./PublishSearchSceneV2.md#field-semantics-and-validation-notes).

### Request Filter Values

| Field | Allowed values | Notes |
| --- | --- | --- |
| `Statuses[]` | `unpublished`, `published` | Empty means all scene statuses. |
| `ConfigLabels[]` | `config`, `draft_config` | Empty means all config labels. `draft_config` is a console draft capability and may not be exposed in all OpenAPI environments. |
| `ConfigKeys[]` | `WantToSearchConfig`, `QueryCompletionConfig`, `OverviewConfig`, `TextSearchConfig`, `ImageSearchConfig`, `MaxRecallNum`, `FilterConfig`, `AuxiliaryPoolsConfig`, `PersonalizedRecallConfig`, `EnableRerankWithHot`, `RerankConfig`, `BoostBuryCondConfig`, `SortRulesConfig`, `ShuffleConfig`, `ServingControlConfig`, `CorrectionConfig`, `SynonymConfig`, `FacetConfig`, `RelevanceCutoffConfig` | Empty means all config keys under the selected config labels. |
| `DatasetIds[]` | exact dataset IDs | Empty means all datasets. Only dataset-level config keys are filtered by dataset ID. |

### Common Response String Values

- `Scenes[].Status`: `unpublished`, `published`
- `OverviewConfig.Mode`: `ondemand`, `always`
- `TextSearchConfig.Mode`: `balanced`, `semantic_priority`, `keyword_priority`, `user_defined`
- `TextSearchConfig.UserDefinedRecallMode`: `keyword_semantic`, `keyword_only`, `semantic_only`
- `ImageSearchConfig.InstructionType`: `preset_image`, `preset_item`, `custom`
- `PersonalizedRecallConfig.Mode`: `strong`, `weak`
- `RerankConfig.RerankModel`: `gte-rerank`, `doubao-rerank`
- `CorrectionConfig.Mode`: `auto`, `suggestion_only`
- `CorrectionConfig.MatchMode`: `exact`, `partial`
- `RelevanceCutoffConfig.Rules[].Mode`: `static`, `relative`

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
