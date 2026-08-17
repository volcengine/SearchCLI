# GetDataItemSummary

## Overview

- API name: `GetDataItemSummary`
- Category: Control Plane - Usage
- Description: Gets Data Item Summary.

## IDL Definition

```proto
message GetDataItemSummaryReq {
  string DatasetId = 1;
  string ProjectName = 20;
}

message GetDataItemSummaryResp {
  int64 TotalCount = 1;
  int64 SuccessCount = 2;
  int64 Duration = 3;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `DatasetId` | string | See service validation | Dataset ID. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TotalCount` | int64 | See service validation | Total count. |
| `SuccessCount` | int64 | See service validation | Success count. |
| `Duration` | int64 | See service validation | Duration. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
