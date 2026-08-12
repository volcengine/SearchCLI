# UpdateAppItemFilter

## Overview

- API name: `UpdateAppItemFilter`
- Category: Control Plane - Application
- Description: Updates App Item Filter.

## IDL Definition

```proto
message UpdateAppItemFilterReq {
  string AppID = 1;
  string DatasetID = 2;

  google.protobuf.Struct ItemFilterCond = 3;
  string ProjectName = 20;
}

message UpdateAppItemFilterResp {
  string AppID = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `DatasetID` | string | See service validation | Dataset ID. |
| `ItemFilterCond` | Struct | See service validation | Item filter cond. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
