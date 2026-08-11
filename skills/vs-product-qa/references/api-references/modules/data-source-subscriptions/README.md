# Data Source Subscriptions

## Module Summary

Data source subscription APIs create and manage backend ingestion tasks that subscribe to external sources, currently MySQL, and import data into an existing dataset or into a backend-created dataset.

## Endpoint List

| Endpoint | Method | Doc |
| --- | --- | --- |
| CreateDataSourceSubscription | `POST` | [Doc](./CreateDataSourceSubscription.md) |
| CloseDataSourceSubscription | `POST` | [Doc](./CloseDataSourceSubscription.md) |
| GetDataSourceSubscription | `POST` | [Doc](./GetDataSourceSubscription.md) |
| ListDataSourceSubscriptions | `POST` | [Doc](./ListDataSourceSubscriptions.md) |

## 公共嵌套类型

### DataSourceConfig

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `MysqlConfig` | MysqlConfig | `Type=mysql` 时必填的 MySQL 数据源配置。 |

### MysqlConfig

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `SourceTable` | MysqlSourceTable | 订阅的源端库表。 |
| `SourceConfig` | MysqlSourceConfig | MySQL 连接配置。 |
| `SyncMode` | string | 同步模式：`full_and_incr` 或 `full_only`，为空默认 `full_and_incr`。 |

### MysqlSourceTable

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `Database` | string | 订阅的源端数据库名。 |
| `Table` | string | 订阅的源端表名。 |

### MysqlSourceConfig

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `Host` | string | MySQL 主机地址，公网 IP 或域名。 |
| `Port` | int32 | MySQL 端口，必须大于 0。 |
| `Username` | string | 数据库用户名。 |
| `Password` | string | 数据库密码。 |
| `SSLSettings` | SourceSSLSettings | SSL 连接配置。 |

### SourceSSLSettings

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `EnableSSL` | boolean | 是否开启 SSL 连接。 |
| `Cert` | string | SSL 证书内容。 |

### DataSourceSubscriptionCreateDatasetConfig

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `Type` | string | 自动创建数据集的类型，当前仅支持 `multi_modal`。 |
| `DatasetName` | string | 自动创建的数据集名称。 |
| `Language` | string | 语言。 |
| `Theme` | string | 主题，可选值：`general`, `e_commerce`, `content`, `long_video`。 |

### DataSourceSubscriptionTaskInfo

| 字段 | 类型 | 业务含义 |
| --- | --- | --- |
| `TaskId` | string | 数据源订阅任务 ID。 |
| `Status` | string | 任务状态，例如 `initialized`, `waiting_dataset`, `importing`, `finish`, `failed`。 |
| `ImportedCount` | int64 | 已导入数据量。 |
| `DatasetId` | string | 绑定或自动创建后的数据集 ID。 |
