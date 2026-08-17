# GetPresignedImportUrlV2

## Overview

- API name: `GetPresignedImportUrlV2`
- Category: Control Plane - Task
- Description: Gets Presigned Import Url V2.

## IDL Definition

```proto
message GetPresignedImportUrlReqV2 {
  optional string FileName = 1;
  string ProjectName = 20;
}

message GetPresignedImportUrlRespV2 {
  string FileUrl = 1;
  string FileKey = 2;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `FileName` | string | No | File name. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `FileUrl` | string | See service validation | File url. |
| `FileKey` | string | See service validation | File key. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
