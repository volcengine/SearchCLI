# GetQuota

## Overview

- API name: `GetQuota`
- Category: Control Plane - Usage
- Description: Gets Quota.

## IDL Definition

```proto
message GetQuotaReq {
    string ProjectName = 1;
}

message GetQuotaResp {
    Quota Quota = 1;
    Quota UsageQuota = 2;
    RemainQuota RemainQuota = 3;
    TokenMetrics TokenMetrics = 4;
    bool VikingUnit = 5;
    VikingUnitDetail VikingUnitDetail = 6;
}

message Quota {
    optional int64 AppDataProcessImageTextQuota = 1;
    optional int64 AppDataProcessVideoTextQuota = 2;
    optional int64 DatasetImageStorageCountQuota = 3;
    optional int64 DatasetVideoStorageDurationQuota = 4;
    optional int64 ApiSearchQpsQuota = 5;
    optional int64 ApiChatSearchQpsQuota = 6;
    optional int64 ApiDeepSearchChatQpsQuota = 7;

    optional int64 AppDataProcessUserEventTextForInvertTextQuota = 8;

    optional int64 ApiRecQpsQuota = 9;

    int64 UserEventDatasetQuota = 10;

    int64 BindUserEventDatasetQuota = 13;

    int64 AppQuota = 21;
    int64 BindDatasetQuota = 22;
    int64 DatasetQuota = 23;

    int64 UserDatasetQuota = 24;
}

message RemainQuota {
    optional int64 AppDataProcessImageTextQuota = 1;
    optional int64 AppDataProcessVideoTextQuota = 2;
    optional int64 DatasetImageStorageCountQuota = 3;
    optional int64 DatasetVideoStorageDurationQuota = 4;
    optional int64 ApiSearchQpsQuota = 5;
    optional int64 ApiChatSearchQpsQuota = 6;
    optional int64 ApiDeepSearchChatQpsQuota = 7;

    optional int64 AppDataProcessUserEventTextForInvertTextQuota = 8;

    optional int64 ApiRecQpsQuota = 9;

    optional int64 UserEventDatasetQuota = 10;
    optional int64 AppQuota = 11;
    optional int64 DatasetQuota = 12;
    optional int64 UserDatasetQuota = 13;
}

message TokenMetrics {
    int64 recommend_reason_input_tokens = 1;
    int64 recommend_reason_output_tokens = 2;
}

message VikingUnitDetail {
    VikingUnitQuota Quota = 1;
    VikingUnitCounter Usage = 2;
    VikingUnitCounter Remain = 3;
}

message VikingUnitQuota {
    double VSUQuota = 1;
    double VPUQuota = 2;
    double VRUQuota = 3;
}

message VikingUnitCounter {
    double VSUCounter = 1;
    double VPUCounter = 2;
    double VRUCounter = 3;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | See service validation | Project name. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `Quota` | Quota | See service validation | Quota. |
| `UsageQuota` | Quota | See service validation | Usage quota. |
| `RemainQuota` | RemainQuota | See service validation | Remain quota. |
| `TokenMetrics` | TokenMetrics | See service validation | Token metrics. |
| `VikingUnit` | bool | See service validation | Viking unit. |
| `VikingUnitDetail` | VikingUnitDetail | See service validation | Viking unit detail. |
| `Quota.AppDataProcessImageTextQuota` | int64 | No | App data process image text quota. |
| `Quota.AppDataProcessVideoTextQuota` | int64 | No | App data process video text quota. |
| `Quota.DatasetImageStorageCountQuota` | int64 | No | Dataset image storage count quota. |
| `Quota.DatasetVideoStorageDurationQuota` | int64 | No | Dataset video storage duration quota. |
| `Quota.ApiSearchQpsQuota` | int64 | No | Api search qps quota. |
| `Quota.ApiChatSearchQpsQuota` | int64 | No | Api chat search qps quota. |
| `Quota.ApiDeepSearchChatQpsQuota` | int64 | No | Api deep search chat qps quota. |
| `Quota.AppDataProcessUserEventTextForInvertTextQuota` | int64 | No | App data process user event text for invert text quota. |
| `Quota.ApiRecQpsQuota` | int64 | No | Api rec qps quota. |
| `Quota.UserEventDatasetQuota` | int64 | See service validation | User event dataset quota. |
| `Quota.BindUserEventDatasetQuota` | int64 | See service validation | Bind user event dataset quota. |
| `Quota.AppQuota` | int64 | See service validation | App quota. |
| `Quota.BindDatasetQuota` | int64 | See service validation | Bind dataset quota. |
| `Quota.DatasetQuota` | int64 | See service validation | Dataset quota. |
| `Quota.UserDatasetQuota` | int64 | See service validation | User dataset quota. |
| `UsageQuota.AppDataProcessImageTextQuota` | int64 | No | App data process image text quota. |
| `UsageQuota.AppDataProcessVideoTextQuota` | int64 | No | App data process video text quota. |
| `UsageQuota.DatasetImageStorageCountQuota` | int64 | No | Dataset image storage count quota. |
| `UsageQuota.DatasetVideoStorageDurationQuota` | int64 | No | Dataset video storage duration quota. |
| `UsageQuota.ApiSearchQpsQuota` | int64 | No | Api search qps quota. |
| `UsageQuota.ApiChatSearchQpsQuota` | int64 | No | Api chat search qps quota. |
| `UsageQuota.ApiDeepSearchChatQpsQuota` | int64 | No | Api deep search chat qps quota. |
| `UsageQuota.AppDataProcessUserEventTextForInvertTextQuota` | int64 | No | App data process user event text for invert text quota. |
| `UsageQuota.ApiRecQpsQuota` | int64 | No | Api rec qps quota. |
| `UsageQuota.UserEventDatasetQuota` | int64 | See service validation | User event dataset quota. |
| `UsageQuota.BindUserEventDatasetQuota` | int64 | See service validation | Bind user event dataset quota. |
| `UsageQuota.AppQuota` | int64 | See service validation | App quota. |
| `UsageQuota.BindDatasetQuota` | int64 | See service validation | Bind dataset quota. |
| `UsageQuota.DatasetQuota` | int64 | See service validation | Dataset quota. |
| `UsageQuota.UserDatasetQuota` | int64 | See service validation | User dataset quota. |
| `RemainQuota.AppDataProcessImageTextQuota` | int64 | No | App data process image text quota. |
| `RemainQuota.AppDataProcessVideoTextQuota` | int64 | No | App data process video text quota. |
| `RemainQuota.DatasetImageStorageCountQuota` | int64 | No | Dataset image storage count quota. |
| `RemainQuota.DatasetVideoStorageDurationQuota` | int64 | No | Dataset video storage duration quota. |
| `RemainQuota.ApiSearchQpsQuota` | int64 | No | Api search qps quota. |
| `RemainQuota.ApiChatSearchQpsQuota` | int64 | No | Api chat search qps quota. |
| `RemainQuota.ApiDeepSearchChatQpsQuota` | int64 | No | Api deep search chat qps quota. |
| `RemainQuota.AppDataProcessUserEventTextForInvertTextQuota` | int64 | No | App data process user event text for invert text quota. |
| `RemainQuota.ApiRecQpsQuota` | int64 | No | Api rec qps quota. |
| `RemainQuota.UserEventDatasetQuota` | int64 | No | User event dataset quota. |
| `RemainQuota.AppQuota` | int64 | No | App quota. |
| `RemainQuota.DatasetQuota` | int64 | No | Dataset quota. |
| `RemainQuota.UserDatasetQuota` | int64 | No | User dataset quota. |
| `TokenMetrics.recommend_reason_input_tokens` | int64 | See service validation | Recommend reason input tokens. |
| `TokenMetrics.recommend_reason_output_tokens` | int64 | See service validation | Recommend reason output tokens. |
| `VikingUnitDetail.Quota` | VikingUnitQuota | See service validation | Quota. |
| `VikingUnitDetail.Usage` | VikingUnitCounter | See service validation | Usage. |
| `VikingUnitDetail.Remain` | VikingUnitCounter | See service validation | Remain. |
| `VikingUnitDetail.Quota.VSUQuota` | double | See service validation | Vsu quota. |
| `VikingUnitDetail.Quota.VPUQuota` | double | See service validation | Vpu quota. |
| `VikingUnitDetail.Quota.VRUQuota` | double | See service validation | Vru quota. |
| `VikingUnitDetail.Usage.VSUCounter` | double | See service validation | Vsu counter. |
| `VikingUnitDetail.Usage.VPUCounter` | double | See service validation | Vpu counter. |
| `VikingUnitDetail.Usage.VRUCounter` | double | See service validation | Vru counter. |
| `VikingUnitDetail.Remain.VSUCounter` | double | See service validation | Vsu counter. |
| `VikingUnitDetail.Remain.VPUCounter` | double | See service validation | Vpu counter. |
| `VikingUnitDetail.Remain.VRUCounter` | double | See service validation | Vru counter. |

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload, path parameter, or query parameter is invalid. | Fix the request according to the request parameter table and IDL definition. |
| `AccessDenied` | The current credential is not authorized to access the target resource. | Check the API key, AK/SK, project scope, and resource ownership. |
| `ResourceNotFound` | The target resource does not exist or is not visible in the current project. | Verify resource IDs and project name. |
| `OperationDenied` | The operation is not allowed for the current resource state or account state. | Check the resource status and service enablement state before retrying. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
| `ServiceUnavailable` | The service is temporarily unavailable. | Retry later. |
