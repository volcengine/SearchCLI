# QueryRecommendationWithScene

## Overview

- API name: `QueryRecommendationWithScene`
- Category: Data Plane - OnlineAPI
- Description: Query Recommendation With Scene API.

## IDL Definition

```proto
message QueryRecommendationRequest{
  ai_search_rec.online.common.User user = 1;
  int64 page_size = 2;
  int64 min_length = 3;
  int64 max_length = 4;
  string related_item = 5;
  string dataset_id = 6;
  optional QueryRecommendationDynamic query_recommendation_dynamic = 99;
  map<string, ai_search_rec.search_api.common.ExperimentInfo> experiment_group = 100;

  string application = 1002;
  string scene_id = 1003;
  string authorization = 2001;
}

message QueryRecommendationResponse{
  repeated Query recommendation_queries = 1;
}

message ExperimentInfo {
  string name = 1;
  string version = 2;
}

message User {
  optional string _user_id = 1;
  string nickname = 2;
  string user_profile = 3;
}

message QueryRecommendationDynamic{
  int64 page_size = 1;
  int64 min_length = 2;
  int64 max_length = 3;
  optional bool enable = 4;
  repeated common.RelatedDict dicts = 5;
  optional bool enable_api_log = 6;
}

message Query {
  string query = 1;
}

message RelatedDict {
  string dict_id = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `user` | User | See service validation | User. |
| `page_size` | int64 | See service validation | Page size. |
| `min_length` | int64 | See service validation | Min length. |
| `max_length` | int64 | See service validation | Max length. |
| `related_item` | string | See service validation | Related item. |
| `dataset_id` | string | See service validation | Dataset ID. |
| `query_recommendation_dynamic` | QueryRecommendationDynamic | No | Query recommendation dynamic. |
| `experiment_group` | ExperimentInfo> | See service validation | Experiment group. |
| `application` | string | See service validation | Application. |
| `scene_id` | string | See service validation | Scene ID. |
| `authorization` | string | See service validation | Authorization. |
| `user._user_id` | string | No | User id. |
| `user.nickname` | string | See service validation | Nickname. |
| `user.user_profile` | string | See service validation | User profile. |
| `query_recommendation_dynamic.page_size` | int64 | See service validation | Page size. |
| `query_recommendation_dynamic.min_length` | int64 | See service validation | Min length. |
| `query_recommendation_dynamic.max_length` | int64 | See service validation | Max length. |
| `query_recommendation_dynamic.enable` | bool | No | Enable. |
| `query_recommendation_dynamic.dicts[]` | array<RelatedDict> | No | Dicts. |
| `query_recommendation_dynamic.enable_api_log` | bool | No | Enable api log. |
| `experiment_group.name` | string | See service validation | Name. |
| `experiment_group.version` | string | See service validation | Version. |
| `query_recommendation_dynamic.dicts[].dict_id` | string | See service validation | Dictionary ID. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `recommendation_queries[]` | array<Query> | No | Recommendation queries. |
| `recommendation_queries[].query` | string | See service validation | Query. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
