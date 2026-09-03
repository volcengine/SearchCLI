# DeleteRecommendRule

## Overview

- API name: `DeleteRecommendRule`
- Category: Control Plane - Scene
- Description: Deletes Recommend Rule.

## IDL Definition

```proto
message DeleteRecommendRuleReq {

  string AppID = 1;

  string RuleID = 2;
  string ProjectName = 20;
}

message EmptyResp {}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `RuleID` | string | See service validation | Rule id. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

This API has no explicit business response fields.

## Field Semantics and Validation Notes

| Field | Constraint | Notes |
| --- | --- | --- |
| `AppID` | non-empty | The target recommend rule must belong to this application. |
| `RuleID` | non-empty | The target recommend rule must exist and be visible in the project. |
| `ProjectName` | non-empty | Project scope for the target rule. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
