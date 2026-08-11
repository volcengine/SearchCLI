# PublishSearchSceneV2

## 接口概览

- 用途：增量更新搜索场景正式配置并发布；未传或传 `null` 的子配置项不会覆盖已有值，发布成功后会删除已有草稿配置。
- Method：`POST`
- Action：`PublishSearchSceneV2`
- Request Type：`search_scene.PublishSearchSceneV2Req`
- Response Type：`search_scene.SearchSceneV2`

## IDL 定义

```proto
message PublishSearchSceneV2Req {
  string ProjectName = 1; // 项目名称
  string ApplicationId = 2; // 应用Id
  string SceneId = 3; // 搜索场景Id

  optional string Name = 11; // 搜索场景名称，不传不会覆盖为空。
  optional string Description = 12; // 搜索场景描述，不传不会覆盖为空。

  SearchSceneConfigV2 Config = 21; // 搜索场景正式配置。本字段、以及场景级和数据集级的子配置，不传不会覆盖为空。
  optional bool DryRun = 31; // 预检标记，默认为 false。当其为 true 时，不会有任何落库与发布动作，只会返回预期效果。
}

message SearchSceneV2 {
  string ApplicationId = 1;
  string SceneId = 2;
  string Name = 3;
  string Description = 4;
  string CreateTime = 5;
  string UpdateTime = 6;
  int64 UpdatedBy = 7;
  bool IsDefault = 8;
  string Status = 9; // unpublished|published

  SearchSceneConfigV2 Config = 21; // 已发布配置
  SearchSceneConfigV2 DraftConfig = 22; // 草稿配置
}

message SearchSceneConfigV2 {
  WantToSearchConfigV2 WantToSearchConfig = 1; // 搜索词配置：猜你想搜
  QueryCompletionConfigV2 QueryCompletionConfig = 2; // 搜索词配置：搜索补全
  OverviewConfig OverviewConfig = 3; // 搜索体验：搜索摘要
  repeated PerDatasetConfig PerDatasetConfigs = 11; // 数据集级别配置
}

message WantToSearchConfigV2 {
  int64 MinWordLength = 1; // 最小搜索词长度
  int64 MaxWordLength = 2; // 最大搜索词长度
  int64 WordNum = 3; // 返回词数量
  optional bool Enable = 4; // 搜索词配置-猜你想搜，默认打开
  repeated string DictIds = 5; // 猜你想搜词库
  optional bool EnableApiLog = 6; // 是否使用搜索日志候选词；默认：关
}

message QueryCompletionConfigV2 {
  int64 SugMaxRecallNum = 1; // 搜索补全最大召回数
  int64 SugMinNum = 2; // 触发搜索联想最小字符数
  optional bool Enable = 3; // 是否开启搜索补全；默认：开
  repeated string DictIds = 4; // 搜索补全词库
  optional bool EnableApiLog = 5; // 是否使用搜索日志候选词；默认：关
}

message OverviewConfig {
  string Mode = 1; // ondemand | always
  string TriggerPrompt = 2;
  string ContentPrompt = 3;
  bool EnableOverview = 4; // 是否开启 AI Overview；默认关闭
}

message PerDatasetConfig {
  string DatasetId = 1;

  TextSearchConfig TextSearchConfig = 11; // 文字搜索
  ImageSearchConfig ImageSearchConfig = 12; // 图片搜索
  optional int64 MaxRecallNum = 13; // 返回物品数量上限
  FilterConfigV2 FilterConfig = 14; // 筛选物品范围
  AuxiliaryPoolsConfig AuxiliaryPoolsConfig = 15; // 重点保障召回
  PersonalizedRecall PersonalizedRecallConfig = 16; // 个性化召回
  optional bool EnableRerankWithHot = 17; // 物品热度参与排序
  RerankConfig RerankConfig = 18; // 召回结果重排
  BoostBuryCondConfig BoostBuryCondConfig = 19; // 提权、降权
  SortRulesConfig SortRulesConfig = 20; // 根据字段排序
  ShuffleConfig ShuffleConfig = 21; // 搜索多样性
  ServingControlConfig ServingControlConfig = 22; // 精细化运营
  CorrectionConfigV2 CorrectionConfig = 23; // 搜索词纠错
  SynonymConfigV2 SynonymConfig = 24; // 同义词
  FacetConfig FacetConfig = 25; // 搜索结果分类统计
}

message TextSearchConfig {
  string Mode = 1; // balanced | semantic_priority | keyword_priority | user_defined
  optional double QueryKeywordMatchPercent = 2; // 关键词匹配度阈值，取值 (0,1]
  string UserDefinedRecallMode = 3; // keyword_semantic | keyword_only | semantic_only
  double TextWeight = 4; // 文本权重，取值 [0,1]
  double DenseWeight = 5; // 语义权重，取值 [0,1]
}

message ImageSearchConfig {
  bool Enable = 1; // 是否开启图片搜索
  string InstructionType = 2; // preset_image | preset_item | custom
  string ImageInstruction = 3; // custom 时配置的图片搜索指令
}

message RerankConfig {
  bool Enable = 1; // 是否重排召回
  int64 RerankTopK = 2; // 重排召回物品数量
  string RerankModel = 3; // gte-rerank | doubao-rerank
  RerankDoubaoConfig RerankDoubaoConfig = 4; // RerankModel=doubao-rerank 时生效
}

message RerankDoubaoConfig {
  string ItemFeature = 1; // text | mixed | image
  string Instruction = 2; // doubao 重排指令
}

message FilterConfigV2 {
  optional string RuleId = 1; // 若传 RuleId，则直接使用 DB 中的规则内容
  optional string Name = 2; // 未传 RuleId 时用于创建规则
  google.protobuf.Struct Config = 3; // 未传 RuleId 时用于创建规则
}

message AuxiliaryPoolsConfig {
  repeated DatasetFilter Pools = 1;
}

message DatasetFilter {
  string Name = 1; // 数据集过滤条件名称
  google.protobuf.Struct Filter = 2; // 过滤条件 DSL
  optional bool Enable = 3; // 规则粒度开关；默认开
}

message PersonalizedRecall {
  bool Enable = 1; // 是否开启个性化召回
  string Mode = 2; // strong | weak
  repeated UserInterest UserInterest = 3; // 兴趣标签相关信息
}

message UserInterest {
  string UserInterestId = 1;
  string InterestField = 2; // 兴趣标签字段
  bool Filterable = 3; // 兴趣标签字段是否为可过滤字段
}

message BoostBuryCondConfig {
  repeated BoostBuryCondRule Rules = 2;
}

message BoostBuryCondRule {
  uint32 ID = 1;
  bool Enable = 2;
  string Name = 3;
  google.protobuf.Struct Config = 4;
  double Boost = 5;
}

message SortRulesConfig {
  repeated SortRule Rules = 1;
}

message SortRule {
  string Field = 1; // 选中的 schema field Name
  string Order = 2; // asc | desc
  optional bool Enable = 3; // 规则粒度开关；默认开
}

message ShuffleConfig {
  repeated ShuffleRule Rules = 1;
}

message ShuffleRule {
  uint32 ID = 1;
  bool Disable = 2; // 是否关闭该规则
  string Name = 3;
  string WindowType = 4; // SLIDE | TOP
  int64 WindowSize = 5;
  int64 MaxSize = 6;
  string FieldName = 8;
  string ShuffleType = 9; // dimension | expression
  google.protobuf.Struct ShuffleExpr = 10;
  int64 RecallMax = 11; // 待废弃，使用 MaxSize
}

message ServingControlConfig {
  repeated ServingControlV2 ServingControls = 1;
}

message ServingControlV2 {
  optional bool Enable = 1; // 是否启用该规则；默认开
  string Name = 2; // 规则名

  google.protobuf.Struct QueryCondition = 11; // 触发条件

  TextSearchConfig TextSearchConfig = 21; // 命中后覆盖召回权重
  AuxiliaryPoolsConfig AuxiliaryPoolsConfig = 22; // 命中后覆盖辅助召回池
  SortRulesConfig SortRulesConfig = 23; // 命中后覆盖排序规则
  ShuffleConfig ShuffleConfig = 24; // 命中后覆盖打散配置
  FilterConfigV2 FilterConfig = 25; // 命中后覆盖过滤条件
  BoostBuryCondConfig BoostBuryCondConfig = 26; // 命中后覆盖提权/降权配置
}

message CorrectionConfigV2 {
  bool Enable = 1; // 是否开启
  string Mode = 2; // auto | suggestion_only
  repeated string DictIds = 3; // 纠错词库
  string MatchMode = 4; // exact | partial
}

message SynonymConfigV2 {
  repeated string DictIds = 1; // 同义词词库
}

message FacetConfig {
  bool Enable = 1;
  repeated Facet Facets = 3;
}

message Facet {
  string Name = 1;
  string Field = 2; // 分面聚合字段完整路径
  optional int64 MaxFacetBuckets = 3; // 默认 10，下限 1，上限 50
  repeated NumberRange NumberRanges = 4;
}

message NumberRange {
  optional float Lt = 1;
  optional float Lte = 2;
  optional float Gt = 3;
  optional float Gte = 4;
}
```

