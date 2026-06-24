# GetDatasetStatistics

## 接口概览

- 模块分类：Dataset Management
- Service：DashboardService
- RPC：GetDatasetStatistics
- HTTP Method：`POST`
- Request Path：`/api/v1/GetDatasetStatistics`
- Request Type：`dataset.GetDatasetStatisticsReq`
- Response Type：`dataset.GetDatasetStatisticsResp`
- Top Action：GetDatasetStatistics
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:392`

## 接口说明

数据统计量

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| DatasetStatistics[] | array<dataset.DatasetStatisticsQuery> | 否 | body | 至少包含 1 个元素 | - |
| DatasetStatistics[].DatasetID | string | 否 | body | 必填 | - |
| DatasetStatistics[].StatusCodes[] | array<string> | 否 | body | 可选：仅在需要统计特定错误码数量时传入。 列表页批量查询一般不传。 | - |
| DatasetStatistics[].ApplicationID | string | 否 | body | 可选：查询索引侧指标（IndexImageCount / IndexVideoDuration）时必填， 用于按应用维度隔离统计。 | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "DatasetStatistics": [
    {
      "DatasetID": "example",
      "StatusCodes": [
        "example"
      ],
      "ApplicationID": "example"
    }
  ],
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| DatasetStatistics[] | array<dataset.DatasetStatistics> | 否 | body | - | - |
| DatasetStatistics[].DatasetID | string | 否 | body | - | - |
| DatasetStatistics[].TotalDataNum | integer | 否 | body | - | - |
| DatasetStatistics[].SuccessDataNum | integer | 否 | body | - | - |
| DatasetStatistics[].FailedDataNum | integer | 否 | body | - | - |
| DatasetStatistics[].StatusCodesDataNum | integer | 否 | body | 当请求中对应 Dataset 的 StatusCodes 非空时才有意义；否则服务端返回 0 | - |
| DatasetStatistics[].Duration | integer | 否 | body | 视频时长 | - |
| DatasetStatistics[].ImageCount | integer | 否 | body | 图片数量 | - |
| DatasetStatistics[].IndexImageCount | integer | 否 | body | 应用索引生效图片数（分子），需携带 ApplicationID 查询 | - |
| DatasetStatistics[].IndexVideoDuration | integer | 否 | body | 应用索引生效视频时长（分子，单位秒），需携带 ApplicationID 查询 | - |

## 响应示例

```json
{
  "DatasetStatistics": [
    {
      "DatasetID": "example",
      "TotalDataNum": 1,
      "SuccessDataNum": 1,
      "FailedDataNum": 1,
      "StatusCodesDataNum": 1,
      "Duration": 1,
      "ImageCount": 1,
      "IndexImageCount": 1,
      "IndexVideoDuration": 1
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