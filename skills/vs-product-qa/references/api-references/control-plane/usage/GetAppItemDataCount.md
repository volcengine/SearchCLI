# GetAppItemDataCount

## Overview

- API name: `GetAppItemDataCount`
- Category: Control Plane - Usage
- Description: Gets App Item Data Count.

## IDL Definition

```proto
message GetAppItemDataCountReq {
  string AppID = 1;
  string DatasetID = 2;
  string ProjectName = 20;
}

message GetAppItemDataCountResp {
  int64 TotalCnt = 1;
  int64 ValidCnt = 2;
  int64 ImageNumTotal = 3;
  int64 ValidImageNum = 4;
  int64 DurationTotal = 5;
  int64 ValidDuration = 6;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `DatasetID` | string | See service validation | Dataset ID. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TotalCnt` | int64 | See service validation | Total cnt. |
| `ValidCnt` | int64 | See service validation | Valid cnt. |
| `ImageNumTotal` | int64 | See service validation | Image num total. |
| `ValidImageNum` | int64 | See service validation | Valid image num. |
| `DurationTotal` | int64 | See service validation | Duration total. |
| `ValidDuration` | int64 | See service validation | Valid duration. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
