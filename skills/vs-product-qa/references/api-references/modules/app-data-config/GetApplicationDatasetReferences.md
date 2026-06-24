# GetApplicationDatasetReferences

## 接口概览

- 模块分类：App Data Config
- Service：DashboardService
- RPC：GetApplicationDatasetReferences
- HTTP Method：`POST`
- Request Path：`/api/v1/GetApplicationDatasetReferences`
- Request Type：`application.GetApplicationDatasetReferencesReq`
- Response Type：`application.GetApplicationDatasetReferencesResp`
- Top Action：GetApplicationDatasetReferences
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:604`

## 接口说明

未在 proto 注释中提供额外说明。

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 否 | body | - | - |
| DatasetID | string | 否 | body | - | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "AppID": "example",
  "DatasetID": "example",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Items[] | array<application.ApplicationDatasetReference> | 否 | body | - | - |
| Items[].AppID | string | 否 | body | 应用ID | - |
| Items[].DatasetID | string | 否 | body | 数据集ID | - |
| Items[].FieldReferences | map<string, FieldSceneReferenceList> | 否 | body | 字段路径 → 该字段在所有场景下的配置列表（一个字段可被多个场景使用） | - |
| Items[].FieldReferences.{value}.References[] | array<application.FieldSceneReference> | 否 | body | - | - |
| Items[].FieldReferences.{value}.References[].Field | string | 否 | body | 字段名/字段路径（如：user.name） | - |
| Items[].FieldReferences.{value}.References[].SceneID | string | 否 | body | 场景ID（应用内唯一，如：search、chart_search, scene-xxx） | - |
| Items[].FieldReferences.{value}.References[].SceneName | string | 否 | body | 场景名称（可读性：搜索筛选、图表统计） | - |
| Items[].FieldReferences.{value}.References[].UseForFacet | boolean | 否 | body | 已配置用于分面聚合 | - |

## 响应示例

```json
{
  "Items": [
    {
      "AppID": "example",
      "DatasetID": "example",
      "FieldReferences": {
        "key": {}
      }
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