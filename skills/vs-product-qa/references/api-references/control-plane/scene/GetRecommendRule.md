# GetRecommendRule

## Overview

- API name: `GetRecommendRule`
- Category: Control Plane - Scene
- Description: Gets Recommend Rule.

## IDL Definition

```proto
message GetRecommendRuleReq {

  string AppID = 1;

  string RuleID = 2;
  string ProjectName = 20;
}

message RecommendRule {

  string AppID = 1;

  string RuleID = 2;

  string Name = 3;

  string Type = 4;

  string Description = 5;

  string CreatedAt = 6;

  string UpdatedAt = 7;

  string UpdatedBy = 8;

  string DatasetID = 9;

  string ItemDatasetID = 11;

  bool Used = 10;

  google.protobuf.Struct Config = 20;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `RuleID` | string | See service validation | Rule id. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `RuleID` | string | See service validation | Rule id. |
| `Name` | string | See service validation | Name. |
| `Type` | string | See service validation | Type. |
| `Description` | string | See service validation | Description. |
| `CreatedAt` | string | See service validation | Created at. |
| `UpdatedAt` | string | See service validation | Updated at. |
| `UpdatedBy` | string | See service validation | Updated by. |
| `DatasetID` | string | See service validation | Dataset ID. |
| `ItemDatasetID` | string | See service validation | Item dataset ID. |
| `Used` | bool | See service validation | Used. |
| `Config` | Struct | See service validation | Config. |

## Field Semantics and Validation Notes

### Rule Type Values

| Field | Allowed values | Notes |
| --- | --- | --- |
| `Type` | `degrade`, `filter`, `search_filter`, `impression`, `suggest`, `userInterest`, `itemCf`, `forceItem`, `boostBuryCond`, `coldStart`, `shuffle`, `recReason` | Legacy rule API uses camelCase values for several rule types. Do not convert them to snake_case in this API. |

Common `Config` constraints by `Type`:

- `filter`: recommendation item filter DSL; supports dynamic parameters such as `"{{Param}}"`; field names must match the item dataset schema and be filterable.
- `search_filter`: search filter DSL; does not support dynamic parameters.
- `impression`: `TimeWindowSeconds > 0`, `MaxSize` in `0..30000`; nested `ExposureCfg` follows the same limits.
- `boostBuryCond`: `Rules[].Boost` must be in `[-1, 1]`; `Rules[].Config` condition DSL allows at most 2 logic layers.
- `coldStart`: `ItemConditionType` is `import_time` or `custom_filter`; `ImportTimeWindowHours`, `ExposureThreshold`, and `MaxInjectCount` must be non-negative; `import_time` requires `ImportTimeWindowHours > 0`; `custom_filter` requires non-empty `ItemFilter`.
- `shuffle`: `WindowType` is `SLIDE` or `TOP`; `ShuffleType` is `dimension` or `expression`; `WindowSize > 0`; one of `MaxSize` or `RecallMax` must be `> 0`; `WindowSize >= MaxSize/RecallMax`; expression shuffle requires non-empty `ShuffleExpr`.
- `recReason`: enabled templates require valid `RecallChannel` and non-empty `Template`; valid channels are `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, and `cold_start`.

Reference constraints:

- `DatasetID` is the behavior dataset for degrade/recall-oriented rules and the target dataset for other rule families as described by service behavior.
- `ItemDatasetID` is the item dataset scope for item-field rule validation.

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
