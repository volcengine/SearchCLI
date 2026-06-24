# GetInferSourceFieldsResult

## 接口概览

- 模块分类：Dataset Management
- Service：DashboardService
- RPC：GetInferSourceFieldsResult
- HTTP Method：`POST`
- Request Path：`/api/v1/GetInferSourceFieldsResult`
- Request Type：`dataset.GetInferSourceFieldsResultReq`
- Response Type：`dataset.GetInferSourceFieldsResultResp`
- Top Action：GetInferSourceFieldsResult
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:360`

## 接口说明

获取推断数据源字段结果

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| TaskID | string | 否 | body | 任务ID | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "TaskID": "example",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Status | dataset.TaskStatusType | 否 | body | 任务状态 | TaskStatusType_Pending=0, TaskStatusType_Processing=1, TaskStatusType_Success=2, TaskStatusType_Failed=3 |
| SourceFieldsContents[] | array<dataset.InferSourceFieldsTaskContent> | 否 | body | 推断结果 | - |
| SourceFieldsContents[].FieldType | dataset.AugmentedFieldType | 否 | body | - | SearchQueries=0, Keyword=1, Description=2, VideoSummary=3, VideoTitle=4, DocChunkID=5, DocCaptionID=6, DocSiblingNodes=7, DocSummary=8, DocSummaryEmbed=9, DocTranscribeContent=10, DocStartTime=11, DocEndTime=12, DocText=13, DocBase64=14, DocDenseTextVector=15, DocDenseImageVector=16, ItemSummary=17 |
| SourceFieldsContents[].SourceFields[] | array<string> | 否 | body | - | - |
| Error | string | 否 | body | 当状态为 StatusFailed 时返回错误信息 | - |

## 响应示例

```json
{
  "Status": "TaskStatusType_Processing",
  "SourceFieldsContents": [
    {
      "FieldType": "Keyword",
      "SourceFields": [
        "example"
      ]
    }
  ],
  "Error": "example"
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