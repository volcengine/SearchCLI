# ListApplicationsMeta

## Overview

- API name: `ListApplicationsMeta`
- Category: Control Plane - Application
- Description: Lists Applications Meta.

## IDL Definition

```proto
message ListApplicationMetaReq {
  repeated string Ids = 1;
  repeated string AppTypes = 2;
  AppState State = 3;
  string ProjectName = 20;
}

message ListApplicationMetaResp {
  repeated ApplicationMeta Apps = 1;
}

enum AppState {
  AppInit = 0;
  AppReady = 1;
  AppDeleting = 2;
  AppDeleted = 3;
  AppNotReady = 4;
}

message ApplicationMeta {
  string AppID = 1;
  string Name = 2;
  AppState State = 3;
  int64 CreatedAt = 4;
  Icon Icon = 5;
  common.IndustryType Industry = 6;
  bool EnableRiskCheck = 8;
  string PostPaidType = 9;

  repeated DatasetMeta Datasets = 7;

  repeated string ItemDatasetIDs = 21;
  repeated string DocumentDatasetIDs = 22;
  repeated string RecommendSceneIds = 23;
}

message Icon {
  string ColorName = 1;
}

enum IndustryType {
  None = 0;
  ECommerce = 1;
  Material = 2;
  Video = 3;
  News = 4;
  SocialPlatform = 5 ;
  Other = 20 ;
}

message DatasetMeta {
  int64 ID = 1;
  int64 AccountID = 2;
  string ProjectName = 3;
  string DatasetID = 4;
  string Description = 5;
  string Name = 6;
  dataset.DatasetType Type = 7;
  dataset.DataSetState State = 8;
  string SchemaKey = 9;
  int64 Version = 10;
  int64 CreatedAt = 11;
  int64 UpdatedAt = 12;
  int64 UpdatedBy = 13;
  bool IsDeleted = 14;
  string UpdatedByName = 15;
  string FieldsConfigKey = 16;
  int64 FieldsConfigVersion = 17;
  bool AutoDelete = 18;
  int32 TTL = 19;
  common.IndustryType Industry = 20;
  string Language = 21;
  string Tag = 22;
  repeated volcengine_api.Tag Tags = 101;
  int64 InternalSchemaVersion = 23;
  dataset.ProcessConfig ProcessConfig = 24;
  string Theme = 25;
  string PostPaidType = 26;
}

enum DatasetType {
  DatasetTypeUnknown = 0;
  DatasetTypeItem = 1;
  DatasetTypeVideo = 3;
  DatasetTypeUserEvent = 4;
  DatasetTypeDoc = 5;
  DatasetTypeDocument = 6;
  DatasetTypeMultiModal = 7;
  DatasetTypeUser = 8;
}

enum DataSetState {
  DatasetUnknown = 0;
  DatasetInit = 1;
  DatasetPending = 2;
  DatasetReady = 3;
  DatasetDeleting = 4;
  DatasetDeleted = 5;
}

message Tag {
  string Key = 1;
  string Value = 2;
}

message ProcessConfig {
  string AbnormalImageDataProcessPolicy = 1;
  string AbnormalVideoDataProcessPolicy = 2;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Ids[]` | array<string> | No | Ids. |
| `AppTypes[]` | array<string> | No | App types. |
| `State` | AppState | See service validation | State. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Apps[]` | array<ApplicationMeta> | No | Apps. |
| `Apps[].AppID` | string | See service validation | Application ID. |
| `Apps[].Name` | string | See service validation | Name. |
| `Apps[].State` | AppState | See service validation | State. |
| `Apps[].CreatedAt` | int64 | See service validation | Created at. |
| `Apps[].Icon` | Icon | See service validation | Icon. |
| `Apps[].Industry` | IndustryType | See service validation | Industry. |
| `Apps[].EnableRiskCheck` | bool | See service validation | Enable risk check. |
| `Apps[].PostPaidType` | string | See service validation | Post paid type. |
| `Apps[].Datasets[]` | array<DatasetMeta> | No | Datasets. |
| `Apps[].ItemDatasetIDs[]` | array<string> | No | Item dataset i ds. |
| `Apps[].DocumentDatasetIDs[]` | array<string> | No | Document dataset i ds. |
| `Apps[].RecommendSceneIds[]` | array<string> | No | Recommend scene ids. |
| `Apps[].Icon.ColorName` | string | See service validation | Color name. |
| `Apps[].Datasets[].ID` | int64 | See service validation | Id. |
| `Apps[].Datasets[].AccountID` | int64 | See service validation | Account id. |
| `Apps[].Datasets[].ProjectName` | string | See service validation | Project name. |
| `Apps[].Datasets[].DatasetID` | string | See service validation | Dataset ID. |
| `Apps[].Datasets[].Description` | string | See service validation | Description. |
| `Apps[].Datasets[].Name` | string | See service validation | Name. |
| `Apps[].Datasets[].Type` | DatasetType | See service validation | Type. |
| `Apps[].Datasets[].State` | DataSetState | See service validation | State. |
| `Apps[].Datasets[].SchemaKey` | string | See service validation | Schema key. |
| `Apps[].Datasets[].Version` | int64 | See service validation | Version. |
| `Apps[].Datasets[].CreatedAt` | int64 | See service validation | Created at. |
| `Apps[].Datasets[].UpdatedAt` | int64 | See service validation | Updated at. |
| `Apps[].Datasets[].UpdatedBy` | int64 | See service validation | Updated by. |
| `Apps[].Datasets[].IsDeleted` | bool | See service validation | Is deleted. |
| `Apps[].Datasets[].UpdatedByName` | string | See service validation | Updated by name. |
| `Apps[].Datasets[].FieldsConfigKey` | string | See service validation | Fields config key. |
| `Apps[].Datasets[].FieldsConfigVersion` | int64 | See service validation | Fields config version. |
| `Apps[].Datasets[].AutoDelete` | bool | See service validation | Auto delete. |
| `Apps[].Datasets[].TTL` | int32 | See service validation | Ttl. |
| `Apps[].Datasets[].Industry` | IndustryType | See service validation | Industry. |
| `Apps[].Datasets[].Language` | string | See service validation | Language. |
| `Apps[].Datasets[].Tag` | string | See service validation | Tag. |
| `Apps[].Datasets[].Tags[]` | array<Tag> | No | Tags. |
| `Apps[].Datasets[].InternalSchemaVersion` | int64 | See service validation | Internal schema version. |
| `Apps[].Datasets[].ProcessConfig` | ProcessConfig | See service validation | Process config. |
| `Apps[].Datasets[].Theme` | string | See service validation | Theme. |
| `Apps[].Datasets[].PostPaidType` | string | See service validation | Post paid type. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
