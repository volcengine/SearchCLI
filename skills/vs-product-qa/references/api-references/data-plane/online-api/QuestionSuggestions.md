# QuestionSuggestions

## Overview

- API name: `QuestionSuggestions`
- Category: Data Plane - OnlineAPI
- Description: Question Suggestions API.

## IDL Definition

```proto
message QuestionSuggestionsRequest {
  ai_search_rec.online.common.User user = 1;
  ai_search_rec.online.common.Context context = 2;
}

message QuestionSuggestionsResponse {
  repeated string suggestions = 1;
}

message User {
  optional string _user_id = 1;
  string nickname = 2;
  string user_profile = 3;
}

message Context {
  Location location = 1;
  google.protobuf.Struct extra = 2;
}

message Location {
  string longitude = 1;
  string latitude = 2;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `user` | User | See service validation | User. |
| `context` | Context | See service validation | Context. |
| `user._user_id` | string | No | User id. |
| `user.nickname` | string | See service validation | Nickname. |
| `user.user_profile` | string | See service validation | User profile. |
| `context.location` | Location | See service validation | Location. |
| `context.extra` | Struct | See service validation | Extra. |
| `context.location.longitude` | string | See service validation | Longitude. |
| `context.location.latitude` | string | See service validation | Latitude. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `suggestions[]` | array<string> | No | Suggestions. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