## 入参解释

### 顶层字段

| 字段              | 类型                    | 必填 | 默认值            | 枚举/校验                                                                                 | 业务含义                                                |
| ----------------- | ----------------------- | ---- | ----------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `ProjectName`   | string                  | 否   | 当前 CLI 项目配置 | -                                                                                         | 项目范围，用于多项目租户隔离。                          |
| `ApplicationId` | string                  | 是   | 无                | 非空应用 ID                                                                               | 目标应用 ID。                                           |
| `SceneId`       | string                  | 是   | 无                | 非空场景 ID                                                                               | 目标搜索场景 ID。                                       |
| `Name`          | string                  | 否   | 不覆盖原值        | -                                                                                         | 搜索场景名称。未传时保持原名称。                        |
| `Description`   | string                  | 否   | 不覆盖原值        | -                                                                                         | 搜索场景描述。未传时保持原描述。                        |
| `Config`        | `SearchSceneConfigV2` | 否   | 不覆盖原配置      | 子配置按对象存在性做增量 patch；数组字段多为整体替换                                  | 要发布的正式配置。详细 patch 语义、场景级配置和数据集级配置见下方分层说明。 |
| `DryRun`        | boolean                 | 否   | `false`         | `true` / `false`                                                                      | 预检开关。为 `true` 时只执行鉴权、patch 和校验，不落库、不发布、不删除草稿。 |

