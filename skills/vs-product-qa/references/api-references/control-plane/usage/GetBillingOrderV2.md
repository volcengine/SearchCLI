# GetBillingOrderV2

## Overview

- API name: `GetBillingOrderV2`
- Category: Control Plane - Usage
- Description: Gets Billing Order.

## IDL Definition

```proto
message GetBillingOrderReq {
    string ProjectName = 1;
}

message GetBillingOrderV2Resp {
    bool IsAiSearchRecOpened = 1;
    string InstanceNo = 2;
    string InstanceName = 3;
    string InstanceStatus = 4;
    string InstanceBusinessStatus = 5;
    string LimitStatus = 6;
    string Package = 7;
    repeated string AvailablePackages = 8;
    bool AutoRenew = 9;
    string CurrentTime = 21;
    string EffectTime = 22;
    string ExpireTime = 23;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `IsAiSearchRecOpened` | bool | See service validation | Whether the AI Search & Recommendation service is opened. |
| `InstanceNo` | string | See service validation | Volcano billing instance number. |
| `InstanceName` | string | See service validation | Volcano billing instance name. |
| `InstanceStatus` | string | See service validation | Instance status. Enum values: `pending` (creating) / `running` / `create_failed` / `terminated` / `expired` / `expire_reclaimed` / `overdue` / `overdue_reclaimed` / `termination_suspended` / `service_shutdown` / `disable` (not enabled; returned when the current project has no instance). |
| `InstanceBusinessStatus` | string | See service validation | Instance business status. Enum values: `off_duty` / `running` / `pending` / `modifying` / `renewing` / `terminating` / `expiring` / `reclaiming` / `formalizing` / `overdue_closing` / `resuming` / `termination_suspending` / `upgrade_expiring` / `upgrade_newing` / `temp_upgrading` / `temp_upgrade_reverting` / `limiting` / `limit_removing` / `service_shutting_down`; `off_duty` is returned when the current project has no instance. |
| `LimitStatus` | string | See service validation | Limit status. Enum values: `unlimited` / `limited`; empty string means unknown. |
| `Package` | string | See service validation | Current package. Enum values: `standard` / `free_trial` / `first_month_trial` / `post_paid`; empty string means unknown. |
| `AvailablePackages[]` | array<string> | No | Packages available for purchase. Enum values: `standard` / `free_trial` / `first_month_trial`. |
| `AutoRenew` | bool | See service validation | Whether auto-renewal is enabled for the current instance. |
| `CurrentTime` | string | See service validation | Current server time, RFC3339 format (UTC). |
| `EffectTime` | string | See service validation | Instance effect time, RFC3339 format (UTC). |
| `ExpireTime` | string | See service validation | Instance expiration time, RFC3339 format (UTC). |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
