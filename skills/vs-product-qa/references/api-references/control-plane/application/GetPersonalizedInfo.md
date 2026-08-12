# GetPersonalizedInfo

## Overview

- API name: `GetPersonalizedInfo`
- Category: Control Plane - Application
- Description: Gets Personalized Info.

## IDL Definition

```proto
message GetPersonalizedInfoReq {
  string AppID = 1;
  string DatasetID = 2;
  string ProjectName = 20;
}

message GetPersonalizedInfoResp {

  DatasetPersonalizedInfo DatasetPersonalizedInfo = 1;

  repeated InterestFieldInfo InterestFieldInfo = 2;
}

message DatasetPersonalizedInfo {
  repeated InterestFieldInfo InterestFieldInfo = 1;
}

message InterestFieldInfo {

  string FieldName = 1;

  bool UseForPersonalized = 2;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `AppID` | string | See service validation | Application ID. |
| `DatasetID` | string | See service validation | Dataset ID. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `DatasetPersonalizedInfo` | DatasetPersonalizedInfo | See service validation | Dataset personalized info. |
| `InterestFieldInfo[]` | array<InterestFieldInfo> | No | Interest field info. |
| `DatasetPersonalizedInfo.InterestFieldInfo[]` | array<InterestFieldInfo> | No | Interest field info. |
| `InterestFieldInfo[].FieldName` | string | See service validation | Field name. |
| `InterestFieldInfo[].UseForPersonalized` | bool | See service validation | Use for personalized. |
| `DatasetPersonalizedInfo.InterestFieldInfo[].FieldName` | string | See service validation | Field name. |
| `DatasetPersonalizedInfo.InterestFieldInfo[].UseForPersonalized` | bool | See service validation | Use for personalized. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