### Config 增量 patch 语义

| 规则 | 说明 |
| --- | --- |
| 顶层 `Config` 不传 | 不更新任何搜索配置，只可能更新 `Name` / `Description`。 |
| 子配置对象不传 | 不覆盖已有值。例如不传 `OverviewConfig`，现有 AI Overview 配置保持不变。 |
| 子配置对象传入 | 该子配置参与 patch。多数结构体字段是 proto3 scalar，字段没传会按零值进入服务端，因此传子对象时应带齐该子对象需要保留的关键字段。 |
| `PerDatasetConfigs` | 按 `DatasetId` 定位数据集级配置。每个数组元素只 patch 对应数据集；没有出现在请求里的数据集配置不变。 |
| 数组类字段 | `DictIds`、`Pools`、`Rules`、`ServingControls`、`Facets`、`NumberRanges` 等数组字段按整体替换处理；传空数组通常表示清空该数组配置。 |
| 全量校验 | 服务端不是只校验本次传入片段，而是在 patch 后对整个场景配置做校验。已有配置和本次配置组合后不合法，也会失败。 |
| 发布副作用 | 非 `DryRun` 时会先物化过滤规则等依赖资源，再落库并发布；发布成功后会删除已有草稿配置。 |

### SearchSceneConfigV2

| 字段 | 类型 | 必填 | 默认值/patch 语义 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `WantToSearchConfig` | `WantToSearchConfigV2` | 否 | 不传不覆盖；传入则 patch 猜你想搜配置 | 长度、数量校验见下表 | 控制“猜你想搜”召回数量、词长、词库和是否接入搜索日志。 |
| `QueryCompletionConfig` | `QueryCompletionConfigV2` | 否 | 不传不覆盖；传入则 patch 搜索补全配置 | 建议 `SugMaxRecallNum`、`SugMinNum` 使用正数 | 控制输入联想/补全的触发长度、最大召回数、词库和日志候选词。 |
| `OverviewConfig` | `OverviewConfig` | 否 | 不传不覆盖；传入则 patch AI Overview 配置 | `Mode` 只能是 `ondemand` 或 `always` | 控制搜索摘要是否开启、何时触发，以及生成摘要使用的 prompt。 |
| `PerDatasetConfigs` | `PerDatasetConfig[]` | 否 | 不传不覆盖任何数据集配置；传入后按 `DatasetId` patch | 每个元素应提供有效 `DatasetId` | 每个数据集独立的召回、排序、过滤、打散、运营和分面配置。 |

