# PublishRecommendSceneV2

## Overview

- API name: `PublishRecommendSceneV2`
- Category: Control Plane - Scene
- Description: Publishes a V2 recommend scene and its online recommendation config.

## IDL Definition

```proto
message PublishRecommendSceneV2Req {
  string          ProjectName     = 1;
  string          ApplicationId   = 2;
  string          SceneId         = 3;
  string          Type            = 4;
  string          Name            = 5;
  string          Description     = 6;
  string          ItemDatasetId   = 7;
  repeated string UserEventScenes = 8;

  RecommendSceneConfigV2 Config = 21;

  bool DryRun = 31;
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

- Treat `PublishRecommendSceneV2` as a full scene publish. Start from `recommend scene get`, preserve unrelated fields, and change only the requested area.
- A successful publish updates persistent scene rows and online runtime config. It also writes `recommend_scene_meta` and application-level `event_scene_mapping`.
- `UserEventScenes[]` is the selected behavior-scene binding. The full candidate list comes from UserEvent dataset metadata and offline event statistics.

## CLI Notes

- `vs recommend scene update --count <n>` maps to `Config.MaxResults`.
- `--user-event-scenes` maps to `UserEventScenes`.
- `--boost-bury-cond-config`, `--shuffle-config`, `--impression-config`, `--suggest-config`, `--reason-template-config`, `--cold-start-config`, `--merge-configs`, `--filter-config`, and `--rec-assistant-config` map to the same V2 `Config` children.
- Use `--dry-run` to validate without publishing.
