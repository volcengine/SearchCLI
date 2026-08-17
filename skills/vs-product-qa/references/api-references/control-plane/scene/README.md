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
| Create recommend scene, `vs recommend scene create` | [CreateRecommendScene](./CreateRecommendScene.md) |
| Update or online recommend scene, `vs recommend scene update` | [OnlineRecommendScene](./OnlineRecommendScene.md) |
| List recommend scenes, `vs recommend scene list` | [ListRecommendScene](./ListRecommendScene.md) |
| Get recommend scene, `vs recommend scene get` | [GetRecommendScene](./GetRecommendScene.md) |
| Delete recommend scene, `vs recommend scene delete` | [DeleteRecommendScene](./DeleteRecommendScene.md) |
| Recommend scene experiment config update | [UpsertRecommendSceneExpConfig](./UpsertRecommendSceneExpConfig.md) |
| Recommend scene experiment config get | [GetRecommendSceneExpConfig](./GetRecommendSceneExpConfig.md) |
| Upsert recommend rule, `vs recommend rule upsert` | [UpsertRecommendRule](./UpsertRecommendRule.md) |
| List recommend rules, `vs recommend rule list` | [ListRecommendRule](./ListRecommendRule.md) |
| Get recommend rule, `vs recommend rule get` | [GetRecommendRule](./GetRecommendRule.md) |
| Delete recommend rule, `vs recommend rule delete` | [DeleteRecommendRule](./DeleteRecommendRule.md) |

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
| `CreateRecommendScene` | [CreateRecommendScene](./CreateRecommendScene.md) |
| `OnlineRecommendScene` | [OnlineRecommendScene](./OnlineRecommendScene.md) |
| `ListRecommendScene` | [ListRecommendScene](./ListRecommendScene.md) |
| `GetRecommendScene` | [GetRecommendScene](./GetRecommendScene.md) |
| `DeleteRecommendScene` | [DeleteRecommendScene](./DeleteRecommendScene.md) |
| `UpsertRecommendSceneExpConfig` | [UpsertRecommendSceneExpConfig](./UpsertRecommendSceneExpConfig.md) |
| `GetRecommendSceneExpConfig` | [GetRecommendSceneExpConfig](./GetRecommendSceneExpConfig.md) |
| `UpsertRecommendRule` | [UpsertRecommendRule](./UpsertRecommendRule.md) |
| `ListRecommendRule` | [ListRecommendRule](./ListRecommendRule.md) |
| `GetRecommendRule` | [GetRecommendRule](./GetRecommendRule.md) |
| `DeleteRecommendRule` | [DeleteRecommendRule](./DeleteRecommendRule.md) |
