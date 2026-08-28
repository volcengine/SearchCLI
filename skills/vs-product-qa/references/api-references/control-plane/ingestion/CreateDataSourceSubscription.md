# CreateDataSourceSubscription

## Overview

- API name: `CreateDataSourceSubscription`
- Category: Control Plane - Ingestion
- Description: Creates Data Source Subscription.

## IDL Definition

```proto
message CreateDataSourceSubscriptionReq {
  string ClientToken = 1;
  bool NeedCreateDataset = 2;
  string DatasetId = 3;
  DataSourceSubscriptionCreateDatasetConfig CreateDatasetConfig = 4;
  string Type = 5;
  DataSourceConfig DataSourceConfig = 6;
  string ProjectName = 20;
}

message CreateDataSourceSubscriptionResp {
  string TaskId = 1;
  string Message = 2;
}

message DataSourceSubscriptionCreateDatasetConfig {
  string Type = 1;
  string DatasetName = 2;
  string Language = 3;
  string Theme = 4;
}

message DataSourceConfig {
  MysqlConfig MysqlConfig = 1;
}

message MysqlConfig {
  MysqlSourceTable SourceTable = 1;
  MysqlSourceConfig SourceConfig = 2;
  string SyncMode = 3;
}

message MysqlSourceTable {
  string Database = 1;
  string Table = 2;
}

message MysqlSourceConfig {
  string Host = 1;
  int32 Port = 2;
  string Username = 3;
  string Password = 4;
  SourceSslSettings SslSettings = 5;
}

message SourceSslSettings {
  bool EnableSsl = 1;
  string Cert = 2;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ClientToken` | string | See service validation | Client token. |
| `NeedCreateDataset` | bool | See service validation | Need create dataset. |
| `DatasetId` | string | See service validation | Dataset ID. |
| `CreateDatasetConfig` | DataSourceSubscriptionCreateDatasetConfig | See service validation | Create dataset config. |
| `Type` | string | See service validation | Type. |
| `DataSourceConfig` | DataSourceConfig | See service validation | Data source config. |
| `ProjectName` | string | See service validation | Project name. |
| `CreateDatasetConfig.Type` | string | See service validation | Type. |
| `CreateDatasetConfig.DatasetName` | string | See service validation | Dataset name. |
| `CreateDatasetConfig.Language` | string | See service validation | Language. |
| `CreateDatasetConfig.Theme` | string | See service validation | Theme. |
| `DataSourceConfig.MysqlConfig` | MysqlConfig | See service validation | Mysql config. |
| `DataSourceConfig.MysqlConfig.SourceTable` | MysqlSourceTable | See service validation | Source table. |
| `DataSourceConfig.MysqlConfig.SourceConfig` | MysqlSourceConfig | See service validation | Source config. |
| `DataSourceConfig.MysqlConfig.SyncMode` | string | See service validation | Sync mode. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TaskId` | string | See service validation | Task id. |
| `Message` | string | See service validation | Message. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
