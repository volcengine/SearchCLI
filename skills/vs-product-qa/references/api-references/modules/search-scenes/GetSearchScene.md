# GetSearchScene

## 接口概览

- 模块分类：Search Scenes
- Service：DashboardService
- RPC：GetSearchScene
- HTTP Method：`POST`
- Request Path：`/api/v1/GetSearchScene`
- Request Type：`search_scene.GetSearchSceneReq`
- Response Type：`search_scene.GetSearchSceneResp`
- Top Action：GetSearchScene
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:656`

## 接口说明

未在 proto 注释中提供额外说明。

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 否 | body | required 应用ID | - |
| ProjectName | string | 否 | body | optional 项目名称 | - |
| SceneID | string | 否 | body | required 搜索场景ID | - |

## 请求示例

```json
{
  "AppID": "example",
  "ProjectName": "example",
  "SceneID": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Scene | search_scene.SearchScene | 否 | body | required 搜索场景详情 | - |
| Scene.AppID | string | 否 | body | required 应用ID | - |
| Scene.SceneID | string | 否 | body | required 搜索场景ID | - |
| Scene.Name | string | 否 | body | required 场景名称 | - |
| Scene.Description | string | 否 | body | optional 场景描述 | - |
| Scene.CreatedAt | string | 否 | body | 创建时间，String类型，遵循YYYY-MM-DD'T'HH:MM:SS'Z'格式 | T, Z, HH, MM |
| Scene.UpdatedAt | string | 否 | body | 更新时间，String类型，遵循YYYY-MM-DD'T'HH:MM:SS'Z'格式 | T, Z, HH, MM |
| Scene.UpdatedBy | string | 否 | body | 更新人 | - |
| Scene.IsDefault | boolean | 否 | body | 是否为默认配置 | - |
| Scene.Status | string | 否 | body | unpublished\|published | unpublished, published |
| Scene.Config | search_scene.SearchSceneConfig | 否 | body | 详情接口返回，list 可返回或留空 | - |
| Scene.Config.SearchConfig | search_scene.SearchConfig | 否 | body | 搜索配置 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[] | array<search_scene.RetrieveConfig> | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].DatasetID | string | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].DatasetName | string | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].MaxRecallNum | integer | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].EnableImage | boolean | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].DatasetType | dataset.DatasetType | 否 | body | - | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| Scene.Config.SearchConfig.RetrieveConfigs[].DenseWeight | number | 否 | body | 语义匹配与关键词匹配的权重（语义） | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].RerankEnabled | boolean | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].RerankTopK | integer | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].TextWeight | number | 否 | body | 模态权重（文本） | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].Mode | search_scene.SearchMode | 否 | body | - | ModeUnknown=0, Balanced=1, SemanticPriority=2, KeywordPriority=3, UserDefined=4 |
| Scene.Config.SearchConfig.RetrieveConfigs[].SortRules[] | array<search_scene.SortRule> | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].Synonyms[] | array<search_scene.Synonym> | 否 | body | deprecated 同义词 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].CorrectionConfig | search_scene.CorrectionConfig | 否 | body | deprecated 纠错配置 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].BoostBuryConfig | rule.BoostBuryConfig | 否 | body | 加、降权配置 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].QueryConfig | search_scene.QueryConfig | 否 | body | 图搜配置 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[] | array<dataset.DatasetFilter> | 否 | body | 辅助召回池 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].ShuffleConfig | rule.ShuffleConfig | 否 | body | 打散规则配置 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall | search_scene.PersonalizedRecall | 否 | body | 个性化召回 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].EnableRerankWithHot | boolean | 否 | body | 物品热度参与排序开关 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].RerankModel | string | 否 | body | 重排模型：gte-rerank（默认）\| doubao-rerank（多模态重排） | gte-rerank, doubao-rerank |
| Scene.Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig | search_scene.RerankDoubaoConfig | 否 | body | - | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].FilterConfig | search_scene.FilterConfig | 否 | body | 过滤条件 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig | rule.BoostBuryCondConfig | 否 | body | 加、降权配置 V2 版本 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].ServingControls[] | array<search_scene.ServingControl> | 否 | body | Serving Control 条件策略覆盖配置 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].UserDefinedRecallMode | search_scene.UserDefinedRecallMode | 否 | body | 自定义模式下的召回路径选择 | KeywordSemantic=0, KeywordOnly=1, SemanticOnly=2 |
| Scene.Config.SearchConfig.RetrieveConfigs[].FacetConfig | search_scene.FacetConfig | 否 | body | 分面聚合 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].SynonymConfig | search_scene.SynonymConfig | 否 | body | 同义词配置 | - |
| Scene.Config.SearchConfig.RetrieveConfigs[].QueryKeywordMatchPercent | number | 否 | body | 关键词匹配度阈值 qkmp，取值 (0,1]；不传由在线侧兜底 | - |
| Scene.Config.QueryCompletionConfig | search_scene.QueryCompletionConfig | 否 | body | query 补全配置 | - |
| Scene.Config.QueryCompletionConfig.SugMaxRecallNum | integer | 否 | body | 搜索补全最大召回数 | - |
| Scene.Config.QueryCompletionConfig.SugMinNum | integer | 否 | body | 触发搜索联想最小字符数 | - |
| Scene.Config.QueryCompletionConfig.Enable | boolean | 否 | body | 是否开启搜索补全；默认：开 | - |
| Scene.Config.QueryCompletionConfig.Dicts[] | array<search_scene.RelatedDict> | 否 | body | 搜索补全词库 | - |
| Scene.Config.QueryCompletionConfig.Dicts[].DictID | string | 否 | body | - | - |
| Scene.Config.QueryCompletionConfig.EnableApiLog | boolean | 否 | body | 是否使用搜索日志候选词；默认：关 | - |
| Scene.Config.WantToSearchConfig | search_scene.WantToSearchConfig | 否 | body | 猜你想搜索配置 | - |
| Scene.Config.WantToSearchConfig.MinWordLength | integer | 否 | body | 最小搜索词长度 | - |
| Scene.Config.WantToSearchConfig.MaxWordLength | integer | 否 | body | 最大搜索词长度 | - |
| Scene.Config.WantToSearchConfig.WordNum | integer | 否 | body | 返回词数量 | - |
| Scene.Config.WantToSearchConfig.Enable | boolean | 否 | body | 搜索词配置-猜你想搜，默认打开 | - |
| Scene.Config.WantToSearchConfig.Dicts[] | array<search_scene.RelatedDict> | 否 | body | 猜你想搜词库 | - |
| Scene.Config.WantToSearchConfig.Dicts[].DictID | string | 否 | body | - | - |
| Scene.Config.WantToSearchConfig.EnableApiLog | boolean | 否 | body | 是否使用搜索日志候选词；默认：关 | - |
| Scene.Config.OverviewConfig | search_scene.OverviewConfig | 否 | body | overview 配置 | - |
| Scene.Config.OverviewConfig.Mode | string | 否 | body | ondemand \| always | ondemand, always |
| Scene.Config.OverviewConfig.TriggerPrompt | string | 否 | body | - | - |
| Scene.Config.OverviewConfig.ContentPrompt | string | 否 | body | - | - |

## 响应示例

```json
{
  "Scene": {
    "AppID": "example",
    "SceneID": "example",
    "Name": "example",
    "Description": "example",
    "CreatedAt": "T",
    "UpdatedAt": "T",
    "UpdatedBy": "example",
    "IsDefault": true,
    "Status": "unpublished",
    "Config": {
      "SearchConfig": {},
      "QueryCompletionConfig": {},
      "WantToSearchConfig": {},
      "OverviewConfig": {}
    }
  }
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