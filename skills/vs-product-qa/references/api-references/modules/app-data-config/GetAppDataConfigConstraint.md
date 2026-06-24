# GetAppDataConfigConstraint

## 接口概览

- 模块分类：App Data Config
- Service：DashboardService
- RPC：GetAppDataConfigConstraint
- HTTP Method：`POST`
- Request Path：`/api/v1/GetAppDataConfigConstraint`
- Request Type：`application.GetAppDataConfigConstraintReq`
- Response Type：`application.GetAppDataConfigConstraintResp`
- Top Action：GetAppDataConfigConstraint
- Top Version：2025-03-01
- Service Path：dashboard_service
- 源定义：`console/idl/handler.proto:567`

## 接口说明

获取Schema校验项

## 请求参数

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| ProjectName | string | 否 | body | 项目名称 | - |

## 请求示例

```json
{
  "ProjectName": "example"
}
```

## 响应格式说明

| 字段路径 | 类型 | 必填 | 位置 | 描述 | 校验/枚举 |
| --- | --- | --- | --- | --- | --- |
| IndexFields[] | array<application.AppSchemaValidator> | 否 | body | - | - |
| IndexFields[].DatasetTypeIn[] | array<dataset.DatasetType> | 否 | body | - | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| IndexFields[].SourceTypeIn[] | array<dataset.SourceType> | 否 | body | - | DatasetSourceTypeUnknown=0, DatasetSourceTypeText=1, DatasetSourceTypeImage=2 |
| IndexFields[].NameIn[] | array<string> | 否 | body | - | - |
| IndexFields[].TypeIn[] | array<dataset.FieldType> | 否 | body | - | FieldTypeUnknown=0, FieldTypeString=1, FieldTypeInt32=2, FieldTypeInt64=3, FieldTypeFloat=4, FieldTypeBool=5, FieldTypeArrayString=6, FieldTypeArrayInt32=7, FieldTypeArrayInt64=8, FieldTypeArrayFloat=9, FieldTypeObject=10, FieldTypeArrayObject=11, FieldTypeDatetimeISO=12, FieldTypeDatetimeSQL=13, FieldTypeTimestampMS=14, FieldTypeTimestampS=15 |
| IndexFields[].MetadataIn[] | array<dataset.FieldMetadata> | 否 | body | - | - |
| IndexFields[].MetadataIn[].IsPK | boolean | 否 | body | - | - |
| IndexFields[].MetadataIn[].IsReadOnly | boolean | 否 | body | - | - |
| IndexFields[].BizAttrIn[] | array<dataset.BizAttr> | 否 | body | - | Unspecified=0, UserId=1, QueryPK=5, ImagePK=11, ImageURL=12, ImageBase64=13, ImageTitle=14, ImagePublishTime=15, ImagePublishTimestamp=16, ImagePublishTimestampMs=17, ImageCategory=18, ImagePublishTimeSqlFmt=19, VideoContentID=21, VideoContentType=22, VideoURL=23, VideoParentContentID=24, VideoSequenceIndex=25, VideoContentTitle=26, VideoMediaCoverURL=27, VideoMediaLink=28, VideoDuration=29, VideoLanguage=30, VideoPublishTime=31, VideoPublishTimestamp=32, VideoPublishTimestampMs=33, VideoPublishTimeSqlFmt=34, UserEventItemPK=41, UserEventUserPK=42, UserEventEventType=51, UserEventTimestamp=52, UserEventScene=53, RecItemTitle=54, RecItemCategory=55, DocID=61, DocType=62, DocURL=63, DocPath=64, DocName=65, DocSize=66, UploadSource=67, DocSource=68, CollectionId=69, DocLarkExtra=70, LocationLongitude=71, LocationLatitude=72, InternalGeo=73, MultiModalId=80, MultiModalTitle=81, MultiModalContent=82, MultiModalImageUrl=83, MultiModalVideoUrl=84, MultiModalCategory=85, MultiModalTag=86, MultiModalBrand=87, MultiModalPrice=88, MultiModalPublishTime=89, MultiModalLink=90, MultiModalLongitude=91, MultiModalLatitude=92, MultiModalContentType=93, MultiModalParentId=94, MultiModalSequenceIndex=95, MultiModalDuration=96, MultiModalLanguage=97, MultiModalMediaLink=98, MultiModalPurchaseCount=99, MultiModalViewCount=100, MultiModalLikeCount=101, MultiModalCommentCount=102 |
| FilterFields[] | array<application.AppSchemaValidator> | 否 | body | - | - |
| FilterFields[].DatasetTypeIn[] | array<dataset.DatasetType> | 否 | body | - | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| FilterFields[].SourceTypeIn[] | array<dataset.SourceType> | 否 | body | - | DatasetSourceTypeUnknown=0, DatasetSourceTypeText=1, DatasetSourceTypeImage=2 |
| FilterFields[].NameIn[] | array<string> | 否 | body | - | - |
| FilterFields[].TypeIn[] | array<dataset.FieldType> | 否 | body | - | FieldTypeUnknown=0, FieldTypeString=1, FieldTypeInt32=2, FieldTypeInt64=3, FieldTypeFloat=4, FieldTypeBool=5, FieldTypeArrayString=6, FieldTypeArrayInt32=7, FieldTypeArrayInt64=8, FieldTypeArrayFloat=9, FieldTypeObject=10, FieldTypeArrayObject=11, FieldTypeDatetimeISO=12, FieldTypeDatetimeSQL=13, FieldTypeTimestampMS=14, FieldTypeTimestampS=15 |
| FilterFields[].MetadataIn[] | array<dataset.FieldMetadata> | 否 | body | - | - |
| FilterFields[].MetadataIn[].IsPK | boolean | 否 | body | - | - |
| FilterFields[].MetadataIn[].IsReadOnly | boolean | 否 | body | - | - |
| FilterFields[].BizAttrIn[] | array<dataset.BizAttr> | 否 | body | - | Unspecified=0, UserId=1, QueryPK=5, ImagePK=11, ImageURL=12, ImageBase64=13, ImageTitle=14, ImagePublishTime=15, ImagePublishTimestamp=16, ImagePublishTimestampMs=17, ImageCategory=18, ImagePublishTimeSqlFmt=19, VideoContentID=21, VideoContentType=22, VideoURL=23, VideoParentContentID=24, VideoSequenceIndex=25, VideoContentTitle=26, VideoMediaCoverURL=27, VideoMediaLink=28, VideoDuration=29, VideoLanguage=30, VideoPublishTime=31, VideoPublishTimestamp=32, VideoPublishTimestampMs=33, VideoPublishTimeSqlFmt=34, UserEventItemPK=41, UserEventUserPK=42, UserEventEventType=51, UserEventTimestamp=52, UserEventScene=53, RecItemTitle=54, RecItemCategory=55, DocID=61, DocType=62, DocURL=63, DocPath=64, DocName=65, DocSize=66, UploadSource=67, DocSource=68, CollectionId=69, DocLarkExtra=70, LocationLongitude=71, LocationLatitude=72, InternalGeo=73, MultiModalId=80, MultiModalTitle=81, MultiModalContent=82, MultiModalImageUrl=83, MultiModalVideoUrl=84, MultiModalCategory=85, MultiModalTag=86, MultiModalBrand=87, MultiModalPrice=88, MultiModalPublishTime=89, MultiModalLink=90, MultiModalLongitude=91, MultiModalLatitude=92, MultiModalContentType=93, MultiModalParentId=94, MultiModalSequenceIndex=95, MultiModalDuration=96, MultiModalLanguage=97, MultiModalMediaLink=98, MultiModalPurchaseCount=99, MultiModalViewCount=100, MultiModalLikeCount=101, MultiModalCommentCount=102 |
| SuggestFields[] | array<application.AppSchemaValidator> | 否 | body | - | - |
| SuggestFields[].DatasetTypeIn[] | array<dataset.DatasetType> | 否 | body | - | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| SuggestFields[].SourceTypeIn[] | array<dataset.SourceType> | 否 | body | - | DatasetSourceTypeUnknown=0, DatasetSourceTypeText=1, DatasetSourceTypeImage=2 |
| SuggestFields[].NameIn[] | array<string> | 否 | body | - | - |
| SuggestFields[].TypeIn[] | array<dataset.FieldType> | 否 | body | - | FieldTypeUnknown=0, FieldTypeString=1, FieldTypeInt32=2, FieldTypeInt64=3, FieldTypeFloat=4, FieldTypeBool=5, FieldTypeArrayString=6, FieldTypeArrayInt32=7, FieldTypeArrayInt64=8, FieldTypeArrayFloat=9, FieldTypeObject=10, FieldTypeArrayObject=11, FieldTypeDatetimeISO=12, FieldTypeDatetimeSQL=13, FieldTypeTimestampMS=14, FieldTypeTimestampS=15 |
| SuggestFields[].MetadataIn[] | array<dataset.FieldMetadata> | 否 | body | - | - |
| SuggestFields[].MetadataIn[].IsPK | boolean | 否 | body | - | - |
| SuggestFields[].MetadataIn[].IsReadOnly | boolean | 否 | body | - | - |
| SuggestFields[].BizAttrIn[] | array<dataset.BizAttr> | 否 | body | - | Unspecified=0, UserId=1, QueryPK=5, ImagePK=11, ImageURL=12, ImageBase64=13, ImageTitle=14, ImagePublishTime=15, ImagePublishTimestamp=16, ImagePublishTimestampMs=17, ImageCategory=18, ImagePublishTimeSqlFmt=19, VideoContentID=21, VideoContentType=22, VideoURL=23, VideoParentContentID=24, VideoSequenceIndex=25, VideoContentTitle=26, VideoMediaCoverURL=27, VideoMediaLink=28, VideoDuration=29, VideoLanguage=30, VideoPublishTime=31, VideoPublishTimestamp=32, VideoPublishTimestampMs=33, VideoPublishTimeSqlFmt=34, UserEventItemPK=41, UserEventUserPK=42, UserEventEventType=51, UserEventTimestamp=52, UserEventScene=53, RecItemTitle=54, RecItemCategory=55, DocID=61, DocType=62, DocURL=63, DocPath=64, DocName=65, DocSize=66, UploadSource=67, DocSource=68, CollectionId=69, DocLarkExtra=70, LocationLongitude=71, LocationLatitude=72, InternalGeo=73, MultiModalId=80, MultiModalTitle=81, MultiModalContent=82, MultiModalImageUrl=83, MultiModalVideoUrl=84, MultiModalCategory=85, MultiModalTag=86, MultiModalBrand=87, MultiModalPrice=88, MultiModalPublishTime=89, MultiModalLink=90, MultiModalLongitude=91, MultiModalLatitude=92, MultiModalContentType=93, MultiModalParentId=94, MultiModalSequenceIndex=95, MultiModalDuration=96, MultiModalLanguage=97, MultiModalMediaLink=98, MultiModalPurchaseCount=99, MultiModalViewCount=100, MultiModalLikeCount=101, MultiModalCommentCount=102 |
| ImageIndexFields[] | array<application.AppSchemaValidator> | 否 | body | - | - |
| ImageIndexFields[].DatasetTypeIn[] | array<dataset.DatasetType> | 否 | body | - | DatasetTypeUnknown=0, DatasetTypeItem=1, DatasetTypeQuery=2, DatasetTypeVideo=3, DatasetTypeUserEvent=4, DatasetTypeDoc=5, DatasetTypeDocument=6, DatasetTypeMultiModal=7 |
| ImageIndexFields[].SourceTypeIn[] | array<dataset.SourceType> | 否 | body | - | DatasetSourceTypeUnknown=0, DatasetSourceTypeText=1, DatasetSourceTypeImage=2 |
| ImageIndexFields[].NameIn[] | array<string> | 否 | body | - | - |
| ImageIndexFields[].TypeIn[] | array<dataset.FieldType> | 否 | body | - | FieldTypeUnknown=0, FieldTypeString=1, FieldTypeInt32=2, FieldTypeInt64=3, FieldTypeFloat=4, FieldTypeBool=5, FieldTypeArrayString=6, FieldTypeArrayInt32=7, FieldTypeArrayInt64=8, FieldTypeArrayFloat=9, FieldTypeObject=10, FieldTypeArrayObject=11, FieldTypeDatetimeISO=12, FieldTypeDatetimeSQL=13, FieldTypeTimestampMS=14, FieldTypeTimestampS=15 |
| ImageIndexFields[].MetadataIn[] | array<dataset.FieldMetadata> | 否 | body | - | - |
| ImageIndexFields[].MetadataIn[].IsPK | boolean | 否 | body | - | - |
| ImageIndexFields[].MetadataIn[].IsReadOnly | boolean | 否 | body | - | - |
| ImageIndexFields[].BizAttrIn[] | array<dataset.BizAttr> | 否 | body | - | Unspecified=0, UserId=1, QueryPK=5, ImagePK=11, ImageURL=12, ImageBase64=13, ImageTitle=14, ImagePublishTime=15, ImagePublishTimestamp=16, ImagePublishTimestampMs=17, ImageCategory=18, ImagePublishTimeSqlFmt=19, VideoContentID=21, VideoContentType=22, VideoURL=23, VideoParentContentID=24, VideoSequenceIndex=25, VideoContentTitle=26, VideoMediaCoverURL=27, VideoMediaLink=28, VideoDuration=29, VideoLanguage=30, VideoPublishTime=31, VideoPublishTimestamp=32, VideoPublishTimestampMs=33, VideoPublishTimeSqlFmt=34, UserEventItemPK=41, UserEventUserPK=42, UserEventEventType=51, UserEventTimestamp=52, UserEventScene=53, RecItemTitle=54, RecItemCategory=55, DocID=61, DocType=62, DocURL=63, DocPath=64, DocName=65, DocSize=66, UploadSource=67, DocSource=68, CollectionId=69, DocLarkExtra=70, LocationLongitude=71, LocationLatitude=72, InternalGeo=73, MultiModalId=80, MultiModalTitle=81, MultiModalContent=82, MultiModalImageUrl=83, MultiModalVideoUrl=84, MultiModalCategory=85, MultiModalTag=86, MultiModalBrand=87, MultiModalPrice=88, MultiModalPublishTime=89, MultiModalLink=90, MultiModalLongitude=91, MultiModalLatitude=92, MultiModalContentType=93, MultiModalParentId=94, MultiModalSequenceIndex=95, MultiModalDuration=96, MultiModalLanguage=97, MultiModalMediaLink=98, MultiModalPurchaseCount=99, MultiModalViewCount=100, MultiModalLikeCount=101, MultiModalCommentCount=102 |

