# ListTerms

## Overview

- API name: `ListTerms`
- Category: Data Plane - DataAPI
- Description: Lists Terms.

## IDL Definition

```proto
message ListTermsRequest {
  int32 page = 1;
  int32 page_size = 2;
}

message ListTermsResponse {
  repeated google.protobuf.Struct items = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | int32 | See service validation | Page. |
| `page_size` | int32 | See service validation | Page size. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `items[]` | array<Struct> | No | Items. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
