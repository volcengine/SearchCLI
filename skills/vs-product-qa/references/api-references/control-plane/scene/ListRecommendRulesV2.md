# ListRecommendRulesV2

## Overview

- API name: `ListRecommendRulesV2`
- Category: Control Plane - Scene
- Description: Lists V2 recommend rules under an application.

## IDL Definition

```proto
message ListRecommendRulesV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  repeated string Types = 3;
  string DatasetId = 4;
  string InvertItemDatasetId = 5;
  string ItemDatasetId = 6;
}

message ListRecommendRulesV2Resp {
  repeated RecommendRuleV2 Rules = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `Types[]` | array<string> | No | Rule type filters. |
| `DatasetId` | string | No | Dataset ID filter. |
| `InvertItemDatasetId` | string | No | Inverted item dataset filter. |
| `ItemDatasetId` | string | No | Item dataset filter. |

## Response Parameters

| Field | Type | Description |
| --- | --- | --- |
| `Rules[]` | array<RecommendRuleV2> | Recommend rule list. List responses do not guarantee full `Config`. |

V2 removed the V1 `TotalCount` and `Items[]` response fields. Use `Rules[]`.

## Rule Type Filters

`Types[]` accepts these V2 rule type values; empty means all:

- `degrade`
- `filter`
- `search_filter`
- `impression`
- `suggest`
- `user_interest`
- `item_cf`
- `force_item`
- `boost_bury_cond`
- `cold_start`
- `shuffle`
- `rec_reason`

`ListRecommendRulesV2` may return rules that are not writable through `UpsertRecommendRuleV2`. Use `UpsertRecommendRuleV2` only for `degrade`, `filter`, `search_filter`, and `force_item`.

## Filter Semantics

- `DatasetId` filters rules by their directly bound dataset. For invert/recall rules, this is the UserEvent dataset.
- `InvertItemDatasetId` only applies to invert/recall rules and filters by the item dataset embedded in the rule config.
- `ItemDatasetId` filters degrade rules by their scoped item dataset.
- List responses do not guarantee full `Config`; call `GetRecommendRuleV2` before modifying a rule.
