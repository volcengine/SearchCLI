# Recommend Scene Natural-Language Routing

This reference is for the `vs-recommend` skill. Use it when a user describes a recommend-scene change in natural language and you need to decide which V2 persistent scene field, `RecommendSceneConfigV2` area, deployment check, or rule-resource workflow should be updated.

This is a workflow-oriented routing guide, not a full API reference. SearchCLI recommendation writes use these V2 control-plane actions:

- scene create/list/get/update/delete use `CreateRecommendSceneV2`, `ListRecommendScenesV2`, `GetRecommendSceneV2`, `PublishRecommendSceneV2`, and `DeleteRecommendSceneV2`.
- rule list/get/upsert/delete use `ListRecommendRulesV2`, `GetRecommendRuleV2`, `UpsertRecommendRuleV2`, and `DeleteRecommendRuleV2`.
- runtime verification uses the data-plane `Recommend` API through `recommend run`.
- request identity fields use `ApplicationId`, `SceneId`, `RuleId`, `DatasetId`, and `ItemDatasetId`.
- `recommend scene update` publishes through `PublishRecommendSceneV2`.
- Unlike SearchSceneV2, recommend scene updates should be treated as full scene publishes. Start from `recommend scene get`, preserve top-level scene fields and unrelated `Config` areas, then change only the requested area.
- A successful publish updates persistent scene rows and online runtime config. It writes generated `recommend_scene_meta` under the scene namespace and writes application-level `event_scene_mapping` for `scene-id -> selected UserEventScenes[]`.
- The full list of possible `event_scene` values comes from the bound UserEvent dataset schema plus offline-received values returned by `dataset get --full`; that candidate list is not itself the scene config.
- Use this file only to identify the config area or workflow. Before deciding concrete enum values, value ranges, required sibling fields, or payload shape, consult the matching API reference under `../../vs-product-qa/references/api-references/`.

## Intent Routing

