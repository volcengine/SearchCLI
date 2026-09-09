# CalculateBillingOrderPrice

## Overview

- API name: `CalculateBillingOrderPrice`
- Category: Control Plane - Usage (Billing)
- Endpoint: `POST /open/CalculateBillingOrderPrice`
- Version: `2025-03-01`
- Description: Unified price quote for new purchase, renewal, and plan modification. Validates the request parameters and calls Trade for a price trial calculation; no order is created.
- SearchCLI: `vs purchase order price --scene <purchase|renew|modify> --configuration-code <code> ...`

## IDL Definition

```proto
enum BillingOrderScene {
    // Unspecified; requests with this value are rejected.
    BillingOrderSceneUnspecified = 0;
    // Purchase a new instance.
    BillingOrderScenePurchase = 1;
    // Extend the validity period of an existing instance.
    BillingOrderSceneRenew = 2;
    // Change the plan of an existing instance; the duration must be given by PurchaseMonths or EndTime.
    BillingOrderSceneModify = 3;
}

message CalculateBillingOrderPriceReq {
    // Product code, required.
    string ProductCode = 1;
    // Target plan (configuration) code, required.
    string ConfigurationCode = 2;
    // Operation scene, required.
    BillingOrderScene Scene = 3;
    // Current instance number; empty for purchase, required for renew/modify.
    string InstanceNO = 4;
    // Purchase duration in months.
    optional int32 PurchaseMonths = 5;
    // Custom expiration time as a Unix timestamp in seconds; mutually exclusive with PurchaseMonths.
    // Not supported for free trial, first-month trial, or post-paid plans.
    optional int64 EndTime = 9;
    // Project name; empty falls back to default.
    string ProjectName = 20;
}

message CalculateBillingOrderPriceResp {
    // Original amount before discounts.
    float OriginalAmount = 1;
    // Discount amount returned by Trade/EPS.
    float DiscountAmount = 2;
    // Estimated payable amount for this quote; the final charge is determined by the EPS order after creation.
    float PayableAmount = 3;
    // Coupon amount returned by Trade/EPS; 0 when no coupon is used.
    double CouponAmount = 4;
    // ISO 4217 currency code, e.g. CNY or USD.
    string Currency = 5;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProductCode` | string | Yes | Product code. SearchCLI manages this field internally; it uses non-empty `VIKING_AISEARCH_PRODUCT_CODE` when set, otherwise `REC-SaaS-LLM-SEARCH`. It is not a CLI input. |
| `ConfigurationCode` | string | Yes | Target plan code. Supported values: `ai_search_free_trial`, `ai_search_first_month_trial`, `ai_search_standard_monthly`, `ai_search_bespoke_premium`, `ai_search_post_paid`. |
| `Scene` | int32 (enum) | Yes | Operation scene: `1` purchase, `2` renew, `3` modify. `0` is rejected. SearchCLI accepts the names `purchase`/`renew`/`modify` and sends the numeric value. |
| `InstanceNO` | string | Conditional | Current instance number. Must be empty for purchase; required for renew and modify. |
| `PurchaseMonths` | int32 | Conditional | Purchase duration in months. Mutually exclusive with `EndTime`. Free trial and first-month trial only support `1`; standard monthly and bespoke premium require a positive integer; ignored for post-paid. |
| `EndTime` | int64 | Conditional | Custom expiration time (Unix timestamp in seconds). Mutually exclusive with `PurchaseMonths`. Not supported by free trial, first-month trial, or post-paid plans. Modify scene requires `PurchaseMonths` or `EndTime`. |
| `ProjectName` | string | No | Project name. Empty or blank falls back to the default project. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `OriginalAmount` | float | See service validation | Original amount before discounts, in the currency given by `Currency`. |
| `DiscountAmount` | float | See service validation | Discount amount from Trade/EPS. |
| `PayableAmount` | float | See service validation | Estimated payable amount; the actual charged amount follows the EPS order after `CreateBillingOrderV2`. |
| `CouponAmount` | double | See service validation | Coupon amount; `0` when no coupon applies. |
| `Currency` | string | See service validation | ISO 4217 currency code (`CNY` or `USD`). Falls back to CNY for China regions and USD for overseas regions when Trade does not return one. |

## Validation Rules

- `ProductCode` and `ConfigurationCode` must be non-empty after trimming.
- `Scene` must be one of purchase/renew/modify; `InstanceNO` must be empty for purchase and non-empty for renew/modify.
- `PurchaseMonths` and `EndTime` are mutually exclusive; `EndTime` must be positive when provided.
- Modify scene requires `PurchaseMonths` or `EndTime`.
- Free trial / first-month trial: fixed to one monthly period (`PurchaseMonths=1`); `EndTime` is rejected.
- Standard monthly / bespoke premium: positive `PurchaseMonths`, or `EndTime`.
- Post-paid: `EndTime` is rejected; `PurchaseMonths` is ignored (billed by actual usage).

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | The request payload or a field is invalid, e.g. unknown scene, empty plan code, mutually exclusive duration fields, or plan/period mismatch. | Fix the request according to the request parameter table and validation rules. |
| `OperationDeniedStateNotEnable` | The service or account is not in an enabled state for the operation. | Check the service opening state before retrying. |
| `OperationDeniedModifyConfiguration` | The target plan change is not allowed from the current plan. | Verify the allowed plan transition rules before quoting a modify scene. |
| `OperationDeniedFreeTrial*` / `OperationDeniedStandard*` / `OperationDeniedFirstMonthTrial*` | Plan-specific eligibility failed, e.g. region restricted, already ordered, not an enterprise account, or not verified. | Read the specific error code suffix and ask the user to satisfy the plan eligibility requirement. |
| `AccessDenied` | The current credential is not authorized. | Check the API key, AK/SK, project scope, and account. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
