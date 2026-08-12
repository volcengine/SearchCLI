# BrowseIndex

## Overview

- API name: `BrowseIndex`
- Category: Data Plane - OnlineAPI
- Description: Browse Index API.

## IDL Definition

```proto
message BrowseIndexRequest {
  string dataset_id = 1;
  int32 page_size = 2;
  int32 page_number = 3;
  google.protobuf.Struct filter = 4;
  string sort_by = 5;
  string sort_order = 6;
  repeated string output_fields = 7 [(google.api.field_behavior) = OPTIONAL, (api.example) = "[\"title\", \"price\", \"category\"]"];
  optional ai_search_rec.online.common.Context context = 8;

  common.Facet facet = 9;

  search.SortRules sort_rules = 10;

  string application = 1002;
  string authorization = 2001;
}

message BrowseIndexResponse {
  optional BrowseIndexResult result = 1;
}

message Context {
  Location location = 1;
  google.protobuf.Struct extra = 2;
}

message Facet {
  optional bool enable = 1;
  repeated FacetConfig facets = 2;
  optional google.protobuf.Struct facet_filter = 3;
}

message SortRules {

  string mode = 1;
  repeated SortRule rules = 2;
}

message BrowseIndexResult {
  repeated BrowseIndexItem items = 1;
  optional int32 total_items = 2;

  repeated common.FacetResult facet_results = 3;
}

message Location {
  string longitude = 1;
  string latitude = 2;
}

message FacetConfig {

  string field = 1;

  optional int64 max_facet_buckets = 2;

  repeated NumberRange number_ranges = 3;
}

message SortRule {
  string field = 1;
  string order = 2;
  optional bool enable = 3;
}

message BrowseIndexItem {
  string _id = 1;
  google.protobuf.Struct display_fields = 2;
}

message FacetResult {
  string field = 1;
  repeated FacetBucket buckets = 2;
}

message NumberRange {
  optional float lt = 1;
  optional float lte = 2;
  optional float gt = 3;
  optional float gte = 4;
}

message FacetBucket {
  optional string value = 1;
  optional NumberRange number_range = 2;
  int64 count = 3;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `dataset_id` | string | See service validation | Dataset ID. |
| `page_size` | int32 | See service validation | Page size. |
| `page_number` | int32 | See service validation | Page number. |
| `filter` | Struct | See service validation | Filter. |
| `sort_by` | string | See service validation | Sort by. |
| `sort_order` | string | See service validation | Sort order. |
| `context` | Context | No | Context. |
| `facet` | Facet | See service validation | Facet. |
| `sort_rules` | SortRules | See service validation | Sort rules. |
| `application` | string | See service validation | Application. |
| `authorization` | string | See service validation | Authorization. |
| `context.location` | Location | See service validation | Location. |
| `context.extra` | Struct | See service validation | Extra. |
| `facet.enable` | bool | No | Enable. |
| `facet.facets[]` | array<FacetConfig> | No | Facets. |
| `facet.facet_filter` | Struct | No | Facet filter. |
| `sort_rules.mode` | string | See service validation | Mode. |
| `sort_rules.rules[]` | array<SortRule> | No | Rules. |
| `context.location.longitude` | string | See service validation | Longitude. |
| `context.location.latitude` | string | See service validation | Latitude. |
| `facet.facets[].field` | string | See service validation | Field. |
| `facet.facets[].max_facet_buckets` | int64 | No | Max facet buckets. |
| `facet.facets[].number_ranges[]` | array<NumberRange> | No | Number ranges. |
| `sort_rules.rules[].field` | string | See service validation | Field. |
| `sort_rules.rules[].order` | string | See service validation | Order. |
| `sort_rules.rules[].enable` | bool | No | Enable. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `result` | BrowseIndexResult | No | Result. |
| `result.items[]` | array<BrowseIndexItem> | No | Items. |
| `result.total_items` | int32 | No | Total items. |
| `result.facet_results[]` | array<FacetResult> | No | Facet results. |
| `result.items[]._id` | string | See service validation | Id. |
| `result.items[].display_fields` | Struct | See service validation | Display fields. |
| `result.facet_results[].field` | string | See service validation | Field. |
| `result.facet_results[].buckets[]` | array<FacetBucket> | No | Buckets. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