| Natural-language request or intent | Preferred action |
| --- | --- |
| run recommend, verify recommendation, check returned items, first-pass result check | Run `recommend run` with the selected scene and user/item context; inspect raw `rec_results` and `extra_info`. |
| recommendation returns empty, no results, bad recall, wrong items | Inspect readiness/status, then `recommend scene get`, then runtime `extra_info`; do not mutate config until the current scene and request context are clear. |
| create a recommend scene, add homepage feed, add detail-page recommendation, add shopping-cart recommendation | Run `recommend scene list` first; reuse an existing scene if suitable, otherwise use the Scene Create Workflow. |
| rename scene, update scene description | Run the Scene Update Workflow and modify `Name` or `Description`; preserve existing `Type`, `ItemDatasetId`, `UserEventScenes`, and full `Config`. |
| change item dataset binding | Run the Scene Update Workflow and modify `ItemDatasetId`; verify the dataset is item type and bound to the application; re-check all field-based rules against the new schema. |
| change behavior scene binding, page/module binding, entry page, event_scene mapping | Run the Behavior Scene Binding Workflow; then run the Scene Update Workflow and modify `UserEventScenes[]`. |
| what values can I use for behavior scene, list pages/modules, event_scene candidates | Run `dataset get --id <user-event-dataset-id> --full` and inspect the UserEvent field whose BizAttr is `user_event_event_scene`; do not update the scene unless the user chooses values. |
| scene type, for-you feed, related items, shopping cart recommendation | For new scenes, map to `Type=for_you`, `related`, or `shopping_cart`; for existing published scenes, changing `Type` may be denied. |
| long sequence model, default model, CTR optimization, optimization target | For create, set `RecommendModel=default` or `long_sequence`; set `RecommendOptimizationTarget=ctr` when required. `PublishRecommendSceneV2` does not accept model/optimization fields. |
| page size, result count, max recommendation count, number of returned items | For persistent defaults, run the Scene Update Workflow and modify `Config.MaxResults`; for one request only, use `recommend run --page-size <n>`. |
| exposure deduplication, impression dedupe, don't repeat exposed items, recently seen item filtering | Run the Scene Update Workflow and modify `Config.ImpressionConfig`; if exposure dedupe is configured, `UserEventScenes[]` must be valid because publish updates dedupe behavior-scene mapping. |
| degrade fallback, fallback rule, fallback strategy, hot item fallback | Use the Rule Resource Workflow for rule type `degrade`, then run the Scene Update Workflow and set `Config.DegradeRuleId`. |
| recommendation prompt, suggestion prompt, generated summary wording | Run the Scene Update Workflow and modify `Config.SuggestConfig.SuggestRawPrompt`; for reusable rules, use rule type `suggest` only when the API reference says it is writable. |
| force specific items, pinned recommendation items, guaranteed item injection, top items | Use the Rule Resource Workflow for rule type `force_item`, then run the Scene Update Workflow and set `Config.ForceItemRuleId`. |
| filter recommendation item scope, restrict item pool, item filter, exclude/include item class | Prefer the Rule Resource Workflow with rule type `filter` for reusable item filters and set `Config.FilterRuleId`; for cold-start-only filtering, modify `Config.ColdStartConfig.ItemConditionType="custom_filter"` and `Config.ColdStartConfig.ItemFilter`. |
| parent/variant recommendation range, recommend only parent items, recommend only child/SKU items | Modify `Config.FilterConfig.ItemTypeFilter` or create-time `FilterConfig.ItemTypeFilter` when the request is for initial scene scope. |
| search filter rule for recommendation, search-filter DSL | Use the Rule Resource Workflow with rule type `search_filter`; do not treat this as the same DSL as a recommendation item filter because dynamic parameters differ. |
| boost, bury, promote, suppress, weight up, weight down | Run the Scene Update Workflow and modify `Config.BoostBuryCondConfig.Rules[]`. V2 removed the legacy `Config.BoostBuryConfig`. |
| conditional boost/bury, complex condition tree, boost if multiple conditions match | Run the Scene Update Workflow and modify `Config.BoostBuryCondConfig.Rules[]`; for reusable rules, use rule type `boost_bury_cond` only when the API reference says it is writable. |
| diversify recommendation results, avoid too many similar items, shuffle results, dimension shuffle, expression shuffle | Run the Scene Update Workflow and modify `Config.ShuffleConfig.Rules[]`; for reusable rules, use rule type `shuffle` only when the API reference says it is writable. |
| cold start, new item boost, new item injection, expose new items | Run the Scene Update Workflow and modify `Config.ColdStartConfig`; for reusable rules, use rule type `cold_start` only when the API reference says it is writable. |
| merge recall channels, recall channel priority, user profile first, multimodal first, hot item first, item similarity first, custom channel weights | Run the Scene Update Workflow and modify `Config.MergeConfigs[]`; in V2 custom weights use `CustomWeights[]`, not a map. |
| recommendation reason, reason template, explain why item is recommended, rec_info | Run the Scene Update Workflow and modify `Config.ReasonTemplateConfig`; for reusable rules, use rule type `rec_reason` only when the API reference says it is writable. |
| recommendation assistant, assistant role, answer style, follow-up style | Run the Scene Update Workflow and modify `Config.RecAssistantConfig`. |
| deployment status, whether scene is online, publish failed, config not effective | Use the Deployment Verification Workflow. |
| inspect reusable rule, create rule, update rule, delete rule | Use the Rule Resource Workflow below; only update a scene when the user also asks to attach or replace a rule in that scene. |

## Scene Create Workflow

Use this workflow when the user wants a new recommend scene.

1. Run `recommend scene list --application-id <id>` first and show existing scene candidates. Prefer reuse when a matching scene already exists.
2. Resolve the item dataset ID. It must be an item dataset bound to the application.
3. Resolve the bound UserEvent dataset and inspect it with `dataset get --id <user-event-dataset-id> --full`.
4. Confirm the target page or module, then map it to `Type`:

| Target | `Type` |
| --- | --- |
| Homepage feed, For You, personalized feed | `for_you` |
| Detail page related items, similar items, item-to-item recommendation | `related` |
| Cart page, shopping-cart recommendation | `shopping_cart` |

