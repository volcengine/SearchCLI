# GetDataSourceSubscription

## Overview

- API name: `GetDataSourceSubscription`
- Category: Control Plane - Ingestion
- Description: Gets Data Source Subscription.

## IDL Definition

```proto
message GetDataSourceSubscriptionReq {
  string TaskId = 1;
  string ProjectName = 20;
}

message GetDataSourceSubscriptionResp {
  DataSourceSubscriptionTaskInfo Task = 1;
}

message DataSourceSubscriptionTaskInfo {
  string TaskId = 1;
  string Status = 2;
  int64 ImportedCount = 3;
  string DatasetId = 4;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TaskId` | string | See service validation | Task id. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Task` | DataSourceSubscriptionTaskInfo | See service validation | Task. |
| `Task.TaskId` | string | See service validation | Task id. |
| `Task.Status` | string | See service validation | Status. snake_case enum: `initialized` / `waiting_for_dataset` / `importing` / `finished` / `failed`. |
| `Task.ImportedCount` | int64 | See service validation | Imported count. |
| `Task.DatasetId` | string | See service validation | Dataset ID. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
