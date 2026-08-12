# CreateDatasetV2

## Overview

- API name: `CreateDatasetV2`
- Category: Control Plane - Dataset
- Description: Creates Dataset V2.

## IDL Definition

```proto
message CreateDatasetReqV2 {
  string Name = 1;
  string Type = 2;
  string Description = 3;
  repeated DatasetSchemaFieldV2 Schema = 4;
  map<string, string> FieldDescMap = 5;
  string Industry = 6;
  string Language = 7;
  ProcessConfig ProcessConfig = 8;
  string Theme = 9;
  bool DryRun = 10;
  string PostPaidType = 11;

  string ProjectName = 20;
  repeated volcengine_api.Tag Tags = 100;
}

message CreateDatasetRespV2 {
  DatasetV2 Dataset = 1;
}

message DatasetSchemaFieldV2 {
  repeated DatasetSchemaFieldV2 Fields = 1;
  string Name = 2 [(api.vd) = "regexp('^[a-zA-Z][a-zA-Z0-9_]{0,127}$'); msg:sprintf('berror(InvalidSchemaFieldName, \"%v\")', $)"];
  string Type = 3;
  string BizAttr = 4;
  bool IsPK = 5;
  bool Required = 6;
  repeated EnumerateMetaV2 EnumerateMeta = 7;

  bool IsReadOnly = 8;
}

message ProcessConfig {
  string AbnormalImageDataProcessPolicy = 1;
  bool VideoAutoDelete = 2;
  string AbnormalVideoDataProcessPolicy = 3;
}

message Tag {
  string Key = 1;
  string Value = 2;
}

message DatasetV2 {
  string Id = 1;
  string Name = 2;
  string Status = 3;
  string Type = 4;
  repeated DatasetSchemaFieldV2 Schema = 5;
  map<string, string> FieldDescMap = 6;
  string Description = 7;
  int64 SchemaVersion = 8;
  string UpdatedTime = 9;
  string CreatedTime = 10;
  string UpdatedBy = 11;
  string Tag = 12;
  string Language = 13;
  string Theme = 14;
  ProcessConfig ProcessConfig = 15;
  string PostPaidType = 16;
  repeated volcengine_api.Tag Tags = 100;
}

message EnumerateMetaV2{
  string EnumerateValue = 1;
  string Name = 2;
  string EnumerateBizAttr = 4;
  bool Required = 5;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Name` | string | See service validation | Name. |
| `Type` | string | See service validation | Type. |
| `Description` | string | See service validation | Description. |
| `Schema[]` | array<DatasetSchemaFieldV2> | No | Schema. |
| `FieldDescMap` | map<string, string> | See service validation | Field desc map. |
| `Industry` | string | See service validation | Industry. |
| `Language` | string | See service validation | Language. |
| `ProcessConfig` | ProcessConfig | See service validation | Process config. |
| `Theme` | string | See service validation | Theme. |
| `DryRun` | bool | See service validation | Dry-run flag. |
| `PostPaidType` | string | See service validation | Post paid type. |
| `ProjectName` | string | See service validation | Project name. |
| `Tags[]` | array<Tag> | No | Tags. |
| `Schema[].Fields[]` | array<DatasetSchemaFieldV2> | No | Fields. |
| `Schema[].Type` | string | See service validation | Type. |
| `Schema[].BizAttr` | string | See service validation | Biz attr. |
| `Schema[].IsPK` | bool | See service validation | Is pk. |
| `Schema[].Required` | bool | See service validation | Required. |
| `Schema[].EnumerateMeta[]` | array<EnumerateMetaV2> | No | Enumerate meta. |
| `Schema[].IsReadOnly` | bool | See service validation | Is read only. |
| `ProcessConfig.AbnormalImageDataProcessPolicy` | string | See service validation | Abnormal image data process policy. |
| `ProcessConfig.VideoAutoDelete` | bool | See service validation | Video auto delete. |
| `ProcessConfig.AbnormalVideoDataProcessPolicy` | string | See service validation | Abnormal video data process policy. |
| `Tags[].Key` | string | See service validation | Key. |
| `Tags[].Value` | string | See service validation | Value. |
| `Schema[].Fields[].Fields[]` | array<DatasetSchemaFieldV2> | No | Fields. |
| `Schema[].Fields[].Type` | string | See service validation | Type. |
| `Schema[].Fields[].BizAttr` | string | See service validation | Biz attr. |
| `Schema[].Fields[].IsPK` | bool | See service validation | Is pk. |
| `Schema[].Fields[].Required` | bool | See service validation | Required. |
| `Schema[].Fields[].EnumerateMeta[]` | array<EnumerateMetaV2> | No | Enumerate meta. |
| `Schema[].Fields[].IsReadOnly` | bool | See service validation | Is read only. |
| `Schema[].EnumerateMeta[].EnumerateValue` | string | See service validation | Enumerate value. |
| `Schema[].EnumerateMeta[].Name` | string | See service validation | Name. |
| `Schema[].EnumerateMeta[].EnumerateBizAttr` | string | See service validation | Enumerate biz attr. |
| `Schema[].EnumerateMeta[].Required` | bool | See service validation | Required. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Dataset` | DatasetV2 | See service validation | Dataset. |
| `Dataset.Id` | string | See service validation | Id. |
| `Dataset.Name` | string | See service validation | Name. |
| `Dataset.Status` | string | See service validation | Status. |
| `Dataset.Type` | string | See service validation | Type. |
| `Dataset.Schema[]` | array<DatasetSchemaFieldV2> | No | Schema. |
| `Dataset.FieldDescMap` | map<string, string> | See service validation | Field desc map. |
| `Dataset.Description` | string | See service validation | Description. |
| `Dataset.SchemaVersion` | int64 | See service validation | Schema version. |
| `Dataset.UpdatedTime` | string | See service validation | Updated time. |
| `Dataset.CreatedTime` | string | See service validation | Created time. |
| `Dataset.UpdatedBy` | string | See service validation | Updated by. |
| `Dataset.Tag` | string | See service validation | Tag. |
| `Dataset.Language` | string | See service validation | Language. |
| `Dataset.Theme` | string | See service validation | Theme. |
| `Dataset.ProcessConfig` | ProcessConfig | See service validation | Process config. |
| `Dataset.PostPaidType` | string | See service validation | Post paid type. |
| `Dataset.Tags[]` | array<Tag> | No | Tags. |
| `Dataset.Schema[].Fields[]` | array<DatasetSchemaFieldV2> | No | Fields. |
| `Dataset.Schema[].Type` | string | See service validation | Type. |
| `Dataset.Schema[].BizAttr` | string | See service validation | Biz attr. |
| `Dataset.Schema[].IsPK` | bool | See service validation | Is pk. |
| `Dataset.Schema[].Required` | bool | See service validation | Required. |
| `Dataset.Schema[].EnumerateMeta[]` | array<EnumerateMetaV2> | No | Enumerate meta. |
| `Dataset.Schema[].IsReadOnly` | bool | See service validation | Is read only. |
| `Dataset.ProcessConfig.AbnormalImageDataProcessPolicy` | string | See service validation | Abnormal image data process policy. |
| `Dataset.ProcessConfig.VideoAutoDelete` | bool | See service validation | Video auto delete. |
| `Dataset.ProcessConfig.AbnormalVideoDataProcessPolicy` | string | See service validation | Abnormal video data process policy. |
| `Dataset.Tags[].Key` | string | See service validation | Key. |
| `Dataset.Tags[].Value` | string | See service validation | Value. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