5. Confirm `UserEventScenes[]`. These values must exist in the UserEvent `event_scene` enum/candidate values returned by `dataset get --full`.
6. If using `RecommendModel=long_sequence`, confirm `ClickEventTypes[]`; values must exist in the UserEvent `event_type` enum values. Also set a non-empty optimization target such as `ctr`.
7. If the scene needs parent/variant item scope at creation time, set `FilterConfig.ItemTypeFilter`.
8. Run `recommend scene create` with `--confirm-entry-binding`; use `--dry-run` first when the payload is complex.
9. Read back with `recommend scene get` and verify `Type`, `ItemDatasetId`, `UserEventScenes`, model, optimization target, `Status`, and `SceneConfigPhase`.
10. For standard-model scenes with an item dataset, creation can deploy immediately. For long-sequence scenes, treat async workflow status as the deployment indicator before runtime verification.

Creation contract:

- `Type`: `for_you`, `related`, `shopping_cart`.
- `RecommendModel`: `default` or `long_sequence`.
- `RecommendOptimizationTarget`: `ctr` or empty.
- `UserEventScenes[]` values are selected page/module bindings and must come from the bound UserEvent dataset's `event_scene` enum/candidate values.
- `ClickEventTypes[]`, `PositiveEventTypes[]`, and `NegativeEventTypes[]` are create-time behavior event declarations and must come from `event_type` enum values.
- `FilterConfig.ItemTypeFilter` controls parent/variant recommendation scope when needed.

## Scene Update Workflow

Use this workflow when the user wants a persistent change on an existing scene.

1. Run `recommend scene get --application-id <id> --scene-id <id>` and inspect the current scene.
2. Use the Intent Routing table to identify the target field or `Config` area.
3. Consult the `PublishRecommendSceneV2` API reference before writing the final payload.
4. Build the update from the readback as a full scene publish:
   - carry forward `Type`, `Name`, `Description`, `ItemDatasetId`, and `UserEventScenes[]` unless intentionally changing them
   - carry forward existing `Config.ImpressionConfig`, `Config.SuggestConfig`, rule IDs, `BoostBuryCondConfig`, `ShuffleConfig`, `ColdStartConfig`, `MergeConfigs`, `ReasonTemplateConfig`, `FilterConfig`, and `RecAssistantConfig` unless intentionally changing them
   - do not assume absent `Config` children are preserved by the backend
5. If the update references item fields, resolve exact field names through `dataset get --id <item-dataset-id> --full` or `app dataset-config get --application-id <id> --dataset-id <id> --full`.
6. If the update changes `UserEventScenes[]` or enables exposure dedupe, resolve the UserEvent `event_scene` candidates first and pass `--confirm-entry-binding` for the real write.
7. Run `recommend scene update --application-id <id> --scene-id <id> ... --confirm-entry-binding`; use `--dry-run` first when the payload is complex.
8. Run `recommend scene get` again and verify the intended field values exactly.
9. If the user needs proof that runtime behavior changed, run `recommend run` after readback. If output still looks stale, use the Deployment Verification Workflow before changing the config again.

Common top-level update fields:

| Field | Notes |
| --- | --- |
| `Type` | Allowed values are `for_you`, `related`, `shopping_cart`; changing `Type` for an already published scene may be denied. |
| `Name` / `Description` | Metadata only. |
| `ItemDatasetId` | Must refer to an item dataset bound to the application; field-based config may need schema revalidation after changing it. |
| `UserEventScenes[]` | Selected behavior-scene bindings; values come from the bound UserEvent dataset's `event_scene` enum/candidate values. |
| `Config` | `RecommendSceneConfigV2`. Treat as full-publish config and preserve unrelated areas. |

## Behavior Scene Binding Workflow

Use this workflow when the user asks about page/module binding, `UserEventScenes`, or `event_scene`.

1. Identify the bound UserEvent dataset for the application. If unclear, inspect the application/dataset list.
2. Run `dataset get --id <user-event-dataset-id> --full`.
3. Find the schema field whose BizAttr is `user_event_event_scene`; its `EnumerateMeta[].EnumerateValue` contains configured enum values plus offline-received `event_scene` values when available.
4. Present the available values to the user only when a choice is needed. Do not invent values such as `home`, `detail`, or `Details`.
5. Write selected values to the recommend scene's `UserEventScenes[]` through the Scene Update Workflow.
6. Remember the deployment distinction:
   - candidate `event_scene` values come from UserEvent dataset metadata/read-time merge
   - selected `UserEventScenes[]` persist on the recommend scene row
   - deployed scene-to-event-scene routing is written as application-level `event_scene_mapping`

## Deployment Verification Workflow

