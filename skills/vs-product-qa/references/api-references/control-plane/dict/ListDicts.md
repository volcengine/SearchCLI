# ListDicts

## Overview

- API name: `ListDicts`
- Category: Control Plane - Dictionary
- Description: Lists Dicts.

## IDL Definition

```proto
message ListDictsReq {
  string ProjectName = 1;
  repeated string DictIds = 2;
  repeated string Types = 3;
}

message ListDictsResp {
  repeated Dict Dicts = 1;
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
| `DictIds[]` | array<string> | No | Dict ids. |
| `Types[]` | array<string> | No | Types. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Dicts[]` | array<Dict> | No | Dicts. |
| `Dicts[].ProjectName` | string | See service validation | Project name. |
| `Dicts[].DictId` | string | See service validation | Dictionary ID. |
| `Dicts[].Name` | string | See service validation | Name. |
| `Dicts[].Type` | string | See service validation | Type. |
| `Dicts[].Description` | string | See service validation | Description. |
| `Dicts[].CreatedAt` | int64 | See service validation | Created at. |
| `Dicts[].UpdatedAt` | int64 | See service validation | Updated at. |
| `Dicts[].UpdatedBy` | string | See service validation | Updated by. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
