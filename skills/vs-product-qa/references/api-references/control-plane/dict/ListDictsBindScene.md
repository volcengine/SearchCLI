# ListDictsBindScene

## Overview

- API name: `ListDictsBindScene`
- Category: Control Plane - Dictionary
- Description: Lists Dicts Bind Scene.

## IDL Definition

```proto
message ListDictsBindSceneReq {
  string ProjectName = 1;
  repeated string DictIds = 2;
}

message ListDictsBindSceneResp {
  repeated DictBindScene DictBindScenes = 1;
}

message DictBindScene {
  string DictId = 1;
  repeated search_scene.ApplicationMeta ApplicationMeta = 2;
  int64 Total = 3;
}

message ApplicationMeta {
  string AppID = 1;
  string AppName = 2;
  repeated SceneMeta Scenes = 3;
}

message SceneMeta {
  string SceneID = 1;
  string SceneName = 2;
  repeated DatasetMeta DatasetMetas = 5;
}

message DatasetMeta {
  string DatasetID = 1;
  string DatasetName = 2;
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
| `DictBindScenes[]` | array<DictBindScene> | No | Dict bind scenes. |
| `DictBindScenes[].DictId` | string | See service validation | Dictionary ID. |
| `DictBindScenes[].ApplicationMeta[]` | array<ApplicationMeta> | No | Application meta. |
| `DictBindScenes[].Total` | int64 | See service validation | Total. |
| `DictBindScenes[].ApplicationMeta[].AppID` | string | See service validation | Application ID. |
| `DictBindScenes[].ApplicationMeta[].AppName` | string | See service validation | App name. |
| `DictBindScenes[].ApplicationMeta[].Scenes[]` | array<SceneMeta> | No | Scenes. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
