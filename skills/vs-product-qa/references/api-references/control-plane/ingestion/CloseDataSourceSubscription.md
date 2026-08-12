# CloseDataSourceSubscription

## Overview

- API name: `CloseDataSourceSubscription`
- Category: Control Plane - Ingestion
- Description: Closes Data Source Subscription.

## IDL Definition

```proto
message CloseDataSourceSubscriptionReq {
  string TaskId = 1;
  string ProjectName = 20;
}

message CloseDataSourceSubscriptionResp {
  string TaskId = 1;
  string Status = 2;
  string Message = 3;
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
| `TaskId` | string | See service validation | Task id. |
| `Status` | string | See service validation | Status. |
| `Message` | string | See service validation | Message. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
