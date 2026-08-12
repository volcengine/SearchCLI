# Control-Plane Ingestion API Router

This file is the final-level router for datasource subscription and ingestion control-plane API contracts.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Create datasource subscription, create DTS sync, `vs dataset subscription create` | [CreateDataSourceSubscription](./CreateDataSourceSubscription.md) |
| Close datasource subscription, stop DTS sync, `vs dataset subscription close` | [CloseDataSourceSubscription](./CloseDataSourceSubscription.md) |
| Get datasource subscription detail, `vs dataset subscription get` | [GetDataSourceSubscription](./GetDataSourceSubscription.md) |
| List datasource subscriptions, `vs dataset subscription list` | [ListDataSourceSubscriptions](./ListDataSourceSubscriptions.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `CreateDataSourceSubscription` | [CreateDataSourceSubscription](./CreateDataSourceSubscription.md) |
| `CloseDataSourceSubscription` | [CloseDataSourceSubscription](./CloseDataSourceSubscription.md) |
| `GetDataSourceSubscription` | [GetDataSourceSubscription](./GetDataSourceSubscription.md) |
| `ListDataSourceSubscriptions` | [ListDataSourceSubscriptions](./ListDataSourceSubscriptions.md) |
