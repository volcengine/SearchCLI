# CreateDataSourceSubscription

## 接口概览

- 用途：创建数据源订阅任务。当前仅支持 MySQL 源；任务会把源数据导入已有 `multi_modal` / `user_event` 数据集，或由后端采样并自动创建 `multi_modal` 数据集后导入。
- Method：`POST`
- Action：`CreateDataSourceSubscription`
- Request Type：`dataset.CreateDataSourceSubscriptionReq`
- Response Type：`dataset.CreateDataSourceSubscriptionResp`

## IDL 定义

```proto
message MysqlSourceTable {
  string Database = 1; // 订阅的源端数据库名（逻辑库名，用于 ObjectMappings 过滤）
  string Table = 2; // 订阅的源端表名（逻辑表名，用于 ObjectMappings 过滤）
}

message SourceSSLSettings {
  bool EnableSSL = 1; // 是否开启 SSL 连接
  string Cert = 2; // SSL 证书内容，EnableSSL=true 时必填
}

message MysqlSourceConfig {
  string Host = 1; // MySQL 主机地址（公网 IP 或域名）
  int32 Port = 2; // MySQL 端口
  string Username = 3; // 数据库用户名
  string Password = 4; // 数据库密码
  SourceSSLSettings SSLSettings = 5; // SSL 连接配置，可选
}

message MysqlConfig {
  MysqlSourceTable SourceTable = 1; // MySQL 订阅的源端库表（逻辑库表，用于 ObjectMappings 过滤）
  MysqlSourceConfig SourceConfig = 2; // MySQL 源端连接配置；目标 Kafka 与 DTS 方案配置由服务端自动生成
  string SyncMode = 3; // 同步模式，支持：full_and_incr（全量+增量，默认）、full_only（仅全量）；为空时默认 full_and_incr
}

message DataSourceConfig {
  MysqlConfig MysqlConfig = 1; // Type=mysql 时必填
}

message DataSourceSubscriptionCreateDatasetConfig {
  string Type = 1 [(api.vd) = "regexp('^multi_modal$'); msg:sprintf('berror(InvalidParameterUnsupportedDatasetType, \"%v\")', $)"]; // 自动创建数据集时仅支持 multi_modal
  string DatasetName = 2; // 数据集名称
  string Language = 3; // 语言
  string Theme = 4; // 主题，可选；支持：general | e_commerce | content | long_video
}

message CreateDataSourceSubscriptionReq {
  string ClientToken = 1; // 幂等 token；相同 ClientToken 的请求参数必须完全一致
  bool NeedCreateDataset = 2; // 是否由消费端自动采样并创建新数据集；默认 false
  string DatasetId = 3; // NeedCreateDataset=false 时必填；仅支持绑定已有 multi_modal / user_event 数据集；NeedCreateDataset=true 时由消费端创建成功后回填
  DataSourceSubscriptionCreateDatasetConfig CreateDatasetConfig = 4; // NeedCreateDataset=true 时用于创建数据集；当前仅支持自动创建 multi_modal 数据集
  string Type = 5; // 数据源类型；当前支持：mysql
  DataSourceConfig DataSourceConfig = 6; // 数据源配置；Type=mysql 时 MysqlConfig 必填
  string ProjectName = 20; // 项目名称
}

message CreateDataSourceSubscriptionResp {
  string TaskId = 1;
  string Message = 2;
}
```

## 入参解释