Use this workflow when the user asks whether a scene is deployed/effective or when runtime output appears stale after an update.

1. Run `recommend scene get --application-id <id> --scene-id <id>` and inspect `Status`, `SceneConfigPhase`, `UserEventScenes`, `ItemDatasetId`, and the changed `Config` area.
2. If the scene is long-sequence, treat non-serving phases as async deployment progress rather than a request/config bug.
3. Check application readiness with `app status` and `app diagnose` before blaming recall quality.
4. Run `recommend run` with the same scene and realistic user/item context.
5. Inspect `rec_results[]`, `extra_info`, recall info, boost status, diversity status, invalid parent items, and omitted params.
6. If persistent readback is correct but runtime still appears stale, report likely online-config propagation/readiness instead of issuing repeated blind updates.

Backend deployment effects to keep in mind:

| Backend effect | Meaning for CLI workflow |
| --- | --- |
| Scene row updated | `recommend scene get` should show the requested persistent fields. |
| `recommend_scene_meta` written under scene namespace | Online runtime metadata was generated for rec-retriever; this is not normally inspected directly by customers. |
| `event_scene_mapping` written under application namespace | Runtime can map a recommend scene to selected behavior scenes for dedupe/behavior filtering. |
| dedupe invert config updated | Impression/exposure dedupe may need supporting behavior data and background processing. |
| scene marked `published` | Persistent publish path completed; runtime may still depend on async data/config propagation. |

## Config Routing Details

| V2 config area | Key fields | Validation notes |
| --- | --- | --- |
| `Config.MaxResults` | Maximum returned item count | Must be `<= 400`. For one request only, prefer `recommend run --page-size`. |
| `Config.FilterRuleId` | Reusable item-filter rule ID | Usually produced by `recommend rule upsert --type filter`; validate the rule with `recommend rule get` before attaching. |
| `Config.ImpressionConfig` | `TimeWindowSeconds`, `MaxSize`, nested `ExposureCfg` | Time windows must be `> 0`; max sizes are `0..30000`; exposure dedupe depends on valid behavior-scene binding. |
| `Config.DegradeRuleId` | Reusable degrade rule ID | Usually produced by rule type `degrade`; backend may ensure a default degrade rule for online scenes. |
| `Config.SuggestConfig.SuggestRawPrompt` | Recommendation prompt text | Preserve the existing prompt unless replacing it is intended. |
| `Config.ForceItemRuleId` | Reusable force-item rule ID | Usually produced by rule type `force_item`; verify exact item IDs against the item dataset. |
| `Config.ShuffleConfig.Rules[]` | `Id`, `Enable`, `Name`, `WindowType`, `WindowSize`, `MaxSize`, `FieldName`, `ShuffleType`, optional `ShuffleExpression` | `WindowType` is `SLIDE` or `TOP`; `ShuffleType` is `dimension` or `expression`; V2 uses `Enable`, not `Disable`; V2 uses `ShuffleExpression`, not `ShuffleExpr`; V2 removed `RecallMax`. |
| `Config.BoostBuryCondConfig.Rules[]` | `Id`, `Enable`, `Name`, `Config`, `Boost` | `Boost` must be in `[-1, 1]`; condition DSL allows at most 2 logic layers. Field names must match item schema casing. |
| `Config.ColdStartConfig` | `Enable`, `ItemConditionType`, `ImportTimeWindowHours`, `ItemFilter`, `ExposureThreshold`, `MaxInjectCount`, `Name` | `ItemConditionType` is `import_time` or `custom_filter`; `import_time` requires `ImportTimeWindowHours > 0`; `custom_filter` requires non-empty `ItemFilter`; numeric thresholds/counts must be non-negative. |
| `Config.MergeConfigs[]` | `Strategy`, `CustomWeights[]` | Strategies: `user_profile_first`, `multimodal_first`, `hot_item_first`, `item_similarity_first`, `custom`. For `custom`, use `CustomWeights[].RecallChannel` and `CustomWeights[].Weight`; channels are `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, `cold_start`; weights must be non-negative and sum to `> 0`; duplicate channels are rejected. |
| `Config.ReasonTemplateConfig` | `Enable`, `Templates[]`, `FallbackReason` | Template channels: `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, `cold_start`. Enabled templates require non-empty `Template`. |
| `Config.FilterConfig.ItemTypeFilter` | `ForParent`, `Filter` | Controls parent/variant recommendation scope. `Filter.field` must match item schema casing. |
| `Config.RecAssistantConfig` | `Enable`, `AssistantRole`, `AnswerStyle`, `FollowUpStyle` | Controls LLM recommendation assistant behavior. |

