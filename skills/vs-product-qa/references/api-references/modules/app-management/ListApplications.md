# ListApplications

## 接口概览

- 模块分类：App Management
- Service：DashboardService
- RPC：ListApplications
- HTTP Method：`POST`
- Request Path：`/api/v1/ListApplications`
- Request Type：`application.ListApplicationReq`
- Response Type：`application.ListApplicationResp`
- Top Action：ListApplications
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:444`

## 接口说明

应用列表

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Ids[] | array<string> | 否 | body | 查询指定ID的应用列表 | - |
| AppTypes[] | array<string> | 否 | body | 查询应用类型 | - |
| State | application.AppState | 否 | body | 查询应用状态 | AppInit=0, AppReady=1, AppDeleting=2, AppDeleted=3, AppNotReady=4 |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "Ids": [
    "example"
  ],
  "AppTypes": [
    "example"
  ],
  "State": "AppReady",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Apps[] | array<application.Application> | 否 | body | - | - |
| Apps[].AppID | string | 否 | body | - | - |
| Apps[].Name | string | 否 | body | - | - |
| Apps[].Type | application.AppType | 否 | body | - | AppTypeDefault=0, AppTypeMultiModalSearch=1, ApplicationTypeKnowledge=2 |
| Apps[].State | application.AppState | 否 | body | - | AppInit=0, AppReady=1, AppDeleting=2, AppDeleted=3, AppNotReady=4 |
| Apps[].Description | string | 否 | body | - | - |
| Apps[].CreatedAt | integer | 否 | body | - | - |
| Apps[].UpdatedAt | integer | 否 | body | - | - |
| Apps[].UpdatedBy | string | 否 | body | - | - |
| Apps[].Datasets[] | array<dataset.Dataset> | 否 | body | - | - |
| Apps[].Datasets[].DatasetID | string | 否 | body | - | - |
| Apps[].Datasets[].Name | string | 否 | body | - | - |
| Apps[].Datasets[].State | dataset.DataSetState | 否 | body | MVP 版本不展示，可以不返回给前端 | DatasetUnknown=0, DatasetInit=1, DatasetPending=2, DatasetReady=3, DatasetDeleting=4, DatasetDeleted=5 |
| Apps[].Datasets[].Type | dataset.DatasetType | 否 | body | - | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| Apps[].Datasets[].DataNum | integer | 否 | body | - | - |
| Apps[].Datasets[].Applications[] | array<dataset.DatasetRefApp> | 否 | body | 关联的应用信息 | - |
| Apps[].Datasets[].Applications[].AppID | string | 否 | body | - | - |
| Apps[].Datasets[].Applications[].Name | string | 否 | body | - | - |
| Apps[].Datasets[].Description | string | 否 | body | - | - |
| Apps[].Datasets[].Schema[] | array<dataset.DatasetSchemaField> | 否 | body | 数据集最新版本对应的schema | - |
| Apps[].Datasets[].Schema[].Name | string | 否 | body | - | regexp('^[a-zA-Z][a-zA-Z0-9_]{0,127}$'); msg:sprintf('berror(InvalidSchemaFieldName, \"%v\")', $) |
| Apps[].Datasets[].Schema[].Type | dataset.FieldType | 否 | body | - | FieldTypeUnknown=0, FieldTypeString=1, FieldTypeInt32=2, FieldTypeInt64=3, FieldTypeFloat=4, FieldTypeBool=5, FieldTypeArrayString=6, FieldTypeArrayInt32=7, FieldTypeArrayInt64=8, FieldTypeArrayFloat=9, FieldTypeObject=10, FieldTypeArrayObject=11, FieldTypeDatetimeISO=12, FieldTypeDatetimeSQL=13, FieldTypeTimestampMS=14, FieldTypeTimestampS=15 |
| Apps[].Datasets[].Schema[].SourceType | dataset.SourceType | 否 | body | 已废弃 | DatasetSourceTypeUnknown=0, DatasetSourceTypeText=1, DatasetSourceTypeImage=2 |
| Apps[].Datasets[].Schema[].PK | boolean | 否 | body | - | - |
| Apps[].Datasets[].Schema[].Meaning | string | 否 | body | 已废弃 | - |
| Apps[].Datasets[].Schema[].Metadata | dataset.FieldMetadata | 否 | body | 字段功能属性，由后端根据业务属性推断而来，不要赋值 | - |
| Apps[].Datasets[].Schema[].Metadata.IsPK | boolean | 否 | body | - | - |
| Apps[].Datasets[].Schema[].Metadata.IsReadOnly | boolean | 否 | body | - | - |
| Apps[].Datasets[].Schema[].Fields[] | array<dataset.DatasetSchemaField> | 否 | body | - | - |
| Apps[].Datasets[].Schema[].BizAttr | dataset.BizAttr | 否 | body | - | Unspecified=0, UserId=1, QueryPK=5, ImagePK=11, ImageURL=12, ImageBase64=13, ImageTitle=14, ImagePublishTime=15, ImagePublishTimestamp=16, ImagePublishTimestampMs=17, ImageCategory=18, ImagePublishTimeSqlFmt=19, VideoContentID=21, VideoContentType=22, VideoURL=23, VideoParentContentID=24, VideoSequenceIndex=25, VideoContentTitle=26, VideoMediaCoverURL=27, VideoMediaLink=28, VideoDuration=29, VideoLanguage=30, VideoPublishTime=31, VideoPublishTimestamp=32, VideoPublishTimestampMs=33, VideoPublishTimeSqlFmt=34, UserEventItemPK=41, UserEventUserPK=42, UserEventEventType=51, UserEventTimestamp=52, UserEventScene=53, RecItemTitle=54, RecItemCategory=55, DocID=61, DocType=62, DocURL=63, DocPath=64, DocName=65, DocSize=66, UploadSource=67, DocSource=68, CollectionId=69, DocLarkExtra=70, LocationLongitude=71, LocationLatitude=72, InternalGeo=73, MultiModalId=80, MultiModalTitle=81, MultiModalContent=82, MultiModalImageUrl=83, MultiModalVideoUrl=84, MultiModalCategory=85, MultiModalTag=86, MultiModalBrand=87, MultiModalPrice=88, MultiModalPublishTime=89, MultiModalLink=90, MultiModalLongitude=91, MultiModalLatitude=92, MultiModalContentType=93, MultiModalParentId=94, MultiModalSequenceIndex=95, MultiModalDuration=96, MultiModalLanguage=97, MultiModalMediaLink=98, MultiModalPurchaseCount=99, MultiModalViewCount=100, MultiModalLikeCount=101, MultiModalCommentCount=102 |
| Apps[].Datasets[].Schema[].KeyError | string | 否 | body | 推断时使用，用于返回key类型错误 | - |
| Apps[].Datasets[].Schema[].TypeError | string | 否 | body | 推断时使用，用于返回type类型错误 | - |
| Apps[].Datasets[].Schema[].Required | boolean | 否 | body | 是否必填 | - |
| Apps[].Datasets[].Schema[].EnumerateMeta[] | array<dataset.EnumerateValue> | 否 | body | 枚举定义 | - |
| Apps[].Datasets[].Schema[].EnumerateMeta[].EnumerateValue | string | 否 | body | 枚举值 | - |
| Apps[].Datasets[].Schema[].EnumerateMeta[].Name | string | 否 | body | 枚举名称 | - |
| Apps[].Datasets[].Schema[].EnumerateMeta[].Meaning | string | 否 | body | 枚举描述 | - |
| Apps[].Datasets[].Schema[].EnumerateMeta[].EnumerateBizAttr | dataset.EnumerateBizAttr | 否 | body | 业务属性 | UserEventBizCustom=0, UserEventBizExposure=1, UserEventBizClick=2, UserEventBizCollect=3, UserEventBizShare=4, UserEventBizLike=5, UserEventBizAddToCart=6, UserEventBizOrder=7, UserEventBizPurchase=8, UserEventBizVisit=9 |
| Apps[].Datasets[].Schema[].EnumerateMeta[].Required | boolean | 否 | body | 必须 | - |
| Apps[].Datasets[].Schema[].Description | string | 否 | body | 字段描述 | - |
| Apps[].Datasets[].Schema[].AugmentedMeta | dataset.AugmentedFieldMeta | 否 | body | 增强字段 | - |
| Apps[].Datasets[].Schema[].AugmentedMeta.Type | dataset.AugmentedFieldType | 否 | body | 增强类型 (例如: 关键词, 摘要等) | SearchQueries=0, Keyword=1, Description=2, VideoSummary=3, VideoTitle=4, DocChunkID=5, DocCaptionID=6, DocSiblingNodes=7, DocSummary=8, DocSummaryEmbed=9, DocTranscribeContent=10, DocStartTime=11, DocEndTime=12, DocText=13, DocBase64=14, DocDenseTextVector=15, DocDenseImageVector=16, ItemSummary=17 |
| Apps[].Datasets[].Schema[].AugmentedMeta.SourceFields[] | array<string> | 否 | body | 用于生成该增强字段的源字段 | - |
| Apps[].Datasets[].Schema[].AugmentedMeta.MaxGenerationNum | integer | 否 | body | 最大关键词数量，应该只有是keyword类型才会生效 | - |
| Apps[].Datasets[].Schema[].AugmentedMeta.SystemPrompt | string | 否 | body | 系统 Prompt | - |
| Apps[].Datasets[].Schema[].AugmentedMeta.Prompt | string | 否 | body | 用户 Prompt | - |
| Apps[].Datasets[].Version | integer | 否 | body | schema版本号 | - |
| Apps[].Datasets[].UpdatedAt | integer | 否 | body | - | - |
| Apps[].Datasets[].CreatedAt | integer | 否 | body | - | - |
| Apps[].Datasets[].UpdatedBy | string | 否 | body | 待确认具体形式 | - |
| Apps[].Datasets[].DataFieldConfig | dataset.DataFieldConfig | 否 | body | 数据字段配置 | - |
| Apps[].Datasets[].DataFieldConfig.IndexFields[] | array<string> | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.FilterFields[] | array<string> | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.SuggestFields[] | array<string> | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.AugmentedFields[] | array<dataset.AugmentedField> | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.AugmentedFields[].FieldName | string | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.AugmentedFields[].FieldType | dataset.AugmentedFieldType | 否 | body | - | SearchQueries=0, Keyword=1, Description=2, VideoSummary=3, VideoTitle=4, DocChunkID=5, DocCaptionID=6, DocSiblingNodes=7, DocSummary=8, DocSummaryEmbed=9, DocTranscribeContent=10, DocStartTime=11, DocEndTime=12, DocText=13, DocBase64=14, DocDenseTextVector=15, DocDenseImageVector=16, ItemSummary=17 |
| Apps[].Datasets[].DataFieldConfig.AugmentedFields[].SourceFields[] | array<string> | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.AugmentedFields[].MaxGenerationNum | integer | 否 | body | 最大关键词数量，应该只有是keyword类型才会生效 | - |
| Apps[].Datasets[].DataFieldConfig.AugmentedFields[].SystemPrompt | string | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.AugmentedFields[].Prompt | string | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.FieldDescMap | map<string, string> | 否 | body | 兼容值修改了字段描述的字段 | - |
| Apps[].Datasets[].DataFieldConfig.DatasetDescription | string | 否 | body | 数据集整体描述，目前没有用到 | - |
| Apps[].Datasets[].DataFieldConfig.ImageIndexFields[] | array<string> | 否 | body | 图片索引字段,采用 list 以保持扩展性 | - |
| Apps[].Datasets[].DataFieldConfig.ChatFields[] | array<string> | 否 | body | 用于问答的字段,采用 list 以保持扩展性 | - |
| Apps[].Datasets[].DataFieldConfig.FilterFieldsMap | map<string, FilterFieldsList> | 否 | body | 过滤字段映射 | - |
| Apps[].Datasets[].DataFieldConfig.FilterFieldsMap.{value}.Fields[] | array<string> | 否 | body | - | - |
| Apps[].Datasets[].DataFieldConfig.VideoIndexFields[] | array<string> | 否 | body | 视频索引字段,采用 list 以保持扩展性 | - |
| Apps[].Datasets[].FieldsConfigVersion | integer | 否 | body | 数据集字段配置版本 | - |
| Apps[].Datasets[].AutoDelete | boolean | 否 | body | 是否自动删除 | - |
| Apps[].Datasets[].PreProcessedDataNum | integer | 否 | body | 已完成预处理的数据量 | - |
| Apps[].Datasets[].Industry | common.IndustryType | 否 | body | optional，数据集行业属性 | None=0, ECommerce=1, Material=2, Video=3, News=4, SocialPlatform=5, Other=20 |
| Apps[].Datasets[].tag | dataset.DatasetTag | 否 | body | - | DatasetTagDefault=0, DatasetTagKnowledge=1 |
| Apps[].Datasets[].DocumentStats | dataset.DocumentStats | 否 | body | - | - |
| Apps[].Datasets[].DocumentStats.DocumentNum | integer | 否 | body | 文档数据集从AI搜导入部分的数据量 | - |
| Apps[].Datasets[].DocumentStats.DocumentPageNum | integer | 否 | body | 文档数据集从AI搜导入的文档页数 | - |
| Apps[].Datasets[].DocumentStats.DocumentFromHomepageNum | integer | 否 | body | 文档数据集从知识管理同步的文档数据量 | - |
| Apps[].Datasets[].ProcessConfig | dataset.ProcessConfig | 否 | body | 处理配置 | - |
| Apps[].Datasets[].ProcessConfig.AbnormalImageDataProcessPolicy | string | 否 | body | 异常图片数据处理策略，枚举值：skip, block | skip, block |
| Apps[].Datasets[].Language | string | 否 | body | 数据集语言配置 合法取值："Zh" \| "En" \| "Ja" 默认值："Zh" 兼容历史：当语言未配置（空字符串）或为未识别值时，按 "Zh" 视为默认 | Zh, En, Ja |
| Apps[].Datasets[].Theme | string | 否 | body | 题材 | - |
| Apps[].Datasets[].MultiModalStats | dataset.MultiModalStats | 否 | body | 多模态数据集多维度统计，仅 DatasetTypeMultiModal 时填充 | - |
| Apps[].Datasets[].MultiModalStats.ItemNumTotal | integer | 否 | body | 索引分母：成功数据项数（对齐 DataService SuccessDataNum） | - |
| Apps[].Datasets[].MultiModalStats.ValidItemNum | integer | 否 | body | 应用索引生效数据项数 | - |
| Apps[].Datasets[].MultiModalStats.ImageNumTotal | integer | 否 | body | 图片总数 | - |
| Apps[].Datasets[].MultiModalStats.ValidImageNum | integer | 否 | body | 应用索引生效图片数 | - |
| Apps[].Datasets[].MultiModalStats.DurationTotal | integer | 否 | body | 视频时长总和（单位秒） | - |
| Apps[].Datasets[].MultiModalStats.ValidDuration | integer | 否 | body | 应用索引生效视频时长（单位秒） | - |
| Apps[].Datasets[].ProjectName | string | 否 | body | 项目名称 | - |
| Apps[].Datasets[].Tags[] | array<volcengine_api.Tag> | 否 | body | 标签列表 | - |
| Apps[].Datasets[].Tags[].Key | string | 否 | body | 标签名 | - |
| Apps[].Datasets[].Tags[].Value | string | 否 | body | 标签值 | - |
| Apps[].Industry | common.IndustryType | 否 | body | 行业 | None=0, ECommerce=1, Material=2, Video=3, News=4, SocialPlatform=5, Other=20 |
| Apps[].EnableRiskCheck | boolean | 否 | body | 是否开启风控 | - |
| Apps[].ItemDatasetIDs[] | array<string> | 否 | body | 应用已经生效的物品数据集ID列表 | - |
| Apps[].DocumentDatasetIDs[] | array<string> | 否 | body | 应用已经生效的物品数据集ID列表 | - |
| Apps[].RecommendSceneIds[] | array<string> | 否 | body | 应用已经生效的推荐场景列表 | - |
| Apps[].Icon | application.Icon | 否 | body | 应用交互配置 | - |
| Apps[].Icon.ColorName | string | 否 | body | cyan, blue, purple, pink | - |
| Apps[].Tool | application.ApplicationTool | 否 | body | 应用数据源描述 | - |
| Apps[].Tool.Name | string | 否 | body | - | - |
| Apps[].Tool.Description | string | 否 | body | - | - |
| Apps[].GeneratedDescription | string | 否 | body | 应用生成描述 | - |
| Apps[].Language | string | 否 | body | 应用语言配置 合法取值："zh" \| "en" \| "ja" 默认值："zh" 兼容历史：当语言未配置（空字符串）或为未识别值时，按 "zh" 视为默认 | zh, en, ja |
| Apps[].Tags[] | array<volcengine_api.Tag> | 否 | body | 标签列表 | - |
| Apps[].Tags[].Key | string | 否 | body | 标签名 | - |
| Apps[].Tags[].Value | string | 否 | body | 标签值 | - |

## 响应示例

```json
{
  "Apps": [
    {
      "AppID": "example",
      "Name": "example",
      "Type": "AppTypeMultiModalSearch",
      "State": "AppReady",
      "Description": "example",
      "CreatedAt": 1,
      "UpdatedAt": 1,
      "UpdatedBy": "example",
      "Datasets": [
        {
          "DatasetID": "example",
          "Name": "example",
          "State": "DatasetInit",
          "Type": "DatasetTypeItem",
          "DataNum": 1,
          "Applications": [
            {}
          ],
          "Description": "example",
          "Schema": [
            {}
          ],
          "Version": 1,
          "UpdatedAt": 1,
          "CreatedAt": 1,
          "UpdatedBy": "example"
        }
      ],
      "Industry": "ECommerce",
      "EnableRiskCheck": true,
      "ItemDatasetIDs": [
        "example"
      ]
    }
  ]
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