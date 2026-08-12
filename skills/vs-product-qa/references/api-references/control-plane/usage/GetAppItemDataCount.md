# GetAppItemDataCount

## Overview

- API name: `GetAppItemDataCount`
- Category: Control Plane - Usage
- Description: Gets the effective data count for an item or video dataset under an application. User behavior datasets (`user_event`) do not require data-volume statistics and should be omitted from product-level data volume summaries.

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

Applicability constraint:

- Use this API only for item/video datasets that are bound to the target application.
- Do not call this API for `user_event` datasets. User behavior datasets have no product-level effective-data-volume metric and must be omitted from application data-volume summaries.
- Do not use this API for document dataset counts. Document dataset counts come from application dataset config metadata instead of this item/video count API.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `DatasetID` | string | See service validation | Item/video dataset ID bound to the application. Do not pass a `user_event` dataset ID. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TotalCnt` | int64 | See service validation | Total item/video records considered by the count API. |
| `ValidCnt` | int64 | See service validation | Effective item/video records after application-level filtering and processing. Use this as the effective count for item/video datasets. |
| `ImageNumTotal` | int64 | See service validation | Total image count for multi-modal item/video data when available. |
| `ValidImageNum` | int64 | See service validation | Effective image count for multi-modal item/video data when available. |
| `DurationTotal` | int64 | See service validation | Total video duration when available. |
| `ValidDuration` | int64 | See service validation | Effective video duration when available. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `InvalidParameter.DatasetType` | The dataset type is not supported by this API, such as a `user_event` or document dataset. | Do not use this API for that dataset type. Skip `user_event` datasets in data-volume summaries, and use document metadata for document datasets. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
