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
| Config.SearchConfig.RetrieveConfigs[].QueryConfig | search_scene.QueryConfig | 否 | body | 图搜配置 | - |
| Config.SearchConfig.RetrieveConfigs[].QueryConfig.ImageInstruction | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].QueryConfig.InstructionType | string | 否 | body | 自定义、预设 | preset_image, preset_item, custom |
| Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[] | array<dataset.DatasetFilter> | 否 | body | 辅助召回池 | - |
| Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[].Name | string | 否 | body | 数据集过滤条件名称 | - |
| Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[].Filter | object | 否 | body | Configuration object. Use only these fields: `field: string` (dataset field name), `op: string` (allowed values: `must`, `must_not`; semantics: belong to / do not belong to), and `conds: array<any>` (list of concrete match values). Meaning: when an item field satisfies this filter, the item can enter the auxiliary recall pool. Only pass these three fields; do not add other DSL keys. | - |
| Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[].Enable | boolean | 否 | body | 搜索结果配置-重点保障召回（规则粒度支持开关）；默认：开 (新建后默认开启) | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig | rule.ShuffleConfig | 否 | body | 打散规则配置 | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[] | array<rule.ShuffleRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].ID | integer | 否 | body | 规则 ID | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].Disable | boolean | 否 | body | 打散规则是否开启；默认：开;保持存量逻辑不变 | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].Name | string | 否 | body | User-defined shuffle rule name. Frontend requires this field to be non-empty. | non-empty |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].WindowType | string | 否 | body | 窗口类型 - SLIDE: 滑动窗口（连续打散） - TOP: TopK窗口 | SLIDE, TOP |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].WindowSize | integer | 否 | body | 窗口大小 | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].MaxSize | integer | 否 | body | WindowSize 中最多展示的数量 | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].FieldName | string | 否 | body | Dataset field selected by the user for diversity evaluation. In `dimension` shuffle, it is the field whose values are diversified within the window. In `expression` shuffle, it is the field used to initialize and bind `ShuffleExpr`. Frontend requires this field to be non-empty and chosen from the dataset field selector. | non-empty |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].ShuffleType | string | 否 | body | 打散规则类型 - dimension: 维度打散 - expression: 表达式打散 | dimension, expression |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].ShuffleExpr | object | 否 | body | Single shuffle-expression object. Use `field: string` to specify the dataset field, and `op: string` to specify the expression type. Allowed stored `op` values are `must`, `must_not`, and `range`. For `must` / `must_not`, pass `conds: array<string \| number \| boolean>` as the match-value list. For `range`, pass one or more of `gt`, `gte`, `lt`, `lte`. Frontend behavior by field type: string and array fields map to `must` / `must_not`; int32/int64 fields support `must`, `must_not`, or `range` with `gt` / `gte` / `lt` / `lte`; float fields support `range` only; bool fields are stored as `must` / `must_not` with `conds: [true]` or `conds: [false]`. This object is a single expression, not a recursive rule tree. | - |
| Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[].RecallMax | integer | 否 | body | WindowSize 中最多展示的数量（待废弃，新版本使用MaxSize） | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall | search_scene.PersonalizedRecall | 否 | body | 个性化召回 | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.Enable | boolean | 否 | body | 搜索结果配置-用户个性化召回 默认关闭 | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.Mode | string | 否 | body | 强个性化(strong) or 弱个性化(weak) | strong, weak |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.UserInterest[] | array<search_scene.UserInterest> | 否 | body | 兴趣标签相关信息 | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.UserInterest[].UserInterestId | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.UserInterest[].InterestField | string | 否 | body | 兴趣标签字段 | - |
| Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.UserInterest[].Filterable | boolean | 否 | body | 兴趣标签字段是否为可过滤字段 | - |
| Config.SearchConfig.RetrieveConfigs[].EnableRerankWithHot | boolean | 否 | body | 物品热度参与排序开关 | - |
| Config.SearchConfig.RetrieveConfigs[].RerankModel | string | 否 | body | 重排模型：gte-rerank（默认）\| doubao-rerank（多模态重排） | gte-rerank, doubao-rerank |
| Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig | search_scene.RerankDoubaoConfig | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig.ItemFeature | string | 否 | body | doubao 重排物品特征：text \| mixed \| image | text, mixed, image |
| Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig.Instruction | string | 否 | body | doubao 重排指令（用户可编辑） | - |
| Config.SearchConfig.RetrieveConfigs[].FilterConfig | search_scene.FilterConfig | 否 | body | 过滤条件 | - |
| Config.SearchConfig.RetrieveConfigs[].FilterConfig.RuleID | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FilterConfig.Config | object | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig | rule.BoostBuryCondConfig | 否 | body | 加、降权配置 V2 版本 | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig.Rules[] | array<rule.BoostBuryCondRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig.Rules[].ID | integer | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig.Rules[].Enable | boolean | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig.Rules[].Name | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig.Rules[].Config | object | 否 | body | Recursive rule object. Two shapes are valid. `Group node`: `{ op: "and" \| "or", conds: Rule[] }`, where `conds` is a non-empty array of child rules. `Leaf node`: `{ field: string, op: string, conds: array<any> }`, where `op` allows `must`, `must_not`, or `partial_match`. Leaf semantics: `must` = contains, `must_not` = does not contain, `partial_match` = partial match. Additional constraint: when `op = partial_match`, `conds` must be `array<string>`. Meaning: when the full rule tree evaluates to true, the current boost/bury rule is triggered. A single-condition rule may be stored either directly as a leaf node or as a one-child group normalized back to a leaf. | - |
| Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig.Rules[].Boost | number | 否 | body | - | [-1, 1] |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[] | array<search_scene.ServingControl> | 否 | body | Serving Control 条件策略覆盖配置 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].QueryCondition | object | 否 | body | 触发条件 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].RecallWeight | search_scene.RecallWeightConfig | 否 | body | 命中后覆盖召回权重 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].RecallWeight.Mode | search_scene.SearchMode | 否 | body | - | ModeUnknown=0, Balanced=1, SemanticPriority=2, KeywordPriority=3, UserDefined=4 |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].RecallWeight.DenseWeight | number | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].RecallWeight.TextWeight | number | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].RecallWeight.UserDefinedRecallMode | search_scene.UserDefinedRecallMode | 否 | body | - | KeywordSemantic=0, KeywordOnly=1, SemanticOnly=2 |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].AuxiliaryPools | search_scene.AuxiliaryPoolsConfig | 否 | body | 命中后覆盖辅助召回池；可显式传空关闭 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].AuxiliaryPools.Pools[] | array<dataset.DatasetFilter> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].AuxiliaryPools.Pools[].Name | string | 否 | body | 数据集过滤条件名称 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].AuxiliaryPools.Pools[].Filter | object | 否 | body | Configuration object. Use only these fields: `field: string` (dataset field name), `op: string` (allowed values: `must`, `must_not`; semantics: belong to / do not belong to), and `conds: array<any>` (list of concrete match values). Meaning: after the request hits the current Serving Control, this filter overrides the auxiliary recall pool configuration. Only pass these three fields; do not add other DSL keys. | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].AuxiliaryPools.Pools[].Enable | boolean | 否 | body | 搜索结果配置-重点保障召回（规则粒度支持开关）；默认：开 (新建后默认开启) | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].SortRules | search_scene.SortRulesConfig | 否 | body | 命中后覆盖 Tie-breaking 排序规则；可显式传空关闭 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].SortRules.Rules[] | array<search_scene.SortRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].SortRules.Rules[].Field | string | 否 | body | 选中的 schema field Name | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].SortRules.Rules[].Order | string | 否 | body | asc：顺序排序，desc 倒序排序 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].SortRules.Rules[].Enable | boolean | 否 | body | 搜索结果配置-根据字段排序（规则粒度支持开关）；默认：开 (新建后默认开启) | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig | rule.ShuffleConfig | 否 | body | 命中后覆盖打散配置 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[] | array<rule.ShuffleRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].ID | integer | 否 | body | 规则 ID | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].Disable | boolean | 否 | body | 打散规则是否开启；默认：开;保持存量逻辑不变 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].Name | string | 否 | body | User-defined shuffle rule name. Frontend requires this field to be non-empty. | non-empty |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].WindowType | string | 否 | body | 窗口类型 - SLIDE: 滑动窗口（连续打散） - TOP: TopK窗口 | SLIDE, TOP |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].WindowSize | integer | 否 | body | 窗口大小 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].MaxSize | integer | 否 | body | WindowSize 中最多展示的数量 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].FieldName | string | 否 | body | Dataset field selected by the user for diversity evaluation. In `dimension` shuffle, it is the field whose values are diversified within the window. In `expression` shuffle, it is the field used to initialize and bind `ShuffleExpr`. Frontend requires this field to be non-empty and chosen from the dataset field selector. | non-empty |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].ShuffleType | string | 否 | body | 打散规则类型 - dimension: 维度打散 - expression: 表达式打散 | dimension, expression |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].ShuffleExpr | object | 否 | body | Single shuffle-expression object. Use `field: string` to specify the dataset field, and `op: string` to specify the expression type. Allowed stored `op` values are `must`, `must_not`, and `range`. For `must` / `must_not`, pass `conds: array<string \| number \| boolean>` as the match-value list. For `range`, pass one or more of `gt`, `gte`, `lt`, `lte`. Frontend behavior by field type: string and array fields map to `must` / `must_not`; int32/int64 fields support `must`, `must_not`, or `range` with `gt` / `gte` / `lt` / `lte`; float fields support `range` only; bool fields are stored as `must` / `must_not` with `conds: [true]` or `conds: [false]`. This object is a single expression, not a recursive rule tree. | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].ShuffleConfig.Rules[].RecallMax | integer | 否 | body | WindowSize 中最多展示的数量（待废弃，新版本使用MaxSize） | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].FilterConfig | search_scene.FilterConfig | 否 | body | 命中后覆盖过滤条件 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].FilterConfig.RuleID | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].FilterConfig.Config | object | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].BoostBuryCondConfig | rule.BoostBuryCondConfig | 否 | body | 命中后覆盖加、降权配置 V2 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].BoostBuryCondConfig.Rules[] | array<rule.BoostBuryCondRule> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].BoostBuryCondConfig.Rules[].ID | integer | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].BoostBuryCondConfig.Rules[].Enable | boolean | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].BoostBuryCondConfig.Rules[].Name | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].BoostBuryCondConfig.Rules[].Config | object | 否 | body | Recursive rule object. Two shapes are valid. `Group node`: `{ op: "and" \| "or", conds: Rule[] }`, where `conds` is a non-empty array of child rules. `Leaf node`: `{ field: string, op: string, conds: array<any> }`, where `op` allows `must`, `must_not`, or `partial_match`. Leaf semantics: `must` = contains, `must_not` = does not contain, `partial_match` = partial match. Additional constraint: when `op = partial_match`, `conds` must be `array<string>`. Meaning: after the request hits the current Serving Control, this rule tree overrides the boost/bury rule. A single-condition rule may be stored either directly as a leaf node or as a one-child group normalized back to a leaf. | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].BoostBuryCondConfig.Rules[].Boost | number | 否 | body | - | [-1, 1] |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].Name | string | 否 | body | 规则名，仅供前端读写展示 | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].Enable | boolean | 否 | body | 是否启用该规则；默认：开 (新建后默认开启) | - |
| Config.SearchConfig.RetrieveConfigs[].ServingControls[].QueryKeywordMatchPercent | number | 否 | body | 命中后覆盖关键词匹配度阈值 qkmp，取值 (0,1] | - |
| Config.SearchConfig.RetrieveConfigs[].UserDefinedRecallMode | search_scene.UserDefinedRecallMode | 否 | body | 自定义模式下的召回路径选择 | KeywordSemantic=0, KeywordOnly=1, SemanticOnly=2 |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig | search_scene.FacetConfig | 否 | body | 分面聚合 | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Enable | boolean | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[] | array<search_scene.Facet> | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[].Name | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[].Field | string | 否 | body | 分面聚合字段完整路径 | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[].MaxFacetBuckets | integer | 否 | body | 枚举类聚合，返回的聚合枚举数量上限。默认 10，下限1，上限 50。 | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[].NumberRanges[] | array<search_scene.NumberRange> | 否 | body | 数值类聚合，定义数值区间，至少有一个合法的区间，eg：[10.5, 100) { "Gte": 10.5, "Lt": 100 } | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[].NumberRanges[].Lt | number | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[].NumberRanges[].Lte | number | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[].NumberRanges[].Gt | number | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].FacetConfig.Facets[].NumberRanges[].Gte | number | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig | search_scene.CorrectionConfig | 否 | body | 搜索词纠错配置 | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.Enable | boolean | 否 | body | 是否开启搜索词纠错 | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.Mode | string | 否 | body | 纠错模式 | auto, suggestion_only |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.Dicts[] | array<search_scene.RelatedDict> | 否 | body | 搜索词纠错词库 | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.Dicts[].DictID | string | 否 | body | - | - |
| Config.SearchConfig.RetrieveConfigs[].CorrectionConfig.MatchMode | string | 否 | body | 纠错匹配模式 | exact, partial |
| Config.SearchConfig.RetrieveConfigs[].SynonymConfig | search_scene.SynonymConfig | 否 | body | 同义词配置 | - |
| Config.SearchConfig.RetrieveConfigs[].SynonymConfig.Dicts[] | array<search_scene.RelatedDict> | 否 | body | 同义词词库 | - |
| Config.SearchConfig.RetrieveConfigs[].SynonymConfig.Dicts[].DictID | string | 否 | body | - | - |
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
