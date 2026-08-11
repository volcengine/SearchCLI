# ListSearchScenesV2

## 接口概览

- 用途：列出指定应用下的搜索场景，默认返回完整配置，也支持按场景、状态、配置标签、配置键和数据集裁剪返回视图。
- Method：`POST`
- Action：`ListSearchScenesV2`
- Request Type：`search_scene.ListSearchScenesV2Req`
- Response Type：`search_scene.ListSearchScenesV2Resp`

## IDL 定义

```proto
rpc ListSearchScenesV2(search_scene.ListSearchScenesV2Req) returns (search_scene.ListSearchScenesV2Resp) {
  option (api.post) = "/open/ListSearchScenesV2";
  option (api.category) = '搜索场景OpenApi';
  option (api.top_action) = "ListSearchScenesV2";
  option (api.top_version) = "2025-03-01";
}

message ListSearchScenesV2Req {
  string ProjectName = 1;
  string ApplicationId = 2;

  repeated string SceneIds = 11; // 可选，空代表全部
  repeated string Statuses = 12; // 可选，空代表全部。合法取值：unpublished | published
  
  repeated string ConfigLabels = 21; // 可选，空代表全部。合法取值：config | draft_conig
  repeated string ConfigKeys = 22; // 可选，同时作用于 Config 与 DraftConfig，空代表全部。
  repeated string DatasetIds = 23; // 可选，空代表全部。仅对数据集级别的配置项有意义。
}

message ListSearchScenesV2Resp {
  repeated SearchSceneV2 Scenes = 2;
}
```

## 入参解释

| 字段 | 类型 | 必填 | 默认值 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `ProjectName` | string | 否 | 当前 CLI 项目配置 | - | 项目范围，用于多项目租户隔离。 |
| `ApplicationId` | string | 是 | 无 | 非空应用 ID | 目标应用 ID。 |
| `SceneIds` | array<string> | 否 | 空数组 | - | 只查询指定场景；为空表示应用下全部搜索场景。 |
| `Statuses` | array<string> | 否 | 空数组 | `unpublished`, `published` | 按场景状态过滤；为空表示不过滤状态。 |
| `ConfigLabels` | array<string> | 否 | 空数组 | `config`, `draft_config`。IDL 注释中 `draft_conig` 为拼写问题，实际使用建议按接口实现确认。 | 控制返回正式配置、草稿配置或二者。 |
| `ConfigKeys` | array<string> | 否 | 空数组 | 场景级：`OverviewConfig`, `WantToSearchConfig`, `QueryCompletionConfig`；数据集级：`TextSearchConfig`, `ImageSearchConfig`, `MaxRecallNum`, `FilterConfig`, `AuxiliaryPoolsConfig`, `PersonalizedRecallConfig`, `EnableRerankWithHot`, `RerankConfig`, `BoostBuryCondConfig`, `SortRulesConfig`, `ShuffleConfig`, `ServingControlConfig`, `CorrectionConfig`, `SynonymConfig`, `FacetConfig`。 | 裁剪返回配置字段，降低响应体积。 |
| `DatasetIds` | array<string> | 否 | 空数组 | - | 只返回指定数据集的 `PerDatasetConfigs`；仅对数据集级配置有效。 |

## 出参解释

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `Scenes` | array<[SearchSceneV2](./README.md#searchscenev2)> | 搜索场景列表。公共嵌套类型见模块 README，避免在每个接口重复展开。 |

## 错误码解释

| 错误码 | HTTP Code | 触发条件 | 处理建议 |
| --- | --- | --- | --- |
| `AccessDenied` | 403 | 当前 AK/SK 或账号无权访问目标应用。 | 检查账号权限、项目范围和 AK/SK。 |
| `InvalidParameter` | 400 | `ApplicationId` 为空，或枚举字段传入非法值。 | 按入参解释修正字段。 |
| `ResourceNotFound` | 404 | 目标应用不存在或不属于当前项目。 | 确认 `ApplicationId` 和 `ProjectName`。 |
| `InternalError` | 500 | 服务内部异常。 | 保留 RequestId，重试或升级给服务端排查。 |
| `ServiceUnavailable` | 503 | 服务临时不可用。 | 稍后重试。 |
