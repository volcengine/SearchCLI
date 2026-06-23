# ListRecommendScene

## 接口概览

- 模块分类：Recommendation Scenes
- Service：DashboardService
- RPC：ListRecommendScene
- HTTP Method：`POST`
- Request Path：`/api/v1/ListRecommendScene`
- Request Type：`recommend.ListRecommendSceneReq`
- Response Type：`recommend.ListRecommendSceneResp`
- Top Action：ListRecommendScene
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:851`

## 接口说明

获取场景基础信息列表

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 否 | body | required 应用ID | - |
| ProjectName | string | 否 | body | 项目名称 | - |
| Types[] | array<string> | 否 | body | optional 场景类型筛选 | - |

## 请求示例

```json
{
  "AppID": "example",
  "ProjectName": "example",
  "Types": [
    "example"
  ]
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| TotalCount | integer | 否 | body | 推荐场景总数 | - |
| Items[] | array<recommend.RecommendScene> | 否 | body | 推荐场景列表 | - |
| Items[].AppID | string | 否 | body | required 应用ID | - |
| Items[].SceneID | string | 否 | body | required 场景ID | - |
| Items[].Type | string | 否 | body | required 场景类型, 枚举值: - for_you: 首页场景 - related: 详情页场景 - shopping_cart: 购物车场景 | for_you, related, shopping_cart |
| Items[].Name | string | 否 | body | required 场景名称 | - |
| Items[].Description | string | 否 | body | optional 场景描述 | - |
| Items[].ItemDatasetID | string | 否 | body | required 推荐场景关联的物品数据集 | - |
| Items[].CreatedAt | string | 否 | body | 创建时间，String类型，遵循YYYY-MM-DD'T'HH:MM:SS'Z'格式 | T, Z, HH, MM |
| Items[].UpdatedAt | string | 否 | body | 更新时间，String类型，遵循YYYY-MM-DD'T'HH:MM:SS'Z'格式 | T, Z, HH, MM |
| Items[].UpdatedBy | string | 否 | body | 更新人 | - |
| Items[].Status | string | 否 | body | 场景状态, 枚举值: - unpublished: 未发布 - published:   已发布 | unpublished, published |
| Items[].RecommendModel | recommend.RecommendModelEnum | 否 | body | 推荐模型 | Default=0, LongSequence=1 |
| Items[].RecommendOptimizationTarget | recommend.RecommendOptimizationTargetEnum | 否 | body | 推荐优化目标 | RecommendOptimizationTargetNone=0, Ctr=1 |
| Items[].SceneConfigPhase | recommend.SceneConfigPhaseEnum | 否 | body | 推荐阶段配置 | SceneConfigPhaseNone=0, SamplePrepare=1, PrepareTrain=2, Training=3, Serving=4 |
| Items[].BhvSceneTypes[] | array<string> | 否 | body | 关联的行为场景类型 | - |
| Items[].ClickEventTypes[] | array<string> | 否 | body | 点击行为类型 | - |
| Items[].PositiveEventTypes[] | array<string> | 否 | body | 正向的行为类型 | - |
| Items[].NegativeEventTypes[] | array<string> | 否 | body | 负向的行为类型 | - |
| Items[].Config | recommend.RecommendSceneConfig | 否 | body | optional 场景配置 list 接口默认不返回该字段，从详情接口获取 | - |
| Items[].Config.Count | integer | 否 | body | required 单次推荐返回数量最大值 | - |
| Items[].Config.FilterRuleID | string | 否 | body | optional 过滤策略规则ID | - |
| Items[].Config.Impression | recommend.ImpressionConfig | 否 | body | optional 下发去重策略规则 | - |
| Items[].Config.Impression.TimeWindowSeconds | integer | 否 | body | required 下发去重时间窗口，单位为秒 | - |
| Items[].Config.Impression.MaxSize | integer | 否 | body | required 最大下发去重物品数量 | - |
| Items[].Config.Impression.ExposureCfg | recommend.ExposureConfig | 否 | body | 曝光去重 | - |
| Items[].Config.Impression.ExposureCfg.TimeWindowSeconds | integer | 否 | body | required 时间窗口，单位为秒 | - |
| Items[].Config.Impression.ExposureCfg.MaxSize | integer | 否 | body | required 最大去重物品数量 | - |
| Items[].Config.DegradeRuleID | string | 否 | body | optional 兜底策略规则ID | - |
| Items[].Config.Suggest | recommend.SuggestConfig | 否 | body | optional 推荐话术策略规则 | - |
| Items[].Config.Suggest.SuggestRawPrompt | string | 否 | body | required 推荐话术原始prompt配置 | - |
| Items[].Config.ForceItemRuleID | string | 否 | body | optional 强推物品规则ID | - |
| Items[].Config.BoostBuryConfig | rule.BoostBuryConfig | 否 | body | 加、降权配置 | - |
| Items[].Config.BoostBuryConfig.Enabled | boolean | 否 | body | 搜索结果配置-提权、降权（规则粒度支持开关）,默认打开 | - |
| Items[].Config.BoostBuryConfig.Rules[] | array<rule.BoostBuryRule> | 否 | body | - | - |
| Items[].Config.BoostBuryConfig.Rules[].Name | string | 否 | body | - | - |
| Items[].Config.BoostBuryConfig.Rules[].Field | string | 否 | body | - | - |
| Items[].Config.BoostBuryConfig.Rules[].Operator | string | 否 | body | - | - |
| Items[].Config.BoostBuryConfig.Rules[].Value | google.protobuf.Value | 否 | body | - | - |
| Items[].Config.BoostBuryConfig.Rules[].Weight | number | 否 | body | - | - |
| Items[].Config.BoostBuryConfig.Rules[].Enable | boolean | 否 | body | 是否启用该规则；默认：开 (新建后默认开启) | - |
| Items[].Config.BoostBuryConfig.Deprecated | boolean | 否 | body | true 表示该配置废弃 | - |
| Items[].Config.Shuffle | rule.ShuffleConfig | 否 | body | 推荐打散规则配置 | - |
| Items[].Config.Shuffle.Rules[] | array<rule.ShuffleRule> | 否 | body | - | - |
| Items[].Config.Shuffle.Rules[].ID | integer | 否 | body | 规则 ID | - |
| Items[].Config.Shuffle.Rules[].Disable | boolean | 否 | body | 打散规则是否开启；默认：开;保持存量逻辑不变 | - |
| Items[].Config.Shuffle.Rules[].Name | string | 否 | body | 打散规则名 | - |
| Items[].Config.Shuffle.Rules[].WindowType | string | 否 | body | 窗口类型 - SLIDE: 滑动窗口（连续打散） - TOP: TopK窗口 | SLIDE, TOP |
| Items[].Config.Shuffle.Rules[].WindowSize | integer | 否 | body | 窗口大小 | - |
| Items[].Config.Shuffle.Rules[].MaxSize | integer | 否 | body | WindowSize 中最多展示的数量 | - |
| Items[].Config.Shuffle.Rules[].FieldName | string | 否 | body | WindowSize 中最少展示的数量（预留） int64 MinSize = 7; 维度打散字段名 | - |
| Items[].Config.Shuffle.Rules[].ShuffleType | string | 否 | body | 打散规则类型 - dimension: 维度打散 - expression: 表达式打散 | dimension, expression |
| Items[].Config.Shuffle.Rules[].ShuffleExpr | google.protobuf.Struct | 否 | body | 表达式打散规则 | - |
| Items[].Config.Shuffle.Rules[].RecallMax | integer | 否 | body | WindowSize 中最多展示的数量（待废弃，新版本使用MaxSize） | - |
| Items[].Config.BoostBuryCondConfig | rule.BoostBuryCondConfig | 否 | body | 加、降权配置 V2 版本 | - |
| Items[].Config.BoostBuryCondConfig.Rules[] | array<rule.BoostBuryCondRule> | 否 | body | - | - |
| Items[].Config.BoostBuryCondConfig.Rules[].ID | integer | 否 | body | - | - |
| Items[].Config.BoostBuryCondConfig.Rules[].Enable | boolean | 否 | body | - | - |
| Items[].Config.BoostBuryCondConfig.Rules[].Name | string | 否 | body | - | - |
| Items[].Config.BoostBuryCondConfig.Rules[].Config | google.protobuf.Struct | 否 | body | - | - |
| Items[].Config.BoostBuryCondConfig.Rules[].Boost | number | 否 | body | - | - |
| Items[].Config.ColdStartConfig | rule.ColdStartConfig | 否 | body | 冷启动配置 | - |
| Items[].Config.ColdStartConfig.Enable | boolean | 否 | body | 是否启用冷启动 | - |
| Items[].Config.ColdStartConfig.ItemConditionType | string | 否 | body | 新品定义条件类型 枚举值: - import_time: 按物品导入时间 - custom_filter: 自定义过滤条件(DSL) | import_time, custom_filter, DSL |
| Items[].Config.ColdStartConfig.ImportTimeWindowHours | integer | 否 | body | 当 ItemConditionType = "import_time" 时生效 物品导入时间窗口（单位: 小时） 例如 24 表示"导入时间在 24 小时内"的物品视为新品 | - |
| Items[].Config.ColdStartConfig.ItemFilter | google.protobuf.Value | 否 | body | 当 ItemConditionType = "custom_filter" 时生效 自定义新品过滤条件（Viking Filter DSL） | - |
| Items[].Config.ColdStartConfig.ExposureThreshold | integer | 否 | body | 退出新品池条件 | - |
| Items[].Config.ColdStartConfig.MaxInjectCount | integer | 否 | body | 单次请求最大新品掺入数量 | - |
| Items[].Config.ColdStartConfig.Name | string | 否 | body | 配置名称 | - |
| Items[].Config.MergeConfigs[] | array<recommend.MergeConfig> | 否 | body | 融合配置（场景多路召回融合策略，多组按顺序执行；首页/详情页 1 组；购物车 2 组） | - |
| Items[].Config.MergeConfigs[].Strategy | string | 否 | body | Strategy 融合策略： - user_profile_first 用户画像优先 - multimodal_first 多模态优先 - hot_item_first 物品高热优先 - item_similarity_first 物品相似度优先（父商品） - custom | - |
| Items[].Config.MergeConfigs[].Weights | map<string, float> | 否 | body | 自定义权重值，key表示业务召回，value 表示融合权重。key列表如下 - user_profile 用户画像 - multimodal 多模态 - hot_item 物品热度 - item_similarity 物品相似度 - item_cf 类似用户喜好（itemcf物品协同过滤） | - |

## 响应示例

```json
{
  "TotalCount": 1,
  "Items": [
    {
      "AppID": "example",
      "SceneID": "example",
      "Type": "for_you",
      "Name": "example",
      "Description": "example",
      "ItemDatasetID": "example",
      "CreatedAt": "T",
      "UpdatedAt": "T",
      "UpdatedBy": "example",
      "Status": "unpublished",
      "RecommendModel": "LongSequence",
      "RecommendOptimizationTarget": "Ctr"
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