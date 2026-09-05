# Control-Plane Scene API Router

This file is the final-level router for scene-related control-plane API contracts, including search scenes, app online config, recommendation scenes, and recommendation rules. For `vs search scene update`, route to `PublishSearchSceneV2`; `UpdateSearchSceneV2` is a separate API contract and is not the current SearchCLI update command path.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Create search scene, `vs search scene create` | [CreateSearchSceneV2](./CreateSearchSceneV2.md) |
| Get search scene, `vs search scene get` | [GetSearchSceneV2](./GetSearchSceneV2.md) |
| List search scenes, `vs search scene list` | [ListSearchScenesV2](./ListSearchScenesV2.md) |
| Update or publish search scene config, `vs search scene update` | [PublishSearchSceneV2](./PublishSearchSceneV2.md) |
| Delete search scene, `vs search scene delete` | [DeleteSearchSceneV2](./DeleteSearchSceneV2.md) |
| Direct search-scene update API named by user | [UpdateSearchSceneV2](./UpdateSearchSceneV2.md) |
| Get application online config, `vs app online-config get` | [GetAppOnlineConfig](./GetAppOnlineConfig.md) |
| Create or update application online config, `vs app online-config update` | [UpsertAppOnlineConfig](./UpsertAppOnlineConfig.md) |
| Create recommend scene, `vs recommend scene create` | [CreateRecommendSceneV2](./CreateRecommendSceneV2.md) |
| Update or publish recommend scene, `vs recommend scene update` | [PublishRecommendSceneV2](./PublishRecommendSceneV2.md) |
| List recommend scenes, `vs recommend scene list` | [ListRecommendScenesV2](./ListRecommendScenesV2.md) |
| Get recommend scene, `vs recommend scene get` | [GetRecommendSceneV2](./GetRecommendSceneV2.md) |
| Delete recommend scene, `vs recommend scene delete` | [DeleteRecommendSceneV2](./DeleteRecommendSceneV2.md) |
| Upsert recommend rule, `vs recommend rule upsert` | [UpsertRecommendRuleV2](./UpsertRecommendRuleV2.md) |
| List recommend rules, `vs recommend rule list` | [ListRecommendRulesV2](./ListRecommendRulesV2.md) |
| Get recommend rule, `vs recommend rule get` | [GetRecommendRuleV2](./GetRecommendRuleV2.md) |
| Delete recommend rule, `vs recommend rule delete` | [DeleteRecommendRuleV2](./DeleteRecommendRuleV2.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `CreateSearchSceneV2` | [CreateSearchSceneV2](./CreateSearchSceneV2.md) |
| `GetSearchSceneV2` | [GetSearchSceneV2](./GetSearchSceneV2.md) |
| `ListSearchScenesV2` | [ListSearchScenesV2](./ListSearchScenesV2.md) |
| `UpdateSearchSceneV2` | [UpdateSearchSceneV2](./UpdateSearchSceneV2.md) |
| `PublishSearchSceneV2` | [PublishSearchSceneV2](./PublishSearchSceneV2.md) |
| `DeleteSearchSceneV2` | [DeleteSearchSceneV2](./DeleteSearchSceneV2.md) |
| `GetAppOnlineConfig` | [GetAppOnlineConfig](./GetAppOnlineConfig.md) |
| `UpsertAppOnlineConfig` | [UpsertAppOnlineConfig](./UpsertAppOnlineConfig.md) |
| `CreateRecommendSceneV2` | [CreateRecommendSceneV2](./CreateRecommendSceneV2.md) |
| `PublishRecommendSceneV2` | [PublishRecommendSceneV2](./PublishRecommendSceneV2.md) |
| `ListRecommendScenesV2` | [ListRecommendScenesV2](./ListRecommendScenesV2.md) |
| `GetRecommendSceneV2` | [GetRecommendSceneV2](./GetRecommendSceneV2.md) |
| `DeleteRecommendSceneV2` | [DeleteRecommendSceneV2](./DeleteRecommendSceneV2.md) |
| `UpsertRecommendRuleV2` | [UpsertRecommendRuleV2](./UpsertRecommendRuleV2.md) |
| `ListRecommendRulesV2` | [ListRecommendRulesV2](./ListRecommendRulesV2.md) |
| `GetRecommendRuleV2` | [GetRecommendRuleV2](./GetRecommendRuleV2.md) |
| `DeleteRecommendRuleV2` | [DeleteRecommendRuleV2](./DeleteRecommendRuleV2.md) |
