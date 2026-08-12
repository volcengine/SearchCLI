# ListItems

## Overview

- API name: `ListItems`
- Category: Data Plane - DataAPI
- Description: Lists Items.

## IDL Definition

```proto
message ListItemsRequest {
  optional int32 max_results = 1;
  string next_token = 2;
  ListItemsRequestFilter filter = 3;
  string sort_by = 4;
  optional int32 sort_order = 5;
  optional int32 _inner_need_count_processed_nums = 6;
  repeated string output_fields = 7;
}

message ListItemsResponse {
  string next_token = 1;
  repeated Item items = 2;
  optional int64 total_document_size = 3;
  optional int64 total_processed_number_of_items = 4;
}

message ListItemsRequestFilter {
  string _id = 1;
  repeated string process_status = 2;
  string doc_name = 3;
  repeated string upload_source = 4;

  repeated string check_error_codes = 5;
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
| `max_results` | int32 | No | Max results. |
| `next_token` | string | See service validation | Pagination token. |
| `filter` | ListItemsRequestFilter | See service validation | Filter. |
| `sort_by` | string | See service validation | Sort by. |
| `sort_order` | int32 | No | Sort order. |
| `_inner_need_count_processed_nums` | int32 | No | Inner need count processed nums. |
| `output_fields[]` | array<string> | No | Output fields. |
| `filter._id` | string | See service validation | Id. |
| `filter.process_status[]` | array<string> | No | Process status. |
| `filter.doc_name` | string | See service validation | Doc name. |
| `filter.upload_source[]` | array<string> | No | Upload source. |
| `filter.check_error_codes[]` | array<string> | No | Check error codes. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `next_token` | string | See service validation | Pagination token. |
| `items[]` | array<Item> | No | Items. |
| `total_document_size` | int64 | No | Total document size. |
| `total_processed_number_of_items` | int64 | No | Total processed number of items. |
| `items[]._id` | string | See service validation | Id. |
| `items[].raw_data` | string | See service validation | Raw data. |
| `items[].meta` | DataItemMeta | See service validation | Meta. |
| `items[].process_status` | string | See service validation | Process status. |
| `items[].check_status` | string | See service validation | Check status. |
| `items[].data_status_details[]` | array<DataStatusDetail> | No | Data status details. |
| `items[].common_process_end_time` | string | No | Common process end time. |
| `items[].create_time` | string | See service validation | Create time. |
| `items[].update_time` | string | See service validation | Update time. |
| `items[].check_error_codes[]` | array<string> | No | Check error codes. |
| `items[].meta.video_meta` | VideoMeta | See service validation | Video meta. |
| `items[].meta.doc_meta` | DocMeta | See service validation | Doc meta. |
| `items[].meta.document_meta` | DocumentMeta | See service validation | Document meta. |
| `items[].meta.multi_modal_meta` | MultiModalMeta | See service validation | Multi modal meta. |
| `items[].data_status_details[].update_type` | string | See service validation | Update type. |
| `items[].data_status_details[].timestamp` | string | See service validation | Timestamp. |
| `items[].data_status_details[].warning_info` | map<string, string> | See service validation | Warning info. |
| `items[].data_status_details[].error_info` | map<string, string> | See service validation | Error info. |
| `items[].data_status_details[].check_details` | Struct | See service validation | Check details. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
