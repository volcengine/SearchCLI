# ListDictsWordNum

## Overview

- API name: `ListDictsWordNum`
- Category: Control Plane - Dictionary
- Description: Lists Dicts Word Num.

## IDL Definition

```proto
message ListDictsWordNumReq {
  string ProjectName = 1;
  repeated string DictIds = 2;
}

message ListDictsWordNumResp {
  repeated DictWordNum DictWordNum = 1;
  repeated ErrorDetail ErrorDetails = 2;
}

message DictWordNum {
  string DictId = 1;
  uint64 WordNum = 2;
}

message ErrorDetail {
  string DictId = 1;
  string Error = 2;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |
| `DictIds[]` | array<string> | No | Dict ids. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `DictWordNum[]` | array<DictWordNum> | No | Dict word num. |
| `ErrorDetails[]` | array<ErrorDetail> | No | Error details. |
| `DictWordNum[].DictId` | string | See service validation | Dictionary ID. |
| `DictWordNum[].WordNum` | uint64 | See service validation | Word num. |
| `ErrorDetails[].DictId` | string | See service validation | Dictionary ID. |
| `ErrorDetails[].Error` | string | See service validation | Error. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
