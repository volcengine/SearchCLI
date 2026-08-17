# CheckDictInput

## Overview

- API name: `CheckDictInput`
- Category: Control Plane - Dictionary
- Description: Checks Dict Input.

## IDL Definition

```proto
message CheckDictInputReq {
  string ProjectName = 1;
  string DictId = 2;
  string Language = 3;
  string Type = 4;
  string TosBucket = 5;
  string TosKey = 6;
  repeated DictEntry Entries = 7;
}

message CheckDictInputResp {
  uint64 BatchEntryCount = 1;
  DictInputErrors Errors = 2;
}

message DictEntry {
  repeated string Fields = 1;
}

message DictInputErrors {
  DictInputErrEntryCount ErrEntryCount = 1;
  DictInputErrHeader ErrHeader = 2;
  repeated DictInputErrFieldCount ErrsFieldCount = 3;
  repeated DictInputErrFieldFormat ErrsFieldFormat = 4;
  repeated DictInputErrFieldTermCount ErrsFieldTermCount = 5;
}

message DictInputErrEntryCount {
  uint64 MaxEntriesPerBatch = 1;
  uint64 MaxEntriesPerDict = 2;
  uint64 DictExistingEntry = 3;
  uint64 ThisBatchEntry = 4;
}

message DictInputErrHeader {
  repeated string Expected = 1;
  repeated string Actual = 2;
}

message DictInputErrFieldCount {
  uint64 LineNumber = 1;
  uint64 Expected = 2;
  uint64 Actual = 3;
}

message DictInputErrFieldFormat {
  uint64 LineNumber = 1;
  string FieldName = 2;
  string ExpectedFormat = 3;
  string ActualContent = 4;
}

message DictInputErrFieldTermCount {
  uint64 LineNumber = 1;
  string FieldName = 2;
  uint64 ExpectedMin = 3;
  uint64 ExpectedMax = 4;
  uint64 Actual = 5;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |
| `DictId` | string | See service validation | Dictionary ID. |
| `Language` | string | See service validation | Language. |
| `Type` | string | See service validation | Type. |
| `TosBucket` | string | See service validation | Tos bucket. |
| `TosKey` | string | See service validation | Tos key. |
| `Entries[]` | array<DictEntry> | No | Entries. |
| `Entries[].Fields[]` | array<string> | No | Fields. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `BatchEntryCount` | uint64 | See service validation | Batch entry count. |
| `Errors` | DictInputErrors | See service validation | Errors. |
| `Errors.ErrEntryCount` | DictInputErrEntryCount | See service validation | Err entry count. |
| `Errors.ErrHeader` | DictInputErrHeader | See service validation | Err header. |
| `Errors.ErrsFieldCount[]` | array<DictInputErrFieldCount> | No | Errs field count. |
| `Errors.ErrsFieldFormat[]` | array<DictInputErrFieldFormat> | No | Errs field format. |
| `Errors.ErrsFieldTermCount[]` | array<DictInputErrFieldTermCount> | No | Errs field term count. |
| `Errors.ErrEntryCount.MaxEntriesPerBatch` | uint64 | See service validation | Max entries per batch. |
| `Errors.ErrEntryCount.MaxEntriesPerDict` | uint64 | See service validation | Max entries per dict. |
| `Errors.ErrEntryCount.DictExistingEntry` | uint64 | See service validation | Dict existing entry. |
| `Errors.ErrEntryCount.ThisBatchEntry` | uint64 | See service validation | This batch entry. |
| `Errors.ErrHeader.Expected[]` | array<string> | No | Expected. |
| `Errors.ErrHeader.Actual[]` | array<string> | No | Actual. |
| `Errors.ErrsFieldCount[].LineNumber` | uint64 | See service validation | Line number. |
| `Errors.ErrsFieldCount[].Expected` | uint64 | See service validation | Expected. |
| `Errors.ErrsFieldCount[].Actual` | uint64 | See service validation | Actual. |
| `Errors.ErrsFieldFormat[].LineNumber` | uint64 | See service validation | Line number. |
| `Errors.ErrsFieldFormat[].FieldName` | string | See service validation | Field name. |
| `Errors.ErrsFieldFormat[].ExpectedFormat` | string | See service validation | Expected format. |
| `Errors.ErrsFieldFormat[].ActualContent` | string | See service validation | Actual content. |
| `Errors.ErrsFieldTermCount[].LineNumber` | uint64 | See service validation | Line number. |
| `Errors.ErrsFieldTermCount[].FieldName` | string | See service validation | Field name. |
| `Errors.ErrsFieldTermCount[].ExpectedMin` | uint64 | See service validation | Expected min. |
| `Errors.ErrsFieldTermCount[].ExpectedMax` | uint64 | See service validation | Expected max. |
| `Errors.ErrsFieldTermCount[].Actual` | uint64 | See service validation | Actual. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
