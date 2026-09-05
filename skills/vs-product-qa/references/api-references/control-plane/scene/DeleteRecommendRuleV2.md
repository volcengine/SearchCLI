# DeleteRecommendRuleV2

## Overview

- API name: `DeleteRecommendRuleV2`
- Category: Control Plane - Scene
- Description: Deletes a V2 recommend rule.

## IDL Definition

```proto
message DeleteRecommendRuleV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  string RuleId        = 3;
  bool DryRun          = 11;
}

message EmptyResp {}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `RuleId` | string | Yes | Recommend rule ID. |
| `DryRun` | bool | No | Validate only; do not delete. |

## CLI Notes

Use `vs recommend rule delete --dry-run` to validate deletion without removing the rule.

## Validation Notes

- The target rule must exist in the application.
- Rules referenced by any recommend scene cannot be deleted. Check `Used=false` from `GetRecommendRuleV2` or `ListRecommendRulesV2` before issuing a real delete.
