# GetDict

## Overview

- API name: `GetDict`
- Category: Control Plane - Dictionary
- Description: Gets Dict.

## IDL Definition

```proto
message GetDictReq {
  string ProjectName = 1;
  string DictId = 2;
}

message Dict {
  string ProjectName = 1;
  string DictId = 2;
  string Name = 3;
  string Type = 4;
  string Description = 5;
  int64 CreatedAt = 6;
  int64 UpdatedAt = 7;
  string UpdatedBy = 8;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |
| `DictId` | string | See service validation | Dictionary ID. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |
| `DictId` | string | See service validation | Dictionary ID. |
| `Name` | string | See service validation | Name. |
| `Type` | string | See service validation | Type. |
| `Description` | string | See service validation | Description. |
| `CreatedAt` | int64 | See service validation | Created at. |
| `UpdatedAt` | int64 | See service validation | Updated at. |
| `UpdatedBy` | string | See service validation | Updated by. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