### 场景级配置

| 路径 | 类型 | 必填 | 默认值/patch 语义 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `WantToSearchConfig.MinWordLength` | int64 | 传 `WantToSearchConfig` 时建议传 | 服务端按请求值覆盖 | 必须 `> 0`，且不能大于 `MaxWordLength` | 候选搜索词的最小长度。 |
| `WantToSearchConfig.MaxWordLength` | int64 | 传 `WantToSearchConfig` 时建议传 | 服务端按请求值覆盖 | 必须 `> 0`，且不能小于 `MinWordLength` | 候选搜索词的最大长度。 |
| `WantToSearchConfig.WordNum` | int64 | 否 | 服务端按请求值覆盖 | 必须 `>= 0` | 返回的猜你想搜词数量。 |
| `WantToSearchConfig.Enable` | boolean | 否 | 不传则沿用旧值 | `true` / `false` | 是否启用猜你想搜。 |
| `WantToSearchConfig.DictIds` | string[] | 否 | 整体替换；空数组表示清空词库引用 | 字典 ID 应存在且可用于该应用 | 猜你想搜使用的词库。 |
| `WantToSearchConfig.EnableApiLog` | boolean | 否 | 不传则沿用旧值 | `true` / `false` | 是否使用搜索日志生成候选词。 |
| `QueryCompletionConfig.SugMaxRecallNum` | int64 | 否 | 服务端按请求值覆盖 | 建议 `> 0` | 搜索补全最大召回数。 |
| `QueryCompletionConfig.SugMinNum` | int64 | 否 | 服务端按请求值覆盖 | 建议 `> 0` | 输入达到多少字符后触发搜索补全。 |
| `QueryCompletionConfig.Enable` | boolean | 否 | 不传则沿用旧值 | `true` / `false` | 是否开启搜索补全。 |
| `QueryCompletionConfig.DictIds` | string[] | 否 | 整体替换；空数组表示清空词库引用 | 字典 ID 应存在且可用于该应用 | 搜索补全使用的词库。 |
| `QueryCompletionConfig.EnableApiLog` | boolean | 否 | 不传则沿用旧值 | `true` / `false` | 是否使用搜索日志生成补全候选词。 |
| `OverviewConfig.Mode` | string | 传 `OverviewConfig` 时建议传 | 服务端按请求值覆盖 | `ondemand` / `always` | `ondemand` 表示按需触发摘要；`always` 表示总是生成摘要。 |
| `OverviewConfig.TriggerPrompt` | string | 否 | 空值时服务端可能按应用语言/行业回填默认 prompt | - | 判断是否触发 AI Overview 的提示词。 |
| `OverviewConfig.ContentPrompt` | string | 否 | 空值时服务端可能按应用语言/行业回填默认 prompt | - | 生成 AI Overview 正文的提示词。 |
| `OverviewConfig.EnableOverview` | boolean | 否 | `false` | `true` / `false` | 是否开启 AI Overview。 |

### PerDatasetConfig 数据集级配置

