# ListIndexStatusV2

## Overview

- API name: `ListIndexStatusV2`
- Category: Control Plane - Application
- Description: Lists Index Status V2.

## IDL Definition

```proto
message ListIndexStatusReqV2 {
  string DatasetId = 1;
  string ApplicationId = 2;
  optional string ItemId = 3;
  optional int64 MaxResults = 4;
  optional string NextToken = 5;
  repeated string IndexStatusList = 6;

  string SortBy = 100;
  string SortOrder = 101;
  string ProjectName = 20;
}

message ListIndexStatusRespV2 {
  string NextToken = 1;
  repeated IndexStatusInfo IndexStatusInfoList = 2;
  int64 DataFieldConfigVersion = 3;
}

message IndexStatusInfo {
  string ItemId = 1;
  repeated string IndexTypes = 2;
  string IndexProcessEndTimestamp = 3;
  repeated string StatusCodes = 4;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `DatasetId` | string | See service validation | Dataset ID. |
| `ApplicationId` | string | See service validation | Application id. |
| `ItemId` | string | No | Item id. |
| `MaxResults` | int64 | No | Max results. |
| `NextToken` | string | No | Pagination token. |
| `IndexStatusList[]` | array<string> | No | Index status list. Fixed status values are snake_case: `success` / `processing`. Error codes remain PascalCase. |
| `SortBy` | string | See service validation | Sort by. |
| `SortOrder` | string | See service validation | Sort order. Enum: `asc` / `desc` (snake_case). |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `NextToken` | string | See service validation | Pagination token. |
| `IndexStatusInfoList[]` | array<IndexStatusInfo> | No | Index status info list. |
| `DataFieldConfigVersion` | int64 | See service validation | Data field config version. |
| `IndexStatusInfoList[].ItemId` | string | See service validation | Item id. |
| `IndexStatusInfoList[].IndexTypes[]` | array<string> | No | Index types. |
| `IndexStatusInfoList[].IndexProcessEndTimestamp` | string | See service validation | Index process end timestamp. |
| `IndexStatusInfoList[].StatusCodes[]` | array<string> | No | Status codes. Fixed status values are snake_case: `success` / `processing`. Error codes remain PascalCase. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
