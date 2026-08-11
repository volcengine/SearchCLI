# ListDataSourceSubscriptions

## 接口概览

- 用途：列出当前账号在指定项目下的数据源订阅任务。
- Method：`POST`
- Action：`ListDataSourceSubscriptions`
- Request Type：`dataset.ListDataSourceSubscriptionsReq`
- Response Type：`dataset.ListDataSourceSubscriptionsResp`

## IDL 定义

```proto
message ListDataSourceSubscriptionsReq {
  string ProjectName = 20; // 项目名称
}

message DataSourceSubscriptionTaskInfo {
  string TaskId = 1;
  string Status = 2;
  int64 ImportedCount = 3; // 已导入数据量
  string DatasetId = 4; // 绑定的数据集 ID
}

message ListDataSourceSubscriptionsResp {
  repeated DataSourceSubscriptionTaskInfo Tasks = 1;
}
```

## 入参解释

| 字段 | 类型 | 必填 | 默认值 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `ProjectName` | string | 是 | CLI 默认项目名 | 非空 | 项目范围。CLI 会按当前配置补默认项目名；服务端校验要求非空。 |

## 出参解释

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `Tasks[].TaskId` | string | 数据源订阅任务 ID。 |
| `Tasks[].Status` | string | 任务状态。常见值：`initialized`、`waiting_dataset`、`importing`、`finish`、`failed`。 |
| `Tasks[].ImportedCount` | int64 | 已导入的数据量。 |
| `Tasks[].DatasetId` | string | 绑定的目标数据集 ID；自动创建数据集成功后会回填。 |

## 错误码解释

| 错误码 | HTTP Code | 触发条件 | 处理建议 |
| --- | --- | --- | --- |
| `InvalidParameter.Request` | 400 | 请求体解析失败，或服务端收到空请求对象。 | 检查 JSON 是否为合法对象。 |
| `MissingParameter.RequiredField` | 400 | 缺少认证注入的 `AccountID` 或请求中的 `ProjectName`。 | 确认 AK/SK 和项目名；CLI 默认会补 `ProjectName`。 |
| `InternalError` | 500 | 内部异常，例如任务列表仓储查询失败。 | 保留 RequestId，重试或升级服务端排查。 |
