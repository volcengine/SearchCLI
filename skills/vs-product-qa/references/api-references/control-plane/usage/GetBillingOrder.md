# GetBillingOrder

## Overview

- API name: `GetBillingOrder`
- Category: Control Plane - Usage
- Description: Gets Billing Order.

## IDL Definition

```proto
message GetBillingOrderReq {
    string ProjectName = 1;
}

message GetBillingOrderResp {

    bool IsAirSearchRecOpened = 1;
    BillingInstanceState InstanceState = 2;
    BillingInstanceBusinessState InstanceBusinessState = 3;
    LimitState LimitState = 4;
    BillingPackage Package = 5;
    int64 ExpireTime = 6;
    int64 CurrentTime = 7;
    string InstanceNo = 8;
    string InstanceName = 9;
    repeated BillingPackage AvailablePackageList = 10;
    int64 EffectTime = 11;
}

enum BillingInstanceState {

    InstanceStatusPending = 0;

    InstanceStatusRunning = 1;

    InstanceStatusCreatedFail = 2;

    InstanceStatusTerminated = 3;

    InstanceStatusExpired = 4;

    InstanceStatusExpireReclaimed = 5;

    InstanceStatusOverdue = 6;

    InstanceStatusOverdueReclaimed = 7;

    InstanceStatusTerminationSuspended = 8;

    InstanceStatusServiceShutdown = 9;

    InstanceStatusDisable = 99;
}

enum BillingInstanceBusinessState {

    InstanceBusinessOffDuty = 0;

    InstanceBusinessRunning = 1;

    InstanceBusinessPending = 2;

    InstanceBusinessModifying = 3;

    InstanceBusinessRenewing = 4;

    InstanceBusinessTerminating = 5;

    InstanceBusinessExpiring = 6;

    InstanceBusinessReclaiming = 7;

    InstanceBusinessFormalizing = 8;

    InstanceBusinessOverdueClosing = 9;

    InstanceBusinessResuming = 10;

    InstanceBusinessTerminateSuspending = 11;

    InstanceBusinessUpgradeExpiring = 12;

    InstanceBusinessUpgradeNewing = 13;

    InstanceBusinessTempUpgrading = 14;

    InstanceBusinessTempUpgradeReverting = 15;

    InstanceBusinessLimiting = 16;

    InstanceBusinessRemoveLimiting = 17;

    InstanceBusinessServiceShutDowning = 18;
}

enum LimitState {

    Unknown = 0;

    UnLimit = 1;

    Limit = 2;
}

enum BillingPackage {

    PackageUnknown = 0;

    PackageFreeTrial = 1;

    PackageStandard = 2;

    PackageFirstMonthTrial = 3;

    PackagePostPaid = 4;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `IsAirSearchRecOpened` | bool | See service validation | Is air search rec opened. |
| `InstanceState` | BillingInstanceState | See service validation | Instance state. |
| `InstanceBusinessState` | BillingInstanceBusinessState | See service validation | Instance business state. |
| `LimitState` | LimitState | See service validation | Limit state. |
| `Package` | BillingPackage | See service validation | Package. |
| `ExpireTime` | int64 | See service validation | Expire time. |
| `CurrentTime` | int64 | See service validation | Current time. |
| `InstanceNo` | string | See service validation | Instance no. |
| `InstanceName` | string | See service validation | Instance name. |
| `AvailablePackageList[]` | array<BillingPackage> | No | Available package list. |
| `EffectTime` | int64 | See service validation | Effect time. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
