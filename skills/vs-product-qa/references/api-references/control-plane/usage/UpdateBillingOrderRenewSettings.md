# UpdateBillingOrderRenewSettings

## Overview

- API name: `UpdateBillingOrderRenewSettings`
- Category: Control Plane - Usage (Billing)
- Endpoint: `POST /open/UpdateBillingOrderRenewSettings`
- Version: `2025-03-01`
- Description: Updates the auto-renewal settings of an existing instance independently. Does not create any order.

## IDL Definition

```proto
message UpdateBillingOrderRenewSettingsReq {
    // Product code, required.
    string ProductCode = 1;
    // Instance number, required; must belong to the current account, project, and product.
    string InstanceNO = 2;
    // Whether auto-renewal is enabled, required. true maps to auto-renewal, false to manual renewal.
    optional bool AutoRenew = 3;
    // Number of periods per auto-renewal. Defaults to 1 when enabling auto-renewal; must be greater than 0.
    // Ignored when auto-renewal is disabled.
    optional int64 RenewPeriodTimes = 4;
    // Remaining auto-renewal times. Defaults to -1 (unlimited) when enabling auto-renewal;
    // must be -1 or a positive integer. Ignored when auto-renewal is disabled.
    optional int64 RemainRenewTimes = 5;
    // Project name; empty or blank falls back to default.
    string ProjectName = 20;
}

message UpdateBillingOrderRenewSettingsResp {
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProductCode` | string | Yes | Product code. SearchCLI-managed billing requests use non-empty `VIKING_AISEARCH_PRODUCT_CODE` when set, otherwise `REC-SaaS-LLM-SEARCH`. |
| `InstanceNO` | string | Yes | Target instance number. Must belong to the current account, project, and product. |
| `AutoRenew` | bool | Yes | `true` enables auto-renewal; `false` switches to manual renewal. |
| `RenewPeriodTimes` | int64 | No | Periods per auto-renewal. Defaults to `1` when auto-renewal is enabled; must be greater than `0`. Ignored when disabling auto-renewal. |
| `RemainRenewTimes` | int64 | No | Remaining auto-renewal times. Defaults to `-1` (unlimited) when auto-renewal is enabled; must be `-1` or a positive integer. Ignored when disabling auto-renewal. |
| `ProjectName` | string | No | Project name. Empty or blank falls back to the default project. |

## Response Parameters

Empty response body. A response without an error code indicates the renewal settings were updated successfully.

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | Missing or invalid field, e.g. empty instance number, `RenewPeriodTimes` not positive, or `RemainRenewTimes` neither `-1` nor positive. | Fix the request according to the request parameter table. |
| `OperationDeniedStateNotEnable` | The instance is not in a state that allows renewal setting changes. | Check the instance state before retrying. |
| `AccessDenied` | The current credential is not authorized, or the instance does not belong to the current account/project/product. | Check the API key, AK/SK, project scope, and instance ownership. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
