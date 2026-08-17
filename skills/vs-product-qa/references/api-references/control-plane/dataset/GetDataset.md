# GetDataset

## Overview

- API name: `GetDataset`
- Category: Control Plane - Dataset
- Description: Gets Dataset.

## IDL Definition

```proto
message GetDatasetReq {
  string DatasetID = 1;
  string ProjectName = 20;
}

message Dataset {
  string DatasetID = 1;
  string Name = 2;
  DataSetState State = 3;
  DatasetType Type = 4;
  int64 DataNum = 6;
  repeated DatasetRefApp Applications = 7;
  string Description = 8;
  repeated DatasetSchemaField Schema = 9;
  int64 Version = 10;
  int64 UpdatedAt = 11;
  int64 CreatedAt = 12;
  string UpdatedBy = 13;
  DataFieldConfig DataFieldConfig = 14;
  int64 FieldsConfigVersion = 15;
  bool AutoDelete = 16;

  int64 PreProcessedDataNum = 17;
  common.IndustryType Industry = 18;
  DatasetTag tag = 19;
  DocumentStats DocumentStats = 20;

  ProcessConfig ProcessConfig = 21;

  string Language = 22;

  string Theme = 23;

  MultiModalStats MultiModalStats = 24;

  string PostPaidType = 25;

  string ProjectName = 100;
  repeated volcengine_api.Tag Tags = 101;
}

enum DataSetState {
  DatasetUnknown = 0;
  DatasetInit = 1;
  DatasetPending = 2;
  DatasetReady = 3;
  DatasetDeleting = 4;
  DatasetDeleted = 5;
  DatasetExpired = 6;
}

enum DatasetType {
  DatasetTypeUnknown = 0;
  DatasetTypeItem = 1;
  DatasetTypeVideo = 3;
  DatasetTypeUserEvent = 4;
  DatasetTypeDoc = 5;
  DatasetTypeDocument = 6;
  DatasetTypeMultiModal = 7;
  DatasetTypeUser = 8;
}

message DatasetRefApp {
  string AppID = 1;
  string Name = 2;
}

message DatasetSchemaField {
  string Name = 1 [(api.vd) = "regexp('^[a-zA-Z][a-zA-Z0-9_]{0,127}$'); msg:sprintf('berror(InvalidSchemaFieldName, \"%v\")', $)"];
  FieldType Type = 2;
  SourceType SourceType = 3;
  bool PK = 4;
  string Meaning = 5;
  FieldMetadata Metadata = 6;
  repeated DatasetSchemaField Fields = 7;
  BizAttr BizAttr = 8;
  string KeyError = 10;
  string TypeError = 11;
  bool Required = 12;
  repeated EnumerateValue EnumerateMeta = 13;
  string  Description = 14;
  optional AugmentedFieldMeta AugmentedMeta = 15;
}

message DataFieldConfig {
  repeated string IndexFields = 1;
  repeated string FilterFields = 2;
  repeated string SuggestFields = 3;
  repeated AugmentedField AugmentedFields = 4;

  map<string, string> FieldDescMap = 5;

  string DatasetDescription = 6;
  repeated string ImageIndexFields = 8;
  repeated string ChatFields = 10;
  map<string, FilterFieldsList> FilterFieldsMap = 11;
  repeated string VideoIndexFields = 12;
}

enum IndustryType {
  None = 0;
  ECommerce = 1;
  Material = 2;
  Video = 3;
  News = 4;
  SocialPlatform = 5 ;
  Other = 20 ;
}

enum DatasetTag {
  DatasetTagDefault = 0;
  DatasetTagKnowledge = 1;
}

message DocumentStats {
  int64 DocumentNum = 1;
  int64 DocumentPageNum = 2;
  int64 DocumentFromHomepageNum = 3;
}

message ProcessConfig {
  string AbnormalImageDataProcessPolicy = 1;
  string AbnormalVideoDataProcessPolicy = 2;
}

message MultiModalStats {
  int64 ItemNumTotal = 1;
  int64 ValidItemNum = 2;
  int64 ImageNumTotal = 3;
  int64 ValidImageNum = 4;
  int64 DurationTotal = 5;
  int64 ValidDuration = 6;
}

message Tag {
  string Key = 1;
  string Value = 2;
}

enum FieldType {
  FieldTypeUnknown = 0;
  FieldTypeString = 1;
  FieldTypeInt32 = 2;
  FieldTypeInt64 = 3;
  FieldTypeFloat = 4;
  FieldTypeBool = 5;

  FieldTypeArrayString = 6;
  FieldTypeArrayInt32 = 7;
  FieldTypeArrayInt64 = 8;
  FieldTypeArrayFloat = 9;
  FieldTypeObject = 10;
  FieldTypeArrayObject = 11;

  FieldTypeDatetimeISO = 12;
  FieldTypeDatetimeSQL = 13;
  FieldTypeTimestampMS = 14;
  FieldTypeTimestampS = 15;
}

enum SourceType {
  DatasetSourceTypeUnknown = 0;
  DatasetSourceTypeText = 1;
  DatasetSourceTypeImage = 2;
}

message FieldMetadata {
  bool IsPK = 1;
  bool IsReadOnly = 4;
}

enum BizAttr {
  Unspecified = 0;

  UserId = 1;

  QueryPK = 5;

  ImagePK = 11;
  ImageURL = 12;
  ImageBase64 = 13;
  ImageTitle = 14;
  ImagePublishTime = 15;
  ImagePublishTimestamp = 16;
  ImagePublishTimestampMs = 17;
  ImageCategory = 18;
  ImagePublishTimeSqlFmt = 19;

  VideoContentID = 21;
  VideoContentType = 22;
  VideoURL = 23;
  VideoParentContentID = 24;
  VideoSequenceIndex = 25;
  VideoContentTitle = 26;
  VideoMediaCoverURL = 27;
  VideoMediaLink = 28;
  VideoDuration = 29;
  VideoLanguage = 30;
  VideoPublishTime = 31;
  VideoPublishTimestamp = 32;
  VideoPublishTimestampMs = 33;
  VideoPublishTimeSqlFmt = 34;

  UserEventItemPK = 41;
  UserEventUserPK = 42;

  UserEventEventType = 51;
  UserEventTimestamp = 52;
  UserEventScene = 53;
  RecItemTitle = 54;
  RecItemCategory = 55;
  UserEventExperimentID = 56;

  DocID = 61;
  DocType = 62;
  DocURL = 63;
  DocPath = 64;
  DocName = 65;
  DocSize = 66;
  UploadSource = 67;
  DocSource = 68;
  CollectionId = 69;
  DocLarkExtra = 70;

  LocationLongitude = 71;
  LocationLatitude = 72;
  InternalGeo = 73;

  MultiModalId = 80;
  MultiModalTitle = 81;
  MultiModalContent = 82;
  MultiModalImageUrl = 83;
  MultiModalVideoUrl = 84;
  MultiModalCategory = 85;
  MultiModalTag = 86;
  MultiModalBrand = 87;
  MultiModalPrice = 88;
  MultiModalPublishTime = 89;
  MultiModalLink = 90;
  MultiModalLongitude = 91;
  MultiModalLatitude = 92;
  MultiModalContentType = 93;
  MultiModalParentId = 94;
  MultiModalSequenceIndex = 95;
  MultiModalDuration = 96;
  MultiModalLanguage = 97;
  MultiModalMediaLink = 98;
  MultiModalPurchaseCount = 99;
  MultiModalViewCount = 100;
  MultiModalLikeCount = 101;
  MultiModalCommentCount = 102;

  UserTablePK = 111;
  UserAge = 112;
  UserCountry = 113;
  UserCity = 114;
  UserDistrict = 115;
  UserGender = 116;
  UserLanguage = 117;
  UserRegisterTimestampMs = 118;
  UserRegisterTimestamp = 119;
  UserTags = 120;
  UserSubscribeType = 121;
  UserType = 122;

}

message EnumerateValue{
  string EnumerateValue = 1;
  string Name = 2;
  string Meaning = 3;
  EnumerateBizAttr EnumerateBizAttr = 4;
  bool Required = 5;
}

message AugmentedFieldMeta {
  AugmentedFieldType Type = 1;
  repeated string SourceFields = 2;
  int32 MaxGenerationNum = 3;
  string SystemPrompt = 4;
  string Prompt = 5;
}

message FilterFieldsList {
  repeated string Fields = 1;
}

message AugmentedField {
  string FieldName = 1;
  AugmentedFieldType FieldType = 2;
  repeated string SourceFields = 3;
  int32 MaxGenerationNum = 4;
  string SystemPrompt = 5;
  string Prompt = 6;
}

enum EnumerateBizAttr {

  UserEventBizCustom = 0;
  UserEventBizExposure = 1;
  UserEventBizClick = 2;
  UserEventBizCollect = 3;
  UserEventBizShare = 4;
  UserEventBizLike = 5;
  UserEventBizAddToCart = 6;
  UserEventBizOrder = 7;
  UserEventBizPurchase = 8;
  UserEventBizVisit = 9;
}

enum AugmentedFieldType {
  SearchQueries = 0;
  Keyword = 1;
  Description = 2;
  VideoSummary = 3;
  VideoTitle = 4;

  DocChunkID = 5;
  DocCaptionID = 6;
  DocSiblingNodes = 7;
  DocSummary = 8;
  DocSummaryEmbed = 9;
  DocTranscribeContent = 10;
  DocStartTime = 11;
  DocEndTime = 12;
  DocText = 13;
  DocBase64 = 14;
  DocDenseTextVector = 15;
  DocDenseImageVector = 16;

  ItemSummary = 17;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `DatasetID` | string | See service validation | Dataset ID. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `DatasetID` | string | See service validation | Dataset ID. |
| `Name` | string | See service validation | Name. |
| `State` | DataSetState | See service validation | State. |
| `Type` | DatasetType | See service validation | Type. |
| `DataNum` | int64 | See service validation | Data num. |
| `Applications[]` | array<DatasetRefApp> | No | Applications. |
| `Description` | string | See service validation | Description. |
| `Schema[]` | array<DatasetSchemaField> | No | Schema. |
| `Version` | int64 | See service validation | Version. |
| `UpdatedAt` | int64 | See service validation | Updated at. |
| `CreatedAt` | int64 | See service validation | Created at. |
| `UpdatedBy` | string | See service validation | Updated by. |
| `DataFieldConfig` | DataFieldConfig | See service validation | Data field config. |
| `FieldsConfigVersion` | int64 | See service validation | Fields config version. |
| `AutoDelete` | bool | See service validation | Auto delete. |
| `PreProcessedDataNum` | int64 | See service validation | Pre processed data num. |
| `Industry` | IndustryType | See service validation | Industry. |
| `tag` | DatasetTag | See service validation | Tag. |
| `DocumentStats` | DocumentStats | See service validation | Document stats. |
| `ProcessConfig` | ProcessConfig | See service validation | Process config. |
| `Language` | string | See service validation | Language. |
| `Theme` | string | See service validation | Theme. |
| `MultiModalStats` | MultiModalStats | See service validation | Multi modal stats. |
| `PostPaidType` | string | See service validation | Post paid type. |
| `ProjectName` | string | See service validation | Project name. |
| `Tags[]` | array<Tag> | No | Tags. |
| `Applications[].AppID` | string | See service validation | Application ID. |
| `Applications[].Name` | string | See service validation | Name. |
| `Schema[].Type` | FieldType | See service validation | Type. |
| `Schema[].SourceType` | SourceType | See service validation | Source type. |
| `Schema[].PK` | bool | See service validation | Pk. |
| `Schema[].Meaning` | string | See service validation | Meaning. |
| `Schema[].Metadata` | FieldMetadata | See service validation | Metadata. |
| `Schema[].Fields[]` | array<DatasetSchemaField> | No | Fields. |
| `Schema[].BizAttr` | BizAttr | See service validation | Biz attr. |
| `Schema[].KeyError` | string | See service validation | Key error. |
| `Schema[].TypeError` | string | See service validation | Type error. |
| `Schema[].Required` | bool | See service validation | Required. |
| `Schema[].EnumerateMeta[]` | array<EnumerateValue> | No | Enumerate meta. |
| `Schema[].Description` | string | See service validation | Description. |
| `Schema[].AugmentedMeta` | AugmentedFieldMeta | No | Augmented meta. |
| `DataFieldConfig.IndexFields[]` | array<string> | No | Index fields. |
| `DataFieldConfig.FilterFields[]` | array<string> | No | Filter fields. |
| `DataFieldConfig.SuggestFields[]` | array<string> | No | Suggest fields. |
| `DataFieldConfig.AugmentedFields[]` | array<AugmentedField> | No | Augmented fields. |
| `DataFieldConfig.FieldDescMap` | map<string, string> | See service validation | Field desc map. |
| `DataFieldConfig.DatasetDescription` | string | See service validation | Dataset description. |
| `DataFieldConfig.ImageIndexFields[]` | array<string> | No | Image index fields. |
| `DataFieldConfig.ChatFields[]` | array<string> | No | Chat fields. |
| `DataFieldConfig.FilterFieldsMap` | map<string, FilterFieldsList> | See service validation | Filter fields map. |
| `DataFieldConfig.VideoIndexFields[]` | array<string> | No | Video index fields. |
| `DocumentStats.DocumentNum` | int64 | See service validation | Document num. |
| `DocumentStats.DocumentPageNum` | int64 | See service validation | Document page num. |
| `DocumentStats.DocumentFromHomepageNum` | int64 | See service validation | Document from homepage num. |
| `ProcessConfig.AbnormalImageDataProcessPolicy` | string | See service validation | Abnormal image data process policy. |
| `ProcessConfig.AbnormalVideoDataProcessPolicy` | string | See service validation | Abnormal video data process policy. |
| `MultiModalStats.ItemNumTotal` | int64 | See service validation | Item num total. |
| `MultiModalStats.ValidItemNum` | int64 | See service validation | Valid item num. |
| `MultiModalStats.ImageNumTotal` | int64 | See service validation | Image num total. |
| `MultiModalStats.ValidImageNum` | int64 | See service validation | Valid image num. |
| `MultiModalStats.DurationTotal` | int64 | See service validation | Duration total. |
| `MultiModalStats.ValidDuration` | int64 | See service validation | Valid duration. |
| `Tags[].Key` | string | See service validation | Key. |
| `Tags[].Value` | string | See service validation | Value. |
| `Schema[].Metadata.IsPK` | bool | See service validation | Is pk. |
| `Schema[].Metadata.IsReadOnly` | bool | See service validation | Is read only. |
| `Schema[].Fields[].Type` | FieldType | See service validation | Type. |
| `Schema[].Fields[].SourceType` | SourceType | See service validation | Source type. |
| `Schema[].Fields[].PK` | bool | See service validation | Pk. |
| `Schema[].Fields[].Meaning` | string | See service validation | Meaning. |
| `Schema[].Fields[].Metadata` | FieldMetadata | See service validation | Metadata. |
| `Schema[].Fields[].Fields[]` | array<DatasetSchemaField> | No | Fields. |
| `Schema[].Fields[].BizAttr` | BizAttr | See service validation | Biz attr. |
| `Schema[].Fields[].KeyError` | string | See service validation | Key error. |
| `Schema[].Fields[].TypeError` | string | See service validation | Type error. |
| `Schema[].Fields[].Required` | bool | See service validation | Required. |
| `Schema[].Fields[].EnumerateMeta[]` | array<EnumerateValue> | No | Enumerate meta. |
| `Schema[].Fields[].Description` | string | See service validation | Description. |
| `Schema[].Fields[].AugmentedMeta` | AugmentedFieldMeta | No | Augmented meta. |
| `Schema[].EnumerateMeta[].EnumerateValue` | string | See service validation | Enumerate value. |
| `Schema[].EnumerateMeta[].Name` | string | See service validation | Name. |
| `Schema[].EnumerateMeta[].Meaning` | string | See service validation | Meaning. |
| `Schema[].EnumerateMeta[].EnumerateBizAttr` | EnumerateBizAttr | See service validation | Enumerate biz attr. |
| `Schema[].EnumerateMeta[].Required` | bool | See service validation | Required. |
| `Schema[].AugmentedMeta.Type` | AugmentedFieldType | See service validation | Type. |
| `Schema[].AugmentedMeta.SourceFields[]` | array<string> | No | Source fields. |
| `Schema[].AugmentedMeta.MaxGenerationNum` | int32 | See service validation | Max generation num. |
| `Schema[].AugmentedMeta.SystemPrompt` | string | See service validation | System prompt. |
| `Schema[].AugmentedMeta.Prompt` | string | See service validation | Prompt. |
| `DataFieldConfig.AugmentedFields[].FieldName` | string | See service validation | Field name. |
| `DataFieldConfig.AugmentedFields[].FieldType` | AugmentedFieldType | See service validation | Field type. |
| `DataFieldConfig.AugmentedFields[].SourceFields[]` | array<string> | No | Source fields. |
| `DataFieldConfig.AugmentedFields[].MaxGenerationNum` | int32 | See service validation | Max generation num. |
| `DataFieldConfig.AugmentedFields[].SystemPrompt` | string | See service validation | System prompt. |
| `DataFieldConfig.AugmentedFields[].Prompt` | string | See service validation | Prompt. |
| `DataFieldConfig.FilterFieldsMap.Fields[]` | array<string> | No | Fields. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