V2 removed the legacy `Config.BoostBuryConfig`. Do not emit it in new payloads.

## Rule Resource Workflow

Use this workflow when the user explicitly asks to manage a reusable rule, or when the requested scene config references a rule ID.

1. Run `recommend rule list --application-id <id>` with `--types` and dataset filters when known.
2. If updating an existing rule, run `recommend rule get --application-id <id> --rule-id <id>` first because list responses may omit or trim `Config`.
3. Consult the `UpsertRecommendRuleV2` API reference before building the rule payload.
4. Run `recommend rule upsert`; use `--dry-run` first when the payload is complex.
5. Read the rule back with `recommend rule get`.
6. If the user wants the rule to affect a scene, run the Scene Update Workflow to attach the returned `RuleId` to the matching scene config field and publish the scene.

Rule types:

| Rule type | Typical use |
| --- | --- |
| `filter` | Reusable recommendation item filter. Supports dynamic parameters such as `"{{Param}}"`. |
| `search_filter` | Search filter rule used by recommendation workflows. Does not support dynamic parameters. |
| `degrade` | Fallback/degrade behavior. Attach with `Config.DegradeRuleId`. |
| `impression` | Reusable impression/exposure deduplication config. List/get only unless the API reference says it is writable. |
| `suggest` | Reusable suggestion/prompt config. List/get only unless the API reference says it is writable. |
| `user_interest` | User-interest related rule. List/get only unless the API reference says it is writable. |
| `item_cf` | Item-CF related rule. List/get only unless the API reference says it is writable. |
| `force_item` | Forced-item rule. Attach with `Config.ForceItemRuleId`. |
| `boost_bury_cond` | Reusable conditional boost/bury rule. List/get only unless the API reference says it is writable. |
| `cold_start` | Reusable cold-start rule. List/get only unless the API reference says it is writable. |
| `shuffle` | Reusable shuffle/diversity rule. List/get only unless the API reference says it is writable. |
| `rec_reason` | Reusable recommendation reason template. List/get only unless the API reference says it is writable. |

`UpsertRecommendRuleV2` currently allows only `degrade`, `filter`, `search_filter`, and `force_item`. Do not try to upsert the other listed rule types unless the installed CLI/API reference proves they are writable.

## Runtime Verification Workflow

Use this workflow when the user wants to check recommendation output without changing persistent configuration.

1. Confirm `application-id` and `scene-id`.
2. For personalized `for_you` scenes, provide `--user-id` when available.
3. For `related` scenes, provide `--parent-id` when available because results often depend on the parent item context.
4. For shopping-cart style verification, provide the available cart/parent item context supported by the installed `recommend run` command.
5. Use `--page-size` only for this request's result count; do not treat it as a persistent scene default.
6. Inspect the raw response:
   - `rec_results[]`: returned item IDs, display fields, score, boost value, response reason, and recall info.
   - `extra_info.omitted_params[]`: request parameters ignored by the service.
   - `extra_info.boost_status[]` and `extra_info.effective_boost_bury_rule`: boost/bury effects.
   - `extra_info.invalid_parent_items[]`: invalid parent item IDs.
   - `extra_info.diversity_rule`: shuffle/diversity success or failure.
7. If results look wrong, inspect the scene with `recommend scene get` before proposing config changes.

## Usage Note

Use this file as a routing layer only. For command execution:

1. identify the target action here,
2. consult `vs-product-qa`, installed `vs recommend ... --help`, and the matching API reference for enum-like strings and validation constraints,
3. run the concrete command workflow,
4. read the scene or rule back after mutation,
5. run `recommend run` when the user needs runtime proof, not just persistent readback.

Field name case sensitivity: for any config area that references item dataset fields, field names are case-sensitive. Before writing a field name into config, first look up the exact item dataset schema via `dataset get --id <item-dataset-id> --full` or `app dataset-config get --application-id <id> --dataset-id <id> --full`.
