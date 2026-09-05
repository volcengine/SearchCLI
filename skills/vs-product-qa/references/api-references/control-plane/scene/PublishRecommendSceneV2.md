# PublishRecommendSceneV2

## Overview

- API name: `PublishRecommendSceneV2`
- Category: Control Plane - Scene
- Description: Publishes a V2 recommend scene and its online recommendation config.

## IDL Definition

```proto
message PublishRecommendSceneV2Req {
  string          ProjectName     = 1; // Project name for project-level isolation.
  string          ApplicationId   = 2; // Application ID.
  string          SceneId         = 3; // Recommend scene ID.
  string          Type            = 4; // for_you / related / shopping_cart.
  string          Name            = 5; // Recommend scene name.
  string          Description     = 6; // Recommend scene description.
  string          ItemDatasetId   = 7; // Bound item dataset ID.
  repeated string UserEventScenes = 8; // Selected event_scene values from the bound UserEvent dataset.

  RecommendSceneConfigV2 Config = 21; // Required full recommend scene config.

  bool DryRun = 31; // Validate only; do not publish.
}

message RecommendSceneV2 {
  string ApplicationId = 1;
  string SceneId       = 2;
  string Type          = 3; // for_you / related / shopping_cart.
  string Name          = 4;
  string Description   = 5;
  string ItemDatasetId = 6;
  string CreateTime    = 7; // RFC3339.
  string UpdateTime    = 8; // RFC3339.
  string Status        = 9; // unpublished / configuring / activating / published.

  string          RecommendModel              = 11; // default / long_sequence.
  string          RecommendOptimizationTarget = 12; // ctr, or empty.
  string          SceneConfigPhase            = 13; // sample_prepare / prepare_train / training / serving, or empty.
  repeated string UserEventScenes             = 14; // Selected event_scene values.
  repeated string ClickEventTypes             = 15; // Selected event_type values.
  repeated string PositiveEventTypes          = 16; // Selected event_type values.
  repeated string NegativeEventTypes          = 17; // Selected event_type values.

  RecommendSceneConfigV2 Config = 21;
}

message RecommendSceneConfigV2 {
  int64                      MaxResults           = 1; // Single-request maximum result count.
  string                     FilterRuleId         = 2; // Reusable recommend filter rule ID.
  ImpressionConfig           ImpressionConfig     = 3; // Impression/exposure deduplication.
  string                     DegradeRuleId        = 4; // Degrade/fallback rule ID.
  SuggestConfig              SuggestConfig        = 5; // Recommendation wording prompt config.
  string                     ForceItemRuleId      = 6; // Forced-item rule ID.
  rule.ShuffleConfigV2       ShuffleConfig        = 7; // Diversity/shuffle rules.
  rule.BoostBuryCondConfigV2 BoostBuryCondConfig  = 8; // Conditional boost/bury rules.
  rule.ColdStartConfig       ColdStartConfig      = 9; // Cold-start injection.
  repeated MergeConfigV2     MergeConfigs         = 10; // Recall-channel merge configs.
  ReasonTemplateConfig       ReasonTemplateConfig = 11; // Recommendation reason templates.
  FilterConfig               FilterConfig         = 12; // Parent/variant recommendation scope.
  RecAssistantConfig         RecAssistantConfig   = 13; // LLM recommendation assistant.
}

message ImpressionConfig {
  int64 TimeWindowSeconds = 1; // Deduplicate returned items within this time window, in seconds.
  int64 MaxSize           = 2; // Maximum deduplication history size.
  ExposureConfig ExposureCfg = 3; // Exposure-based deduplication.
}

message ExposureConfig {
  int64 TimeWindowSeconds = 1; // Exposure deduplication time window, in seconds.
  int64 MaxSize           = 2; // Maximum exposure deduplication history size.
}

message SuggestConfig {
  string SuggestRawPrompt = 1; // Raw recommendation wording prompt.
}

message CustomMergeWeight {
  string RecallChannel = 1; // multimodal / user_profile / item_cf / hot_item / item_similarity / cold_start.
  float  Weight        = 2; // Non-negative custom merge weight.
}

message MergeConfigV2 {
  string Strategy = 1; // user_profile_first / multimodal_first / hot_item_first / item_similarity_first / custom.
  repeated CustomMergeWeight CustomWeights = 2; // Used when Strategy=custom.
}

message FilterConfig {
  ItemTypeFilter ItemTypeFilter = 3;
}

message ItemTypeFilter {
  bool ForParent = 1; // true selects parent items; false selects variants/children when paired with Filter.
  optional google.protobuf.Struct Filter = 3; // Viking Filter DSL for the item type field.
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
  string RecallChannel = 2; // multimodal / user_profile / item_cf / hot_item / item_similarity / cold_start.
  string Template = 3;
  repeated string Variables = 4; // For example: ["item.id"].
}

message ColdStartConfig {
  bool   Enable                = 1;
  string ItemConditionType     = 2; // import_time / custom_filter.
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
  uint32 Id = 1; // Omit to let the server generate a stable positive ID.
  bool Enable = 2;
  string Name = 3;
  google.protobuf.Struct Config = 4;
  double Boost = 5; // [-1, 1].
}

message ShuffleConfigV2 {
  repeated ShuffleRuleV2 Rules = 1;
}

message ShuffleRuleV2 {
  uint32 Id = 1; // Omit to let the server generate a stable positive ID.
  optional bool Enable = 2; // Defaults to enabled.
  string Name = 3;
  string WindowType = 4; // SLIDE / TOP.
  int64 WindowSize = 5;
  int64 MaxSize = 6;
  string ShuffleType = 7; // dimension / expression.
  string FieldName = 8;
  google.protobuf.Struct ShuffleExpression = 9;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `SceneId` | string | Yes | Recommend scene ID. |
| `Type` | string | Yes | `for_you`, `related`, or `shopping_cart`. |
| `Name` | string | Yes | Scene name. |
| `Description` | string | No | Scene description. |
| `ItemDatasetId` | string | Yes | Item dataset ID. |
| `UserEventScenes[]` | array<string> | Yes | Selected UserEvent `event_scene` values. |
| `Config` | `RecommendSceneConfigV2` | Yes | Scene config to publish. |
| `DryRun` | bool | No | Validate only; do not publish. |

## RecommendSceneConfigV2

| V2 field | Type | Notes |
| --- | --- | --- |
| `MaxResults` | int64 | Single request maximum result count. Use `1..400`; the server rejects values greater than `400`. |
| `FilterRuleId` | string | Reusable item-filter rule ID. |
| `ImpressionConfig` | object | Required. Impression/exposure deduplication config. |
| `DegradeRuleId` | string | Fallback/degrade rule ID. |
| `SuggestConfig` | object | Required. Recommendation wording/prompt config. |
| `ForceItemRuleId` | string | Forced-item rule ID. |
| `ShuffleConfig` | object | V2 shuffle/diversity config. |
| `BoostBuryCondConfig` | object | V2 conditional boost/bury config. |
| `ColdStartConfig` | object | Cold-start config. |
| `MergeConfigs[]` | array<object> | Recall merge configs. |
| `ReasonTemplateConfig` | object | Recommendation reason templates. |
| `FilterConfig` | object | Parent/variant recommendation scope. |
| `RecAssistantConfig` | object | LLM recommendation assistant config. |

## Enum Values

| Field | Allowed values |
| --- | --- |
| `Type` | `for_you`, `related`, `shopping_cart` |
| `MergeConfigs[].Strategy` | `user_profile_first`, `multimodal_first`, `hot_item_first`, `item_similarity_first`, `custom` |
| `MergeConfigs[].CustomWeights[].RecallChannel` | `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, `cold_start` |
| `ReasonTemplateConfig.Templates[].RecallChannel` | `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, `cold_start` |
| `ColdStartConfig.ItemConditionType` | `import_time`, `custom_filter` |
| `ShuffleConfig.Rules[].WindowType` | `SLIDE`, `TOP`; empty is normalized to `SLIDE` |
| `ShuffleConfig.Rules[].ShuffleType` | `dimension`, `expression`; empty is treated as `dimension` |
| `FilterConfig.ItemTypeFilter.ForParent` | `true` means recommend parent items; `false` or omitted means no parent-only switch |

## Scene-specific Merge Rules

| Scene `Type` | Supported `MergeConfigs[].Strategy` |
| --- | --- |
| `for_you` | `user_profile_first`, `multimodal_first`, `hot_item_first`, `custom` |
| `related` | `user_profile_first`, `multimodal_first`, `hot_item_first`, `item_similarity_first`, `custom` |
| `shopping_cart` | `item_similarity_first`, `custom` |

For `Strategy=custom`, `CustomWeights[]` must be non-empty, every `Weight` must be `>= 0`, and the total weight must be greater than `0`. `item_similarity` is not allowed as a custom recall channel for `for_you`.

## Validation Constraints

- `Config`, `Config.ImpressionConfig`, and `Config.SuggestConfig` are required for publish.
- `SceneId`, `ApplicationId`, `Type`, and `ItemDatasetId` must identify the existing scene and datasets. If the scene is already `published`, its `Type` cannot be changed.
- Referenced `FilterRuleId`, `DegradeRuleId`, and `ForceItemRuleId` must exist in the same application. `filter` and `force_item` rules must use the same item dataset as `ItemDatasetId`.
- `UserEventScenes[]` is required when `ImpressionConfig.ExposureCfg` is set, and every value must exist in the bound UserEvent dataset's `event_scene` candidate values. Fetch candidates with `vs dataset get --full`; they are merged from schema metadata and offline event statistics.
- `ImpressionConfig.TimeWindowSeconds` and `ImpressionConfig.ExposureCfg.TimeWindowSeconds` must be `> 0`; `MaxSize` fields must be in `0..30000`.
- `FilterConfig.ItemTypeFilter` is required when the item dataset schema has an ItemType business attribute. The schema must also have the paired ParentId business attribute, and the ItemType field must be filterable.
- If the item dataset schema has no ItemType business attribute, do not send `FilterConfig.ItemTypeFilter`.
- `FilterConfig.ItemTypeFilter.Filter` and `ColdStartConfig.ItemFilter` use Viking Filter DSL objects; `ItemTypeFilter.Filter` must be non-empty when `ItemTypeFilter` is present.
- `ColdStartConfig.ImportTimeWindowHours`, `ExposureThreshold`, and `MaxInjectCount` must be `>= 0`. When `ItemConditionType=import_time`, `ImportTimeWindowHours` must be `> 0`; when `ItemConditionType=custom_filter`, `ItemFilter` must be non-empty.
- `BoostBuryCondConfig.Rules[].Id` may be omitted; the server generates stable positive IDs. If provided, IDs must be unique. Each rule requires `Name` and `Config`; `Boost` must be in `[-1, 1]`.
- `BoostBuryCondConfig.Rules[].Config` is a condition tree with `op`, `field`, and `conds`, or logic nodes with `op: "and"|"or"` and child `conds`. Logic nesting is limited to 2 layers. Recommend scene boost/bury does not allow query-dynamic operators such as `query_equal`, `query_in`, or `query_partial_match`.
- Boost/bury condition operators include `must`, `must_not`, `any_must`, `any_must_not`, `partial_match`, `range`, `geo_distance`, and `time_range`; field/operator compatibility is checked against the item dataset schema.
- `ShuffleConfig.Rules[].Id` may be omitted; the server generates stable positive IDs. If provided, IDs must be unique. Each rule requires `Name`, `FieldName`, `WindowSize > 0`, `MaxSize > 0`, and `WindowSize >= MaxSize`.
- `ShuffleType=expression` requires `ShuffleExpression`. Duplicate shuffle rules are rejected. Dimension duplicates are based on `FieldName + WindowType + WindowSize`; expression duplicates also include `ShuffleExpression`.
- `ReasonTemplateConfig.Enable=false` disables recommendation reasons. Enabled templates require `RecallChannel` and `Template`; `item.*` variables are validated against the item dataset schema, and `array<object>` paths are not supported.
- `RecAssistantConfig.Enable=false` disables the LLM recommendation assistant. When enabled, `AssistantRole`, `AnswerStyle`, and `FollowUpStyle` may be empty and can be filled by online defaults.

## Deployment Notes

- Treat `PublishRecommendSceneV2` as a full scene publish at the request level. Start from `recommend scene get`, preserve top-level scene fields and unrelated `Config` fields, then change only the requested area.
- The practical partial-update granularity is the first level under `Config`. For example, replacing `Config.RecAssistantConfig` or `Config.ImpressionConfig` is acceptable after readback, but changing a nested field such as `Config.RecAssistantConfig.AnswerStyle` requires sending the full updated `RecAssistantConfig` object together with the rest of the full publish payload.
- A successful publish updates persistent scene rows and online runtime config. It also writes `recommend_scene_meta` and application-level `event_scene_mapping`.
- `UserEventScenes[]` is the selected behavior-scene binding. The full candidate list comes from the bound UserEvent dataset: fetch it with `dataset get --full`, read the field whose business attribute is UserEventScene, and use its `EnumerateMeta` values. The backend may merge schema metadata with offline event statistics before returning the dataset schema.

## CLI Notes

- `vs recommend scene update --count <n>` maps to `Config.MaxResults`.
- `--user-event-scenes` maps to `UserEventScenes`.
- `--boost-bury-cond-config`, `--shuffle-config`, `--impression-config`, `--suggest-config`, `--reason-template-config`, `--cold-start-config`, `--merge-configs`, `--filter-config`, and `--rec-assistant-config` map to the same V2 `Config` children.
- For `recommend scene update`, the CLI first reads the current scene with `GetRecommendSceneV2`, merges `--config` or advanced flags at the first `Config` level, and then sends a full `PublishRecommendSceneV2` payload. Prefer passing the full first-level child object when modifying nested fields.
- `--config @file.json` may contain a full `RecommendSceneConfigV2` or a first-level patch such as `{ "RecAssistantConfig": { ...full object... } }`. It is merged over the current `Config`; it is not a raw nested JSONPath patch.
- `--data @file.json` is the escape hatch for an already assembled full `PublishRecommendSceneV2Req`; when using `--data`, include `ApplicationId`, `SceneId`, `Type`, `Name`, `ItemDatasetId`, `UserEventScenes`, and complete `Config`.
- Use `--dry-run` to validate without publishing.
