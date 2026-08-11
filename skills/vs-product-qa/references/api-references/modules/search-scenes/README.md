# Search Scenes

## Module Summary

SearchCLI search-scene commands use the V2 control-plane actions. The old v1 actions (`CreateSearchScene`, `ListSearchScene`, `GetSearchScene`, `OnlineSearchScene`, `DeleteSearchScene`) are deprecated for SearchCLI command mapping and should not be used for new scene writes.

## Endpoint List

| Endpoint | Method | Path | Service | Doc |
| --- | --- | --- | --- | --- |
| CreateSearchSceneV2 | `POST` | `/api/v1/CreateSearchSceneV2` | DashboardServiceV2 | [Doc](./CreateSearchSceneV2.md) |
| ListSearchScenesV2 | `POST` | `/api/v1/ListSearchScenesV2` | DashboardServiceV2 | [Doc](./ListSearchScenesV2.md) |
| GetSearchSceneV2 | `POST` | `/api/v1/GetSearchSceneV2` | DashboardServiceV2 | [Doc](./GetSearchSceneV2.md) |
| PublishSearchSceneV2 | `POST` | `/api/v1/PublishSearchSceneV2` | DashboardServiceV2 | [Doc](./PublishSearchSceneV2.md) |
| DeleteSearchSceneV2 | `POST` | `/api/v1/DeleteSearchSceneV2` | DashboardServiceV2 | [Doc](./DeleteSearchSceneV2.md) |

## V2 Request Shape

- identity fields use `ApplicationId` and `SceneId`.
- `search scene update` publishes through `PublishSearchSceneV2`.
- scene config uses `SearchSceneConfigV2`.
- dataset-level settings live under `Config.PerDatasetConfigs[]`, keyed by `DatasetId`.

## 公共嵌套类型

### SearchSceneV2

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `ApplicationId` | string | 应用 ID。 |
| `SceneId` | string | 搜索场景 ID。 |
| `Name` | string | 场景名称。 |
| `Description` | string | 场景描述。 |
| `CreateTime` | string | 创建时间。 |
| `UpdateTime` | string | 更新时间。 |
| `UpdatedBy` | int64 | 更新人。 |
| `IsDefault` | boolean | 是否默认场景。 |
| `Status` | string | 场景状态：`unpublished` 或 `published`。 |
| `Config` | [SearchSceneConfigV2](#searchsceneconfigv2) | 已发布配置。 |
| `DraftConfig` | [SearchSceneConfigV2](#searchsceneconfigv2) | 草稿配置。 |

### SearchSceneConfigV2

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `WantToSearchConfig` | WantToSearchConfigV2 | 猜你想搜配置。 |
| `QueryCompletionConfig` | QueryCompletionConfigV2 | 搜索补全配置。 |
| `OverviewConfig` | OverviewConfig | 搜索摘要配置。 |
| `PerDatasetConfigs` | array<PerDatasetConfig> | 数据集级搜索配置列表。 |

### PerDatasetConfig

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `DatasetId` | string | 数据集 ID。 |
| `TextSearchConfig` | TextSearchConfig | 文本检索配置。 |
| `ImageSearchConfig` | ImageSearchConfig | 图片检索配置。 |
| `MaxRecallNum` | int64 | 最大召回数。 |
| `FilterConfig` | FilterConfigV2 | 搜索范围过滤配置。 |
| `AuxiliaryPoolsConfig` | AuxiliaryPoolsConfig | 辅助召回池配置。 |
| `PersonalizedRecallConfig` | PersonalizedRecall | 个性化召回配置。 |
| `EnableRerankWithHot` | boolean | 是否使用热度参与排序。 |
| `RerankConfig` | RerankConfig | 重排配置。 |
| `BoostBuryCondConfig` | BoostBuryCondConfig | 提权/降权配置。 |
| `SortRulesConfig` | SortRulesConfig | 字段排序配置。 |
| `ShuffleConfig` | ShuffleConfig | 多样性打散配置。 |
| `ServingControlConfig` | ServingControlConfig | 精细化运营条件策略。 |
| `CorrectionConfig` | CorrectionConfigV2 | 搜索词纠错配置。 |
| `SynonymConfig` | SynonymConfigV2 | 同义词配置。 |
| `FacetConfig` | FacetConfig | 分面聚合配置。 |

### 常用枚举

| 字段 | 合法值 | 说明 |
| --- | --- | --- |
| `TextSearchConfig.Mode` | `balanced`, `semantic_priority`, `keyword_priority`, `user_defined` | 检索模式。 |
| `TextSearchConfig.UserDefinedRecallMode` | `keyword_semantic`, `keyword_only`, `semantic_only` | 自定义模式下的召回路径。 |
| `ImageSearchConfig.InstructionType` | `preset_image`, `preset_item`, `custom` | 图片搜索指令类型。 |
| `OverviewConfig.Mode` | `ondemand`, `always` | 搜索摘要触发模式。 |
