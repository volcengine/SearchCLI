# ListApplicationDatasetConfigChangeHistoryV2

## 接口概览

- 模块分类：App Management OpenAPI
- Service：DashboardServiceV2
- RPC：ListApplicationDatasetConfigChangeHistoryV2
- HTTP Method：`POST`
- Request Path：`/open/ListApplicationDatasetConfigChangeHistoryV2`
- Request Type：`application_v2.ListApplicationDatasetConfigChangeHistoryReqV2`
- Response Type：`application_v2.ListApplicationDatasetConfigChangeHistoryRespV2`
- Top Action：ListApplicationDatasetConfigChangeHistoryV2
- Top Version：2025-03-01
- Service Path：dashboard_service_v2
- 源定义：`console/idl/handler.proto:1353`

## 接口说明

数据集配置变更历史列表

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| DatasetId | string | 否 | body | 数据集ID | - |
| ApplicationId | string | 否 | body | 应用ID | - |
| MaxResults | integer | 否 | body | 返回每页的行数，默认值为10，最大值为100； | - |
| NextToken | string | 否 | body | 用于翻页时候获取下一页内容，字符串； | - |
| ConfigChangedContentList[] | array<string> | 否 | body | 变更内容列表： | - |
| SortBy | string | 否 | body | 按字段排序，枚举值为字段名，为空时默认按创建时间倒序 | - |
| SortOrder | string | 否 | body | 指定排序顺序，枚举值为："Desc" \| "Asc" | Desc, Asc |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "DatasetId": "example",
  "ApplicationId": "example",
  "MaxResults": 1,
  "NextToken": "example",
  "ConfigChangedContentList": [
    "example"
  ],
  "SortBy": "example",
  "SortOrder": "Desc",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| NextToken | string | 否 | body | 用于翻页时候获取下一页内容，字符串； | - |
| ConfigChangeHistory[] | array<application_v2.ConfigChangeHistoryList> | 否 | body | 变更历史列表 | - |
| ConfigChangeHistory[].ConfigChangedContent | string | 否 | body | 变更内容 | - |
| ConfigChangeHistory[].ConfigChangedTimestamp | string | 否 | body | 变更时间, ISO8601 格式 | - |

## 响应示例

```json
{
  "NextToken": "example",
  "ConfigChangeHistory": [
    {
      "ConfigChangedContent": "example",
      "ConfigChangedTimestamp": "example"
    }
  ]
}
```

## 错误码说明

| 错误名 | 错误码 | HTTP Code | Message | 说明 |
| --- | --- | --- | --- | --- |
| OperationDeniedStateNotEnable | OperationDenied.StateNotEnable | 400 | The operation is denied because the {entity} state is {state}. | 用户状态受限，不允许操作。 |
| AccessDenied | AccessDenied | 403 | You are not authorized to perform this action. | 您无权执行此操作。 |
| InternalError | InternalError | 500 | The request has failed due to an unknown error. | 服务内部错误。 |

## 备注

- 必填性基于 proto 字段校验规则（如 `api.vd`）与字段注释自动推断。
- 参数位置优先读取字段注解（`query/path/form/body`）；未显式声明时，按 `GET -> query`、其余方法 -> `body` 推断。
- 若本接口未显式声明 `err_enum`，上表回退展示公共错误码集合。