| 字段 | 类型 | 必填 | 默认值/patch 语义 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `DatasetId` | string | 是 | 无 | 应为应用已绑定的数据集 ID | 定位要 patch 的数据集级配置。 |
| `TextSearchConfig` | `TextSearchConfig` | 否 | 不传不覆盖；传入则覆盖文本召回相关字段 | 枚举和阈值见下表 | 控制文本搜索模式、关键词匹配阈值、关键词/语义权重。 |
| `ImageSearchConfig` | `ImageSearchConfig` | 否 | 不传不覆盖；传入则覆盖图片搜索配置 | `InstructionType` 校验见下表 | 控制是否启用图片搜索，以及图片查询指令。 |
| `MaxRecallNum` | int64 | 否 | 不传不覆盖 | 建议为正整数 | 搜索召回后返回物品数量上限。 |
| `FilterConfig` | `FilterConfigV2` | 否 | 不传不覆盖；传空对象可清空过滤范围 | `RuleId` / `Config` 语义见下表 | 配置搜索时可进入召回/排序的物品范围。 |
| `AuxiliaryPoolsConfig` | `AuxiliaryPoolsConfig` | 否 | 不传不覆盖；`Pools: []` 清空 | 每个 pool 的 `Filter` 必须可解析且不能含动态参数 | 重点保障召回池，用于保证特定物品集合有机会被召回。 |
| `PersonalizedRecallConfig` | `PersonalizedRecall` | 否 | 不传不覆盖；`Enable=false` 会关闭并清空个性化召回细节 | `InterestField` 必须是当前数据集可过滤字段 | 控制基于用户兴趣标签的个性化召回。 |
| `EnableRerankWithHot` | boolean | 否 | 不传不覆盖 | `true` / `false` | 是否让物品热度参与排序。 |
| `RerankConfig` | `RerankConfig` | 否 | 不传不覆盖；传入则覆盖重排配置 | Doubao 指令长度上限 1023 | 控制是否对召回结果做模型重排，以及重排模型和参数。 |
| `BoostBuryCondConfig` | `BoostBuryCondConfig` | 否 | 不传不覆盖；`Rules: []` 清空 | 规则字段必须存在于数据集 schema 且条件结构合法 | 按条件对命中物品做提权或降权。 |
| `SortRulesConfig` | `SortRulesConfig` | 否 | 不传不覆盖；`Rules: []` 清空 | `Order` 只能是 `asc` / `desc`；字段必须在 schema 中存在 | 按指定字段排序。 |
| `ShuffleConfig` | `ShuffleConfig` | 否 | 不传不覆盖；`Rules: []` 清空 | 使用打散规则自身校验 | 控制搜索结果多样性，避免同类结果过度集中。 |
| `ServingControlConfig` | `ServingControlConfig` | 否 | 不传不覆盖；`ServingControls: []` 清空 | 每条规则必须有触发条件且至少一个覆盖动作 | 精细化运营规则，命中查询条件后覆盖部分搜索配置。 |
| `CorrectionConfig` | `CorrectionConfigV2` | 否 | 不传不覆盖 | `Mode`、`MatchMode` 枚举见下表 | 搜索词纠错配置。 |
| `SynonymConfig` | `SynonymConfigV2` | 否 | 不传不覆盖；`DictIds: []` 清空 | 字典 ID 应存在且可用于该应用 | 同义词召回配置。 |
| `FacetConfig` | `FacetConfig` | 否 | 不传不覆盖；`Facets: []` 清空 | 聚合字段必须是可过滤且支持分面类型 | 控制搜索结果的分类统计/分面聚合。 |

### 常用子结构字段

| 路径 | 类型 | 必填 | 默认值/patch 语义 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `TextSearchConfig.Mode` | string | 否 | 空值按 `balanced` 处理 | `balanced` / `semantic_priority` / `keyword_priority` / `user_defined` | 搜索召回模式。`user_defined` 时可通过权重和召回模式精细控制。 |
| `TextSearchConfig.QueryKeywordMatchPercent` | double | 否 | 不传表示不设置该阈值 | `(0, 1]` | 关键词匹配度阈值。值越高，要求 query 与文本关键词匹配越严格。 |
| `TextSearchConfig.UserDefinedRecallMode` | string | 否 | 空值按 `keyword_semantic` 处理 | `keyword_semantic` / `keyword_only` / `semantic_only` | 自定义模式下使用关键词、语义或二者结合召回。 |
| `TextSearchConfig.TextWeight` | double | 否 | 服务端按请求值覆盖 | 建议 `[0, 1]` | 关键词/文本召回权重。 |
| `TextSearchConfig.DenseWeight` | double | 否 | 服务端按请求值覆盖 | 建议 `[0, 1]` | 语义向量召回权重。 |
| `ImageSearchConfig.Enable` | boolean | 否 | `false` | `true` / `false` | 是否开启图片搜索。 |
| `ImageSearchConfig.InstructionType` | string | 否 | 空值按 `preset_image` 处理 | `preset_image` / `preset_item` / `custom` | 图片搜索指令来源。 |
| `ImageSearchConfig.ImageInstruction` | string | `InstructionType=custom` 时是 | - | `custom` 时不能为空 | 自定义图片搜索指令。 |
| `RerankConfig.Enable` | boolean | 否 | `false` | `true` / `false` | 是否开启重排。 |
| `RerankConfig.RerankTopK` | int64 | 否 | 服务端按请求值覆盖 | 建议为正整数 | 进入重排模型的候选物品数量。 |
| `RerankConfig.RerankModel` | string | 否 | 为空时回读默认模型 | 通常为 `gte-rerank` / `doubao-rerank` | 选择重排模型。 |
| `RerankConfig.RerankDoubaoConfig.ItemFeature` | string | 否 | 为空时使用默认值 | `text` / `mixed` / `image` | Doubao rerank 使用的物品特征类型。 |
| `RerankConfig.RerankDoubaoConfig.Instruction` | string | 否 | 为空时服务端回填默认指令 | 长度 `<= 1023` | Doubao rerank 指令。 |
| `FilterConfig.RuleId` | string | 否 | - | 必须是当前应用、当前数据集下的 search filter 规则 | 复用已存在的过滤规则。传非空 `RuleId` 时服务端从 DB 读取规则内容，并忽略请求中的 `Config`。 |
| `FilterConfig.Name` | string | 否 | - | - | 未传 `RuleId` 且传入 `Config` 时，用作新过滤规则名称。 |
| `FilterConfig.Config` | object | 否 | 空对象或不传表示清空过滤范围 | 必须是合法过滤 DSL，字段需满足数据集过滤配置 | 未传 `RuleId` 时使用该 DSL 更新过滤范围；正式发布时会物化为规则并回填 `RuleId`。 |

