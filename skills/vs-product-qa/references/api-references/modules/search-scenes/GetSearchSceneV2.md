# GetSearchSceneV2

## 接口概览

- 用途：获取单个搜索场景的 V2 详情，包括正式配置与草稿配置。
- Method：`POST`
- Action：`GetSearchSceneV2`
- Request Type：`search_scene.GetSearchSceneV2Req`
- Response Type：`search_scene.SearchSceneV2`

## IDL 定义

```proto
message GetSearchSceneV2Req {
  string ProjectName = 1; // 必填，项目名称，用于项目级资源隔离。
  string ApplicationId = 2; // 必填，搜索场景所属的应用 ID。
  string SceneId = 3; // 必填，搜索场景 ID。

  // 以下三个用于筛选的可选字段，其含义与 ListSearchScenesV2Req 中的三个同名字段相同。
  repeated string ConfigLabels = 11;
  repeated string ConfigKeys = 12;
  repeated string DatasetIds = 13;
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

  SearchSceneConfigV2 Config = 21 [(api.go_tag) = "json:\"Config,omitempty\""];
  SearchSceneConfigV2 DraftConfig = 22 [(api.go_tag) = "json:\"DraftConfig,omitempty\""];
}
```

## 入参解释

| 字段              | 类型                   | 必填 | 默认值            | 枚举/校验                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 业务含义                                                        |
| ----------------- | ---------------------- | ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `ApplicationId` | string                 | 是   | 无                | 非空应用 ID                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 目标应用 ID。                                                   |
| `ProjectName`   | string                 | 否   | 当前 CLI 项目配置 | -                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 项目范围，用于多项目租户隔离。                                  |
| `SceneId`       | string                 | 是   | 无                | 非空场景 ID                                                                                                                                                                                                                                                                                                                                                                                                                                                   | 目标搜索场景 ID。                                               |
| `ConfigLabels`  | array<string>          | 否   | 空数组            | `config`, `draft_config`。IDL 注释中 `draft_conig` 为历史拼写问题。                                                                                                                                                                                                                                                                                                                                                                                     | 控制返回正式配置、草稿配置或二者。                              |
| `ConfigKeys`    | array<string>          | 否   | 空数组            | 场景级：`OverviewConfig`, `WantToSearchConfig`, `QueryCompletionConfig`；数据集级：`TextSearchConfig`, `ImageSearchConfig`, `MaxRecallNum`, `FilterConfig`, `AuxiliaryPoolsConfig`, `PersonalizedRecallConfig`, `EnableRerankWithHot`, `RerankConfig`, `BoostBuryCondConfig`, `SortRulesConfig`, `ShuffleConfig`, `ServingControlConfig`, `CorrectionConfig`, `SynonymConfig`, `FacetConfig`。 | 裁剪返回配置字段，降低响应体积。                                |
| `DatasetIds`    | array<string>          | 否   | 空数组            | -                                                                                                                                                                                                                                                                                                                                                                                                                                                             | 只返回指定数据集的`PerDatasetConfigs`；仅对数据集级配置有效。 |

## 出参解释

| 字段                     | 类型                                                  | 业务含义                                     |
| ------------------------ | ----------------------------------------------------- | -------------------------------------------- |
| `Result.ApplicationId` | string                                                | 应用 ID。                                    |
| `Result.SceneId`       | string                                                | 搜索场景 ID。                                |
| `Result.Name`          | string                                                | 场景名称。                                   |
| `Result.Description`   | string                                                | 场景描述。                                   |
| `Result.Status`        | string                                                | 场景状态：`unpublished` 或 `published`。 |
| `Result.Config`        | [SearchSceneConfigV2](./README.md#searchsceneconfigv2) | 已发布配置。                                 |
| `Result.DraftConfig`   | [SearchSceneConfigV2](./README.md#searchsceneconfigv2) | 草稿配置。                                   |

## 错误码解释

| 错误码                 | HTTP Code | 触发条件                                          | 处理建议                                                |
| ---------------------- | --------- | ------------------------------------------------- | ------------------------------------------------------- |
| `AccessDenied`       | 403       | 当前 AK/SK 或账号无权访问目标应用。               | 检查账号权限、项目范围和 AK/SK。                        |
| `InvalidParameter`   | 400       | `ApplicationId` 或 `SceneId` 缺失、格式非法。 | 按入参解释补齐必填字段。                                |
| `ResourceNotFound`   | 404       | 目标应用或场景不存在。                            | 确认`ApplicationId`、`SceneId` 和 `ProjectName`。 |
| `InternalError`      | 500       | 服务内部异常。                                    | 保留 RequestId，重试或升级给服务端排查。                |
| `ServiceUnavailable` | 503       | 服务临时不可用。                                  | 稍后重试。                                              |
