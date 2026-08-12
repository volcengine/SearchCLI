# ListDatasets

## Overview

- API name: `ListDatasets`
- Category: Control Plane - Dataset
- Description: Lists Datasets.

## IDL Definition

```proto
message ListDatasetsReq {
  repeated string DatasetID = 1;
  int32 Page = 2;
  int32 PageSize = 3;
  repeated string DatasetTags = 4;
  string ProjectName = 20;
}

message ListDatasetsResp {
  repeated Dataset Dataset = 1;
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
| `DatasetID[]` | array<string> | No | Dataset ID. |
| `Page` | int32 | See service validation | Page. |
| `PageSize` | int32 | See service validation | Page size. |
| `DatasetTags[]` | array<string> | No | Dataset tags. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Dataset[]` | array<Dataset> | No | Dataset. |
| `Dataset[].DatasetID` | string | See service validation | Dataset ID. |
| `Dataset[].Name` | string | See service validation | Name. |
| `Dataset[].State` | DataSetState | See service validation | State. |
| `Dataset[].Type` | DatasetType | See service validation | Type. |
| `Dataset[].DataNum` | int64 | See service validation | Data num. |
| `Dataset[].Applications[]` | array<DatasetRefApp> | No | Applications. |
| `Dataset[].Description` | string | See service validation | Description. |
| `Dataset[].Schema[]` | array<DatasetSchemaField> | No | Schema. |
| `Dataset[].Version` | int64 | See service validation | Version. |
| `Dataset[].UpdatedAt` | int64 | See service validation | Updated at. |
| `Dataset[].CreatedAt` | int64 | See service validation | Created at. |
| `Dataset[].UpdatedBy` | string | See service validation | Updated by. |
| `Dataset[].DataFieldConfig` | DataFieldConfig | See service validation | Data field config. |
| `Dataset[].FieldsConfigVersion` | int64 | See service validation | Fields config version. |
| `Dataset[].AutoDelete` | bool | See service validation | Auto delete. |
| `Dataset[].PreProcessedDataNum` | int64 | See service validation | Pre processed data num. |
| `Dataset[].Industry` | IndustryType | See service validation | Industry. |
| `Dataset[].tag` | DatasetTag | See service validation | Tag. |
| `Dataset[].DocumentStats` | DocumentStats | See service validation | Document stats. |
| `Dataset[].ProcessConfig` | ProcessConfig | See service validation | Process config. |
| `Dataset[].Language` | string | See service validation | Language. |
| `Dataset[].Theme` | string | See service validation | Theme. |
| `Dataset[].MultiModalStats` | MultiModalStats | See service validation | Multi modal stats. |
| `Dataset[].PostPaidType` | string | See service validation | Post paid type. |
| `Dataset[].ProjectName` | string | See service validation | Project name. |
| `Dataset[].Tags[]` | array<Tag> | No | Tags. |
| `Dataset[].Applications[].AppID` | string | See service validation | Application ID. |
| `Dataset[].Applications[].Name` | string | See service validation | Name. |
| `Dataset[].Schema[].Type` | FieldType | See service validation | Type. |
| `Dataset[].Schema[].SourceType` | SourceType | See service validation | Source type. |
| `Dataset[].Schema[].PK` | bool | See service validation | Pk. |
| `Dataset[].Schema[].Meaning` | string | See service validation | Meaning. |
| `Dataset[].Schema[].Metadata` | FieldMetadata | See service validation | Metadata. |
| `Dataset[].Schema[].Fields[]` | array<DatasetSchemaField> | No | Fields. |
| `Dataset[].Schema[].BizAttr` | BizAttr | See service validation | Biz attr. |
| `Dataset[].Schema[].KeyError` | string | See service validation | Key error. |
| `Dataset[].Schema[].TypeError` | string | See service validation | Type error. |
| `Dataset[].Schema[].Required` | bool | See service validation | Required. |
| `Dataset[].Schema[].EnumerateMeta[]` | array<EnumerateValue> | No | Enumerate meta. |
| `Dataset[].Schema[].Description` | string | See service validation | Description. |
| `Dataset[].Schema[].AugmentedMeta` | AugmentedFieldMeta | No | Augmented meta. |
| `Dataset[].DataFieldConfig.IndexFields[]` | array<string> | No | Index fields. |
| `Dataset[].DataFieldConfig.FilterFields[]` | array<string> | No | Filter fields. |
| `Dataset[].DataFieldConfig.SuggestFields[]` | array<string> | No | Suggest fields. |
| `Dataset[].DataFieldConfig.AugmentedFields[]` | array<AugmentedField> | No | Augmented fields. |
| `Dataset[].DataFieldConfig.FieldDescMap` | map<string, string> | See service validation | Field desc map. |
| `Dataset[].DataFieldConfig.DatasetDescription` | string | See service validation | Dataset description. |
| `Dataset[].DataFieldConfig.ImageIndexFields[]` | array<string> | No | Image index fields. |
| `Dataset[].DataFieldConfig.ChatFields[]` | array<string> | No | Chat fields. |
| `Dataset[].DataFieldConfig.FilterFieldsMap` | map<string, FilterFieldsList> | See service validation | Filter fields map. |
| `Dataset[].DataFieldConfig.VideoIndexFields[]` | array<string> | No | Video index fields. |
| `Dataset[].DocumentStats.DocumentNum` | int64 | See service validation | Document num. |
| `Dataset[].DocumentStats.DocumentPageNum` | int64 | See service validation | Document page num. |
| `Dataset[].DocumentStats.DocumentFromHomepageNum` | int64 | See service validation | Document from homepage num. |
| `Dataset[].ProcessConfig.AbnormalImageDataProcessPolicy` | string | See service validation | Abnormal image data process policy. |
| `Dataset[].ProcessConfig.AbnormalVideoDataProcessPolicy` | string | See service validation | Abnormal video data process policy. |
| `Dataset[].MultiModalStats.ItemNumTotal` | int64 | See service validation | Item num total. |
| `Dataset[].MultiModalStats.ValidItemNum` | int64 | See service validation | Valid item num. |
| `Dataset[].MultiModalStats.ImageNumTotal` | int64 | See service validation | Image num total. |
| `Dataset[].MultiModalStats.ValidImageNum` | int64 | See service validation | Valid image num. |
| `Dataset[].MultiModalStats.DurationTotal` | int64 | See service validation | Duration total. |
| `Dataset[].MultiModalStats.ValidDuration` | int64 | See service validation | Valid duration. |
| `Dataset[].Tags[].Key` | string | See service validation | Key. |
| `Dataset[].Tags[].Value` | string | See service validation | Value. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
