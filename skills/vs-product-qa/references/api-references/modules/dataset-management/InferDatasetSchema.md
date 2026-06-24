# InferDatasetSchema

## 接口概览

- 模块分类：Dataset Management
- Service：DashboardService
- RPC：InferDatasetSchema
- HTTP Method：`POST`
- Request Path：`/api/v1/InferDatasetSchema`
- Request Type：`dataset.InferDatasetSchemaReq`
- Response Type：`dataset.InferDatasetSchemaResp`
- Top Action：InferDatasetSchema
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:280`

## 接口说明

数据集schema推断v0.1

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Type | dataset.DatasetType | 否 | body | 必填，数据集类型 | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| RawData | string | 否 | body | 必填，原始数据，json 字符串 | - |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "Type": "DatasetTypeItem",
  "RawData": "example",
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| Schema[] | array<dataset.DatasetSchemaField> | 否 | body | schema 定义 | - |
| Schema[].Name | string | 否 | body | - | regexp('^[a-zA-Z][a-zA-Z0-9_]{0,127}$'); msg:sprintf('berror(InvalidSchemaFieldName, \"%v\")', $) |
| Schema[].Type | dataset.FieldType | 否 | body | - | FieldTypeUnknown=0, FieldTypeString=1, FieldTypeInt32=2, FieldTypeInt64=3, FieldTypeFloat=4, FieldTypeBool=5, FieldTypeArrayString=6, FieldTypeArrayInt32=7, FieldTypeArrayInt64=8, FieldTypeArrayFloat=9, FieldTypeObject=10, FieldTypeArrayObject=11, FieldTypeDatetimeISO=12, FieldTypeDatetimeSQL=13, FieldTypeTimestampMS=14, FieldTypeTimestampS=15 |
| Schema[].SourceType | dataset.SourceType | 否 | body | 已废弃 | DatasetSourceTypeUnknown=0, DatasetSourceTypeText=1, DatasetSourceTypeImage=2 |
| Schema[].PK | boolean | 否 | body | - | - |
| Schema[].Meaning | string | 否 | body | 已废弃 | - |
| Schema[].Metadata | dataset.FieldMetadata | 否 | body | 字段功能属性，由后端根据业务属性推断而来，不要赋值 | - |
| Schema[].Metadata.IsPK | boolean | 否 | body | - | - |
| Schema[].Metadata.IsReadOnly | boolean | 否 | body | - | - |
| Schema[].Fields[] | array<dataset.DatasetSchemaField> | 否 | body | - | - |
| Schema[].BizAttr | dataset.BizAttr | 否 | body | - | Unspecified=0, UserId=1, QueryPK=5, ImagePK=11, ImageURL=12, ImageBase64=13, ImageTitle=14, ImagePublishTime=15, ImagePublishTimestamp=16, ImagePublishTimestampMs=17, ImageCategory=18, ImagePublishTimeSqlFmt=19, VideoContentID=21, VideoContentType=22, VideoURL=23, VideoParentContentID=24, VideoSequenceIndex=25, VideoContentTitle=26, VideoMediaCoverURL=27, VideoMediaLink=28, VideoDuration=29, VideoLanguage=30, VideoPublishTime=31, VideoPublishTimestamp=32, VideoPublishTimestampMs=33, VideoPublishTimeSqlFmt=34, UserEventItemPK=41, UserEventUserPK=42, UserEventEventType=51, UserEventTimestamp=52, UserEventScene=53, RecItemTitle=54, RecItemCategory=55, DocID=61, DocType=62, DocURL=63, DocPath=64, DocName=65, DocSize=66, UploadSource=67, DocSource=68, CollectionId=69, DocLarkExtra=70, LocationLongitude=71, LocationLatitude=72, InternalGeo=73, MultiModalId=80, MultiModalTitle=81, MultiModalContent=82, MultiModalImageUrl=83, MultiModalVideoUrl=84, MultiModalCategory=85, MultiModalTag=86, MultiModalBrand=87, MultiModalPrice=88, MultiModalPublishTime=89, MultiModalLink=90, MultiModalLongitude=91, MultiModalLatitude=92, MultiModalContentType=93, MultiModalParentId=94, MultiModalSequenceIndex=95, MultiModalDuration=96, MultiModalLanguage=97, MultiModalMediaLink=98, MultiModalPurchaseCount=99, MultiModalViewCount=100, MultiModalLikeCount=101, MultiModalCommentCount=102 |
| Schema[].KeyError | string | 否 | body | 推断时使用，用于返回key类型错误 | - |
| Schema[].TypeError | string | 否 | body | 推断时使用，用于返回type类型错误 | - |
| Schema[].Required | boolean | 否 | body | 是否必填 | - |
| Schema[].EnumerateMeta[] | array<dataset.EnumerateValue> | 否 | body | 枚举定义 | - |
| Schema[].EnumerateMeta[].EnumerateValue | string | 否 | body | 枚举值 | - |
| Schema[].EnumerateMeta[].Name | string | 否 | body | 枚举名称 | - |
| Schema[].EnumerateMeta[].Meaning | string | 否 | body | 枚举描述 | - |
| Schema[].EnumerateMeta[].EnumerateBizAttr | dataset.EnumerateBizAttr | 否 | body | 业务属性 | UserEventBizCustom=0, UserEventBizExposure=1, UserEventBizClick=2, UserEventBizCollect=3, UserEventBizShare=4, UserEventBizLike=5, UserEventBizAddToCart=6, UserEventBizOrder=7, UserEventBizPurchase=8, UserEventBizVisit=9 |
| Schema[].EnumerateMeta[].Required | boolean | 否 | body | 必须 | - |
| Schema[].Description | string | 否 | body | 字段描述 | - |
| Schema[].AugmentedMeta | dataset.AugmentedFieldMeta | 否 | body | 增强字段 | - |
| Schema[].AugmentedMeta.Type | dataset.AugmentedFieldType | 否 | body | 增强类型 (例如: 关键词, 摘要等) | SearchQueries=0, Keyword=1, Description=2, VideoSummary=3, VideoTitle=4, DocChunkID=5, DocCaptionID=6, DocSiblingNodes=7, DocSummary=8, DocSummaryEmbed=9, DocTranscribeContent=10, DocStartTime=11, DocEndTime=12, DocText=13, DocBase64=14, DocDenseTextVector=15, DocDenseImageVector=16, ItemSummary=17 |
| Schema[].AugmentedMeta.SourceFields[] | array<string> | 否 | body | 用于生成该增强字段的源字段 | - |
| Schema[].AugmentedMeta.MaxGenerationNum | integer | 否 | body | 最大关键词数量，应该只有是keyword类型才会生效 | - |
| Schema[].AugmentedMeta.SystemPrompt | string | 否 | body | 系统 Prompt | - |
| Schema[].AugmentedMeta.Prompt | string | 否 | body | 用户 Prompt | - |

## 响应示例

```json
{
  "Schema": [
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