| 字段 | 类型 | 必填 | 默认值 | 枚举/校验 | 业务含义 |
| --- | --- | --- | --- | --- | --- |
| `ClientToken` | string | 是 | 无 | 非空；同一 token 的请求参数必须完全一致 | 幂等 token。服务端会用 token + 请求指纹去重；相同 token 且参数一致时返回已有任务，参数不一致时报 `IdempotentParameterMismatch`。 |
| `NeedCreateDataset` | boolean | 否 | `false` | `true` / `false` | 是否由后端消费端从源表采样并自动创建新数据集。 |
| `DatasetId` | string | 条件必填 | 无 | `NeedCreateDataset=false` 时必填；目标数据集类型只能是 `multi_modal` 或 `user_event` | 已有目标数据集 ID。 |
| `CreateDatasetConfig` | object | 条件必填 | 无 | `NeedCreateDataset=true` 时必填；`Type` 最终只允许 `multi_modal`；`DatasetName` 非空；`Theme` 支持 `general`, `e_commerce`, `content`, `long_video` | 自动创建数据集时使用的配置。 |
| `Type` | string | 是 | 无 | 当前仅支持 `mysql` | 数据源类型，用于选择订阅适配器。 |
| `DataSourceConfig.MysqlConfig.SourceTable.Database` | string | 是 | 无 | 非空 | MySQL 源端逻辑库名，用于 DTS ObjectMappings 过滤。 |
| `DataSourceConfig.MysqlConfig.SourceTable.Table` | string | 是 | 无 | 非空 | MySQL 源端逻辑表名，用于 DTS ObjectMappings 过滤。 |
| `DataSourceConfig.MysqlConfig.SourceConfig.Host` | string | 是 | 无 | 非空 | MySQL 公网 IP 或域名。 |
| `DataSourceConfig.MysqlConfig.SourceConfig.Port` | int32 | 是 | 无 | `> 0` | MySQL 端口。 |
| `DataSourceConfig.MysqlConfig.SourceConfig.Username` | string | 是 | 无 | 非空 | 数据库用户名。 |
| `DataSourceConfig.MysqlConfig.SourceConfig.Password` | string | 是 | 无 | 非空 | 数据库密码。建议只通过 `--data @file` 或 `--data-source-config @file` 传入，避免进入 shell history。 |
| `DataSourceConfig.MysqlConfig.SourceConfig.SSLSettings` | object | 否 | 空 | `EnableSSL=true` 时应提供证书内容 | MySQL SSL 连接配置。 |
| `DataSourceConfig.MysqlConfig.SyncMode` | string | 否 | `full_and_incr` | `full_and_incr`, `full_only` | DTS 同步模式。 |
| `ProjectName` | string | 是 | CLI 默认项目名 | 非空 | 项目范围。CLI 会按当前配置补默认项目名；服务端校验要求非空。 |

## 出参解释

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `TaskId` | string | 新建或幂等命中的数据源订阅任务 ID。 |
| `Message` | string | 创建结果说明；当前 handler 成功时返回 `success`。 |

## 错误码解释

| 错误码 | HTTP Code | 触发条件 | 处理建议 |
| --- | --- | --- | --- |
| `InvalidParameter.Request` | 400 | 请求体解析失败，或服务端收到空请求对象。 | 检查 JSON 是否为合法对象。 |
| `MissingParameter.RequiredField` | 400 | 缺少 `AccountID`、`ClientToken`、`DatasetId`、`Type`、`CreateDatasetConfig`、`CreateDatasetConfig.DatasetName`、`DataSourceConfig`、`DataSourceConfig.MysqlConfig`、`SourceTable`、`SourceConfig`、`Database`、`Table`、`Host`、`Username` 或 `Password` 等必填字段。 | 按入参解释补齐字段；`AccountID` 由认证上下文注入，若缺失需检查 AK/SK。 |
| `InvalidParameter` | 400 | `Type`/`SourceType` 不支持、`SyncMode` 非法、端口 `<=0`、数据源配置无法转换为 DTS 配置、`CreateDatasetConfig.Theme` 非法，或 DTS 创建任务返回非标准错误。 | 仅使用 `Type=mysql`；`SyncMode` 使用 `full_and_incr` 或 `full_only`；检查 MySQL 连接配置和 Theme。 |
| `InvalidParameter.DatasetType` | 400 | 数据集类型为空或无法识别。 | 使用支持的数据集类型；自动创建场景最终应使用 `multi_modal`。 |
| `InvalidParameter.UnsupportedDatasetType` | 400 | 自动创建时不是 `multi_modal`，或绑定已有数据集时目标数据集不是 `multi_modal` / `user_event`。 | 改用 `multi_modal` / `user_event` 目标数据集；自动创建只能使用 `multi_modal`。 |
| `IdempotentParameterMismatch` | 400 | 相同 `ClientToken` 已存在任务，但本次请求参数与历史请求指纹不同。 | 更换新的 `ClientToken`，或完全复用原始请求参数。 |
| `ResourceNotFound.Dataset` | 404 | `DatasetId` 对应的数据集不存在。 | 确认数据集 ID 和项目名。 |
| `InternalError` | 500 | 内部异常，例如请求指纹生成失败、任务入库/更新失败、Kafka/DTS 内部调用异常等未归类错误。 | 保留 RequestId，重试或升级服务端排查。 |
