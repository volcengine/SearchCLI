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
| `MaxResults` | int64 | Single request maximum result count. |
| `FilterRuleId` | string | Reusable item-filter rule ID. |
| `ImpressionConfig` | object | Impression/exposure deduplication config. |
| `DegradeRuleId` | string | Fallback/degrade rule ID. |
| `SuggestConfig` | object | Recommendation wording/prompt config. |
| `ForceItemRuleId` | string | Forced-item rule ID. |
| `ShuffleConfig` | object | V2 shuffle/diversity config. |
| `BoostBuryCondConfig` | object | V2 conditional boost/bury config. |
| `ColdStartConfig` | object | Cold-start config. |
| `MergeConfigs[]` | array<object> | Recall merge configs. |
| `ReasonTemplateConfig` | object | Recommendation reason templates. |
| `FilterConfig` | object | Parent/variant recommendation scope. |
| `RecAssistantConfig` | object | LLM recommendation assistant config. |

## V1 to V2 Renames

| V1 | V2 |
| --- | --- |
| `AppID` | `ApplicationId` |
| `SceneID` | `SceneId` |
| `ItemDatasetID` | `ItemDatasetId` |
| `BhvSceneTypes` | `UserEventScenes` |
| `Config.Count` | `Config.MaxResults` |
| `Config.FilterRuleID` | `Config.FilterRuleId` |
| `Config.Impression` | `Config.ImpressionConfig` |
| `Config.DegradeRuleID` | `Config.DegradeRuleId` |
| `Config.Suggest` | `Config.SuggestConfig` |
| `Config.ForceItemRuleID` | `Config.ForceItemRuleId` |
| `Config.Shuffle` | `Config.ShuffleConfig` |
| `Config.ReasonTemplate` | `Config.ReasonTemplateConfig` |
| `Config.MergeConfigs[].Weights` | `Config.MergeConfigs[].CustomWeights[]` |

V2 removed `Config.BoostBuryConfig`. Use `Config.BoostBuryCondConfig`.

## Deployment Notes

- Treat `PublishRecommendSceneV2` as a full scene publish. Start from `recommend scene get`, preserve unrelated fields, and change only the requested area.
- A successful publish updates persistent scene rows and online runtime config. It also writes `recommend_scene_meta` and application-level `event_scene_mapping`.
- `UserEventScenes[]` is the selected behavior-scene binding. The full candidate list comes from UserEvent dataset metadata and offline event statistics.

## CLI Notes

- `vs recommend scene update --count <n>` maps to `Config.MaxResults`.
- `--user-event-scenes` maps to `UserEventScenes`.
- `--boost-bury-cond-config`, `--shuffle-config`, `--impression-config`, `--suggest-config`, `--reason-template-config`, `--cold-start-config`, `--merge-configs`, `--filter-config`, and `--rec-assistant-config` map to the same V2 `Config` children.
- Use `--dry-run` to validate without publishing.
