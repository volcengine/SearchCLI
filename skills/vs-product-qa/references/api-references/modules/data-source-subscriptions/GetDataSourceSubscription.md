# GetDataSourceSubscription

## 接口概览

- 用途：查询单个数据源订阅任务的状态、导入数量和目标数据集。
- Method：`POST`
- Action：`GetDataSourceSubscription`
- Request Type：`dataset.GetDataSourceSubscriptionReq`
- Response Type：`dataset.GetDataSourceSubscriptionResp`

## IDL 定义

```proto
message GetDataSourceSubscriptionReq {
  string TaskId = 1;
  string ProjectName = 20; // 项目名称
}

message DataSourceSubscriptionTaskInfo {
  string TaskId = 1;
  string Status = 2;
  int64 ImportedCount = 3; // 已导入数据量
  string DatasetId = 4; // 绑定的数据集 ID
}

message GetDataSourceSubscriptionResp {
  DataSourceSubscriptionTaskInfo Task = 1;
}
```

## 入参解释

| 字段 | 类型 | 必填 | 默认值 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `TaskId` | string | 是 | 无 | 非空 | 要查询的数据源订阅任务 ID。 |
| `ProjectName` | string | 是 | CLI 默认项目名 | 非空 | 项目范围。CLI 会按当前配置补默认项目名；服务端校验要求非空。 |

## 出参解释

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `Task.TaskId` | string | 数据源订阅任务 ID。 |
| `Task.Status` | string | 任务状态。常见值：`initialized`（已初始化）、`waiting_dataset`（等待自动创建数据集）、`importing`（导入中）、`finish`（已结束）、`failed`（失败）。 |
| `Task.ImportedCount` | int64 | 已导入的数据量。 |
| `Task.DatasetId` | string | 绑定的目标数据集 ID；自动创建数据集成功后会回填。 |

## 错误码解释

| 错误码 | HTTP Code | 触发条件 | 处理建议 |
| --- | --- | --- | --- |
| `InvalidParameter.Request` | 400 | 请求体解析失败，或服务端收到空请求对象。 | 检查 JSON 是否为合法对象。 |
| `MissingParameter.RequiredField` | 400 | 缺少认证注入的 `AccountID` 或请求中的 `TaskId`。 | 补齐 `TaskId`；若 `AccountID` 缺失，检查 AK/SK。 |
| `ResourceNotFound.Task` | 404 | 按 `TaskId` + `ProjectName` 未找到订阅任务。 | 确认任务 ID 和项目名。 |
| `AccessDenied` | 403 | 任务存在，但任务所属账号与当前认证账号不一致。 | 使用任务所属账号的 AK/SK，或检查项目/账号。 |
| `InternalError` | 500 | 内部异常，例如仓储查询失败但未归类为 not found。 | 保留 RequestId，重试或升级服务端排查。 |
