# GetDatasetStatistics

## Overview

- API name: `GetDatasetStatistics`
- Category: Control Plane - Usage
- Description: Gets Dataset Statistics.

## IDL Definition

```proto
message GetDatasetStatisticsReq {

  repeated DatasetStatisticsQuery DatasetStatistics = 1;
  string ProjectName = 20;
}

message GetDatasetStatisticsResp {
  repeated DatasetStatistics DatasetStatistics = 1;
}

message DatasetStatisticsQuery {

  string DatasetID = 1;

  repeated string StatusCodes = 2;

  string ApplicationID = 3;
}

message DatasetStatistics {
  string DatasetID = 1;

  int64 TotalDataNum = 2;
  int64 SuccessDataNum = 3;
  int64 FailedDataNum = 4;

  int64 StatusCodesDataNum = 5;

  int64 Duration = 6;
  int64 ImageCount = 7;

  int64 IndexImageCount = 8;

  int64 IndexVideoDuration = 9;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `DatasetStatistics[]` | array<DatasetStatisticsQuery> | No | Dataset statistics. |
| `ProjectName` | string | See service validation | Project name. |
| `DatasetStatistics[].DatasetID` | string | See service validation | Dataset ID. |
| `DatasetStatistics[].StatusCodes[]` | array<string> | No | Status codes. |
| `DatasetStatistics[].ApplicationID` | string | See service validation | Application id. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `DatasetStatistics[]` | array<DatasetStatistics> | No | Dataset statistics. |
| `DatasetStatistics[].DatasetID` | string | See service validation | Dataset ID. |
| `DatasetStatistics[].TotalDataNum` | int64 | See service validation | Total data num. |
| `DatasetStatistics[].SuccessDataNum` | int64 | See service validation | Success data num. |
| `DatasetStatistics[].FailedDataNum` | int64 | See service validation | Failed data num. |
| `DatasetStatistics[].StatusCodesDataNum` | int64 | See service validation | Status codes data num. |
| `DatasetStatistics[].Duration` | int64 | See service validation | Duration. |
| `DatasetStatistics[].ImageCount` | int64 | See service validation | Image count. |
| `DatasetStatistics[].IndexImageCount` | int64 | See service validation | Index image count. |
| `DatasetStatistics[].IndexVideoDuration` | int64 | See service validation | Index video duration. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
