# WriteTerms

## Overview

- API name: `WriteTerms`
- Category: Data Plane - DataAPI
- Description: Writes or updates dictionary terms.

## IDL Definition

```proto
message WriteTermsRequest {

  repeated DictItem items = 1;

  string _data_tos_link = 2;
}

message WriteTermsResponse {
}

message DictItem {
  google.protobuf.Struct _last_data = 1;
  google.protobuf.Struct _current_data = 2;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `items[]` | array<DictItem> | No | Items. |
| `_data_tos_link` | string | See service validation | Data tos link. |
| `items[]._last_data` | Struct | See service validation | Last data. |
| `items[]._current_data` | Struct | See service validation | Current data. |

## Response Parameters

This API has no explicit business response fields.

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
