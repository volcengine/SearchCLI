# ListRecommendRule

## Overview

- API name: `ListRecommendRule`
- Category: Control Plane - Scene
- Description: Lists Recommend Rule.

## IDL Definition

```proto
message ListRecommendRuleReq {

  string AppID = 1;

  repeated string Types = 2;

  string DatasetID = 3;

  string InvertItemDatasetID = 4;

  string ItemDatasetID = 5;
  string ProjectName = 20;
}

message ListRecommendRuleResp {

  int64 TotalCount = 1;

  repeated RecommendRule Items = 2;
}

message RecommendRule {

  string AppID = 1;

  string RuleID = 2;

  string Name = 3;

  string Type = 4;

  string Description = 5;

  string CreatedAt = 6;

  string UpdatedAt = 7;

  string UpdatedBy = 8;

  string DatasetID = 9;

  string ItemDatasetID = 11;

  bool Used = 10;

  google.protobuf.Struct Config = 20;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `Types[]` | array<string> | No | Types. |
| `DatasetID` | string | See service validation | Dataset ID. |
| `InvertItemDatasetID` | string | See service validation | Invert item dataset ID. |
| `ItemDatasetID` | string | See service validation | Item dataset ID. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `TotalCount` | int64 | See service validation | Total count. |
| `Items[]` | array<RecommendRule> | No | Items. |
| `Items[].AppID` | string | See service validation | Application ID. |
| `Items[].RuleID` | string | See service validation | Rule id. |
| `Items[].Name` | string | See service validation | Name. |
| `Items[].Type` | string | See service validation | Type. |
| `Items[].Description` | string | See service validation | Description. |
| `Items[].CreatedAt` | string | See service validation | Created at. |
| `Items[].UpdatedAt` | string | See service validation | Updated at. |
| `Items[].UpdatedBy` | string | See service validation | Updated by. |
| `Items[].DatasetID` | string | See service validation | Dataset ID. |
| `Items[].ItemDatasetID` | string | See service validation | Item dataset ID. |
| `Items[].Used` | bool | See service validation | Used. |
| `Items[].Config` | Struct | See service validation | Config. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
