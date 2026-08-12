# GetAppOnlineConfig

## Overview

- API name: `GetAppOnlineConfig`
- Category: Control Plane - Scene
- Description: Gets App Online Config.

## IDL Definition

```proto
message GetAppOnlineConfigReq {
  string AppID = 1;
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
| `ProjectName` | string | See service validation | Project name. |

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

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
