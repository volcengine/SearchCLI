# CreateApplicationV2

## Overview

- API name: `CreateApplicationV2`
- Category: Control Plane - Application
- Description: Creates Application V2.

## IDL Definition

```proto
message CreateApplicationReqV2 {
  string Name = 1;
  string Description = 2;
  string Industry = 3;
  IconV2 Icon = 4;
  string Language = 5;
  bool EnableRiskCheck = 6;
  bool DryRun = 7;
  string PostPaidType = 8;
  string ProjectName = 20;
  repeated volcengine_api.Tag Tags = 101;
}

message CreateApplicationRespV2 {
  ApplicationV2 Application = 1;
}

message IconV2 {
  string ColorName = 1;
}

message Tag {
  string Key = 1;
  string Value = 2;
}

message ApplicationV2 {
  string Id = 1;
  string Name = 2;
  string Status = 3;
  string Language = 4;
  string Description = 5;
  IconV2 Icon = 6;
  string Industry = 7;
  string CreateTime = 8;
  string UpdateTime = 9;
  string UpdatedBy = 10;
  string PostPaidType = 11;
  repeated volcengine_api.Tag Tags = 100;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Name` | string | See service validation | Name. |
| `Description` | string | See service validation | Description. |
| `Industry` | string | See service validation | Industry. |
| `Icon` | IconV2 | See service validation | Icon. |
| `Language` | string | See service validation | Language. |
| `EnableRiskCheck` | bool | See service validation | Enable risk check. |
| `DryRun` | bool | See service validation | Dry-run flag. |
| `PostPaidType` | string | See service validation | Post paid type. |
| `ProjectName` | string | See service validation | Project name. |
| `Tags[]` | array<Tag> | No | Tags. |
| `Icon.ColorName` | string | See service validation | Color name. |
| `Tags[].Key` | string | See service validation | Key. |
| `Tags[].Value` | string | See service validation | Value. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Application` | ApplicationV2 | See service validation | Application. |
| `Application.Id` | string | See service validation | Id. |
| `Application.Name` | string | See service validation | Name. |
| `Application.Status` | string | See service validation | Status. Enum: `init` / `not_ready` / `ready` / `deleting` / `deleted` (snake_case). |
| `Application.Language` | string | See service validation | Language. |
| `Application.Description` | string | See service validation | Description. |
| `Application.Icon` | IconV2 | See service validation | Icon. |
| `Application.Industry` | string | See service validation | Industry. |
| `Application.CreateTime` | string | See service validation | Created time. |
| `Application.UpdateTime` | string | See service validation | Updated time. |
| `Application.UpdatedBy` | string | See service validation | Updated by. |
| `Application.PostPaidType` | string | See service validation | Post paid type. |
| `Application.Tags[]` | array<Tag> | No | Tags. |
| `Application.Icon.ColorName` | string | See service validation | Color name. |
| `Application.Tags[].Key` | string | See service validation | Key. |
| `Application.Tags[].Value` | string | See service validation | Value. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
