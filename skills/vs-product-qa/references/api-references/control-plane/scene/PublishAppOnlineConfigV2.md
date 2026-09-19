# PublishAppOnlineConfigV2

## Overview

- API name: `PublishAppOnlineConfigV2`
- Category: Control Plane - Scene
- Description: Publishes App Online Config.

## IDL Definition

```proto
message PublishAppOnlineConfigV2Req {
  string ProjectName = 1;
  string ApplicationId = 2;
  OnlineConfigV2 Config = 11;
  bool DryRun = 21;
}

message GetAppOnlineConfigV2Resp {
  OnlineConfigV2 Config = 1;
  OnlineConfigV2 DraftConfig = 2;
}

message OnlineConfigV2 {
  ChatConfigV2 ChatConfig = 1;
}

message ChatConfigV2 {
  repeated string BanWords = 1;
  string RoleInfo = 2;
  string AnswerInfo = 3;
  string RoleAuxiliaryPrompt = 4;
  OpeningRemarksConfig OpeningRemarksConfig = 5;
  string NetworkSearchMode = 6;
  string SearchSceneId = 7;
  string FollowUpInfo = 8;
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
| `ProjectName` | string | See service validation | Project name. |
| `ApplicationId` | string | See service validation | Application ID. |
| `Config` | OnlineConfigV2 | See service validation | Config. |
| `DryRun` | bool | No | Validate only; do not publish. |
| `Config.ChatConfig` | ChatConfigV2 | See service validation | Chat config. |
| `Config.ChatConfig.BanWords[]` | array<string> | No | Ban words. |
| `Config.ChatConfig.RoleInfo` | string | See service validation | Role info. |
| `Config.ChatConfig.AnswerInfo` | string | See service validation | Answer info. |
| `Config.ChatConfig.RoleAuxiliaryPrompt` | string | See service validation | Role auxiliary prompt. |
| `Config.ChatConfig.OpeningRemarksConfig` | OpeningRemarksConfig | See service validation | Opening remarks config. |
| `Config.ChatConfig.NetworkSearchMode` | string | See service validation | Network search mode. |
| `Config.ChatConfig.SearchSceneId` | string | See service validation | Search scene ID. |
| `Config.ChatConfig.FollowUpInfo` | string | See service validation | Follow up info. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Config` | OnlineConfigV2 | See service validation | Config. |
| `DraftConfig` | OnlineConfigV2 | See service validation | Draft config. |
| `Config.ChatConfig` | ChatConfigV2 | See service validation | Chat config. |
| `DraftConfig.ChatConfig` | ChatConfigV2 | See service validation | Chat config. |
| `Config.ChatConfig.BanWords[]` | array<string> | No | Ban words. |
| `Config.ChatConfig.RoleInfo` | string | See service validation | Role info. |
| `Config.ChatConfig.AnswerInfo` | string | See service validation | Answer info. |
| `Config.ChatConfig.RoleAuxiliaryPrompt` | string | See service validation | Role auxiliary prompt. |
| `Config.ChatConfig.OpeningRemarksConfig` | OpeningRemarksConfig | See service validation | Opening remarks config. |
| `Config.ChatConfig.NetworkSearchMode` | string | See service validation | Network search mode. |
| `Config.ChatConfig.SearchSceneId` | string | See service validation | Search scene ID. |
| `Config.ChatConfig.FollowUpInfo` | string | See service validation | Follow up info. |
| `DraftConfig.ChatConfig.BanWords[]` | array<string> | No | Ban words. |
| `DraftConfig.ChatConfig.RoleInfo` | string | See service validation | Role info. |
| `DraftConfig.ChatConfig.AnswerInfo` | string | See service validation | Answer info. |
| `DraftConfig.ChatConfig.RoleAuxiliaryPrompt` | string | See service validation | Role auxiliary prompt. |
| `DraftConfig.ChatConfig.OpeningRemarksConfig` | OpeningRemarksConfig | See service validation | Opening remarks config. |
| `DraftConfig.ChatConfig.NetworkSearchMode` | string | See service validation | Network search mode. |
| `DraftConfig.ChatConfig.SearchSceneId` | string | See service validation | Search scene ID. |
| `DraftConfig.ChatConfig.FollowUpInfo` | string | See service validation | Follow up info. |

## Field Semantics and Validation Notes

This API publishes the complete application online chat config. Preserve existing sibling fields inside `Config.ChatConfig` unless the change intentionally clears them. `DryRun=true` validates the config without publishing it.

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
- `Config.ChatConfig.SearchSceneId` may be empty. When non-empty, it must refer to an existing search scene under the same application.
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
