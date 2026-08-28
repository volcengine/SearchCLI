# PublishSearchSceneV2

## Overview

- API name: `PublishSearchSceneV2`
- Category: Control Plane - Scene
- Description: Publishes Search Scene V2.

## IDL Definition

```proto
message PublishSearchSceneV2Req {
  string ProjectName = 1;
  string ApplicationId = 2;
  string SceneId = 3;

  optional string Name = 11;
  optional string Description = 12;

  SearchSceneConfigV2 Config = 21;

  optional bool DryRun = 31;
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
| `SceneId` | string | See service validation | Scene ID. |
| `Name` | string | No | Name. |
| `Description` | string | No | Description. |
| `Config` | SearchSceneConfigV2 | See service validation | Config. |
| `DryRun` | bool | No | Dry-run flag. |
| `Config.WantToSearchConfig` | WantToSearchConfigV2 | See service validation | Want to search config. |
| `Config.QueryCompletionConfig` | QueryCompletionConfigV2 | See service validation | Query completion config. |
| `Config.OverviewConfig` | OverviewConfig | See service validation | Overview config. |
| `Config.PerDatasetConfigs[]` | array<PerDatasetConfig> | No | Per dataset configs. |
| `Config.WantToSearchConfig.MinWordLength` | int64 | See service validation | Min word length. |
| `Config.WantToSearchConfig.MaxWordLength` | int64 | See service validation | Max word length. |
| `Config.WantToSearchConfig.WordNum` | int64 | See service validation | Word num. |
| `Config.WantToSearchConfig.Enable` | bool | No | Enable. |
| `Config.WantToSearchConfig.DictIds[]` | array<string> | No | Dict ids. |
| `Config.WantToSearchConfig.EnableApiLog` | bool | No | Enable api log. |
| `Config.QueryCompletionConfig.SugMaxRecallNum` | int64 | See service validation | Sug max recall num. |
| `Config.QueryCompletionConfig.SugMinNum` | int64 | See service validation | Sug min num. |
| `Config.QueryCompletionConfig.Enable` | bool | No | Enable. |
| `Config.QueryCompletionConfig.DictIds[]` | array<string> | No | Dict ids. |
| `Config.QueryCompletionConfig.EnableApiLog` | bool | No | Enable api log. |
| `Config.OverviewConfig.Mode` | string | See service validation | Mode. |
| `Config.OverviewConfig.TriggerPrompt` | string | See service validation | Trigger prompt. |
| `Config.OverviewConfig.ContentPrompt` | string | See service validation | Content prompt. |
| `Config.OverviewConfig.EnableOverview` | bool | See service validation | Enable overview. |
| `Config.PerDatasetConfigs[].DatasetId` | string | See service validation | Dataset ID. |
| `Config.PerDatasetConfigs[].TextSearchConfig` | TextSearchConfig | See service validation | Text search config. |
| `Config.PerDatasetConfigs[].ImageSearchConfig` | ImageSearchConfig | See service validation | Image search config. |
| `Config.PerDatasetConfigs[].MaxRecallNum` | int64 | No | Max recall num. |
| `Config.PerDatasetConfigs[].FilterConfig` | FilterConfigV2 | See service validation | Filter config. |
| `Config.PerDatasetConfigs[].AuxiliaryPoolsConfig` | AuxiliaryPoolsConfig | See service validation | Auxiliary pools config. |
| `Config.PerDatasetConfigs[].PersonalizedRecallConfig` | PersonalizedRecall | See service validation | Personalized recall config. |
| `Config.PerDatasetConfigs[].EnableRerankWithHot` | bool | No | Enable rerank with hot. |
| `Config.PerDatasetConfigs[].RerankConfig` | RerankConfig | See service validation | Rerank config. |
| `Config.PerDatasetConfigs[].RerankConfig.RerankModel` | string | See service validation | Rerank model. Enum: `gte_rerank` / `doubao_rerank` (snake_case). |
| `Config.PerDatasetConfigs[].BoostBuryCondConfig` | BoostBuryCondConfig | See service validation | Boost bury cond config. |
| `Config.PerDatasetConfigs[].SortRulesConfig` | SortRulesConfig | See service validation | Sort rules config. |
| `Config.PerDatasetConfigs[].ShuffleConfig` | ShuffleConfig | See service validation | Shuffle config. |
| `Config.PerDatasetConfigs[].ServingControlConfig` | ServingControlConfig | See service validation | Serving control config. |
| `Config.PerDatasetConfigs[].CorrectionConfig` | CorrectionConfigV2 | See service validation | Correction config. |
| `Config.PerDatasetConfigs[].SynonymConfig` | SynonymConfigV2 | See service validation | Synonym config. |
| `Config.PerDatasetConfigs[].FacetConfig` | FacetConfig | See service validation | Facet config. |
| `Config.PerDatasetConfigs[].RelevanceCutoffConfig` | RelevanceCutoffConfig | See service validation | Relevance cutoff config. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ApplicationId` | string | See service validation | Application id. |
| `SceneId` | string | See service validation | Scene ID. |
| `Name` | string | See service validation | Name. |
| `Description` | string | See service validation | Description. |
| `CreateTime` | string | See service validation | Create time. |
| `UpdateTime` | string | See service validation | Update time. |
| `UpdatedBy` | int64 | See service validation | Updated by. |
| `IsDefault` | bool | See service validation | Is default. |
| `Status` | string | See service validation | Status. |
| `Config` | SearchSceneConfigV2 | See service validation | Config. |
| `DraftConfig` | SearchSceneConfigV2 | See service validation | Draft config. |
| `Config.WantToSearchConfig` | WantToSearchConfigV2 | See service validation | Want to search config. |
| `Config.QueryCompletionConfig` | QueryCompletionConfigV2 | See service validation | Query completion config. |
| `Config.OverviewConfig` | OverviewConfig | See service validation | Overview config. |
| `Config.PerDatasetConfigs[]` | array<PerDatasetConfig> | No | Per dataset configs. |
| `DraftConfig.WantToSearchConfig` | WantToSearchConfigV2 | See service validation | Want to search config. |
| `DraftConfig.QueryCompletionConfig` | QueryCompletionConfigV2 | See service validation | Query completion config. |
| `DraftConfig.OverviewConfig` | OverviewConfig | See service validation | Overview config. |
| `DraftConfig.PerDatasetConfigs[]` | array<PerDatasetConfig> | No | Per dataset configs. |
| `Config.WantToSearchConfig.MinWordLength` | int64 | See service validation | Min word length. |
| `Config.WantToSearchConfig.MaxWordLength` | int64 | See service validation | Max word length. |
| `Config.WantToSearchConfig.WordNum` | int64 | See service validation | Word num. |
| `Config.WantToSearchConfig.Enable` | bool | No | Enable. |
| `Config.WantToSearchConfig.DictIds[]` | array<string> | No | Dict ids. |
| `Config.WantToSearchConfig.EnableApiLog` | bool | No | Enable api log. |
| `Config.QueryCompletionConfig.SugMaxRecallNum` | int64 | See service validation | Sug max recall num. |
| `Config.QueryCompletionConfig.SugMinNum` | int64 | See service validation | Sug min num. |
| `Config.QueryCompletionConfig.Enable` | bool | No | Enable. |
| `Config.QueryCompletionConfig.DictIds[]` | array<string> | No | Dict ids. |
| `Config.QueryCompletionConfig.EnableApiLog` | bool | No | Enable api log. |
| `Config.OverviewConfig.Mode` | string | See service validation | Mode. |
| `Config.OverviewConfig.TriggerPrompt` | string | See service validation | Trigger prompt. |
| `Config.OverviewConfig.ContentPrompt` | string | See service validation | Content prompt. |
| `Config.OverviewConfig.EnableOverview` | bool | See service validation | Enable overview. |
| `Config.PerDatasetConfigs[].DatasetId` | string | See service validation | Dataset ID. |
| `Config.PerDatasetConfigs[].TextSearchConfig` | TextSearchConfig | See service validation | Text search config. |
| `Config.PerDatasetConfigs[].ImageSearchConfig` | ImageSearchConfig | See service validation | Image search config. |
| `Config.PerDatasetConfigs[].MaxRecallNum` | int64 | No | Max recall num. |
| `Config.PerDatasetConfigs[].FilterConfig` | FilterConfigV2 | See service validation | Filter config. |
| `Config.PerDatasetConfigs[].AuxiliaryPoolsConfig` | AuxiliaryPoolsConfig | See service validation | Auxiliary pools config. |
| `Config.PerDatasetConfigs[].PersonalizedRecallConfig` | PersonalizedRecall | See service validation | Personalized recall config. |
| `Config.PerDatasetConfigs[].EnableRerankWithHot` | bool | No | Enable rerank with hot. |
| `Config.PerDatasetConfigs[].RerankConfig` | RerankConfig | See service validation | Rerank config. |
| `Config.PerDatasetConfigs[].RerankConfig.RerankModel` | string | See service validation | Rerank model. Enum: `gte_rerank` / `doubao_rerank` (snake_case). |
| `Config.PerDatasetConfigs[].BoostBuryCondConfig` | BoostBuryCondConfig | See service validation | Boost bury cond config. |
| `Config.PerDatasetConfigs[].SortRulesConfig` | SortRulesConfig | See service validation | Sort rules config. |
| `Config.PerDatasetConfigs[].ShuffleConfig` | ShuffleConfig | See service validation | Shuffle config. |
| `Config.PerDatasetConfigs[].ServingControlConfig` | ServingControlConfig | See service validation | Serving control config. |
| `Config.PerDatasetConfigs[].CorrectionConfig` | CorrectionConfigV2 | See service validation | Correction config. |
| `Config.PerDatasetConfigs[].SynonymConfig` | SynonymConfigV2 | See service validation | Synonym config. |
| `Config.PerDatasetConfigs[].FacetConfig` | FacetConfig | See service validation | Facet config. |
| `Config.PerDatasetConfigs[].RelevanceCutoffConfig` | RelevanceCutoffConfig | See service validation | Relevance cutoff config. |
| `DraftConfig.WantToSearchConfig.MinWordLength` | int64 | See service validation | Min word length. |
| `DraftConfig.WantToSearchConfig.MaxWordLength` | int64 | See service validation | Max word length. |
| `DraftConfig.WantToSearchConfig.WordNum` | int64 | See service validation | Word num. |
| `DraftConfig.WantToSearchConfig.Enable` | bool | No | Enable. |
| `DraftConfig.WantToSearchConfig.DictIds[]` | array<string> | No | Dict ids. |
| `DraftConfig.WantToSearchConfig.EnableApiLog` | bool | No | Enable api log. |
| `DraftConfig.QueryCompletionConfig.SugMaxRecallNum` | int64 | See service validation | Sug max recall num. |
| `DraftConfig.QueryCompletionConfig.SugMinNum` | int64 | See service validation | Sug min num. |
| `DraftConfig.QueryCompletionConfig.Enable` | bool | No | Enable. |
| `DraftConfig.QueryCompletionConfig.DictIds[]` | array<string> | No | Dict ids. |
| `DraftConfig.QueryCompletionConfig.EnableApiLog` | bool | No | Enable api log. |
| `DraftConfig.OverviewConfig.Mode` | string | See service validation | Mode. |
| `DraftConfig.OverviewConfig.TriggerPrompt` | string | See service validation | Trigger prompt. |
| `DraftConfig.OverviewConfig.ContentPrompt` | string | See service validation | Content prompt. |
| `DraftConfig.OverviewConfig.EnableOverview` | bool | See service validation | Enable overview. |
| `DraftConfig.PerDatasetConfigs[].DatasetId` | string | See service validation | Dataset ID. |
| `DraftConfig.PerDatasetConfigs[].TextSearchConfig` | TextSearchConfig | See service validation | Text search config. |
| `DraftConfig.PerDatasetConfigs[].ImageSearchConfig` | ImageSearchConfig | See service validation | Image search config. |
| `DraftConfig.PerDatasetConfigs[].MaxRecallNum` | int64 | No | Max recall num. |
| `DraftConfig.PerDatasetConfigs[].FilterConfig` | FilterConfigV2 | See service validation | Filter config. |
| `DraftConfig.PerDatasetConfigs[].AuxiliaryPoolsConfig` | AuxiliaryPoolsConfig | See service validation | Auxiliary pools config. |
| `DraftConfig.PerDatasetConfigs[].PersonalizedRecallConfig` | PersonalizedRecall | See service validation | Personalized recall config. |
| `DraftConfig.PerDatasetConfigs[].EnableRerankWithHot` | bool | No | Enable rerank with hot. |
| `DraftConfig.PerDatasetConfigs[].RerankConfig` | RerankConfig | See service validation | Rerank config. |
| `DraftConfig.PerDatasetConfigs[].RerankConfig.RerankModel` | string | See service validation | Rerank model. Enum: `gte_rerank` / `doubao_rerank` (snake_case). |
| `DraftConfig.PerDatasetConfigs[].BoostBuryCondConfig` | BoostBuryCondConfig | See service validation | Boost bury cond config. |
| `DraftConfig.PerDatasetConfigs[].SortRulesConfig` | SortRulesConfig | See service validation | Sort rules config. |
| `DraftConfig.PerDatasetConfigs[].ShuffleConfig` | ShuffleConfig | See service validation | Shuffle config. |
| `DraftConfig.PerDatasetConfigs[].ServingControlConfig` | ServingControlConfig | See service validation | Serving control config. |
| `DraftConfig.PerDatasetConfigs[].CorrectionConfig` | CorrectionConfigV2 | See service validation | Correction config. |
| `DraftConfig.PerDatasetConfigs[].SynonymConfig` | SynonymConfigV2 | See service validation | Synonym config. |
| `DraftConfig.PerDatasetConfigs[].FacetConfig` | FacetConfig | See service validation | Facet config. |
| `DraftConfig.PerDatasetConfigs[].RelevanceCutoffConfig` | RelevanceCutoffConfig | See service validation | Relevance cutoff config. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