### 高级子结构字段

| 路径 | 类型 | 必填 | 默认值/patch 语义 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `AuxiliaryPoolsConfig.Pools[].Name` | string | 否 | - | - | 辅助召回池名称，用于识别该保障召回规则。 |
| `AuxiliaryPoolsConfig.Pools[].Filter` | object | 是 | - | 必须非空、DSL 可解析、不能包含动态参数 | 定义进入该辅助召回池的物品集合。 |
| `AuxiliaryPoolsConfig.Pools[].Enable` | boolean | 否 | `true` | `true` / `false` | 是否启用该辅助召回池。 |
| `PersonalizedRecallConfig.Enable` | boolean | 否 | `false` | `true` / `false` | 是否开启个性化召回。为 `false` 时不再保留 `Mode` 和 `UserInterest` 细节。 |
| `PersonalizedRecallConfig.Mode` | string | 开启时建议传 | - | `strong` / `weak` | 个性化召回强度。 |
| `PersonalizedRecallConfig.UserInterest[].UserInterestId` | string | 开启时建议传 | - | - | 用户兴趣倒排或标签配置 ID。 |
| `PersonalizedRecallConfig.UserInterest[].InterestField` | string | 开启时是 | - | 必须是当前数据集 `FilterFields` 中的字段 | 与用户兴趣匹配的物品字段。 |
| `BoostBuryCondConfig.Rules[]` | object[] | 否 | 整体替换；空数组清空 | 条件字段必须在 schema 中存在，规则 ID 在同一数据集内不能和打散规则冲突 | 条件提权/降权规则。 |
| `BoostBuryCondConfig.Rules[].Boost` | double | 否 | - | 按服务端规则校验 | 提权/降权强度。 |
| `SortRulesConfig.Rules[].Field` | string | 是 | - | 字段必须在当前数据集 schema 中存在 | 排序字段。 |
| `SortRulesConfig.Rules[].Order` | string | 是 | - | `asc` / `desc` | 升序或降序。 |
| `SortRulesConfig.Rules[].Enable` | boolean | 否 | `true` | `true` / `false` | 是否启用该排序规则。 |
| `ShuffleConfig.Rules[]` | object[] | 否 | 整体替换；空数组清空 | 使用打散规则自身校验；规则 ID 在同一数据集内不能和提权/降权规则冲突 | 多样性打散规则。 |
| `ServingControlConfig.ServingControls[].Enable` | boolean | 否 | `true` | `true` / `false` | 是否启用该精细化运营规则。 |
| `ServingControlConfig.ServingControls[].Name` | string | 否 | - | - | 运营规则名称。 |
| `ServingControlConfig.ServingControls[].QueryCondition` | object | 是 | - | 必须是合法查询条件 DSL，且不超过服务端复杂度限制 | 查询触发条件。命中后才应用该规则内的覆盖动作。 |
| `ServingControlConfig.ServingControls[]` 的覆盖动作 | object | 是 | - | 至少配置一个覆盖动作 | 可覆盖 `TextSearchConfig`、`AuxiliaryPoolsConfig`、`SortRulesConfig`、`ShuffleConfig`、`FilterConfig`、`BoostBuryCondConfig`。 |
| `CorrectionConfig.Enable` | boolean | 否 | `false` | `true` / `false` | 是否开启搜索词纠错。 |
| `CorrectionConfig.Mode` | string | 开启时可省略 | 开启且为空时按 `auto` 处理 | `auto` / `suggestion_only` | 纠错模式。 |
| `CorrectionConfig.DictIds` | string[] | 否 | 整体替换；空数组清空 | 字典 ID 不能为空 | 纠错词库。 |
| `CorrectionConfig.MatchMode` | string | 开启时可省略 | 开启且为空时按 `exact` 处理 | `exact` / `partial` | 纠错匹配模式。 |
| `SynonymConfig.DictIds` | string[] | 否 | 整体替换；空数组清空 | 字典 ID 不能为空 | 同义词词库。 |
| `FacetConfig.Enable` | boolean | 否 | `false` | `true` / `false` | 是否开启分面统计。 |
| `FacetConfig.Facets[].Name` | string | 否 | - | - | 分面名称。 |
| `FacetConfig.Facets[].Field` | string | 开启分面时是 | - | 必须是当前数据集可过滤字段；不支持地理位置和时间字段 | 分面聚合字段。 |
| `FacetConfig.Facets[].MaxFacetBuckets` | int64 | 否 | 枚举型字段默认 `10` | `1` 到 `50` | 枚举型分面最多返回多少个 bucket。 |
| `FacetConfig.Facets[].NumberRanges[]` | object[] | 否 | 不传时数值字段可按枚举聚合 | 每个 range 至少有一个边界；`Lt` 和 `Lte` 不能同时传，`Gt` 和 `Gte` 不能同时传；上下界同时存在时下界必须小于上界 | 数值型分面的区间聚合规则。 |

