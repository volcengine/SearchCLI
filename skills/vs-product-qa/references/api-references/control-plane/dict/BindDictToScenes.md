# BindDictToScenes

## Overview

- API name: `BindDictToScenes`
- Category: Control Plane - Dictionary
- Description: Binds Dict To Scenes.

## IDL Definition

```proto
message BindDictToScenesReq {
  string ProjectName = 1;
  string DictId = 2;
  repeated DictScene Scenes = 3;
}

message BindDictToScenesResp {
}

message DictScene {
  string AppId = 1;
  string SceneId = 2;
  string DatasetId = 3;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |
| `DictId` | string | See service validation | Dictionary ID. |
| `Scenes[]` | array<DictScene> | No | Scenes. |
| `Scenes[].AppId` | string | See service validation | Application ID. |
| `Scenes[].SceneId` | string | See service validation | Scene ID. |
| `Scenes[].DatasetId` | string | See service validation | Dataset ID. |

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
