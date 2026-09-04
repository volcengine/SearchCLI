# Recommend Scene Natural-Language Routing

This reference is for the `vs-recommend` skill. Use it when a user describes a recommend-scene change in natural language and you need to decide which persistent recommend scene field, `Config` area, or rule-resource workflow should be updated.

This is a workflow-oriented routing guide, not a full API reference. SearchCLI recommendation writes use these control-plane actions:

- scene create/list/get/update/delete use `CreateRecommendScene`, `ListRecommendScene`, `GetRecommendScene`, `OnlineRecommendScene`, and `DeleteRecommendScene`.
- rule list/get/upsert/delete use `ListRecommendRule`, `GetRecommendRule`, `UpsertRecommendRule`, and `DeleteRecommendRule`.
- runtime verification uses the data-plane `Recommend` API through `recommend run`.
- request identity fields use `AppID` / `ApplicationId` and `SceneID` / `SceneId` depending on the CLI layer; follow the installed CLI and API reference for final spelling.
- `recommend scene update` publishes via `OnlineRecommendScene`; preserve unrelated existing scene config when preparing a config payload unless the user explicitly asks to replace it.
- Use this file only to identify the config area or workflow. Before deciding concrete enum values, value ranges, required sibling fields, or payload shape, consult the matching API reference under `../../vs-product-qa/references/api-references/`.

## Intent Routing

| Natural-language request or intent | Preferred action |
| --- | --- |
| run recommend, verify recommendation, check returned items, first-pass result check | Run `recommend run` with the selected scene and user/item context; inspect raw `rec_results` and `extra_info`. |
| create a recommend scene, add homepage feed, add detail-page recommendation, add shopping-cart recommendation | Run `recommend scene list` first; reuse an existing scene if suitable, otherwise run `recommend scene create` after confirming target page/module and `BhvSceneTypes`. |
| rename scene, update scene description, change item dataset binding, change behavior scene binding | Run `recommend scene update` and modify top-level scene fields such as `Name`, `Description`, `ItemDatasetID`, or `BhvSceneTypes`. |
| scene type, for-you feed, related items, shopping cart recommendation | For new scenes, run `recommend scene create` with `Type=for_you`, `related`, or `shopping_cart`; for existing published scenes, changing `Type` may be denied. |
| long sequence model, default model, CTR optimization, optimization target | Prefer setting `RecommendModel` and `RecommendOptimizationTarget` during `recommend scene create`; if the user wants to change these on an existing scene, verify the installed CLI/API surface first because `OnlineRecommendScene` does not expose the same create-time fields. |
| page size, result count, max recommendation count, number of returned items | For persistent defaults, run `recommend scene update` and modify `Config.Count`; for one request only, use `recommend run --page-size <n>`. |
| exposure deduplication, impression dedupe, don't repeat exposed items, recently seen item filtering | Run `recommend scene update` and modify `Config.Impression`; for reusable legacy rules, use the Rule Resource Workflow with rule type `impression`. |
| degrade fallback, fallback rule, fallback strategy | Use the Rule Resource Workflow for rule type `degrade`, then run `recommend scene update` and set `Config.DegradeRuleID`. |
| recommendation prompt, suggestion prompt | Run `recommend scene update` and modify `Config.Suggest.SuggestRawPrompt`; for reusable legacy rules, use rule type `suggest`. |
| force specific items, pinned recommendation items, guaranteed item injection | Use the Rule Resource Workflow for rule type `forceItem`, then run `recommend scene update` and set `Config.ForceItemRuleID`. |
| filter recommendation item scope, restrict item pool, item filter, exclude/include item class | Prefer the Rule Resource Workflow with rule type `filter` for reusable item filters and set `Config.FilterRuleID`; for cold-start-only filtering, modify `Config.ColdStartConfig.ItemConditionType="custom_filter"` and `Config.ColdStartConfig.ItemFilter`. |
| search filter rule for recommendation, search-filter DSL | Use the Rule Resource Workflow with rule type `search_filter`; do not treat this as the same DSL as a recommendation item filter because dynamic parameters differ. |
| boost, bury, promote, suppress, weight up, weight down on a simple field condition | Run `recommend scene update` and modify `Config.BoostBuryConfig`; use simple `Field` / `Operator` / `Value` rules. |
| conditional boost/bury, complex condition tree, boost if multiple conditions match | Run `recommend scene update` and modify `Config.BoostBuryCondConfig.Rules[]`; for reusable legacy rules, use rule type `boostBuryCond`. |
| diversify recommendation results, avoid too many similar items, shuffle results, dimension shuffle, expression shuffle | Run `recommend scene update` and modify `Config.Shuffle.Rules[]`; for reusable legacy rules, use rule type `shuffle`. |
| cold start, new item boost, new item injection, expose new items | Run `recommend scene update` and modify `Config.ColdStartConfig`; for reusable legacy rules, use rule type `coldStart`. |
| merge recall channels, recall channel priority, user profile first, multimodal first, hot item first, item similarity first, custom channel weights | Run `recommend scene update` and modify `Config.MergeConfigs[]`. |
| recommendation reason, reason template, explain why item is recommended | Run `recommend scene update` and modify `Config.ReasonTemplate`; for reusable legacy rules, use rule type `recReason`. |
| inspect reusable rule, create rule, update rule, delete rule | Use the Rule Resource Workflow below; only update a scene when the user also asks to attach or replace a rule in that scene. |

