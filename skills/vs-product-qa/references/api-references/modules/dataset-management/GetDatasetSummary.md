# GetDatasetSummary

## 接口概览

- 模块分类：Dataset Management
- Service：DashboardService
- RPC：GetDatasetSummary
- HTTP Method：`POST`
- Request Path：`/api/v1/GetDatasetSummary`
- Request Type：`dataset.GetDatasetSummaryReq`
- Response Type：`dataset.DatasetSummary`
- Top Action：GetDatasetSummary
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:189`

## 接口说明

未在 proto 注释中提供额外说明。

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| DatasetID | string | 否 | body | - | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "DatasetID": "example",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Summary[] | array<dataset.DatasetRecord> | 否 | body | - | - |
| Summary[].Timestamp | integer | 否 | body | - | - |
| Summary[].UpdatedBy | string | 否 | body | - | - |
| Summary[].ReceiveCount | integer | 否 | body | - | - |
| Summary[].UpsertCount | integer | 否 | body | - | - |
| Summary[].DeleteCount | integer | 否 | body | - | - |
| Summary[].FailureCount | integer | 否 | body | - | - |
| Summary[].OpType | dataset.DatasetRecordType | 否 | body | 导入数据、更新schema etc. | DatasetRecordType_Unspecified=0, DatasetRecordType_ImportData=1, DatasetRecordType_UpdateSchema=2, DatasetRecordType_UpdateAppDataConfig=3, DatasetRecordType_CreateBatchImportTask=4, DatasetRecordType_BatchImportData=5, DatasetRecordType_DeleteData=6, DatasetRecordType_CreateDataset=7 |
| Summary[].CreateTime | string | 否 | body | 创建时间 2025-11-19T10:00:00Z | - |
| Summary[].BatchId | string | 否 | body | 批量数据导入 batch_id | - |
| Summary[].EstimatedCount | integer | 否 | body | 批量数据导入预估数据总量 | - |
| Summary[].Status | string | 否 | body | 状态: 'initialized','processing','completed','expired' | initialized, processing, completed, expired |

## 响应示例

```json
{
  "Summary": [
    {
      "Timestamp": 1,
      "UpdatedBy": "example",
      "ReceiveCount": 1,
      "UpsertCount": 1,
      "DeleteCount": 1,
      "FailureCount": 1,
      "OpType": "DatasetRecordType_ImportData",
      "CreateTime": "example",
      "BatchId": "example",
      "EstimatedCount": 1,
      "Status": "initialized"
    }
  ]
}
```

## 错误码说明

| 错误名 | 错误码 | HTTP Code | Message | 说明 |
| --- | --- | --- | --- | --- |
| AccessDenied | AccessDenied | 403 | You are not authorized to perform this action. | 您无权执行此操作。 |
| DryRunOperation | DryRunOperation | 400 | The request is validated by a dryrun operation. | 请求通过了全部检查。 |
| IdempotentParameterMismatch | IdempotentParameterMismatch | 400 | Parameters mismatch the previous request with a same ClientToken. | 请求参数发生变化，请求不生效。 |
| IncorrectStatus | IncorrectStatus | 400 | The current status '{status}' of the resource does not support this operation. | 资源当前状态不支持此操作。 |
| InternalError | InternalError | 500 | The request has failed due to an unknown error. | 服务内部错误。 |
| InvalidParameter | InvalidParameter | 400 | The specified parameter '{parameter}' is invalid. | 参数不合法。 |
| InvalidParameterDatasourceAlreadyExists | InvalidParameter.DatasourceAlreadyExists | 409 | The datasource already exist. | 数据源已存在。 |
| InvalidParameterLength | InvalidParameter.Length | 400 | The length of '{name}' must be between {min} and {max}. | 参数长度设置错误。 |
| InvalidParameterParseRequest | InvalidParameter.Request | 400 | Parse request failed. | 参数不合法。 |
| MissingParameterConfig | MissingParameter.Config | 400 | The required parameter config is missing. | 配置参数不能为空。 |
| OperationDeniedDataSourceDeleting | OperationDenied.DataSourceDeleting | 400 | The operation is denied because datasource '{id}' is being deleted. | 数据源正在删除中。 |
| QuotaExceeded | QuotaExceeded | 429 | QuotaExceeded: '{resource}'. | 配额超限。 |
| ResourceNotFoundConfiguration | ResourceNotFound.Configuration | 404 | The specified resource does not exist: configuration. | 未找到配置。 |
| ResourceNotFoundDatabaseEntry | ResourceNotFound.DatabaseEntry | 404 | The specified resource does not exist: database entry. | 未找到数据库记录。 |
| ResourceNotFoundDataSourceTable | ResourceNotFound.DataSourceTable | 404 | The specified datasource table does not exist. | 数据源表未找到。 |
| ServiceUnavailable | ServiceUnavailable | 503 | The request has failed due to a temporary server error. | 服务不可用。 |

## 备注

- 必填性基于 proto 字段校验规则（如 `api.vd`）与字段注释自动推断。
- 参数位置优先读取字段注解（`query/path/form/body`）；未显式声明时，按 `GET -> query`、其余方法 -> `body` 推断。
- 若本接口未显式声明 `err_enum`，上表回退展示公共错误码集合。