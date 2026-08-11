# CreateSearchSceneV2

## 接口概览

- 用途：在指定应用下创建一个搜索场景策略，并返回创建后的搜索场景详情。
- Method：`POST`
- Action：`CreateSearchSceneV2`
- Request Type：`search_scene.CreateSearchSceneV2Req`
- Response Type：`search_scene.SearchSceneV2`

## IDL 定义

```proto
message CreateSearchSceneV2Req {
  string ProjectName = 1; // 必填，项目名称，用于项目级资源隔离。
  string ApplicationId = 2; // 必填，搜索场景所属的应用 ID。
  string Name = 3; // 搜索场景名称。
  string Description = 4; // 搜索场景描述。

  bool DryRun = 11; // 预检标记，默认为 false。为 true 时，预检成功后返回 DryRunOperation，不执行落库或发布。
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
```

## 入参解释

| 字段 | 类型 | 必填 | 默认值 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `ApplicationId` | string | 是 | 无 | 非空应用 ID | 目标应用 ID。 |
| `ProjectName` | string | 否 | 当前 CLI 项目配置 | - | 项目范围，用于多项目租户隔离。 |
| `Name` | string | 是 | 无 | 非空字符串 | 搜索场景名称。 |
| `Description` | string | 否 | 空 | - | 搜索场景描述。 |
| `DryRun` | boolean | 否 | `false` | `true` / `false` | 预检开关。为 `true` 时只做校验，不落库、不发布。 |

## 出参解释

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `Result.ApplicationId` | string | 应用 ID。 |
| `Result.SceneId` | string | 新建搜索场景 ID。 |
| `Result.Name` | string | 场景名称。 |
| `Result.Description` | string | 场景描述。 |
| `Result.Status` | string | 场景状态：`unpublished` 或 `published`。 |
| `Result.Config` | [SearchSceneConfigV2](./README.md#searchsceneconfigv2) | 创建后默认发布配置。 |
| `Result.DraftConfig` | [SearchSceneConfigV2](./README.md#searchsceneconfigv2) | 草稿配置。 |

## 错误码解释

| 错误码 | HTTP Code | 触发条件 | 处理建议 |
| --- | --- | --- | --- |
| `AccessDenied` | 403 | 当前 AK/SK 或账号无权访问目标应用。 | 检查账号权限、项目范围和 AK/SK。 |
| `InvalidParameter` | 400 | `ApplicationId` 或 `Name` 缺失、格式非法。 | 按入参解释补齐必填字段。 |
| `ResourceNotFound.Application` | 404 | 目标应用不存在或不属于当前项目。 | 确认 `ApplicationId` 和 `ProjectName`。 |
| `DryRunOperation` | 400 | `DryRun=true` 且预检成功。 | 确认预检结果后去掉 `DryRun` 再提交。 |
| `InternalError` | 500 | 服务内部异常。 | 保留 RequestId，重试或升级给服务端排查。 |
| `ServiceUnavailable` | 503 | 服务临时不可用。 | 稍后重试。 |
