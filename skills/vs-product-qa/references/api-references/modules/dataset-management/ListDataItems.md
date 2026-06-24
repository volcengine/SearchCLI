# ListDataItems

## 接口概览

- 模块分类：Dataset Management
- Service：DashboardService
- RPC：ListDataItems
- HTTP Method：`POST`
- Request Path：`/api/v1/ListDataItems`
- Request Type：`dataset.ListDataItemsReq`
- Response Type：`dataset.ListDataItemsResp`
- Top Action：ListDataItems
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:237`

## 接口说明

数据集详情列表 v2

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| DatasetId | string | 否 | body | 数据集 Id | - |
| Filter | dataset.ListDataItemsFilter | 否 | body | 带查询批量记录的筛选条件 | - |
| Filter.ItemId | string | 否 | body | 数据条目主键。筛选项，默认不筛选 | - |
| Filter.ProcessStatus[] | array<string> | 否 | body | 数据条目处理状态：success数据正常，processing处理中，failed数据异常。默认返回全部状态。 | - |
| MaxResults | integer | 否 | body | 返回每页的行数，默认值为10，最大值为100； | - |
| NextToken | string | 否 | body | 用于翻页时候获取下一页内容，字符串； | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "DatasetId": "example",
  "Filter": {
    "ItemId": "example",
    "ProcessStatus": [
      "example"
    ]
  },
  "MaxResults": 1,
  "NextToken": "example",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| NextToken | string | 否 | body | 用于翻页时候获取下一页内容，字符串； | - |
| Items[] | array<dataset.DataItem> | 否 | body | 搜索结果 | - |
| Items[].ItemId | string | 否 | body | 数据记录主键，数据集内唯一 | - |
| Items[].RawData | string | 否 | body | 原始数据 | - |
| Items[].Meta | dataset.DataItemMeta | 否 | body | 数据记录元信息 | - |
| Items[].Meta.ItemMeta | dataset.ItemMeta | 否 | body | - | - |
| Items[].Meta.VideoMeta | dataset.VideoMeta | 否 | body | - | - |
| Items[].Meta.VideoMeta.ContentType | string | 否 | body | 内容类型: video, collection | - |
| Items[].Meta.VideoMeta.VideoURLs[] | array<string> | 否 | body | 视频URL列表 | - |
| Items[].Meta.VideoMeta.ParentContentID | string | 否 | body | 父内容ID | - |
| Items[].Meta.VideoMeta.SequenceIndex | integer | 否 | body | 序列索引 | - |
| Items[].Meta.VideoMeta.VideoContent | dataset.VideoContent | 否 | body | 视频内容 | - |
| Items[].Meta.VideoMeta.VideoContent.Title | string | 否 | body | - | - |
| Items[].Meta.VideoMeta.VideoContent.Summary | string | 否 | body | - | - |
| Items[].Meta.VideoMeta.VideoContent.Insight | string | 否 | body | - | - |
| Items[].Meta.VideoMeta.CollectionContent | dataset.CollectionContent | 否 | body | 集合内容 | - |
| Items[].Meta.VideoMeta.CollectionContent.Summary | string | 否 | body | - | - |
| Items[].Meta.VideoMeta.Duration | integer | 否 | body | 视频时长(秒) | - |
| Items[].ProcessStatus | string | 否 | body | 数据处理状态，success, processing, failed | - |
| Items[].CheckStatus | string | 否 | body | 数据检查状态，normal, warning, error | - |
| Items[].DataStatusDetails[] | array<dataset.DataStatusDetail> | 否 | body | 数据状态详情 | - |
| Items[].DataStatusDetails[].UpdateType | string | 否 | body | 更新类型: FIRST_UPDATE_SUCCESS, LATEST_UPDATE_SUCCESS, UPDATE_FAILED | - |
| Items[].DataStatusDetails[].Timestamp | string | 否 | body | 更新时间,RFC3339格式，例如2025-03-12T15:01:07+08:00 | - |
| Items[].DataStatusDetails[].WarningCode | map<string, string> | 否 | body | 警告详情 | - |
| Items[].DataStatusDetails[].ErrorCode | map<string, string> | 否 | body | 错误详情 | - |
| Items[].CreateTime | string | 否 | body | 创建时间，RFC3339格式，例如2025-03-12T15:01:07+08:00 | - |
| Items[].UpdateTime | string | 否 | body | 更新时间，RFC3339格式，例如2025-03-12T15:01:07+08:00 | - |

## 响应示例

```json
{
  "NextToken": "example",
  "Items": [
    {
      "ItemId": "example",
      "RawData": "example",
      "Meta": {
        "ItemMeta": {},
        "VideoMeta": {}
      },
      "ProcessStatus": "example",
      "CheckStatus": "example",
      "DataStatusDetails": [
        {
          "UpdateType": "example",
          "Timestamp": "example",
          "WarningCode": {
            "key": "example"
          },
          "ErrorCode": {
            "key": "example"
          }
        }
      ],
      "CreateTime": "example",
      "UpdateTime": "example"
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