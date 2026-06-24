# UpsertRecommendRule

## 接口概览

- 模块分类：Recommendation Rules
- Service：DashboardService
- RPC：UpsertRecommendRule
- HTTP Method：`POST`
- Request Path：`/api/v1/UpsertRecommendRule`
- Request Type：`recommend.UpsertRecommendRuleReq`
- Response Type：`recommend.UpsertRecommendRuleResp`
- Top Action：UpsertRecommendRule
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:909`

## 接口说明

创建/更新推荐规则请求

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 否 | body | required 应用ID | - |
| RuleID | string | 否 | body | optional 规则ID，唯一标识 仅创建时允许为空 | - |
| Name | string | 否 | body | required 规则名称 | - |
| Type | string | 否 | body | required 规则类型 枚举值: - degrade: 兜底策略 - filter: 推荐过滤策略（支持动态参数，参数格式："{{Param}}" ） - 静态条件: {"op":"must","field":"region","conds":["cn","sg"]} - 动态条件: {"op":"must","field":"region","conds":"{{ParamRegions}}"} - search_filter: 搜索过滤策略，不支持动态参数 - impression: 下发&曝光去重 - suggest: 推荐话术 - userInterest: 用户兴趣召回 - itemCf: itemCf召回 - forceItem: 物品强推 | op, must, field, region, conds, cn, sg, degrade, filter, search_filter, impression, suggest, userInterest, itemCf, forceItem |
| Description | string | 否 | body | optional 规则描述 | - |
| DatasetID | string | 否 | body | optional 数据集ID，策略规则关联的数据集ID 部分规则策略需配合数据集字段进行定义，支持查询检索 - 兜底策略，关联行为数据集，依赖行为类型枚举 - 过滤策略，关联物品数据集，依赖物品数据集支持过滤的字段名 - 物品强推，关联物品数据集 | - |
| Config | object | 否 | body | optional 规则配置详情 list 接口默认不返回该字段，从详情接口获取规则配置。结构见下方 "Config 结构说明" | - |
| ProjectName | string | 否 | body | 项目名称 | - |

### Config 结构说明

`Config` 是一棵递归规则树，每个节点要么是**分组节点**（通过逻辑运算组合子规则），要么是**叶子节点**（单字段条件）。

#### 分组节点

| 字段 | 类型 | 必填 | 描述 | 允许值 |
| --- | --- | --- | --- | --- |
| `op` | string | 是 | 子规则之间的逻辑运算关系 | `and`, `or` |
| `conds` | array<object> | 是 | 子规则节点列表（可以是分组节点或叶子节点） | - |

#### 叶子节点 — `must` / `must_not`

| 字段 | 类型 | 必填 | 描述 | 允许值 |
| --- | --- | --- | --- | --- |
| `field` | string | 是 | 数据集字段名 | 必须是关联数据集中支持过滤的字段 |
| `op` | string | 是 | 匹配运算符 | `must`, `must_not` |
| `conds` | array<string \| number> | 是 | 待匹配的值列表 | 字段值数组；int/float 类型字段使用数值 |

#### 叶子节点 — `range`

| 字段 | 类型 | 必填 | 描述 | 允许值 |
| --- | --- | --- | --- | --- |
| `field` | string | 是 | 数据集字段名 | 必须是数值类型字段 |
| `op` | string | 是 | 范围运算符 | `range` |
| `gt` | number | 否 | 大于（开区间左边界） | - |
| `gte` | number | 否 | 大于等于（闭区间左边界） | - |
| `lt` | number | 否 | 小于（开区间右边界） | - |
| `lte` | number | 否 | 小于等于（闭区间右边界） | - |

> `gt` / `gte` / `lt` / `lte` 至少需要配置其中一个。

#### 叶子节点 — `time_range`

| 字段 | 类型 | 必填 | 描述 | 允许值 |
| --- | --- | --- | --- | --- |
| `field` | string | 是 | 数据集字段名 | 必须是时间/时间戳类型字段 |
| `op` | string | 是 | 时间范围运算符 | `time_range` |
| `gt` | string | 否 | 起始时间表达式 | `now()`, `now() - Nd`（过去 N 天） |
| `lt` | string | 否 | 结束时间表达式 | `now()`, `now() + Nd`（未来 N 天） |

#### 示例：单条件过滤

```json
{
  "field": "region",
  "op": "must",
  "conds": ["cn", "sg"]
}
```

#### 示例：多条件组合（and/or）

```json
{
  "op": "and",
  "conds": [
    {
      "field": "category",
      "op": "must",
      "conds": ["electronics"]
    },
    {
      "field": "price",
      "op": "range",
      "gte": 100,
      "lt": 500
    }
  ]
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| RuleID | string | 否 | body | 规则ID | - |

## 响应示例

```json
{
  "RuleID": "example"
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