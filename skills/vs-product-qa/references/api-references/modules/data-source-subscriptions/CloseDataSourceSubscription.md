# CloseDataSourceSubscription

## 接口概览

- 用途：关闭指定数据源订阅任务。若任务已经处于完成态，服务端直接返回当前任务，不重复关闭底层数据源。
- Method：`POST`
- Action：`CloseDataSourceSubscription`
- Request Type：`dataset.CloseDataSourceSubscriptionReq`
- Response Type：`dataset.CloseDataSourceSubscriptionResp`

## IDL 定义

```proto
message CloseDataSourceSubscriptionReq {
  string TaskId = 1;
  string ProjectName = 20; // 项目名称
}

message CloseDataSourceSubscriptionResp {
  string TaskId = 1;
  string Status = 2;
  string Message = 3;
}
```

## 入参解释

| 字段 | 类型 | 必填 | 默认值 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `TaskId` | string | 是 | 无 | 非空 | 要关闭的数据源订阅任务 ID。 |
| `ProjectName` | string | 是 | CLI 默认项目名 | 非空 | 项目范围。CLI 会按当前配置补默认项目名；服务端校验要求非空。 |

## 出参解释

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `TaskId` | string | 被关闭的数据源订阅任务 ID。 |
| `Status` | string | 关闭后的任务状态；成功关闭后为 `finish`，已完成任务会返回原完成态。 |
| `Message` | string | 关闭结果说明；当前 handler 成功时返回 `success`。 |

## 错误码解释

| 错误码 | HTTP Code | 触发条件 | 处理建议 |
| --- | --- | --- | --- |
| `InvalidParameter.Request` | 400 | 请求体解析失败，或服务端收到空请求对象。 | 检查 JSON 是否为合法对象。 |
| `MissingParameter.RequiredField` | 400 | 缺少认证注入的 `AccountID` 或请求中的 `TaskId`。 | 补齐 `TaskId`；若 `AccountID` 缺失，检查 AK/SK。 |
| `ResourceNotFound.Task` | 404 | 按 `TaskId` + `ProjectName` 未找到订阅任务。 | 确认任务 ID 和项目名。 |
| `AccessDenied` | 403 | 任务存在，但任务所属账号与当前认证账号不一致。 | 使用任务所属账号的 AK/SK，或检查项目/账号。 |
| `InvalidParameter` | 400 | 任务内部 `SourceType` 不支持，或关闭底层数据源时发现任务配置不合法。 | 先查询任务详情；若为历史异常数据，升级服务端处理。 |
| `InternalError` | 500 | 内部异常，例如更新任务状态失败、关闭 Kafka/DTS 资源失败等未归类错误。 | 保留 RequestId，重试或升级服务端排查。 |
