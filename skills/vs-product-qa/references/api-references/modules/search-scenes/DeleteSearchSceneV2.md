# DeleteSearchSceneV2

## 接口概览

- 用途：删除指定应用下的搜索场景。
- Method：`POST`
- Action：`DeleteSearchSceneV2`
- Request Type：`search_scene.DeleteSearchSceneV2Req`
- Response Type：`search_scene.EmptyResp`

## IDL 定义

```proto
message DeleteSearchSceneV2Req {
  string ProjectName = 1; // 必填，项目名称，用于项目级资源隔离。
  string ApplicationId = 2; // 必填，搜索场景所属的应用 ID。
  string SceneId = 3; // 必填，搜索场景 ID。

  bool DryRun = 11; // 预检标记，默认为 false。为 true 时，预检成功后返回 DryRunOperation，不执行落库或发布。
}

message EmptyResp {}
```

## 入参解释

| 字段 | 类型 | 必填 | 默认值 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `ApplicationId` | string | 是 | 无 | 非空应用 ID | 目标应用 ID。 |
| `ProjectName` | string | 否 | 当前 CLI 项目配置 | - | 项目范围，用于多项目租户隔离。 |
| `SceneId` | string | 是 | 无 | 非空场景 ID | 需要删除的搜索场景 ID。 |
| `DryRun` | boolean | 否 | `false` | `true` / `false` | 预检开关。为 `true` 时只做校验，不删除。 |

## 出参解释

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `Result` | object | 成功时为空对象。 |

## 错误码解释

| 错误码 | HTTP Code | 触发条件 | 处理建议 |
| --- | --- | --- | --- |
| `AccessDenied` | 403 | 当前 AK/SK 或账号无权访问目标应用。 | 检查账号权限、项目范围和 AK/SK。 |
| `InvalidParameter` | 400 | `ApplicationId` 或 `SceneId` 缺失、格式非法。 | 按入参解释补齐必填字段。 |
| `ResourceNotFound.Application` | 404 | 目标应用不存在或不属于当前项目。 | 确认 `ApplicationId` 和 `ProjectName`。 |
| `SearchSceneNotFound` | 404 | 目标搜索场景不存在。 | 确认 `SceneId`。 |
| `DefaultSearchSceneCannotDelete` | 400 | 尝试删除默认搜索场景。 | 先切换默认场景，或不要删除默认场景。 |
| `DryRunOperation` | 400 | `DryRun=true` 且预检成功。 | 确认预检结果后去掉 `DryRun` 再提交。 |
| `InternalError` | 500 | 服务内部异常。 | 保留 RequestId，重试或升级给服务端排查。 |
| `ServiceUnavailable` | 503 | 服务临时不可用。 | 稍后重试。 |
