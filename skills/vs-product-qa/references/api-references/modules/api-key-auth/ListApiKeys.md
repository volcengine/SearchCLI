# ListApiKeys

## 接口概览

- 模块分类：API Key Authentication
- Service：DashboardService
- RPC：ListApiKeys
- HTTP Method：`POST`
- Request Path：`/open/ListApiKeys`
- Request Type：`api_key.ListApiKeysReq`
- Response Type：`api_key.ListApiKeysResp`
- Top Action：ListApiKeys
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:1155`

## 接口说明

api key 鉴权 读取 api key 列表

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Filter | api_key.Filter | 否 | body | 过滤条件 | - |
| ProjectName | string | 否 | body | 项目名称 | - |
| PageNumber | integer | 否 | body | 页码，从1开始，默认值为1 | - |
| PageSize | integer | 否 | body | 每页数量，默认值10，最大值100 | - |
| SortBy | string | 否 | body | 按字段排序，枚举值为字段名，为空时默认按创建时间倒序 | - |
| SortOrder | string | 否 | body | 指定排序顺序，枚举值为："Desc" \| "Asc" | Desc, Asc |

## 请求示例

```json
{
  "Filter": {
    "Status": "example"
  },
  "ProjectName": "example",
  "PageNumber": 1,
  "PageSize": 1,
  "SortBy": "example",
  "SortOrder": "Desc"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Items[] | array<api_key.ApiKeyMetadata> | 否 | body | api key 信息列表 | - |
| Items[].Name | string | 否 | body | api key 名称，用户自定义字符串，长度限制 1-128字符，字符集 | - |
| Items[].Status | string | 否 | body | api key 状态：启用（enable）、禁用（disable），其余状态不合法 | enable, disable |
| Items[].CreateBy | string | 否 | body | 创建人，显示子账户名称，如 rec-test | - |
| Items[].CreateTime | string | 否 | body | 创建时间，遵循 YYYY-MM-DD HH:MM 格式，如 2025-07-08 18:21 | - |
| Items[].CreateTimeTimestamp | integer | 否 | body | 创建时间戳，单位秒，如 1794244800 | - |
| PageNumber | integer | 否 | body | 当前页码 | - |
| PageSize | integer | 否 | body | 每页数量 | - |
| TotalCount | integer | 否 | body | 总记录数；符合筛选条件的数量 | - |

## 响应示例

```json
{
  "Items": [
    {
      "Name": "example",
      "Status": "enable",
      "CreateBy": "example",
      "CreateTime": "example",
      "CreateTimeTimestamp": 1
    }
  ],
  "PageNumber": 1,
  "PageSize": 1,
  "TotalCount": 1
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