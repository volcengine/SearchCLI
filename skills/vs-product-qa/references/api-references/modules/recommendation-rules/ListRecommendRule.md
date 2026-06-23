# ListRecommendRule

## 接口概览

- 模块分类：Recommendation Rules
- Service：DashboardService
- RPC：ListRecommendRule
- HTTP Method：`POST`
- Request Path：`/api/v1/ListRecommendRule`
- Request Type：`recommend.ListRecommendRuleReq`
- Response Type：`recommend.ListRecommendRuleResp`
- Top Action：ListRecommendRule
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:916`

## 接口说明

获取策略规则列表

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 否 | body | required 应用ID | - |
| Types[] | array<string> | 否 | body | optional 策略规则类型 非空时，筛选指定类型策略规则 枚举值: - degrade: 兜底策略 - filter: 推荐过滤策略 - search_filter: 搜索过滤策略 - impression: 下发&曝光去重 - suggest: 推荐话术 - userInterest: 用户兴趣召回 - itemCf: itemCf召回 | degrade, filter, search_filter, impression, suggest, userInterest, itemCf |
| DatasetID | string | 否 | body | optional 数据集ID 非空时, 筛选指定数据集关联的策略规则 规则同时关联 行为+物品 数据集时，该字段表示行为数据集ID | - |
| InvertItemDatasetID | string | 否 | body | optional 倒排物品数据集ID，倒排类规则查询有效 规则同时关联 行为+物品 数据集时，该字段表示物品数据集ID | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "AppID": "example",
  "Types": [
    "degrade"
  ],
  "DatasetID": "example",
  "InvertItemDatasetID": "example",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| TotalCount | integer | 否 | body | 推荐策略规则总数 | - |
| Items[] | array<recommend.RecommendRule> | 否 | body | 推荐策略规则列表 不包括策略规则配置详情 | - |
| Items[].AppID | string | 否 | body | required 应用ID | - |
| Items[].RuleID | string | 否 | body | optional 规则ID，唯一标识 仅创建时允许为空 | - |
| Items[].Name | string | 否 | body | required 规则名称 | - |
| Items[].Type | string | 否 | body | required 规则类型 枚举值: - degrade: 兜底策略 - filter: 过滤策略（支持动态参数，参数格式："{{Param}}" ） - 静态条件: {"op":"must","field":"region","conds":["cn","sg"]} - 动态条件: {"op":"must","field":"region","conds":"{{ParamRegions}}"} - impression: 下发&曝光去重 - suggest: 推荐话术 - userInterest: 用户兴趣召回 - itemCf: itemCf召回 - forceItem: 物品强推 | op, must, field, region, conds, cn, sg, degrade, filter, impression, suggest, userInterest, itemCf, forceItem |
| Items[].Description | string | 否 | body | optional 规则描述 | - |
| Items[].CreatedAt | string | 否 | body | 创建时间，String类型，遵循YYYY-MM-DD'T'HH:MM:SS'Z'格式 | T, Z, HH, MM |
| Items[].UpdatedAt | string | 否 | body | 更新时间，String类型，遵循YYYY-MM-DD'T'HH:MM:SS'Z'格式 | T, Z, HH, MM |
| Items[].UpdatedBy | string | 否 | body | 更新人 | - |
| Items[].DatasetID | string | 否 | body | optional 数据集ID，策略规则关联的数据集ID 部分规则策略需配合数据集字段进行定义，支持查询检索 - 兜底策略，关联行为数据集，依赖行为类型枚举 - 过滤策略，关联物品数据集，依赖物品数据集支持过滤的字段名 | - |
| Items[].Used | boolean | 否 | body | optional 规则是否已被引用 | - |
| Items[].Config | google.protobuf.Struct | 否 | body | optional 规则配置详情 list 接口默认不返回该字段，从详情接口获取规则配置 | - |

## 响应示例

```json
{
  "TotalCount": 1,
  "Items": [
    {
      "AppID": "example",
      "RuleID": "example",
      "Name": "example",
      "Type": "op",
      "Description": "example",
      "CreatedAt": "T",
      "UpdatedAt": "T",
      "UpdatedBy": "example",
      "DatasetID": "example",
      "Used": true,
      "Config": {}
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