## 出参解释

| 字段                     | 类型                    | 业务含义                                                           |
| ------------------------ | ----------------------- | ------------------------------------------------------------------ |
| `Result.ApplicationId` | string                  | 应用 ID。                                                          |
| `Result.SceneId`       | string                  | 搜索场景 ID。                                                      |
| `Result.Name`          | string                  | 场景名称。                                                         |
| `Result.Description`   | string                  | 场景描述。                                                         |
| `Result.CreateTime`    | string                  | 创建时间。                                                         |
| `Result.UpdateTime`    | string                  | 更新时间。                                                         |
| `Result.UpdatedBy`     | int64                   | 更新人。                                                           |
| `Result.IsDefault`     | boolean                 | 是否默认场景。                                                     |
| `Result.Status`        | string                  | 场景状态：`unpublished` 或 `published`。                       |
| `Result.Config`        | `SearchSceneConfigV2` | 发布后的正式配置。结构见上方递归 IDL。                             |
| `Result.DraftConfig`   | `SearchSceneConfigV2` | 草稿配置。发布成功后草稿通常会被删除或清空，具体以服务端返回为准。 |

## 错误码解释

| 错误码                 | HTTP Code | 触发条件                                                                                | 处理建议                                                |
| ---------------------- | --------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `AccessDenied`       | 403       | 当前 AK/SK 或账号无权访问目标应用。                                                     | 检查账号权限、项目范围和 AK/SK。                        |
| `InvalidParameter`   | 400       | `ApplicationId`、`SceneId` 或 `Config` 子字段格式非法；枚举值非法；配置校验失败。 | 按入参解释和递归 IDL 修正 payload。                     |
| `ResourceNotFound`   | 404       | 目标应用、场景、关联规则或字典不存在。                                                  | 确认`ApplicationId`、`SceneId`、规则 ID 和字典 ID。 |
| `OperationDenied`    | 400       | 场景配置无法应用，例如数据集配置不满足发布条件。                                        | 根据错误信息修正配置后重试。                            |
| `InternalError`      | 500       | 内部异常。                                                                              | 保留 RequestId，重试或升级服务端排查。                  |
| `ServiceUnavailable` | 503       | 服务临时不可用。                                                                        | 稍后重试。                                              |