## Scene Create Workflow

Use this workflow when the user wants a new recommend scene.

1. Run `recommend scene list --application-id <id>` first and show existing scene candidates. Prefer reuse when a matching scene already exists.
2. Confirm the target page or module, then map it to `Type`:

| Target | `Type` |
| --- | --- |
| Homepage feed, For You, personalized feed | `for_you` |
| Detail page related items, similar items, item-to-item recommendation | `related` |
| Cart page, shopping-cart recommendation | `shopping_cart` |

3. Confirm the item dataset ID. It must be an item dataset bound to the application.
4. Confirm `BhvSceneTypes[]`. These values must exist in the bound UserEvent dataset's `event_scene` enum values.
5. If using `RecommendModel=LongSequence`, confirm `ClickEventTypes[]`; values must exist in the bound UserEvent dataset's `event_type` enum values. Also set a non-empty optimization target such as `Ctr`.
6. Run `recommend scene create` with `--confirm-entry-binding`.
7. Read back with `recommend scene get` and verify `Type`, `ItemDatasetID`, `BhvSceneTypes`, model, and optimization target.

Creation contract:

- `Type`: `for_you`, `related`, `shopping_cart`.
- `RecommendModel`: proto enum `Default` or `LongSequence`; CLI flags currently accept integer enum values (`0` for `Default`, `1` for `LongSequence`).
- `RecommendOptimizationTarget`: proto enum `RecommendOptimizationTargetNone` or `Ctr`; CLI flags currently accept integer enum values (`0` for none, `1` for `Ctr`).
- `ClickEventTypes[]`, `PositiveEventTypes[]`, and `NegativeEventTypes[]` are create-time behavior event declarations and must come from `event_type` enum values.

## Scene Update Workflow

Use this workflow when the user wants a persistent change on an existing scene.

1. Run `recommend scene get --application-id <id> --scene-id <id>` and inspect the current scene.
2. Use the Intent Routing table to identify the target field or `Config` area.
3. Consult `../../vs-product-qa/references/api-references/control-plane/scene/OnlineRecommendScene.md` before writing the final payload.
4. Preserve unrelated config areas from the readback unless the user explicitly asks to replace them. This avoids accidentally dropping existing rule IDs, shuffle rules, cold-start config, merge config, or reason templates.
5. Run `recommend scene update --application-id <id> --scene-id <id> ... --confirm-entry-binding`.
6. Run `recommend scene get` again and verify the intended field values exactly.

Common top-level update fields:

| Field | Notes |
| --- | --- |
| `Type` | Allowed values are `for_you`, `related`, `shopping_cart`; changing `Type` for an already published scene may be denied. |
| `Name` / `Description` | Metadata only. |
| `ItemDatasetID` | Must refer to an item dataset bound to the application. |
| `BhvSceneTypes[]` | Required for scene behavior binding; values come from the bound UserEvent dataset's `event_scene` enum values. |
| `Config` | Recommend scene config. See the Config Routing Details section. |

## Config Routing Details

