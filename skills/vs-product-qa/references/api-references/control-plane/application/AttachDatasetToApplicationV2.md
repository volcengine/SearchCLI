# AttachDatasetToApplicationV2

## Overview

- API name: `AttachDatasetToApplicationV2`
- Category: Control Plane - Application
- Description: Attach Dataset To Application V2 API.

## IDL Definition

```proto
message AttachDatasetToApplicationReqV2 {
  string ApplicationId = 1;
  string DatasetId = 2;
  dataset_v2.DataFieldConfigV2 DataConfig = 3;
  bool DryRun = 4;
  string ProjectName = 20;
}

message AttachDatasetToApplicationRespV2 {}

message DataFieldConfigV2 {
  repeated string IndexFields = 1;
  repeated string FilterFields = 2;
  repeated string SuggestFields = 3;
  repeated string ImageIndexFields = 4;
  repeated string VideoIndexFields = 5;
  repeated string ChatFields = 6;
  map<string, FilterFieldsListV2> FilterFieldsMap = 7;
  map<string, string> FieldDescMap = 8;
  repeated AugmentedFieldV2 AugmentedFields = 9;
}

message FilterFieldsListV2 {
  repeated string Fields = 1;
}

message AugmentedFieldV2 {
  string FieldName = 1;
  string FieldType = 2;
  repeated string SourceFields = 3;
  int32 MaxGenerationNum = 4;
  string SystemPrompt = 5;
  string Prompt = 6;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ApplicationId` | string | See service validation | Application id. |
| `DatasetId` | string | See service validation | Dataset ID. |
| `DataConfig` | DataFieldConfigV2 | See service validation | Data config. |
| `DryRun` | bool | See service validation | Dry-run flag. |
| `ProjectName` | string | See service validation | Project name. |
| `DataConfig.IndexFields[]` | array<string> | No | Index fields. |
| `DataConfig.FilterFields[]` | array<string> | No | Filter fields. |
| `DataConfig.SuggestFields[]` | array<string> | No | Suggest fields. |
| `DataConfig.ImageIndexFields[]` | array<string> | No | Image index fields. |
| `DataConfig.VideoIndexFields[]` | array<string> | No | Video index fields. |
| `DataConfig.ChatFields[]` | array<string> | No | Chat fields. |
| `DataConfig.FilterFieldsMap` | map<string, FilterFieldsListV2> | See service validation | Filter fields map. |
| `DataConfig.FieldDescMap` | map<string, string> | See service validation | Field desc map. |
| `DataConfig.AugmentedFields[]` | array<AugmentedFieldV2> | No | Augmented fields. |
| `DataConfig.FilterFieldsMap.Fields[]` | array<string> | No | Fields. |
| `DataConfig.AugmentedFields[].FieldName` | string | See service validation | Field name. |
| `DataConfig.AugmentedFields[].FieldType` | string | See service validation | Field type. Enum values are snake_case (e.g. `search_queries`, `item_summary`, `doc_chunk_id`). |
| `DataConfig.AugmentedFields[].SourceFields[]` | array<string> | No | Source fields. |
| `DataConfig.AugmentedFields[].MaxGenerationNum` | int32 | See service validation | Max generation num. |
| `DataConfig.AugmentedFields[].SystemPrompt` | string | See service validation | System prompt. |
| `DataConfig.AugmentedFields[].Prompt` | string | See service validation | Prompt. |

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
