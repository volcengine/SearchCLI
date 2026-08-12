# QueryCompletionWithScene

## Overview

- API name: `QueryCompletionWithScene`
- Category: Data Plane - OnlineAPI
- Description: Query Completion With Scene API.

## IDL Definition

```proto
message QueryCompletionRequest {
  string query = 1;

  QueryCompletionDynamic query_completion_dynamic = 2;

  map<string, common.ExperimentInfo> experiment_group = 100;

  string application = 1002;
  string scene_id = 1003;
  string authorization = 2001;
  string dataset_id = 3;
}

message QueryCompletionResponse {
  repeated Suggestion suggestions = 1;
}

message ExperimentInfo {
  string name = 1;
  string version = 2;
}

message QueryCompletionDynamic {
  int64 sug_max_retrieve_num = 1;
  int64 min_char_length = 2;
  optional bool enable = 3;
  repeated common.RelatedDict dicts = 4;
  optional bool enable_api_log = 5;
}

message Suggestion {
  string suggestion = 1;
}

message RelatedDict {
  string dict_id = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | string | See service validation | Query. |
| `query_completion_dynamic` | QueryCompletionDynamic | See service validation | Query completion dynamic. |
| `experiment_group` | ExperimentInfo> | See service validation | Experiment group. |
| `application` | string | See service validation | Application. |
| `scene_id` | string | See service validation | Scene ID. |
| `authorization` | string | See service validation | Authorization. |
| `dataset_id` | string | See service validation | Dataset ID. |
| `query_completion_dynamic.sug_max_retrieve_num` | int64 | See service validation | Sug max retrieve num. |
| `query_completion_dynamic.min_char_length` | int64 | See service validation | Min char length. |
| `query_completion_dynamic.enable` | bool | No | Enable. |
| `query_completion_dynamic.dicts[]` | array<RelatedDict> | No | Dicts. |
| `query_completion_dynamic.enable_api_log` | bool | No | Enable api log. |
| `experiment_group.name` | string | See service validation | Name. |
| `experiment_group.version` | string | See service validation | Version. |
| `query_completion_dynamic.dicts[].dict_id` | string | See service validation | Dictionary ID. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `suggestions[]` | array<Suggestion> | No | Suggestions. |
| `suggestions[].suggestion` | string | See service validation | Suggestion. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
