# AddInferDatasetSchemaTaskV2

## Overview

- API name: `AddInferDatasetSchemaTaskV2`
- Category: Control Plane - Task
- Description: Starts Infer Dataset Schema Task V2.

## IDL Definition

```proto
message AddInferDatasetSchemaTaskReqV2 {
  string TosKey = 1;
  string Type = 2;
  string Industry = 3;
  string Language = 4;
  string Theme = 5;
  bool DryRun = 6;
  string PostPaidType = 7;
  string ProjectName = 20;
}

message AddInferDatasetSchemaTaskRespV2 {
  string TaskId = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TosKey` | string | See service validation | Tos key. |
| `Type` | string | See service validation | Type. |
| `Industry` | string | See service validation | Industry. |
| `Language` | string | See service validation | Language. |
| `Theme` | string | See service validation | Theme. |
| `DryRun` | bool | See service validation | Dry-run flag. |
| `PostPaidType` | string | See service validation | Post paid type. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TaskId` | string | See service validation | Task id. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
