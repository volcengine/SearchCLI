# CreateRecommendSceneV2

## Overview

- API name: `CreateRecommendSceneV2`
- Category: Control Plane - Scene
- Description: Creates a V2 recommend scene.

## IDL Definition

```proto
message CreateRecommendSceneV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  string Type          = 3;
  string Name          = 4;
  string Description   = 5;
  string ItemDatasetId = 6;

  string          RecommendModel              = 7;
  string          RecommendOptimizationTarget = 8;
  repeated string UserEventScenes             = 9;
  repeated string ClickEventTypes             = 10;
  repeated string PositiveEventTypes          = 11;
  repeated string NegativeEventTypes          = 12;
  FilterConfig    FilterConfig                = 13;

  bool DryRun = 21;
}

message CreateRecommendSceneV2Resp {
  string SceneId = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `Type` | string | Yes | Recommend scene type. |
| `Name` | string | Yes | Scene name. |
| `Description` | string | No | Scene description. |
| `ItemDatasetId` | string | Yes | Item dataset ID. |
| `RecommendModel` | string | No | `default` or `long_sequence`; empty means `default`. |
| `RecommendOptimizationTarget` | string | No | `ctr`; empty means unspecified. |
| `UserEventScenes[]` | array<string> | Yes | Selected UserEvent `event_scene` values. |
| `ClickEventTypes[]` | array<string> | Conditional | Required for long-sequence model. Values come from UserEvent `event_type`. |
| `PositiveEventTypes[]` | array<string> | No | Positive behavior types from UserEvent `event_type`. |
| `NegativeEventTypes[]` | array<string> | No | Negative behavior types from UserEvent `event_type`. |
| `FilterConfig` | object | No | Parent/variant item recommendation scope. |
| `DryRun` | bool | No | Validate only; do not create or publish. |

## Response Parameters

| Field | Type | Description |
| --- | --- | --- |
| `SceneId` | string | Created recommend scene ID. |

## Field Semantics

| Field | Allowed values | Notes |
| --- | --- | --- |
| `Type` | `for_you`, `related`, `shopping_cart` | Homepage feed, detail-page related items, or shopping-cart recommendation. |
| `RecommendModel` | `default`, `long_sequence` | V2 uses string code instead of proto enum integer. |
| `RecommendOptimizationTarget` | `ctr` | Empty string means unspecified. |

`UserEventScenes[]` values must exist in the bound UserEvent dataset's `event_scene` enum/candidate values. Candidate discovery is done through `dataset get --full`.

`FilterConfig.ItemTypeFilter` can constrain parent/variant recommendation scope:

```json
{
  "ItemTypeFilter": {
    "ForParent": true,
    "Filter": { "field": "item_type", "op": "must", "conds": ["parent"] }
  }
}
```

## CLI Notes

- `vs recommend scene create --user-event-scenes a,b` maps to `UserEventScenes`.
- `--bhv-scene-types` is a deprecated alias of `--user-event-scenes`.
- `--recommend-model` expects `default` or `long_sequence`, not integer enum values.
- `--optimization-target` expects `ctr`, not integer enum values.
- Use `--dry-run` to validate without creating.
