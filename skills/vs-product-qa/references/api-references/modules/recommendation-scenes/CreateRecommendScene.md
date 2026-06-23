# CreateRecommendScene

## 接口概览

- 模块分类：Recommendation Scenes
- Service：DashboardService
- RPC：CreateRecommendScene
- HTTP Method：`POST`
- Request Path：`/api/v1/CreateRecommendScene`
- Request Type：`recommend.CreateRecommendSceneReq`
- Response Type：`recommend.CreateRecommendSceneResp`
- Top Action：CreateRecommendScene
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:837`

## 接口说明

创建场景

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 否 | body | required 应用ID | - |
| ProjectName | string | 否 | body | 项目名称 | - |
| Type | string | 否 | body | required 场景类型, 枚举值: - for_you: 首页场景 - related: 详情页场景 - shopping_cart: 购物车场景 | for_you, related, shopping_cart |
| Name | string | 否 | body | required 场景名称 | - |
| Description | string | 否 | body | optional 场景描述 | - |
| ItemDatasetID | string | 否 | body | required 物品数据集 | - |
| RecommendModel | recommend.RecommendModelEnum | 否 | body | 推荐模型 | Default=0, LongSequence=1 |
| RecommendOptimizationTarget | recommend.RecommendOptimizationTargetEnum | 否 | body | 优化目标 | RecommendOptimizationTargetNone=0, Ctr=1 |
| BhvSceneTypes[] | array<string> | 否 | body | 关联的行为场景类型 | - |
| ClickEventTypes[] | array<string> | 否 | body | 点击行为类型 | - |
| PositiveEventTypes[] | array<string> | 否 | body | 正向的行为类型 | - |
| NegativeEventTypes[] | array<string> | 否 | body | 负向的行为类型 | - |

## 请求示例

```json
{
  "AppID": "example",
  "ProjectName": "example",
  "Type": "for_you",
  "Name": "example",
  "Description": "example",
  "ItemDatasetID": "example",
  "RecommendModel": "LongSequence",
  "RecommendOptimizationTarget": "Ctr",
  "BhvSceneTypes": [
    "example"
  ],
  "ClickEventTypes": [
    "example"
  ],
  "PositiveEventTypes": [
    "example"
  ],
  "NegativeEventTypes": [
    "example"
  ]
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| SceneID | string | 否 | body | 场景ID | - |

## 响应示例

```json
{
  "SceneID": "example"
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