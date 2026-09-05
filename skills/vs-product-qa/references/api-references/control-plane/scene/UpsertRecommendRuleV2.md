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

V2 uses snake_case rule type values. Do not use legacy camelCase values such as `forceItem`, `userInterest`, `itemCf`, `boostBuryCond`, `coldStart`, or `recReason`.

## Response Parameters

| Field | Type | Description |
| --- | --- | --- |
| `RuleId` | string | Created or updated rule ID. |

## CLI Notes

- `vs recommend rule upsert --type force_item` is the V2 spelling.
- Use `--item-dataset-id` for `ItemDatasetId` when item-field validation is needed.
- Use `--dry-run` to validate without persisting.