| Config area | Key fields | Validation notes |
| --- | --- | --- |
| `Config.Count` | Maximum returned item count | Must be `<= 400`. For one request only, prefer `recommend run --page-size`. |
| `Config.FilterRuleID` | Reusable item-filter rule ID | Usually produced by `recommend rule upsert --type filter`; validate the rule with `recommend rule get` before attaching. |
| `Config.Impression` | `TimeWindowSeconds`, `MaxSize`, nested `ExposureCfg` | Time windows must be `> 0`; max sizes are `0..30000`. |
| `Config.DegradeRuleID` | Reusable degrade rule ID | Usually produced by rule type `degrade`. |
| `Config.Suggest.SuggestRawPrompt` | Recommendation prompt text | Preserve the existing prompt unless replacing it is intended. |
| `Config.ForceItemRuleID` | Reusable force-item rule ID | Usually produced by rule type `forceItem`. |
| `Config.BoostBuryConfig` | `Enabled`, `Rules[]` with `Name`, `Field`, `Operator`, `Value`, `Weight`, optional `Enable` | CLI prevalidation accepts operators such as `eq`, `ne`, `contains`, `not_contains`, `must`, `must_not`, `any_must`, `any_must_not`, `gt`, `gte`, `lt`, `lte`, `geo_distance_inner`, `geo_distance_outer`, `time_gt`, `time_gte`, `time_lt`, `time_lte`. Match operator to the item field type and filterability. |
| `Config.Shuffle.Rules[]` | `Name`, `WindowType`, `WindowSize`, `MaxSize` or `RecallMax`, `FieldName`, `ShuffleType`, optional `ShuffleExpr` | `WindowType` is `SLIDE` or `TOP`; `ShuffleType` is `dimension` or `expression`; `WindowSize > 0`; one effective max value must be `> 0`; `WindowSize >= MaxSize/RecallMax`; expression shuffle requires `ShuffleExpr`. |
| `Config.BoostBuryCondConfig.Rules[]` | `Enable`, `Name`, `Config`, `Boost` | `Boost` must be in `[-1, 1]`; condition DSL allows at most 2 logic layers. Field names must match item schema casing. |
| `Config.ColdStartConfig` | `Enable`, `ItemConditionType`, `ImportTimeWindowHours`, `ItemFilter`, `ExposureThreshold`, `MaxInjectCount`, `Name` | `ItemConditionType` is `import_time` or `custom_filter`; `import_time` requires `ImportTimeWindowHours > 0`; `custom_filter` requires non-empty `ItemFilter`; numeric thresholds/counts must be non-negative. |
| `Config.MergeConfigs[]` | `Strategy`, `Weights` | Strategies: `user_profile_first`, `multimodal_first`, `hot_item_first`, `item_similarity_first`, `custom`. `for_you` does not support `item_similarity_first`; `shopping_cart` supports `item_similarity_first` and `custom`. For `custom`, weight keys are `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, `cold_start`; weights must be non-negative and sum to `> 0`; `item_similarity` is not valid for `for_you`. |
| `Config.ReasonTemplate` | `Enable`, `Templates[]`, `FallbackReason` | Template channels: `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, `cold_start`. Enabled templates require non-empty `Template`. |

## Rule Resource Workflow

Use this workflow when the user explicitly asks to manage a reusable rule, or when the requested scene config references a rule ID.

1. Run `recommend rule list --application-id <id>` with `--types` and dataset filters when known.
2. If updating an existing rule, run `recommend rule get --application-id <id> --rule-id <id>` first because list responses may omit or trim `Config`.
3. Consult `../../vs-product-qa/references/api-references/control-plane/scene/UpsertRecommendRule.md` before building the rule payload.
4. Run `recommend rule upsert` to create or update the rule.
5. Read the rule back with `recommend rule get`.
6. If the user wants the rule to affect a scene, run the Scene Update Workflow to attach the returned `RuleID` to the matching scene config field.

Rule types:

| Rule type | Typical use |
| --- | --- |
| `filter` | Reusable recommendation item filter. Supports dynamic parameters such as `"{{Param}}"`. |
| `search_filter` | Search filter rule used by recommendation workflows. Does not support dynamic parameters. |
| `degrade` | Fallback/degrade behavior. Attach with `Config.DegradeRuleID`. |
| `impression` | Reusable impression/exposure deduplication config. |
| `suggest` | Reusable suggestion/prompt config. |
| `userInterest` | User-interest related legacy rule. |
| `itemCf` | Item-CF related legacy rule. |
| `forceItem` | Forced-item rule. Attach with `Config.ForceItemRuleID`. |
| `boostBuryCond` | Reusable conditional boost/bury rule. |
| `coldStart` | Reusable cold-start rule. |
| `shuffle` | Reusable shuffle/diversity rule. |
| `recReason` | Reusable recommendation reason template. |

The recommend-rule API keeps several camelCase type values such as `userInterest`, `itemCf`, `forceItem`, `boostBuryCond`, `coldStart`, and `recReason`. Do not convert them to snake_case.

## Runtime Verification Workflow

Use this workflow when the user wants to check recommendation output without changing persistent configuration.

1. Confirm `application-id` and `scene-id`.
2. For personalized `for_you` scenes, provide `--user-id` when available.
3. For `related` or shopping-cart style scenes, provide `--parent-id` when available because results often depend on the parent item context.
4. Use `--page-size` only for this request's result count; do not treat it as a persistent scene default.
5. Inspect the raw response:
   - `rec_results[]`: returned item IDs, display fields, score, boost value, response reason, and recall info.
   - `extra_info.omitted_params[]`: request parameters ignored by the service.
   - `extra_info.boost_status[]` and `extra_info.effective_boost_bury_rule`: boost/bury effects.
   - `extra_info.invalid_parent_items[]`: invalid parent item IDs.
   - `extra_info.diversity_rule`: shuffle/diversity success or failure.
6. If results look wrong, inspect the scene with `recommend scene get` before proposing config changes.

## Usage Note

Use this file as a routing layer only. For command execution:

1. identify the target action here,
2. consult `vs-product-qa`, installed `vs recommend ... --help`, and the matching API reference for enum-like strings and validation constraints,
3. run the concrete command workflow,
4. read the scene or rule back after mutation.

Field name case sensitivity: for any config area that references item dataset fields, field names are case-sensitive. Before writing a field name into config, first look up the exact item dataset schema via `dataset get --id <item-dataset-id> --full` or `app dataset-config get --application-id <id> --dataset-id <id> --full`.
