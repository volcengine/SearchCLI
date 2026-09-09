# GetInferDatasetSchemaResultV2

## Overview

- API name: `GetInferDatasetSchemaResultV2`
- Category: Control Plane - Task
- Description: Gets Infer Dataset Schema Result V2.

## IDL Definition

```proto
message GetInferDatasetSchemaResultReqV2 {
  string TaskId = 1;
  string ProjectName = 20;
}

message GetInferDatasetSchemaResultRespV2 {
  string Status = 1;
  repeated DatasetSchemaFieldV2 Schema = 2;
  DataFieldConfigV2 DataFieldConfig = 3;
  string Error = 4;
  string ErrorCode = 5;

  string DatasetName = 6;
  string DatasetDescription = 7;
  map<string, string> FieldDescMap = 8;
}

message DatasetSchemaFieldV2 {
  repeated DatasetSchemaFieldV2 Fields = 1;
  string Name = 2 [(api.vd) = "regexp('^[a-zA-Z][a-zA-Z0-9_]{0,127}$'); msg:sprintf('berror(InvalidSchemaFieldName, \"%v\")', $)"];
  string Type = 3;
  string BizAttr = 4;
  bool IsPrimaryKey = 5;
  bool Required = 6;
  repeated EnumerateMetaV2 EnumerateMeta = 7;

  bool IsReadOnly = 8;
}

message DataFieldConfigV2 {
  repeated string IndexFields = 1;
  repeated string FilterFields = 2;
  repeated string SuggestFields = 3;
  repeated string ImageIndexFields = 4;
  repeated string VideoIndexFields = 5;
  repeated string ChatFields = 6;
  map<string, FilterFieldsListV2> FilterFieldsMap = 7;
  repeated AugmentedFieldV2 AugmentedFields = 9;
}

message EnumerateMetaV2{
  string EnumerateValue = 1;
  string Name = 2;
  string EnumerateBizAttr = 4;
  bool Required = 5;
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
| `TaskId` | string | See service validation | Task id. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Status` | string | See service validation | Status. Enum: `pending` / `processing` / `succeeded` / `failed` / `canceled`. |
| `Schema[]` | array<DatasetSchemaFieldV2> | No | Schema. |
| `DataFieldConfig` | DataFieldConfigV2 | See service validation | Data field config. |
| `Error` | string | See service validation | Error. |
| `ErrorCode` | string | See service validation | Error code. |
| `DatasetName` | string | See service validation | Dataset name. |
| `DatasetDescription` | string | See service validation | Dataset description. |
| `FieldDescMap` | map<string, string> | See service validation | Field desc map (top-level). |
| `Schema[].Fields[]` | array<DatasetSchemaFieldV2> | No | Fields. |
| `Schema[].Type` | string | See service validation | Type. |
| `Schema[].BizAttr` | string | See service validation | Biz attr. snake_case; for `multi_modal` datasets use `multi_modal_*` values (e.g. `multi_modal_id`, `multi_modal_title`, `multi_modal_image_url`, `multi_modal_video_url`), for `user_event` use `user_event_*` values (e.g. `user_event_event_type`, `user_event_item_pk`, `user_event_user_pk`). |
| `Schema[].IsPrimaryKey` | bool | See service validation | Is primary key. |
| `Schema[].Required` | bool | See service validation | Required. |
| `Schema[].EnumerateMeta[]` | array<EnumerateMetaV2> | No | Enumerate meta. |
| `Schema[].IsReadOnly` | bool | See service validation | Is read only. |
| `DataFieldConfig.IndexFields[]` | array<string> | No | Index fields. |
| `DataFieldConfig.FilterFields[]` | array<string> | No | Filter fields. |
| `DataFieldConfig.SuggestFields[]` | array<string> | No | Suggest fields. |
| `DataFieldConfig.ImageIndexFields[]` | array<string> | No | Image index fields. |
| `DataFieldConfig.VideoIndexFields[]` | array<string> | No | Video index fields. |
| `DataFieldConfig.ChatFields[]` | array<string> | No | Chat fields. |
| `DataFieldConfig.FilterFieldsMap` | map<string, FilterFieldsListV2> | See service validation | Filter fields map. |
| `DataFieldConfig.AugmentedFields[]` | array<AugmentedFieldV2> | No | Augmented fields. |
| `Schema[].Fields[].Fields[]` | array<DatasetSchemaFieldV2> | No | Fields. |
| `Schema[].Fields[].Type` | string | See service validation | Type. |
| `Schema[].Fields[].BizAttr` | string | See service validation | Biz attr. Enum values are snake_case. |
| `Schema[].Fields[].IsPrimaryKey` | bool | See service validation | Is primary key. |
| `Schema[].Fields[].Required` | bool | See service validation | Required. |
| `Schema[].Fields[].EnumerateMeta[]` | array<EnumerateMetaV2> | No | Enumerate meta. |
| `Schema[].Fields[].IsReadOnly` | bool | See service validation | Is read only. |
| `Schema[].EnumerateMeta[].EnumerateValue` | string | See service validation | Enumerate value. |
| `Schema[].EnumerateMeta[].Name` | string | See service validation | Name. |
| `Schema[].EnumerateMeta[].EnumerateBizAttr` | string | See service validation | Enumerate biz attr. Enum values are snake_case (e.g. `exposure`, `click`). |
| `Schema[].EnumerateMeta[].Required` | bool | See service validation | Required. |
| `DataFieldConfig.FilterFieldsMap.Fields[]` | array<string> | No | Fields. |
| `DataFieldConfig.AugmentedFields[].FieldName` | string | See service validation | Field name. |
| `DataFieldConfig.AugmentedFields[].FieldType` | string | See service validation | Field type. Enum values are snake_case (e.g. `search_queries`, `item_summary`, `doc_chunk_id`). |
| `DataFieldConfig.AugmentedFields[].SourceFields[]` | array<string> | No | Source fields. |
| `DataFieldConfig.AugmentedFields[].MaxGenerationNum` | int32 | See service validation | Max generation num. |
| `DataFieldConfig.AugmentedFields[].SystemPrompt` | string | See service validation | System prompt. |
| `DataFieldConfig.AugmentedFields[].Prompt` | string | See service validation | Prompt. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
