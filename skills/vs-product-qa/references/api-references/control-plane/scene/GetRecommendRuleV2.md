# GetRecommendRuleV2

## Overview

- API name: `GetRecommendRuleV2`
- Category: Control Plane - Scene
- Description: Gets a V2 recommend rule detail, including full `Config`.

## IDL Definition

```proto
message GetRecommendRuleV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  string RuleId        = 3;
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
| `RuleId` | string | Yes | Recommend rule ID. |

## Response Notes

- `RecommendRuleV2` no longer exposes `UpdatedBy`.
- Rule type values are snake_case in V2.
- `GetRecommendRuleV2` returns the full rule `Config`; list responses may not.
