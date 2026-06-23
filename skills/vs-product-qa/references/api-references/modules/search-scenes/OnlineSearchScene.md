# OnlineSearchScene

## 接口概览

- 模块分类：Search Scenes
- Service：DashboardService
- RPC：OnlineSearchScene
- HTTP Method：`POST`
- Request Path：`/api/v1/OnlineSearchScene`
- Request Type：`search_scene.OnlineSearchSceneReq`
- Response Type：`search_scene.EmptyResp`
- Top Action：OnlineSearchScene
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:635`

## 接口说明

未在 proto 注释中提供额外说明。

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 否 | body | required 应用ID | - |
| ProjectName | string | 否 | body | optional 项目名称 | - |
| SceneID | string | 否 | body | required 搜索场景ID | - |
| Name | string | 否 | body | required 场景名称 | - |
| Description | string | 否 | body | optional 场景描述 | - |
| Config | search_scene.SearchSceneConfig | 否 | body | required 搜索场景配置 | - |
| Config.SearchConfig | search_scene.SearchConfig | 否 | body | 搜索配置 | - |
| Config.SearchConfig.RetrieveConfigs[] | array<search_scene.RetrieveConfig> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].DatasetID | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].DatasetName | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].MaxRecallNum | integer | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].EnableImage | boolean | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].DatasetType | dataset.DatasetType | 否 | body | - | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| Config.SearchConfig.RetrieveConfigs[].DenseWeight | number | 否 | body | 语义匹配与关键词匹配的权重（语义） | - |
| Config.SearchConfig.RetrieveConfigs[].RerankEnabled | boolean | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].RerankTopK | integer | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].TextWeight | number | 否 | body | 模态权重（文本） | - |
| Config.SearchConfig.RetrieveConfigs[].Mode | search_scene.SearchMode | 否 | body | - | ModeUnknown=0, Balanced=1, SemanticPriority=2, KeywordPriority=3, UserDefined=4 |
| Config.SearchConfig.RetrieveConfigs[].SortRules[] | array<search_scene.SortRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].SortRules[].Field | string | 否 | body | 选中的 schema field Name | - |
| Config.SearchConfig.RetrieveConfigs[].SortRules[].Order | string | 否 | body | asc：顺序排序，desc 倒序排序 | - |
| Config.SearchConfig.RetrieveConfigs[].SortRules[].Enable | boolean | 否 | body | 搜索结果配置-根据字段排序（规则粒度支持开关）；默认：开 (新建后默认开启) | - |
| Config.SearchConfig.RetrieveConfigs[].Synonyms[] | array<search_scene.Synonym> | 否 | body | deprecated 同义词 | - |
| Config.SearchConfig.RetrieveConfigs[].Synonyms[].Words[] | array<string> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig | search_scene.CorrectionConfig | 否 | body | deprecated 纠错配置 | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.Enable | boolean | 否 | body | 是否开启 | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.Mode | string | 否 | body | 模式. auto:直接纠正, suggestion_only:仅建议. | auto, suggestion_only |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.Dicts[] | array<search_scene.RelatedDict> | 否 | body | 纠错词库 | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.MatchMode | string | 否 | body | 匹配模式： exact:完全匹配, partial:部分匹配 | exact, partial |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryConfig | rule.BoostBuryConfig | 否 | body | 加、降权配置 | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryConfig.Enabled | boolean | 否 | body | 搜索结果配置-提权、降权（规则粒度支持开关）,默认打开 | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryConfig.Rules[] | array<rule.BoostBuryRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryConfig.Deprecated | boolean | 否 | body | true 表示该配置废弃 | - |
| Config.SearchConfig.RetrieveConfigs[].QueryConfig | search_scene.QueryConfig | 否 | body | 图搜配置 | - |
| Config.SearchConfig.RetrieveConfigs[].QueryConfig.ImageInstruction | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].QueryConfig.InstructionType | string | 否 | body | 自定义、预设 | preset_image, preset_item, custom |
| Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[] | array<dataset.DatasetFilter> | 否 | body | 辅助召回池 | - |
| Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[].Name | string | 否 | body | 数据集过滤条件名称 | - |
| Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[].Filter | google.protobuf.Struct | 否 | body | 过滤条件DSL json map | - |
| Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[].Enable | boolean | 否 | body | 搜索结果配置-重点保障召回（规则粒度支持开关）；默认：开 (新建后默认开启) | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig | rule.ShuffleConfig | 否 | body | 打散规则配置 | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[] | array<rule.ShuffleRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall | search_scene.PersonalizedRecall | 否 | body | 个性化召回 | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.Enable | boolean | 否 | body | 搜索结果配置-用户个性化召回 默认关闭 | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.Mode | string | 否 | body | 强个性化(strong) or 弱个性化(weak) | strong, weak |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.UserInterest[] | array<search_scene.UserInterest> | 否 | body | 兴趣标签相关信息 | - |
| Config.SearchConfig.RetrieveConfigs[].EnableRerankWithHot | boolean | 否 | body | 物品热度参与排序开关 | - |
| Config.SearchConfig.RetrieveConfigs[].RerankModel | string | 否 | body | 重排模型：gte-rerank（默认）\| doubao-rerank（多模态重排） | gte-rerank, doubao-rerank |
| Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig | search_scene.RerankDoubaoConfig | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig.ItemFeature | string | 否 | body | doubao 重排物品特征：text \| mixed \| image | text, mixed, image |
| Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig.Instruction | string | 否 | body | doubao 重排指令（用户可编辑） | - |
| Config.SearchConfig.RetrieveConfigs[].FilterConfig | search_scene.FilterConfig | 否 | body | 过滤条件 | - |
| Config.SearchConfig.RetrieveConfigs[].FilterConfig.RuleID | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FilterConfig.Config | google.protobuf.Struct | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig | rule.BoostBuryCondConfig | 否 | body | 加、降权配置 V2 版本 | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig.Rules[] | array<rule.BoostBuryCondRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[] | array<search_scene.ServingControl> | 否 | body | Serving Control 条件策略覆盖配置 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].QueryCondition | google.protobuf.Struct | 否 | body | 触发条件 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].RecallWeight | search_scene.RecallWeightConfig | 否 | body | 命中后覆盖召回权重 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].AuxiliaryPools | search_scene.AuxiliaryPoolsConfig | 否 | body | 命中后覆盖辅助召回池；可显式传空关闭 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].SortRules | search_scene.SortRulesConfig | 否 | body | 命中后覆盖 Tie-breaking 排序规则；可显式传空关闭 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig | rule.ShuffleConfig | 否 | body | 命中后覆盖打散配置 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].FilterConfig | search_scene.FilterConfig | 否 | body | 命中后覆盖过滤条件 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].BoostBuryCondConfig | rule.BoostBuryCondConfig | 否 | body | 命中后覆盖加、降权配置 V2 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].Name | string | 否 | body | 规则名，仅供前端读写展示 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].Enable | boolean | 否 | body | 是否启用该规则；默认：开 (新建后默认开启) | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].QueryKeywordMatchPercent | number | 否 | body | 命中后覆盖关键词匹配度阈值 qkmp，取值 (0,1] | - |
| Config.SearchConfig.RetrieveConfigs[].UserDefinedRecallMode | search_scene.UserDefinedRecallMode | 否 | body | 自定义模式下的召回路径选择 | KeywordSemantic=0, KeywordOnly=1, SemanticOnly=2 |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig | search_scene.FacetConfig | 否 | body | 分面聚合 | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Enable | boolean | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[] | array<search_scene.Facet> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].SynonymConfig | search_scene.SynonymConfig | 否 | body | 同义词配置 | - |
| Config.SearchConfig.RetrieveConfigs[].SynonymConfig.Dicts[] | array<search_scene.RelatedDict> | 否 | body | 同义词词库 | - |
| Config.SearchConfig.RetrieveConfigs[].QueryKeywordMatchPercent | number | 否 | body | 关键词匹配度阈值 qkmp，取值 (0,1]；不传由在线侧兜底 | - |
| Config.QueryCompletionConfig | search_scene.QueryCompletionConfig | 否 | body | query 补全配置 | - |
| Config.QueryCompletionConfig.SugMaxRecallNum | integer | 否 | body | 搜索补全最大召回数 | - |
| Config.QueryCompletionConfig.SugMinNum | integer | 否 | body | 触发搜索联想最小字符数 | - |
| Config.QueryCompletionConfig.Enable | boolean | 否 | body | 是否开启搜索补全；默认：开 | - |
| Config.QueryCompletionConfig.Dicts[] | array<search_scene.RelatedDict> | 否 | body | 搜索补全词库 | - |
| Config.QueryCompletionConfig.Dicts[].DictID | string | 否 | body | - | - |
| Config.QueryCompletionConfig.EnableApiLog | boolean | 否 | body | 是否使用搜索日志候选词；默认：关 | - |
| Config.WantToSearchConfig | search_scene.WantToSearchConfig | 否 | body | 猜你想搜索配置 | - |
| Config.WantToSearchConfig.MinWordLength | integer | 否 | body | 最小搜索词长度 | - |
| Config.WantToSearchConfig.MaxWordLength | integer | 否 | body | 最大搜索词长度 | - |
| Config.WantToSearchConfig.WordNum | integer | 否 | body | 返回词数量 | - |
| Config.WantToSearchConfig.Enable | boolean | 否 | body | 搜索词配置-猜你想搜，默认打开 | - |
| Config.WantToSearchConfig.Dicts[] | array<search_scene.RelatedDict> | 否 | body | 猜你想搜词库 | - |
| Config.WantToSearchConfig.Dicts[].DictID | string | 否 | body | - | - |
| Config.WantToSearchConfig.EnableApiLog | boolean | 否 | body | 是否使用搜索日志候选词；默认：关 | - |
| Config.OverviewConfig | search_scene.OverviewConfig | 否 | body | overview 配置 | - |
| Config.OverviewConfig.Mode | string | 否 | body | ondemand \| always | ondemand, always |
| Config.OverviewConfig.TriggerPrompt | string | 否 | body | - | - |
| Config.OverviewConfig.ContentPrompt | string | 否 | body | - | - |

## 请求示例

```json
{
  "AppID": "example",
  "ProjectName": "example",
  "SceneID": "example",
  "Name": "example",
  "Description": "example",
  "Config": {
    "SearchConfig": {
      "RetrieveConfigs": [
        {}
      ]
    },
    "QueryCompletionConfig": {
      "SugMaxRecallNum": 1,
      "SugMinNum": 1,
      "Enable": true,
      "Dicts": [
        {}
      ],
      "EnableApiLog": true
    },
    "WantToSearchConfig": {
      "MinWordLength": 1,
      "MaxWordLength": 1,
      "WordNum": 1,
      "Enable": true,
      "Dicts": [
        {}
      ],
      "EnableApiLog": true
    },
    "OverviewConfig": {
      "Mode": "ondemand",
      "TriggerPrompt": "example",
      "ContentPrompt": "example"
    }
  }
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| - | - | - | - | - | - |

## 响应示例

```json
{}
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