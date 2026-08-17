# DeleteApplication

## Overview

- API name: `DeleteApplication`
- Category: Control Plane - Application
- Description: Deletes Application.

## IDL Definition

```proto
message DeleteApplicationReq {
  string AppID = 1;
  bool DryRun = 2;
  string ProjectName = 20;
}

message DeleteApplicationResp {}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `DryRun` | bool | See service validation | Dry-run flag. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

This API has no explicit business response fields.

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
