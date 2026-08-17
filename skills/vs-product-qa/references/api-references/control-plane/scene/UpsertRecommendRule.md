# UpsertRecommendRule

## Overview

- API name: `UpsertRecommendRule`
- Category: Control Plane - Scene
- Description: Creates or updates Recommend Rule.

## IDL Definition

```proto
message UpsertRecommendRuleReq {

  string AppID = 1;

  string RuleID = 2;

  string Name = 3;

  string Type = 4;

  string Description = 5;

  string DatasetID = 9;

  string ItemDatasetID = 10;

  google.protobuf.Struct Config = 20;
  string ProjectName = 21;
}

message UpsertRecommendRuleResp {

  string RuleID = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `RuleID` | string | See service validation | Rule id. |
| `Name` | string | See service validation | Name. |
| `Type` | string | See service validation | Type. |
| `Description` | string | See service validation | Description. |
| `DatasetID` | string | See service validation | Dataset ID. |
| `ItemDatasetID` | string | See service validation | Item dataset ID. |
| `Config` | Struct | See service validation | Config. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `RuleID` | string | See service validation | Rule id. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
