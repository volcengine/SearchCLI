# CreateBillingOrderV2

## Overview

- API name: `CreateBillingOrderV2`
- Category: Control Plane - Usage (Billing)
- Endpoint: `POST /open/CreateBillingOrderV2`
- Version: `2025-03-01`
- Description: Unified order creation for new purchase, renewal, and plan modification. Creates a formal EPS order and returns the `OrderNO` used to launch the FastPay cashier. The common field rules match `CalculateBillingOrderPrice`.
- SearchCLI: `vs purchase order create --scene <purchase|renew|modify> --configuration-code <code> ...`

## IDL Definition

```proto
message CreateBillingOrderV2Req {
    // Product code, required.
    string ProductCode = 1;
    // Target plan (configuration) code, required.
    string ConfigurationCode = 2;
    // Operation scene, required.
    BillingOrderScene Scene = 3;
    // Current instance number; empty for purchase, required for renew/modify.
    string InstanceNO = 4;
    // Purchase duration in months; same rules as the price quote request.
    optional int32 PurchaseMonths = 5;
    // Whether auto-renewal is enabled.
    optional bool AutoRenew = 6;
    // Client idempotency token, required, at most 60 characters; reuse it for retries of the same order.
    string ClientToken = 7;
    // Custom passthrough parameters; by convention "source" is knowledge_center or ai_search_console.
    map<string, string> CustomParams = 8;
    // Custom expiration time as a Unix timestamp in seconds; same rules as the price quote request.
    optional int64 EndTime = 9;
    // Project name; empty falls back to default.
    string ProjectName = 20;
}

message CreateBillingOrderV2Resp {
    // Product code actually submitted to Trade.
    string ProductCode = 1;
    // Target plan code actually submitted to Trade.
    string ConfigurationCode = 2;
    // Formal EPS order number; the client uses this value to launch FastPay.
    string OrderNO = 3;
    // Target instance number. Renew/modify return the requested instance number;
    // for a new purchase the instance is usually created after payment and activation, so this may be empty.
    string InstanceNO = 4;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProductCode` | string | Yes | Product code. SearchCLI manages this field internally; it uses non-empty `VIKING_AISEARCH_PRODUCT_CODE` when set, otherwise `REC-SaaS-LLM-SEARCH`. It is not a CLI input. |
| `ConfigurationCode` | string | Yes | Target plan code: `ai_search_free_trial`, `ai_search_first_month_trial`, `ai_search_standard_monthly`, `ai_search_bespoke_premium`, `ai_search_post_paid`. |
| `Scene` | int32 (enum) | Yes | Operation scene: `1` purchase, `2` renew, `3` modify. SearchCLI accepts the names `purchase`/`renew`/`modify` and sends the numeric value. |
| `InstanceNO` | string | Conditional | Current instance number. Must be empty for purchase; required for renew and modify. |
| `PurchaseMonths` | int32 | Conditional | Purchase duration in months. Mutually exclusive with `EndTime`. Free trial / first-month trial only support `1`; standard monthly and bespoke premium require a positive integer; ignored for post-paid. |
| `AutoRenew` | bool | No | `true` enables auto-renewal, `false` sets manual renewal. When omitted, no renewal setting is carried and the EPS default applies. Ignored for post-paid plans. |
| `ClientToken` | string | Yes | Idempotency token, 1-60 characters. Must be reused by retries of the same order. SearchCLI auto-generates a UUID when `--client-token` is omitted. |
| `CustomParams` | map<string,string> | No | Passthrough parameters. The `source` key convention is `knowledge_center` or `ai_search_console`; SearchCLI sends `{"source": "ai_search_console"}`. |
| `EndTime` | int64 | Conditional | Custom expiration time (Unix timestamp in seconds). Mutually exclusive with `PurchaseMonths`; unsupported by free trial, first-month trial, and post-paid. Modify scene requires `PurchaseMonths` or `EndTime`. |
| `ProjectName` | string | No | Project name. Empty or blank falls back to the default project. |

## Response Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProductCode` | string | See service validation | Product code submitted to Trade. |
| `ConfigurationCode` | string | See service validation | Target plan code submitted to Trade. |
| `OrderNO` | string | Yes | Formal EPS order number. Use it to launch the FastPay cashier to complete payment; an empty value is treated as an order creation failure. |
| `InstanceNO` | string | No | Target instance number. Returned for renew/modify; may be empty for a new purchase until payment and activation complete. |

## Behavior Notes

- The console converts the request to a Trade one-step order call (`CreateOrderInOneStep`); it does not create EPS pre-orders or formal orders directly.
- Instance ownership is validated locally before calling Trade to prevent cross-account, cross-project, or cross-product operations.
- Creating the order does not complete payment: the user must finish payment in the FastPay cashier. After payment, poll the instance state with `GetBillingOrder` (SearchCLI: `vs purchase order status` / `vs purchase order wait`).
- `ClientToken` is an idempotency key, not a credential.

## Error Codes

| Error code | Trigger condition | Handling guidance |
| --- | --- | --- |
| `InvalidParameter` | Missing or invalid field, e.g. empty `ClientToken`, token longer than 60 characters, unknown scene, duration conflict, or plan/period mismatch. | Fix the request according to the request parameter table and validation rules. |
| `OperationDeniedStateNotEnable` | The service or account is not in an enabled state for the operation. | Check the service opening state before retrying. |
| `OperationDeniedModifyConfiguration` | The target plan change is not allowed from the current plan. | Verify the allowed plan transition rules before creating a modify order. |
| `OperationDeniedFreeTrial*` / `OperationDeniedStandard*` / `OperationDeniedFirstMonthTrial*` | Plan-specific eligibility failed, e.g. region restricted, already ordered, not an enterprise account, or not verified. | Read the specific error code suffix and ask the user to satisfy the plan eligibility requirement. |
| `OperationDeniedCreateBillingOrderFailed` | Trade did not return a formal order number. | Treat as order creation failure; retry with the same `ClientToken` or escalate with the request ID. |
| `AccessDenied` | The current credential is not authorized. | Check the API key, AK/SK, project scope, and account. |
| `InternalError` | The service encountered an internal error. | Keep the request ID and retry or escalate for server-side investigation. |
