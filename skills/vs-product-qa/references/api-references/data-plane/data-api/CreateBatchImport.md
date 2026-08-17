# CreateBatchImport

## Overview

- API name: `CreateBatchImport`
- Category: Data Plane - DataAPI
- Description: Creates Batch Import.

## IDL Definition

```proto
message CreateBatchImportRequest {
  optional int64 estimated_count = 1;
}

message CreateBatchImportResponse {
  string batch_id = 1;
  string status = 2;
  string expired_time = 3;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `estimated_count` | int64 | No | Estimated count. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `batch_id` | string | See service validation | Batch id. |
| `status` | string | See service validation | Status. |
| `expired_time` | string | See service validation | Expired time. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
