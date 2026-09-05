# UpsertRecommendRuleV2

## Overview

- API name: `UpsertRecommendRuleV2`
- Category: Control Plane - Scene
- Description: Creates or updates a V2 recommend rule.

## IDL Definition

```proto
message UpsertRecommendRuleV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  string RuleId        = 3;
  string Name          = 4;
  string Type          = 5;
  string Description   = 6;
  string DatasetId     = 11;
  string ItemDatasetId = 12;
  google.protobuf.Struct Config = 21;
  bool DryRun = 31;
}

message UpsertRecommendRuleV2Resp {
  string RuleId = 1;
}

message RecommendRuleV2 {
  string ApplicationId = 1;
  string RuleId        = 2;
  string Name          = 3;
  string Type          = 4;
  string Description   = 5;
  string CreateTime    = 6;
  string UpdateTime    = 7;
  string DatasetId     = 11;
  string ItemDatasetId = 12;
  bool   Used          = 13;
  google.protobuf.Struct Config = 21;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `RuleId` | string | No | Existing rule ID. Empty means create. |
| `Name` | string | Yes for create | Rule name. |
| `Type` | string | Yes for create | Rule type. |
| `Description` | string | No | Rule description. |
| `DatasetId` | string | Conditional | Dataset ID associated with the rule. |
| `ItemDatasetId` | string | Conditional | Item dataset ID associated with the rule. |
| `Config` | Struct | Yes | Rule config. |
| `DryRun` | bool | No | Validate only; do not create/update. |

## Rule Type Values

`UpsertRecommendRuleV2` currently allows only:

- `degrade`
- `filter`
- `search_filter`
- `force_item`

Other V2 rule types may appear in list/get responses but should not be upserted unless the installed API reference proves they are writable:

- `impression`
- `suggest`
- `user_interest`
- `item_cf`
- `boost_bury_cond`
- `cold_start`
- `shuffle`
- `rec_reason`

Use the snake_case rule type values listed above.

## Config JSON Shapes

The V2 IDL declares `Config` as `google.protobuf.Struct`; the concrete JSON shape depends on `Type`.

### `degrade`

```json
{
  "SortType": "EventAccumulation",
  "EventType": "click",
  "TimeWindowSeconds": 3600,
  "ResultDimension": "item_id",
  "EventScores": [
    { "EventType": "click", "Weight": 1 }
  ],
  "ItemFieldSort": {
    "SortField": "sales",
    "SortOrder": "Desc"
  },
  "Fallback": {
    "Enable": true,
    "ItemFieldSort": {
      "SortField": "sales",
      "SortOrder": "Desc"
    }
  }
}
```

### `filter` / `search_filter`

```json
{
  "op": "must",
  "field": "category",
  "conds": ["shoes"]
}
```

### `force_item`

```json
{
  "EffectDuration": "request",
  "Enable": true,
  "Items": [
    { "ItemPkValue": "sku_001", "Position": 1 }
  ]
}
```

## Config Constraints

- `Config` is required and must match `Type`; unknown fields are not a substitute for the expected config structure.
- Existing rules that are already used by a scene cannot change type, dataset binding, or config. Only a name-only update is allowed for used rules.
- `filter`, `search_filter`, and `force_item` must set `DatasetId` to an item dataset in the same application.
- `degrade` must set `DatasetId` to the bound UserEvent dataset. It must also set `ItemDatasetId` when `Config.SortType="ItemField"` or when `Config.Fallback.Enable=true`.
- `ItemDatasetId` is scoped to `degrade`; for other writable rule types it is ignored by the backend.

### `degrade` Config

| Field | Constraint |
| --- | --- |
| `SortType` | `EventAccumulation` or `ItemField`. |
| `EventType` | Required for `EventAccumulation`; must exist in the UserEvent dataset's `event_type` enum values. |
| `TimeWindowSeconds` | Required for `EventAccumulation`; must be between `300` and `1209600` seconds. |
| `ResultDimension` | Required for `EventAccumulation`; must equal the UserEvent item primary-key field. |
| `EventScores[]` | Required for `EventAccumulation`; each `EventType` must be unique and exist in UserEvent `event_type`; each `Weight` must be finite and in `[-100, 100]`. |
| `ItemFieldSort.SortField` | Required for `ItemField`; field must exist in `ItemDatasetId` schema and be int, float, or time-like. A `_item_data.` prefix is accepted and stripped before schema lookup. |
| `ItemFieldSort.SortOrder` | `Asc` or `Desc`. |
| `Fallback` | Required for `EventAccumulation`; if `Fallback.Enable=true`, `Fallback.ItemFieldSort` is required and follows the same `ItemFieldSort` constraints. |

### `filter` and `search_filter` Config

- `Config` is a Viking Filter DSL object and must be non-empty.
- The condition tree allows at most 2 logic layers.
- Referenced `field` values must be exact, case-sensitive item dataset schema field names and must be filterable in the app data config.
- `filter` is the recommend-filter rule type and may use supported dynamic parameter syntax. `search_filter` is for search-scene filter rules and should not use dynamic parameters.

### `force_item` Config

| Field | Constraint |
| --- | --- |
| `EffectDuration` | `request` or `session`. |
| `Items[].ItemPkValue` | Required item primary-key value; duplicate item PKs are rejected. |
| `Items[].Position` | Must be `> 0`; duplicate positions are rejected. |
| `Enable` | Optional. If omitted, backend treats the rule as enabled when `Items[]` is non-empty and disabled when it is empty. |

## Response Parameters

| Field | Type | Description |
| --- | --- | --- |
| `RuleId` | string | Created or updated rule ID. |

## CLI Notes

- `vs recommend rule upsert --type force_item` is the V2 spelling.
- Use `--item-dataset-id` for `ItemDatasetId` when item-field validation is needed.
- Use `--dry-run` to validate without persisting.
