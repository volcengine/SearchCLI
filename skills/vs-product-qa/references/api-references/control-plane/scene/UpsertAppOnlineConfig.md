# UpsertAppOnlineConfig

## Overview

- API name: `UpsertAppOnlineConfig`
- Category: Control Plane - Scene
- Description: Creates or updates App Online Config.

## IDL Definition

```proto
message UpsertAppOnlineConfigReq {
  string AppID = 1;
  OnlineConfig Config = 2;
  optional bool ConfigSaveAsDraft = 3;
  string ProjectName = 20;
}

message GetAppOnlineConfigResp {
  OnlineConfig Config = 1;
  OnlineConfig DraftConfig = 2;
}

message OnlineConfig {
  ChatConfig ChatConfig = 11;
}

message ChatConfig {
  repeated string BanWords = 2;
  string RoleInfo = 3;
  string AnswerInfo = 4;
  string RoleAuxiliaryPrompt = 5;
  OpeningRemarksConfig OpeningRemarksConfig = 6;
  string NetworkSearchMode = 7;
  string SearchSceneID = 8;
  string FollowUpInfo = 9;
}

message OpeningRemarksConfig {
  bool EnableRecommend = 1;
  string RecommendSceneId = 2;
  string UserPrompt = 3;
  string RecommendItemDatasetId = 4;
  string UserPromptWithoutRec = 5;
  int64 SuggestionLimit = 6;
  CustomizedQuestionConfig CustomizedQuestionConfig = 7;

  optional bool EnableOpeningSuggestion = 8;
}

message CustomizedQuestionConfig {
  repeated string CustomizedQuestions = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `Config` | OnlineConfig | See service validation | Config. |
| `ConfigSaveAsDraft` | bool | No | Config save as draft. |
| `ProjectName` | string | See service validation | Project name. |
| `Config.ChatConfig` | ChatConfig | See service validation | Chat config. |
| `Config.ChatConfig.BanWords[]` | array<string> | No | Ban words. |
| `Config.ChatConfig.RoleInfo` | string | See service validation | Role info. |
| `Config.ChatConfig.AnswerInfo` | string | See service validation | Answer info. |
| `Config.ChatConfig.RoleAuxiliaryPrompt` | string | See service validation | Role auxiliary prompt. |
| `Config.ChatConfig.OpeningRemarksConfig` | OpeningRemarksConfig | See service validation | Opening remarks config. |
| `Config.ChatConfig.NetworkSearchMode` | string | See service validation | Network search mode. |
| `Config.ChatConfig.SearchSceneID` | string | See service validation | Search scene ID. |
| `Config.ChatConfig.FollowUpInfo` | string | See service validation | Follow up info. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Config` | OnlineConfig | See service validation | Config. |
| `DraftConfig` | OnlineConfig | See service validation | Draft config. |
| `Config.ChatConfig` | ChatConfig | See service validation | Chat config. |
| `DraftConfig.ChatConfig` | ChatConfig | See service validation | Chat config. |
| `Config.ChatConfig.BanWords[]` | array<string> | No | Ban words. |
| `Config.ChatConfig.RoleInfo` | string | See service validation | Role info. |
| `Config.ChatConfig.AnswerInfo` | string | See service validation | Answer info. |
| `Config.ChatConfig.RoleAuxiliaryPrompt` | string | See service validation | Role auxiliary prompt. |
| `Config.ChatConfig.OpeningRemarksConfig` | OpeningRemarksConfig | See service validation | Opening remarks config. |
| `Config.ChatConfig.NetworkSearchMode` | string | See service validation | Network search mode. |
| `Config.ChatConfig.SearchSceneID` | string | See service validation | Search scene ID. |
| `Config.ChatConfig.FollowUpInfo` | string | See service validation | Follow up info. |
| `DraftConfig.ChatConfig.BanWords[]` | array<string> | No | Ban words. |
| `DraftConfig.ChatConfig.RoleInfo` | string | See service validation | Role info. |
| `DraftConfig.ChatConfig.AnswerInfo` | string | See service validation | Answer info. |
| `DraftConfig.ChatConfig.RoleAuxiliaryPrompt` | string | See service validation | Role auxiliary prompt. |
| `DraftConfig.ChatConfig.OpeningRemarksConfig` | OpeningRemarksConfig | See service validation | Opening remarks config. |
| `DraftConfig.ChatConfig.NetworkSearchMode` | string | See service validation | Network search mode. |
| `DraftConfig.ChatConfig.SearchSceneID` | string | See service validation | Search scene ID. |
| `DraftConfig.ChatConfig.FollowUpInfo` | string | See service validation | Follow up info. |

## Field Semantics and Validation Notes

This API writes the complete application online chat config. Preserve existing sibling fields inside `Config.ChatConfig` unless the change intentionally clears them. `ConfigSaveAsDraft=true` saves draft config only; otherwise the config is published and the draft is cleared by service behavior.

### String Enum Values

| Field | Allowed values | Notes |
| --- | --- | --- |
| `Config.ChatConfig.NetworkSearchMode` | `disabled`, `ondemand`, `always` | Empty is accepted and treated as `disabled`; any other value is invalid. |

### Numeric and Length Constraints

| Field | Constraint | Notes |
| --- | --- | --- |
| `Config.ChatConfig.OpeningRemarksConfig.SuggestionLimit` | `3..8` | Default is `4` when read through service behavior. |
| `Config.ChatConfig.OpeningRemarksConfig.CustomizedQuestionConfig.CustomizedQuestions[]` | at most `100` items | Applies when customized opening suggestions are configured. |

### Reference Constraints

- `Config.ChatConfig.OpeningRemarksConfig` is required in update requests.
- `Config.ChatConfig.SearchSceneID` may be empty. When non-empty, it must refer to an existing search scene under the same application.
- When `Config.ChatConfig.OpeningRemarksConfig.EnableRecommend=true`, `Config.ChatConfig.OpeningRemarksConfig.RecommendSceneId` is required and must refer to an existing recommend scene under the same application.
- `Config.ChatConfig.OpeningRemarksConfig.RecommendItemDatasetId` may be omitted. When provided, it must match the item dataset bound to `RecommendSceneId`; service behavior fills it with the bound item dataset ID.
- `Config.ChatConfig.RoleAuxiliaryPrompt` is compatibility data derived from `RoleInfo`, `AnswerInfo`, and `FollowUpInfo`; prefer writing the explicit fields.

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
