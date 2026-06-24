# GetAppOnlineExpConfig

## 接口概览

- 模块分类：App Online Config
- Service：DashboardService
- RPC：GetAppOnlineExpConfig
- HTTP Method：`POST`
- Request Path：`/api/v1/GetAppOnlineExpConfig`
- Request Type：`application.GetAppOnlineExpConfigReq`
- Response Type：`application.GetAppOnlineExpConfigResp`
- Top Action：GetAppOnlineExpConfig
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:692`

## 接口说明

获取在线体验配置 待迁移到bff，纯产品前端功能，用于体验配置过程中，配置临时生效

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| AppID | string | 是 | body | app id | len($)>0; msg:sprintf('berror(AppNotFound, \"%v\")', $) |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "AppID": "example",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| EnableSug | boolean | 否 | body | 开启搜索联想, 应该只用前端关注即可 | - |
| EnableImg | boolean | 否 | body | 是否支持上传图片 | - |
| DisplayFields[] | array<dataset.DatasetSchemaField> | 否 | body | 搜索结果展示字段配置，目前根据是否有images判断是否支持配置 | - |
| DisplayFields[].Name | string | 否 | body | - | regexp('^[a-zA-Z][a-zA-Z0-9_]{0,127}$'); msg:sprintf('berror(InvalidSchemaFieldName, \"%v\")', $) |
| DisplayFields[].Type | dataset.FieldType | 否 | body | - | FieldTypeUnknown=0, FieldTypeString=1, FieldTypeInt32=2, FieldTypeInt64=3, FieldTypeFloat=4, FieldTypeBool=5, FieldTypeArrayString=6, FieldTypeArrayInt32=7, FieldTypeArrayInt64=8, FieldTypeArrayFloat=9, FieldTypeObject=10, FieldTypeArrayObject=11, FieldTypeDatetimeISO=12, FieldTypeDatetimeSQL=13, FieldTypeTimestampMS=14, FieldTypeTimestampS=15 |
| DisplayFields[].SourceType | dataset.SourceType | 否 | body | 已废弃 | DatasetSourceTypeUnknown=0, DatasetSourceTypeText=1, DatasetSourceTypeImage=2 |
| DisplayFields[].PK | boolean | 否 | body | - | - |
| DisplayFields[].Meaning | string | 否 | body | 已废弃 | - |
| DisplayFields[].Metadata | dataset.FieldMetadata | 否 | body | 字段功能属性，由后端根据业务属性推断而来，不要赋值 | - |
| DisplayFields[].Metadata.IsPK | boolean | 否 | body | - | - |
| DisplayFields[].Metadata.IsReadOnly | boolean | 否 | body | - | - |
| DisplayFields[].Fields[] | array<dataset.DatasetSchemaField> | 否 | body | - | - |
| DisplayFields[].BizAttr | dataset.BizAttr | 否 | body | - | Unspecified=0, UserId=1, QueryPK=5, ImagePK=11, ImageURL=12, ImageBase64=13, ImageTitle=14, ImagePublishTime=15, ImagePublishTimestamp=16, ImagePublishTimestampMs=17, ImageCategory=18, ImagePublishTimeSqlFmt=19, VideoContentID=21, VideoContentType=22, VideoURL=23, VideoParentContentID=24, VideoSequenceIndex=25, VideoContentTitle=26, VideoMediaCoverURL=27, VideoMediaLink=28, VideoDuration=29, VideoLanguage=30, VideoPublishTime=31, VideoPublishTimestamp=32, VideoPublishTimestampMs=33, VideoPublishTimeSqlFmt=34, UserEventItemPK=41, UserEventUserPK=42, UserEventEventType=51, UserEventTimestamp=52, UserEventScene=53, RecItemTitle=54, RecItemCategory=55, DocID=61, DocType=62, DocURL=63, DocPath=64, DocName=65, DocSize=66, UploadSource=67, DocSource=68, CollectionId=69, DocLarkExtra=70, LocationLongitude=71, LocationLatitude=72, InternalGeo=73, MultiModalId=80, MultiModalTitle=81, MultiModalContent=82, MultiModalImageUrl=83, MultiModalVideoUrl=84, MultiModalCategory=85, MultiModalTag=86, MultiModalBrand=87, MultiModalPrice=88, MultiModalPublishTime=89, MultiModalLink=90, MultiModalLongitude=91, MultiModalLatitude=92, MultiModalContentType=93, MultiModalParentId=94, MultiModalSequenceIndex=95, MultiModalDuration=96, MultiModalLanguage=97, MultiModalMediaLink=98, MultiModalPurchaseCount=99, MultiModalViewCount=100, MultiModalLikeCount=101, MultiModalCommentCount=102 |
| DisplayFields[].KeyError | string | 否 | body | 推断时使用，用于返回key类型错误 | - |
| DisplayFields[].TypeError | string | 否 | body | 推断时使用，用于返回type类型错误 | - |
| DisplayFields[].Required | boolean | 否 | body | 是否必填 | - |
| DisplayFields[].EnumerateMeta[] | array<dataset.EnumerateValue> | 否 | body | 枚举定义 | - |
| DisplayFields[].EnumerateMeta[].EnumerateValue | string | 否 | body | 枚举值 | - |
| DisplayFields[].EnumerateMeta[].Name | string | 否 | body | 枚举名称 | - |
| DisplayFields[].EnumerateMeta[].Meaning | string | 否 | body | 枚举描述 | - |
| DisplayFields[].EnumerateMeta[].EnumerateBizAttr | dataset.EnumerateBizAttr | 否 | body | 业务属性 | UserEventBizCustom=0, UserEventBizExposure=1, UserEventBizClick=2, UserEventBizCollect=3, UserEventBizShare=4, UserEventBizLike=5, UserEventBizAddToCart=6, UserEventBizOrder=7, UserEventBizPurchase=8, UserEventBizVisit=9 |
| DisplayFields[].EnumerateMeta[].Required | boolean | 否 | body | 必须 | - |
| DisplayFields[].Description | string | 否 | body | 字段描述 | - |
| DisplayFields[].AugmentedMeta | dataset.AugmentedFieldMeta | 否 | body | 增强字段 | - |
| DisplayFields[].AugmentedMeta.Type | dataset.AugmentedFieldType | 否 | body | 增强类型 (例如: 关键词, 摘要等) | SearchQueries=0, Keyword=1, Description=2, VideoSummary=3, VideoTitle=4, DocChunkID=5, DocCaptionID=6, DocSiblingNodes=7, DocSummary=8, DocSummaryEmbed=9, DocTranscribeContent=10, DocStartTime=11, DocEndTime=12, DocText=13, DocBase64=14, DocDenseTextVector=15, DocDenseImageVector=16, ItemSummary=17 |
| DisplayFields[].AugmentedMeta.SourceFields[] | array<string> | 否 | body | 用于生成该增强字段的源字段 | - |
| DisplayFields[].AugmentedMeta.MaxGenerationNum | integer | 否 | body | 最大关键词数量，应该只有是keyword类型才会生效 | - |
| DisplayFields[].AugmentedMeta.SystemPrompt | string | 否 | body | 系统 Prompt | - |
| DisplayFields[].AugmentedMeta.Prompt | string | 否 | body | 用户 Prompt | - |
| DatasetDisplayConfigs[] | array<application.OnlineExpDatasetDisplayConfig> | 否 | body | 数据集展示字段配置，key为dataset_id | - |
| DatasetDisplayConfigs[].Name | string | 否 | body | 数据集名称 | - |
| DatasetDisplayConfigs[].DatasetID | string | 否 | body | 数据集id | - |
| DatasetDisplayConfigs[].DisplayFields[] | array<dataset.DatasetSchemaField> | 否 | body | - | - |
| DatasetDisplayConfigs[].DisplayFields[].Name | string | 否 | body | - | regexp('^[a-zA-Z][a-zA-Z0-9_]{0,127}$'); msg:sprintf('berror(InvalidSchemaFieldName, \"%v\")', $) |
| DatasetDisplayConfigs[].DisplayFields[].Type | dataset.FieldType | 否 | body | - | FieldTypeUnknown=0, FieldTypeString=1, FieldTypeInt32=2, FieldTypeInt64=3, FieldTypeFloat=4, FieldTypeBool=5, FieldTypeArrayString=6, FieldTypeArrayInt32=7, FieldTypeArrayInt64=8, FieldTypeArrayFloat=9, FieldTypeObject=10, FieldTypeArrayObject=11, FieldTypeDatetimeISO=12, FieldTypeDatetimeSQL=13, FieldTypeTimestampMS=14, FieldTypeTimestampS=15 |
| DatasetDisplayConfigs[].DisplayFields[].SourceType | dataset.SourceType | 否 | body | 已废弃 | DatasetSourceTypeUnknown=0, DatasetSourceTypeText=1, DatasetSourceTypeImage=2 |
| DatasetDisplayConfigs[].DisplayFields[].PK | boolean | 否 | body | - | - |
| DatasetDisplayConfigs[].DisplayFields[].Meaning | string | 否 | body | 已废弃 | - |
| DatasetDisplayConfigs[].DisplayFields[].Metadata | dataset.FieldMetadata | 否 | body | 字段功能属性，由后端根据业务属性推断而来，不要赋值 | - |
| DatasetDisplayConfigs[].DisplayFields[].Metadata.IsPK | boolean | 否 | body | - | - |
| DatasetDisplayConfigs[].DisplayFields[].Metadata.IsReadOnly | boolean | 否 | body | - | - |
| DatasetDisplayConfigs[].DisplayFields[].Fields[] | array<dataset.DatasetSchemaField> | 否 | body | - | - |
| DatasetDisplayConfigs[].DisplayFields[].BizAttr | dataset.BizAttr | 否 | body | - | Unspecified=0, UserId=1, QueryPK=5, ImagePK=11, ImageURL=12, ImageBase64=13, ImageTitle=14, ImagePublishTime=15, ImagePublishTimestamp=16, ImagePublishTimestampMs=17, ImageCategory=18, ImagePublishTimeSqlFmt=19, VideoContentID=21, VideoContentType=22, VideoURL=23, VideoParentContentID=24, VideoSequenceIndex=25, VideoContentTitle=26, VideoMediaCoverURL=27, VideoMediaLink=28, VideoDuration=29, VideoLanguage=30, VideoPublishTime=31, VideoPublishTimestamp=32, VideoPublishTimestampMs=33, VideoPublishTimeSqlFmt=34, UserEventItemPK=41, UserEventUserPK=42, UserEventEventType=51, UserEventTimestamp=52, UserEventScene=53, RecItemTitle=54, RecItemCategory=55, DocID=61, DocType=62, DocURL=63, DocPath=64, DocName=65, DocSize=66, UploadSource=67, DocSource=68, CollectionId=69, DocLarkExtra=70, LocationLongitude=71, LocationLatitude=72, InternalGeo=73, MultiModalId=80, MultiModalTitle=81, MultiModalContent=82, MultiModalImageUrl=83, MultiModalVideoUrl=84, MultiModalCategory=85, MultiModalTag=86, MultiModalBrand=87, MultiModalPrice=88, MultiModalPublishTime=89, MultiModalLink=90, MultiModalLongitude=91, MultiModalLatitude=92, MultiModalContentType=93, MultiModalParentId=94, MultiModalSequenceIndex=95, MultiModalDuration=96, MultiModalLanguage=97, MultiModalMediaLink=98, MultiModalPurchaseCount=99, MultiModalViewCount=100, MultiModalLikeCount=101, MultiModalCommentCount=102 |
| DatasetDisplayConfigs[].DisplayFields[].KeyError | string | 否 | body | 推断时使用，用于返回key类型错误 | - |
| DatasetDisplayConfigs[].DisplayFields[].TypeError | string | 否 | body | 推断时使用，用于返回type类型错误 | - |
| DatasetDisplayConfigs[].DisplayFields[].Required | boolean | 否 | body | 是否必填 | - |
| DatasetDisplayConfigs[].DisplayFields[].EnumerateMeta[] | array<dataset.EnumerateValue> | 否 | body | 枚举定义 | - |
| DatasetDisplayConfigs[].DisplayFields[].EnumerateMeta[].EnumerateValue | string | 否 | body | 枚举值 | - |
| DatasetDisplayConfigs[].DisplayFields[].EnumerateMeta[].Name | string | 否 | body | 枚举名称 | - |
| DatasetDisplayConfigs[].DisplayFields[].EnumerateMeta[].Meaning | string | 否 | body | 枚举描述 | - |
| DatasetDisplayConfigs[].DisplayFields[].EnumerateMeta[].EnumerateBizAttr | dataset.EnumerateBizAttr | 否 | body | 业务属性 | UserEventBizCustom=0, UserEventBizExposure=1, UserEventBizClick=2, UserEventBizCollect=3, UserEventBizShare=4, UserEventBizLike=5, UserEventBizAddToCart=6, UserEventBizOrder=7, UserEventBizPurchase=8, UserEventBizVisit=9 |
| DatasetDisplayConfigs[].DisplayFields[].EnumerateMeta[].Required | boolean | 否 | body | 必须 | - |
| DatasetDisplayConfigs[].DisplayFields[].Description | string | 否 | body | 字段描述 | - |
| DatasetDisplayConfigs[].DisplayFields[].AugmentedMeta | dataset.AugmentedFieldMeta | 否 | body | 增强字段 | - |
| DatasetDisplayConfigs[].DisplayFields[].AugmentedMeta.Type | dataset.AugmentedFieldType | 否 | body | 增强类型 (例如: 关键词, 摘要等) | SearchQueries=0, Keyword=1, Description=2, VideoSummary=3, VideoTitle=4, DocChunkID=5, DocCaptionID=6, DocSiblingNodes=7, DocSummary=8, DocSummaryEmbed=9, DocTranscribeContent=10, DocStartTime=11, DocEndTime=12, DocText=13, DocBase64=14, DocDenseTextVector=15, DocDenseImageVector=16, ItemSummary=17 |
| DatasetDisplayConfigs[].DisplayFields[].AugmentedMeta.SourceFields[] | array<string> | 否 | body | 用于生成该增强字段的源字段 | - |
| DatasetDisplayConfigs[].DisplayFields[].AugmentedMeta.MaxGenerationNum | integer | 否 | body | 最大关键词数量，应该只有是keyword类型才会生效 | - |
| DatasetDisplayConfigs[].DisplayFields[].AugmentedMeta.SystemPrompt | string | 否 | body | 系统 Prompt | - |
| DatasetDisplayConfigs[].DisplayFields[].AugmentedMeta.Prompt | string | 否 | body | 用户 Prompt | - |
| DatasetDisplayConfigs[].DatasetType | dataset.DatasetType | 否 | body | - | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| DatasetDisplayConfigs[].DisplayMapping | map<string, string> | 否 | body | 展示字段和 schema 映射关系 | - |

## 响应示例

```json
{
  "EnableSug": true,
  "EnableImg": true,
  "DisplayFields": [
    {
      "Name": "example",
      "Type": "FieldTypeString",
      "SourceType": "DatasetSourceTypeText",
      "PK": true,
      "Meaning": "example",
      "Metadata": {
        "IsPK": true,
        "IsReadOnly": true
      },
      "Fields": [
        {}
      ],
      "BizAttr": "UserId",
      "KeyError": "example",
      "TypeError": "example",
      "Required": true,
      "EnumerateMeta": [
        {
          "EnumerateValue": "example",
          "Name": "example",
          "Meaning": "example",
          "EnumerateBizAttr": "UserEventBizExposure",
          "Required": true
        }
      ]
    }
  ],
  "DatasetDisplayConfigs": [
    {
      "Name": "example",
      "DatasetID": "example",
      "DisplayFields": [
        {
          "Name": "example",
          "Type": "FieldTypeString",
          "SourceType": "DatasetSourceTypeText",
          "PK": true,
          "Meaning": "example",
          "Metadata": {},
          "Fields": [
            {}
          ],
          "BizAttr": "UserId",
          "KeyError": "example",
          "TypeError": "example",
          "Required": true,
          "EnumerateMeta": [
            {}
          ]
        }
      ],
      "DatasetType": "DatasetTypeItem",
      "DisplayMapping": {
        "key": "example"
      }
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