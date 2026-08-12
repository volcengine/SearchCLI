# ListBillingUsageData

## Overview

- API name: `ListBillingUsageData`
- Category: Control Plane - Usage
- Description: Lists Billing Usage Data.

## IDL Definition

```proto
message ListBillingUsageDataReq {

    repeated string ChargeTypes = 1;
    int64 StartTime = 2;
    int64 EndTime = 3;
    string ProjectName = 20;
}

message ListBillingUsageDataResp {
    repeated BillingUsageData Data = 2;
}

message BillingUsageData {
    string ChargeType = 1;
    string TotalCount = 2;
    string TotalUsageCount = 4;
    repeated BillingUsageMetrics MetricsData = 3;
}

message BillingUsageMetrics {
    string Date = 1;
    string Hour = 2;
    string Value = 3;
    string UsageValue = 4;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ChargeTypes[]` | array<string> | No | Charge types. |
| `StartTime` | int64 | See service validation | Start time. |
| `EndTime` | int64 | See service validation | End time. |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Data[]` | array<BillingUsageData> | No | Data. |
| `Data[].ChargeType` | string | See service validation | Charge type. |
| `Data[].TotalCount` | string | See service validation | Total count. |
| `Data[].TotalUsageCount` | string | See service validation | Total usage count. |
| `Data[].MetricsData[]` | array<BillingUsageMetrics> | No | Metrics data. |
| `Data[].MetricsData[].Date` | string | See service validation | Date. |
| `Data[].MetricsData[].Hour` | string | See service validation | Hour. |
| `Data[].MetricsData[].Value` | string | See service validation | Value. |
| `Data[].MetricsData[].UsageValue` | string | See service validation | Usage value. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
