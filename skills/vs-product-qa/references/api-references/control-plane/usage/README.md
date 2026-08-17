# Control-Plane Usage API Router

This file is the final-level router for billing, quota, usage, and count/statistics control-plane API contracts.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Billing order, purchase order status, service opening status, `vs purchase order status` | [GetBillingOrder](./GetBillingOrder.md) |
| Quota, resource limit, remaining capacity | [GetQuota](./GetQuota.md) |
| Billing usage data, metering usage | [ListBillingUsageData](./ListBillingUsageData.md) |
| Data item summary, processed item summary | [GetDataItemSummary](./GetDataItemSummary.md) |
| Dataset data count, dataset total rows/items | [GetDatasetDataCount](./GetDatasetDataCount.md) |
| Dataset statistics, dataset metrics | [GetDatasetStatistics](./GetDatasetStatistics.md) |
| Application effective item data count, `vs app item-data-count` | [GetAppItemDataCount](./GetAppItemDataCount.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `GetBillingOrder` | [GetBillingOrder](./GetBillingOrder.md) |
| `GetQuota` | [GetQuota](./GetQuota.md) |
| `ListBillingUsageData` | [ListBillingUsageData](./ListBillingUsageData.md) |
| `GetDataItemSummary` | [GetDataItemSummary](./GetDataItemSummary.md) |
| `GetDatasetDataCount` | [GetDatasetDataCount](./GetDatasetDataCount.md) |
| `GetDatasetStatistics` | [GetDatasetStatistics](./GetDatasetStatistics.md) |
| `GetAppItemDataCount` | [GetAppItemDataCount](./GetAppItemDataCount.md) |
