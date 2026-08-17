# GetItem

## Overview

- API name: `GetItem`
- Category: Data Plane - DataAPI
- Description: Gets Item.

## IDL Definition

```proto
message GetItemRequest {
  string _id = 1;
  repeated string output_fields = 2;
}

message GetItemResponse {
  Item item = 1;
}

message Item {
  string _id = 1;
  string raw_data = 2;
  DataItemMeta meta = 3;
  string process_status = 4;
  string check_status = 5;
  repeated DataStatusDetail data_status_details = 6;
  optional string common_process_end_time = 7;
  string create_time = 8;
  string update_time = 9;
  repeated string check_error_codes = 10;
}

message DataItemMeta {
  VideoMeta video_meta = 1;
  DocMeta doc_meta = 2;
  DocumentMeta document_meta = 3;
  MultiModalMeta multi_modal_meta = 4;
}

message DataStatusDetail {
  string update_type = 1;
  string timestamp = 2;
  map<string, string> warning_info = 3;
  map<string, string> error_info = 4;
  google.protobuf.Struct check_details = 5;
}

message VideoMeta {
  string vid = 1;
  string content_type = 2;
  repeated string video_urls = 3;
  string parent_content_id = 4;
  int64 sequence_index = 5;
  VideoContent video_content = 6;
  CollectionContent collection_content = 7;
  int64 duration = 8;
}

message DocMeta {
  google.protobuf.Struct fields = 1;
}

message DocumentMeta {
  repeated google.protobuf.Struct document_chunk_infos = 1;
  string upload_source = 2;
  string collection_id = 3;
  string collection_name = 4;
  int64 page = 5;
}

message MultiModalMeta {
  optional int64 valid_image_count = 1;
  optional double video_duration = 2;
}

message VideoContent {
  string title = 1;
  string summary = 2;
  string insight = 3;
}

message CollectionContent {
  string summary = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `_id` | string | See service validation | Id. |
| `output_fields[]` | array<string> | No | Output fields. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `item` | Item | See service validation | Item. |
| `item._id` | string | See service validation | Id. |
| `item.raw_data` | string | See service validation | Raw data. |
| `item.meta` | DataItemMeta | See service validation | Meta. |
| `item.process_status` | string | See service validation | Process status. |
| `item.check_status` | string | See service validation | Check status. |
| `item.data_status_details[]` | array<DataStatusDetail> | No | Data status details. |
| `item.common_process_end_time` | string | No | Common process end time. |
| `item.create_time` | string | See service validation | Create time. |
| `item.update_time` | string | See service validation | Update time. |
| `item.check_error_codes[]` | array<string> | No | Check error codes. |
| `item.meta.video_meta` | VideoMeta | See service validation | Video meta. |
| `item.meta.doc_meta` | DocMeta | See service validation | Doc meta. |
| `item.meta.document_meta` | DocumentMeta | See service validation | Document meta. |
| `item.meta.multi_modal_meta` | MultiModalMeta | See service validation | Multi modal meta. |
| `item.data_status_details[].update_type` | string | See service validation | Update type. |
| `item.data_status_details[].timestamp` | string | See service validation | Timestamp. |
| `item.data_status_details[].warning_info` | map<string, string> | See service validation | Warning info. |
| `item.data_status_details[].error_info` | map<string, string> | See service validation | Error info. |
| `item.data_status_details[].check_details` | Struct | See service validation | Check details. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
