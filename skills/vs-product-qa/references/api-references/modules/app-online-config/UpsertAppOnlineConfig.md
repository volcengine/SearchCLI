# UpsertAppOnlineConfig

## 接口概览

- 模块分类：App Online Config
- Service：DashboardService
- RPC：UpsertAppOnlineConfig
- HTTP Method：`POST`
- Request Path：`/api/v1/UpsertAppOnlineConfig`
- Request Type：`application.UpsertAppOnlineConfigReq`
- Response Type：`application.GetAppOnlineConfigResp`
- Top Action：UpsertAppOnlineConfig
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:683`

## 接口说明

新增/更新在线配置接口

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 是 | body | app id | len($)>0; msg:sprintf('berror(AppNotFound, \"%v\")', $) |
| Config | application.OnlineConfig | 否 | body | - | - |
| Config.ChatConfig | application.ChatConfig | 否 | body | 对话配置 | - |
| Config.ChatConfig.BanWords[] | array<string> | 否 | body | 禁答词 | - |
| Config.ChatConfig.RoleInfo | string | 否 | body | 角色身份 | - |
| Config.ChatConfig.AnswerInfo | string | 否 | body | 回复设定 | - |
| Config.ChatConfig.RoleAuxiliaryPrompt | string | 否 | body | 角色辅助提示 | - |
| Config.ChatConfig.OpeningRemarksConfig | application.OpeningRemarksConfig | 否 | body | 开场白配置 | - |
| Config.ChatConfig.OpeningRemarksConfig.EnableRecommend | boolean | 否 | body | 是否开启推荐 | - |
| Config.ChatConfig.OpeningRemarksConfig.RecommendSceneId | string | 否 | body | 推荐场景Id | - |
| Config.ChatConfig.OpeningRemarksConfig.UserPrompt | string | 否 | body | 开场白 | - |
| Config.ChatConfig.OpeningRemarksConfig.RecommendItemDatasetId | string | 否 | body | 推荐生效物品数据集Id | - |
| Config.ChatConfig.OpeningRemarksConfig.UserPromptWithoutRec | string | 否 | body | 未包含推荐的开场白 | - |
| Config.ChatConfig.OpeningRemarksConfig.SuggestionLimit | integer | 否 | body | 最多推荐问题数 | - |
| Config.ChatConfig.OpeningRemarksConfig.CustomizedQuestionConfig | application.CustomizedQuestionConfig | 否 | body | 自定义问题配置 | - |
| Config.ChatConfig.OpeningRemarksConfig.CustomizedQuestionConfig.CustomizedQuestions[] | array<string> | 否 | body | 自定义问题列表 | - |
| Config.ChatConfig.OpeningRemarksConfig.EnableOpeningSuggestion | boolean | 否 | body | 开场设置-开场推荐问题, 默认打开 | - |
| Config.ChatConfig.NetworkSearchMode | string | 否 | body | 网络检索模式 disabled\|ondemand\|always | disabled, ondemand, always |
| Config.ChatConfig.SearchSceneID | string | 否 | body | 绑定搜索策略（场景）ID，必填 | - |
| Config.ChatConfig.FollowUpInfo | string | 否 | body | 追问设定 | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "AppID": "example",
  "Config": {
    "ChatConfig": {
      "BanWords": [
        "example"
      ],
      "RoleInfo": "example",
      "AnswerInfo": "example",
      "RoleAuxiliaryPrompt": "example",
      "OpeningRemarksConfig": {},
      "NetworkSearchMode": "disabled",
      "SearchSceneID": "example",
      "FollowUpInfo": "example"
    }
  },
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Config | application.OnlineConfig | 否 | body | 配置 | - |
| Config.ChatConfig | application.ChatConfig | 否 | body | 对话配置 | - |
| Config.ChatConfig.BanWords[] | array<string> | 否 | body | 禁答词 | - |
| Config.ChatConfig.RoleInfo | string | 否 | body | 角色身份 | - |
| Config.ChatConfig.AnswerInfo | string | 否 | body | 回复设定 | - |
| Config.ChatConfig.RoleAuxiliaryPrompt | string | 否 | body | 角色辅助提示 | - |
| Config.ChatConfig.OpeningRemarksConfig | application.OpeningRemarksConfig | 否 | body | 开场白配置 | - |
| Config.ChatConfig.OpeningRemarksConfig.EnableRecommend | boolean | 否 | body | 是否开启推荐 | - |
| Config.ChatConfig.OpeningRemarksConfig.RecommendSceneId | string | 否 | body | 推荐场景Id | - |
| Config.ChatConfig.OpeningRemarksConfig.UserPrompt | string | 否 | body | 开场白 | - |
| Config.ChatConfig.OpeningRemarksConfig.RecommendItemDatasetId | string | 否 | body | 推荐生效物品数据集Id | - |
| Config.ChatConfig.OpeningRemarksConfig.UserPromptWithoutRec | string | 否 | body | 未包含推荐的开场白 | - |
| Config.ChatConfig.OpeningRemarksConfig.SuggestionLimit | integer | 否 | body | 最多推荐问题数 | - |
| Config.ChatConfig.OpeningRemarksConfig.CustomizedQuestionConfig | application.CustomizedQuestionConfig | 否 | body | 自定义问题配置 | - |
| Config.ChatConfig.OpeningRemarksConfig.CustomizedQuestionConfig.CustomizedQuestions[] | array<string> | 否 | body | 自定义问题列表 | - |
| Config.ChatConfig.OpeningRemarksConfig.EnableOpeningSuggestion | boolean | 否 | body | 开场设置-开场推荐问题, 默认打开 | - |
| Config.ChatConfig.NetworkSearchMode | string | 否 | body | 网络检索模式 disabled\|ondemand\|always | disabled, ondemand, always |
| Config.ChatConfig.SearchSceneID | string | 否 | body | 绑定搜索策略（场景）ID，必填 | - |
| Config.ChatConfig.FollowUpInfo | string | 否 | body | 追问设定 | - |

## 响应示例

```json
{
  "Config": {
    "ChatConfig": {
      "BanWords": [
        "example"
      ],
      "RoleInfo": "example",
      "AnswerInfo": "example",
      "RoleAuxiliaryPrompt": "example",
      "OpeningRemarksConfig": {},
      "NetworkSearchMode": "disabled",
      "SearchSceneID": "example",
      "FollowUpInfo": "example"
    }
  }
}
```

## 错误码说明

| 错误名 | 错误码 | HTTP Code | Message | 说明 |
| --- | --- | --- | --- | --- |
| AccessDenied | AccessDenied | 403 | You are not authorized to perform this action. | 您无权执行此操作。 |
| DryRunOperation | DryRunOperation | 400 | The request is validated by a dryrun operation. | 请求通过了全部检查。 |
| IdempotentParameterMismatch | IdempotentParameterMismatch | 400 | Parameters mismatch the previous request with a same ClientToken. | 请求参数发生变化，请求不生效。 |
| IncorrectStatus | IncorrectStatus | 400 | The current status '{status}' of the resource does not support this operation. | 资源当前状态不支持此操作。 |
| InternalError | InternalError | 500 | The request has failed due to an unknown error. | 服务内部错误。 |
| InvalidParameter | InvalidParameter | 400 | The specified parameter '{parameter}' is invalid. | 参数不合法。 |
| InvalidParameterDatasourceAlreadyExists | InvalidParameter.DatasourceAlreadyExists | 409 | The datasource already exist. | 数据源已存在。 |
| InvalidParameterLength | InvalidParameter.Length | 400 | The length of '{name}' must be between {min} and {max}. | 参数长度设置错误。 |
| InvalidParameterParseRequest | InvalidParameter.Request | 400 | Parse request failed. | 参数不合法。 |
| MissingParameterConfig | MissingParameter.Config | 400 | The required parameter config is missing. | 配置参数不能为空。 |
| OperationDeniedDataSourceDeleting | OperationDenied.DataSourceDeleting | 400 | The operation is denied because datasource '{id}' is being deleted. | 数据源正在删除中。 |
| QuotaExceeded | QuotaExceeded | 429 | QuotaExceeded: '{resource}'. | 配额超限。 |
| ResourceNotFoundConfiguration | ResourceNotFound.Configuration | 404 | The specified resource does not exist: configuration. | 未找到配置。 |
| ResourceNotFoundDatabaseEntry | ResourceNotFound.DatabaseEntry | 404 | The specified resource does not exist: database entry. | 未找到数据库记录。 |
| ResourceNotFoundDataSourceTable | ResourceNotFound.DataSourceTable | 404 | The specified datasource table does not exist. | 数据源表未找到。 |
| ServiceUnavailable | ServiceUnavailable | 503 | The request has failed due to a temporary server error. | 服务不可用。 |

## 备注

- 必填性基于 proto 字段校验规则（如 `api.vd`）与字段注释自动推断。
- 参数位置优先读取字段注解（`query/path/form/body`）；未显式声明时，按 `GET -> query`、其余方法 -> `body` 推断。
- 若本接口未显式声明 `err_enum`，上表回退展示公共错误码集合。