## 响应示例

```json
{
  "IndexFields": [
    {
      "DatasetTypeIn": [
        "DatasetTypeItem"
      ],
      "SourceTypeIn": [
        "DatasetSourceTypeText"
      ],
      "NameIn": [
        "example"
      ],
      "TypeIn": [
        "FieldTypeString"
      ],
      "MetadataIn": [
        {
          "IsPK": true,
          "IsReadOnly": true
        }
      ],
      "BizAttrIn": [
        "UserId"
      ]
    }
  ],
  "FilterFields": [
    {
      "DatasetTypeIn": [
        "DatasetTypeItem"
      ],
      "SourceTypeIn": [
        "DatasetSourceTypeText"
      ],
      "NameIn": [
        "example"
      ],
      "TypeIn": [
        "FieldTypeString"
      ],
      "MetadataIn": [
        {
          "IsPK": true,
          "IsReadOnly": true
        }
      ],
      "BizAttrIn": [
        "UserId"
      ]
    }
  ],
  "SuggestFields": [
    {
      "DatasetTypeIn": [
        "DatasetTypeItem"
      ],
      "SourceTypeIn": [
        "DatasetSourceTypeText"
      ],
      "NameIn": [
        "example"
      ],
      "TypeIn": [
        "FieldTypeString"
      ],
      "MetadataIn": [
        {
          "IsPK": true,
          "IsReadOnly": true
        }
      ],
      "BizAttrIn": [
        "UserId"
      ]
    }
  ],
  "ImageIndexFields": [
    {
      "DatasetTypeIn": [
        "DatasetTypeItem"
      ],
      "SourceTypeIn": [
        "DatasetSourceTypeText"
      ],
      "NameIn": [
        "example"
      ],
      "TypeIn": [
        "FieldTypeString"
      ],
      "MetadataIn": [
        {
          "IsPK": true,
          "IsReadOnly": true
        }
      ],
      "BizAttrIn": [
        "UserId"
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