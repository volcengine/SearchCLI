# CreateRecommendScene

## Overview

- API name: `CreateRecommendScene`
- Category: Control Plane - Scene
- Description: Creates Recommend Scene.

## IDL Definition

```proto
message CreateRecommendSceneReq {

  string AppID = 1;
  string ProjectName = 20;

  string Type = 2;

  string Name = 3;

  string Description = 4;

  string ItemDatasetID = 5;

  RecommendModelEnum RecommendModel = 6;

  RecommendOptimizationTargetEnum RecommendOptimizationTarget = 7;

  repeated string BhvSceneTypes = 8;

  repeated string  ClickEventTypes = 9;

  repeated string  PositiveEventTypes = 10;

  repeated string  NegativeEventTypes = 11;
}

message CreateRecommendSceneResp {

  string SceneID = 1;
}

enum RecommendModelEnum {
  Default = 0;
  LongSequence = 1;
}

enum RecommendOptimizationTargetEnum {
  RecommendOptimizationTargetNone = 0;
  Ctr = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `ProjectName` | string | See service validation | Project name. |
| `Type` | string | See service validation | Type. |
| `Name` | string | See service validation | Name. |
| `Description` | string | See service validation | Description. |
| `ItemDatasetID` | string | See service validation | Item dataset ID. |
| `RecommendModel` | RecommendModelEnum | See service validation | Recommend model. |
| `RecommendOptimizationTarget` | RecommendOptimizationTargetEnum | See service validation | Recommend optimization target. |
| `BhvSceneTypes[]` | array<string> | No | Bhv scene types. |
| `ClickEventTypes[]` | array<string> | No | Click event types. |
| `PositiveEventTypes[]` | array<string> | No | Positive event types. |
| `NegativeEventTypes[]` | array<string> | No | Negative event types. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `SceneID` | string | See service validation | Scene ID. |

## Field Semantics and Validation Notes

### Enum and String Values

| Field | Allowed values | Notes |
| --- | --- | --- |
| `Type` | `for_you`, `related`, `shopping_cart` | Recommend scene type: home feed, related/detail-page, or shopping-cart recommendation. |
| `RecommendModel` | `Default`, `LongSequence` | Proto enum values. Service/domain string equivalents are `default` and `long_sequence`. |
| `RecommendOptimizationTarget` | `RecommendOptimizationTargetNone`, `Ctr` | Proto enum values. Long-sequence scenes require a non-empty optimization target; service/domain string equivalent for `Ctr` is `ctr`. |

### Behavior Event Constraints

- `BhvSceneTypes[]` is required and every value must exist in the bound UserEvent dataset's `event_scene` enum values.
- For `RecommendModel=LongSequence`, `ClickEventTypes[]` is required.
- `ClickEventTypes[]`, `PositiveEventTypes[]`, and `NegativeEventTypes[]` values come from the bound UserEvent dataset's `event_type` enum values.

### Reference Constraints

- `ItemDatasetID` must refer to an item dataset bound to the application.
- `FilterConfig.ItemTypeFilter.Filter` fields must use exact item dataset schema field names and must be filterable.

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
