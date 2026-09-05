# GetRecommendSceneV2

## Overview

- API name: `GetRecommendSceneV2`
- Category: Control Plane - Scene
- Description: Gets a V2 recommend scene detail.

## IDL Definition

```proto
message GetRecommendSceneV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  string SceneId       = 3;
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
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `SceneId` | string | Yes | Recommend scene ID. |

## Response Notes

- `RecommendSceneV2` no longer exposes `UpdatedBy`.
- `Status` values include `unpublished`, `configuring`, `activating`, and `published`.
- `RecommendModel` values are `default` and `long_sequence`.
- `RecommendOptimizationTarget` is `ctr` or empty.
- `SceneConfigPhase` values include `sample_prepare`, `prepare_train`, `training`, and `serving`; empty means not applicable.
- `UserEventScenes[]` contains selected UserEvent `event_scene` values.
- `ClickEventTypes[]`, `PositiveEventTypes[]`, and `NegativeEventTypes[]` contain UserEvent `event_type` values.
- `Config` is `RecommendSceneConfigV2`; list responses may omit full config, but get returns the full detail. For publishable config enum values and validation constraints, see [PublishRecommendSceneV2](./PublishRecommendSceneV2.md#enum-values).
