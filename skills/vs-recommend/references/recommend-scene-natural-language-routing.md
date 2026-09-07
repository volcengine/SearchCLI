# Recommend Scene Natural-Language Routing

This reference is for the `vs-recommend` skill. Use it when a user describes a recommend-scene change in natural language and you need to decide which V2 persistent scene field, `RecommendSceneConfigV2` area, deployment check, or rule-resource workflow should be updated.

This is a workflow-oriented routing guide, not a full API reference. SearchCLI recommendation writes use these V2 control-plane actions:

- scene create/list/get/update/delete use `CreateRecommendSceneV2`, `ListRecommendScenesV2`, `GetRecommendSceneV2`, `PublishRecommendSceneV2`, and `DeleteRecommendSceneV2`.
- rule list/get/upsert/delete use `ListRecommendRulesV2`, `GetRecommendRuleV2`, `UpsertRecommendRuleV2`, and `DeleteRecommendRuleV2`.
- runtime verification uses the data-plane `Recommend` API through `vs recommend run`.
- request identity fields use `ApplicationId`, `SceneId`, `RuleId`, `DatasetId`, and `ItemDatasetId`.
- `recommend scene update` publishes through `PublishRecommendSceneV2`.
- Unlike SearchSceneV2, recommend scene updates should be treated as full scene publishes. Start from `vs recommend scene get`, preserve top-level scene fields and unrelated `Config` areas, then change only the requested area. CLI first-level `Config` patches are merged over readback before publish; nested field edits still require the full updated first-level object.
- A successful publish updates persistent scene rows and online runtime config. It writes generated `recommend_scene_meta` under the scene namespace and writes application-level `event_scene_mapping` for `scene-id -> selected UserEventScenes[]`.
- The full list of possible `event_scene` values comes from the bound UserEvent dataset schema plus offline-received values returned by `vs dataset get --id <user-event-dataset-id> --full`. Console finds the UserEvent schema field whose business attribute is UserEventScene and renders its `EnumerateMeta[].EnumerateValue` values; that candidate list is not itself the scene config.
- Use this file only to identify the config area or workflow. Before deciding concrete enum values, value ranges, required sibling fields, or payload shape, consult the matching API reference under `../../vs-product-qa/references/api-references/`.

## Intent Routing

| Natural-language request or intent | Preferred action |
| --- | --- |
| run recommend, verify recommendation, check returned items, first-pass result check | Run `vs recommend run` with the selected scene and user/item context; inspect raw `rec_results` and `extra_info`. |
| recommendation returns empty, no results, bad recall, wrong items | Inspect readiness/status, then run `vs recommend scene get`, then inspect runtime `extra_info`; do not mutate config until the current scene and request context are clear. |
| create a recommend scene, add Guess You Like / 猜你喜欢, add related recommendation / 相关推荐, add shopping-cart recommendation / 购物车推荐 | Use the Scene Create Workflow. Run `vs recommend scene list` first only when the user did not explicitly ask for a new scene. |
| delete recommend scene, remove recommend scene, 删除推荐场景 | Use the Scene Delete Workflow. |
| rename scene, update scene description | Run the Scene Update Workflow and modify `Name` or `Description`; preserve existing `Type`, `ItemDatasetId`, `UserEventScenes`, and full `Config`. |
| change item dataset binding | Run the Scene Update Workflow and modify `ItemDatasetId`; verify the dataset is item type and bound to the application; re-check all field-based rules against the new schema. |
| associated behavior scene, associated behavior page/module, bind behavior scene, change behavior scene to `home`, change behavior scene to `Details`, `event_scene` mapping, 关联行为发生场景 | Use the Behavior Scene Binding Workflow; it resolves candidates from the UserEvent dataset schema, then runs the Scene Update Workflow and modifies `UserEventScenes[]`. |
| what values can I use for behavior scene, list pages/modules, event_scene candidates | Run `vs dataset get --id <user-event-dataset-id> --full` and inspect the UserEvent field whose BizAttr is `user_event_event_scene`; do not update the scene unless the user chooses values. |
| scene type, Guess You Like / 猜你喜欢, related recommendation / 相关推荐, shopping-cart recommendation / 购物车推荐 | For new scenes, map to `Type=for_you`, `related`, or `shopping_cart`; for existing published scenes, changing `Type` may be denied. |
| long sequence model, default model, CTR optimization, optimization target | For create, set `RecommendModel=default` or `long_sequence`; set `RecommendOptimizationTarget=ctr` when required. `PublishRecommendSceneV2` does not accept model/optimization fields. |
| recommendation count limit, returned item count limit, 推荐数量上限 | Run the Scene Update Workflow and modify `Config.MaxResults`; for one request only, use `vs recommend run --page-size <n>`. |
| filter recommendation item scope, filter item range, only recommend/exclude items matching a condition, 筛选物品范围 | Use the Item Filter Rule Workflow; create or reuse a `filter` rule, then attach it with `Config.FilterRuleId`. |
| remove item-scope filtering, clear filter rule, 取消筛选物品范围 | Use the Item Filter Rule Workflow's removal path: clear `Config.FilterRuleId`, verify the scene readback, then delete the explicitly identified old rule only after it is unused. |
| parent/variant recommendation range, recommend only parent items, recommend only child/SKU items | Modify `Config.FilterConfig.ItemTypeFilter` or create-time `FilterConfig.ItemTypeFilter` when the request is for initial scene scope. This is different from reusable item filtering. |
| cold start, new item recall, new item boost, new item injection, 新物品冷启动召回 | Use the Cold Start Workflow and modify `Config.ColdStartConfig`. |
| hot item recall, popular item fallback, fallback strategy, 热门物品召回 | Use the Degrade Rule Workflow for rule type `degrade`, then attach it with `Config.DegradeRuleId`. |
| switch hot-item recall to the default rule, restore default hot-item rule, 切换默认热门规则 | Use the Degrade Rule Workflow's default-rule path: resolve the existing system default rule, attach it, verify the scene readback, and only then delete explicitly requested obsolete rules. |
| merge recall channels, recall channel priority, user profile first, multimodal first, hot item first, item similarity first, custom channel weights, 召回融合策略 | Use the Merge Strategy Workflow and modify `Config.MergeConfigs[]`; in V2 custom weights use `CustomWeights[]`, not a map. |
| boost, bury, promote, suppress, weight up, weight down, 提权, 降权 | Use the Boost/Bury Workflow and modify `Config.BoostBuryCondConfig.Rules[]`. |
| impression dedupe, exposure dedupe, do not repeat recommended items, remove already recommended items, 去除已推荐物品 | Use the Impression Dedupe Workflow and modify `Config.ImpressionConfig`; if exposure dedupe is configured, `UserEventScenes[]` must be valid because publish updates dedupe behavior-scene mapping. |
| diversify recommendation results, avoid too many similar items, shuffle results, dimension shuffle, expression shuffle, 推荐多样性 | Use the Shuffle Workflow and modify `Config.ShuffleConfig.Rules[]`. |
| force specific items, pinned recommendation items, top items, 置顶物品 | Use the Force Item Rule Workflow for rule type `force_item`, then attach it with `Config.ForceItemRuleId`. |
| recommendation reason, reason template, explain why item is recommended, single-item recommendation reason, 单个物品推荐原因 | Use the Reason Template Workflow and modify `Config.ReasonTemplateConfig`. |
| recommendation wording, recommendation prompt, generated summary wording, recommendation assistant, assistant role, answer style, follow-up style, 推荐话术 | Use the Recommendation Wording Workflow and modify `Config.SuggestConfig` and/or `Config.RecAssistantConfig`. |
| search filter rule for recommendation, search-filter DSL | Use the Rule Resource Workflow with rule type `search_filter`; do not treat this as the same DSL as a recommendation item filter because dynamic parameters differ. |
| deployment status, whether scene is online, publish failed, config not effective | Use the Deployment Verification Workflow. |
| inspect reusable rule, create rule, update rule, delete rule | Use the Rule Resource Workflow below; only update a scene when the user also asks to attach or replace a rule in that scene. |

## Scene Create Workflow

Use this workflow when the user wants a new recommend scene.

1. Resolve the item dataset ID. It must be an item dataset bound to the application.
2. If the user did not explicitly ask for a new scene, run `vs recommend scene list --application-id <application-id>` and prefer reuse when a matching scene already exists.
3. If the target `UserEventScenes[]` values are not already explicit and trusted, run `vs dataset get --id <user-event-dataset-id> --full` and inspect the bound UserEvent dataset.
4. Confirm the target page or module, then map it to `Type`:

| Target | `Type` |
| --- | --- |
| Guess You Like / 猜你喜欢 / personalized recommendation | `for_you` |
| Related recommendation / 相关推荐 / similar items / item-to-item recommendation | `related` |
| Shopping-cart recommendation / 购物车推荐 | `shopping_cart` |

5. Confirm `UserEventScenes[]`. These values must exist in the UserEvent `event_scene` enum/candidate values returned by `vs dataset get --id <user-event-dataset-id> --full`; specifically, find the schema field whose business attribute is UserEventScene and use `EnumerateMeta[].EnumerateValue`.
6. If using `RecommendModel=long_sequence`, confirm `ClickEventTypes[]`; values must exist in the UserEvent `event_type` enum values. Also set a non-empty optimization target such as `ctr`.
7. If the scene needs parent/variant item scope at creation time, set `FilterConfig.ItemTypeFilter`.
8. Run `vs recommend scene create ... --confirm-entry-binding`; use `--dry-run` only after required values are resolved and before the real create.
9. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Type`, `ItemDatasetId`, `UserEventScenes`, model, optimization target, `Status`, and `SceneConfigPhase`.
10. For standard-model scenes with an item dataset, creation can deploy immediately. For long-sequence scenes, treat async workflow status as the deployment indicator before runtime verification.

Creation contract:

- `Type`: `for_you`, `related`, `shopping_cart`.
- UI labels map to V2 values as: 猜你喜欢 -> `for_you`, 相关推荐 -> `related`, 购物车推荐 -> `shopping_cart`.
- `RecommendModel`: `default` or `long_sequence`.
- `RecommendOptimizationTarget`: `ctr` or empty.
- `UserEventScenes[]` values are selected page/module bindings and must come from the bound UserEvent dataset's `event_scene` enum/candidate values.
- `ClickEventTypes[]`, `PositiveEventTypes[]`, and `NegativeEventTypes[]` are create-time behavior event declarations and must come from `event_type` enum values.
- `FilterConfig.ItemTypeFilter` controls parent/variant recommendation scope when needed.

## Scene Update Workflow

Use this workflow when the user wants a persistent change on an existing scene.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and inspect the current scene.
2. Use the Intent Routing table to identify the target field or `Config` area.
3. Consult the `PublishRecommendSceneV2` API reference before writing the final payload.
4. Build the update from the readback as a full scene publish:
   - carry forward `Type`, `Name`, `Description`, `ItemDatasetId`, and `UserEventScenes[]` unless intentionally changing them
   - carry forward existing `Config.ImpressionConfig`, `Config.SuggestConfig`, rule IDs, `BoostBuryCondConfig`, `ShuffleConfig`, `ColdStartConfig`, `MergeConfigs`, `ReasonTemplateConfig`, `FilterConfig`, and `RecAssistantConfig` unless intentionally changing them
   - replace only first-level `Config` sections such as `RecAssistantConfig`, `ImpressionConfig`, or `MergeConfigs`; if changing a nested field, construct and send the full updated first-level section
   - do not assume absent `Config` children are preserved by the backend
5. If the update references item fields, run `vs dataset get --id <item-dataset-id> --full` and resolve exact field names from the item dataset schema.
6. If the update changes `UserEventScenes[]` or enables exposure dedupe, resolve the UserEvent `event_scene` candidates first and pass `--confirm-entry-binding` for the real write.
7. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> ... --confirm-entry-binding`; use `--dry-run` only after required read steps and before the real publish.
8. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` again and verify the intended field values exactly.
9. If the user needs proof that runtime behavior changed, run `vs recommend run` after readback. If output still looks stale, use the Deployment Verification Workflow before changing the config again.

Common top-level update fields:

| Field | Notes |
| --- | --- |
| `Type` | Allowed values are `for_you`, `related`, `shopping_cart`; changing `Type` for an already published scene may be denied. |
| `Name` / `Description` | Metadata only. |
| `ItemDatasetId` | Must refer to an item dataset bound to the application; field-based config may need schema revalidation after changing it. |
| `UserEventScenes[]` | Selected behavior-scene bindings; values come from the bound UserEvent dataset's `event_scene` enum/candidate values. |
| `Config` | `RecommendSceneConfigV2`. Treat as full-publish config and preserve unrelated areas. CLI `--config` may be a full config or first-level patch merged over readback; it is not a nested JSONPath patch. |

## Scene Delete Workflow

Use this workflow when the user wants to delete an existing recommend scene.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` to confirm the exact target scene.
2. Run `vs recommend scene delete --application-id <application-id> --scene-id <scene-id>`; use `--dry-run` only after step 1 and before the real delete.
3. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and expect `ResourceNotFound.RecommendScene`.

## Behavior Scene Binding Workflow

Use this workflow when the user asks about page/module binding, `UserEventScenes`, or `event_scene`.

1. Identify the bound UserEvent dataset for the application. If unclear, inspect the application/dataset list.
2. Run `vs dataset get --id <user-event-dataset-id> --full`.
3. Find the schema field whose BizAttr/business attribute is `user_event_event_scene`.
4. Read candidates from that field's `EnumerateMeta[].EnumerateValue`. Console's `BhvSceneTypes` dropdown uses these values, not hard-coded page names.
5. Match the user's requested page/module text to one or more returned candidate values. Matching is case-sensitive for the final written value: if the user says `home`, write `home`; if the candidate is `Details`, write `Details`.
6. Present the available values to the user only when the requested value is missing or ambiguous. Do not invent values such as `home`, `detail`, or `Details`.
7. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` as the full publish base.
8. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --user-event-scenes <selected-values> --confirm-entry-binding`.
9. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `UserEventScenes[]`.
10. Remember the deployment distinction:
   - candidate `event_scene` values come from UserEvent dataset metadata/read-time merge
   - selected `UserEventScenes[]` persist on the recommend scene row
   - deployed scene-to-event-scene routing is written as application-level `event_scene_mapping`

## Item Filter Rule Workflow

Use this workflow for `筛选物品范围` or reusable item-scope filters.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` to identify the scene `ItemDatasetId`.
2. Run `vs dataset get --id <item-dataset-id> --full`.
3. Confirm every requested filter `field` exists and is filterable; copy field casing exactly.
4. Run `vs recommend rule list --application-id <application-id> --types filter --dataset-id <item-dataset-id>`.
5. Create the new rule with `vs recommend rule upsert --application-id <application-id> --type filter --dataset-id <item-dataset-id> --config <filter-dsl>`; use `--dry-run` only after steps 1-4 and before the real upsert.
6. Run `vs recommend rule get --application-id <application-id> --rule-id <rule-id>` to explicitly confirm the rule was created successfully, including the rule type, dataset binding, and filter DSL.
7. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` as the full publish base.
8. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-filter-rule-id> --confirm-entry-binding`.
9. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Config.FilterRuleId`.

For removing an item filter and cleaning up its rule:

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and resolve the exact bound `Config.FilterRuleId`.
2. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-empty-filter-rule-id> --confirm-entry-binding`, preserving all unrelated scene fields and config areas.
3. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Config.FilterRuleId` is empty.
4. Run `vs recommend rule get --application-id <application-id> --rule-id <old-filter-rule-id>` and verify `Used=false`.
5. Run `vs recommend rule delete --application-id <application-id> --rule-id <old-filter-rule-id>`; use `--dry-run` only after step 4 and before the real delete.
6. Run `vs recommend rule get --application-id <application-id> --rule-id <old-filter-rule-id>` and expect `ResourceNotFound.RecommendRule`.

## Degrade Rule Workflow

Use this workflow for `热门物品召回`, hot item fallback, or degrade/fallback behavior.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` to identify `ItemDatasetId`.
2. Choose exactly one sorting mode:
   - behavior statistics: set `SortType="EventAccumulation"`, choose `EventType` values from the UserEvent enum, set `TimeWindowSeconds`, and map heat-score statements such as "每次点击热度加 2 分" to exact `EventScores[].EventType` and `Weight` values
   - item field: set `SortType="ItemField"` with a complete `ItemFieldSort`; require a numeric or time-like sortable field from the item dataset schema and copy its casing exactly; omit event-score, time-window, and fallback fields
3. For behavior-statistics mode, run `vs dataset get --id <user-event-dataset-id> --full`, find the UserEvent item primary-key field whose business attribute is UserEventItemPK and the event type field whose business attribute is UserEventType. `ResultDimension` is derived from that UserEventItemPK field by the V2 backend; do not ask the user to provide it or infer it from a display name. Verify the derived field in rule readback.
4. For item-field mode, run `vs dataset get --id <item-dataset-id> --full`; do not require a UserEvent schema read just to build `ItemFieldSort`.
5. For behavior-statistics mode, set the top-level `EventType` to the primary event and include it in `EventScores[]`. Every `Weight` must be finite and in `[-100, 100]`; do not silently use the UI default weight.
6. If behavior-statistics mode also enables item-field fallback when hot items are insufficient, run `vs dataset get --id <item-dataset-id> --full`, then set `Fallback.Enable=true` and provide the complete `Fallback.ItemFieldSort` with `SortField` and `SortOrder` (`Asc` or `Desc`). Apply the same numeric/time-like field validation. Use `Fallback.Enable=false` only when the user explicitly disables this fallback.
7. Run `vs recommend rule upsert --application-id <application-id> --type degrade --dataset-id <user-event-dataset-id> --item-dataset-id <item-dataset-id> --config <degrade-config>`; use `--dry-run` only after the mode-specific read steps above and before the real upsert. Always pass `--item-dataset-id`; console lists hot-item recall candidates by both the UserEvent dataset and item dataset, so a rule without `ItemDatasetId` can be attached by ID but will not appear in the dropdown.
8. Run `vs recommend rule get --application-id <application-id> --rule-id <rule-id>` and verify the selected `SortType` plus all mode-specific fields.
9. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` as the full publish base.
10. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-degrade-rule-id> --confirm-entry-binding`.
11. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Config.DegradeRuleId`.
12. Replacing a rule binding does not imply deleting the previously bound rule. Keep replaced rules unless the user explicitly requests cleanup.

For switching back to the system default rule:

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>`.
2. Run `vs recommend rule list --application-id <application-id> --types degrade --dataset-id <user-event-dataset-id> --item-dataset-id <item-dataset-id>` and resolve the existing system-generated default rule from the list; do not hard-code its `RuleId` or create a replacement. If more than one candidate appears to be the default, stop for clarification unless one is unambiguous.
3. Run `vs recommend rule get --application-id <application-id> --rule-id <default-rule-id>` and verify its application, type, UserEvent dataset, and item dataset before publishing.
4. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` as the full publish base.
5. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-default-degrade-rule-id> --confirm-entry-binding`.
6. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify the default rule is bound before attempting cleanup.
7. If the user explicitly asks to delete replaced rules, run `vs recommend rule get --application-id <application-id> --rule-id <old-rule-id>` for each exact old rule and require `Used=false`; never delete the system default rule or infer cleanup targets from a name prefix alone.
8. Run `vs recommend rule delete --application-id <application-id> --rule-id <old-rule-id>` for each explicitly requested unreferenced rule.
9. Optionally run `vs recommend rule list --application-id <application-id> --types degrade --dataset-id <user-event-dataset-id> --item-dataset-id <item-dataset-id>` to verify that those exact IDs are absent; `vs recommend rule get --application-id <application-id> --rule-id <old-rule-id>` returning `ResourceNotFound.RecommendRule` is also valid deletion proof.

## Force Item Rule Workflow

Use this workflow for `置顶物品` or forced item injection.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` to identify `ItemDatasetId`.
2. Run `vs dataset get --id <item-dataset-id> --full` and resolve the item primary-key field.
3. Verify each requested item ID exists when item lookup is available; otherwise use only explicit item IDs provided by the user.
4. Build a `force_item` config with `EffectDuration` (`request` or `session`), `Enable`, and `Items[]` containing positive unique `Position` values.
5. Run `vs recommend rule upsert --application-id <application-id> --type force_item --dataset-id <item-dataset-id> --config <force-item-config>`; use `--dry-run` only after steps 1-4 and before the real upsert.
6. Run `vs recommend rule get --application-id <application-id> --rule-id <rule-id>`.
7. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` as the full publish base.
8. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-force-item-rule-id> --confirm-entry-binding`.
9. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Config.ForceItemRuleId`.

## Cold Start Workflow

Use this workflow for `新物品冷启动召回`.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and preserve the full scene config. Use this readback as the authoritative source of `ItemDatasetId`; this step must run before any item-schema lookup even when an item dataset ID is available from context.
2. Treat the two item-condition modes as mutually exclusive:
   - import time: set `ItemConditionType="import_time"` and `ImportTimeWindowHours > 0`; omit `ItemFilter`
   - item fields: use `ItemConditionType="custom_filter"` with a non-empty Viking Filter DSL `ItemFilter`, and omit `ImportTimeWindowHours` because it is not used in this mode
3. For `custom_filter`, run `vs dataset get --id <item-dataset-id-from-step-1> --full`. Every `ItemFilter.field` must match the item schema exactly, including casing, and must be filterable in the app data config. Do not infer or normalize field names from natural language.
4. Build `ItemFilter` in the same shape that the console emits. A single equality condition such as `category = 短袖` must be a flat rule: `{"field":"category","op":"must","conds":["短袖"]}`. Do not add an outer group for one condition, and do not use condition-tree syntax such as `{"op":"and","conds":[{"field":"category","op":"eq","value":"短袖"}]}`. Operator mapping: `=` / `==` / `in` -> `must`; `!=` / `not_in` -> `must_not`; range operators -> `range`.
5. Build and send the complete first-level `ColdStartConfig` object, including `Enable`, `Name`, `ItemConditionType`, the selected condition field (`ImportTimeWindowHours` or `ItemFilter`), `ExposureThreshold`, and `MaxInjectCount`. Do not send a nested `ItemFilter` patch by itself.
6. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-cold-start-config> --confirm-entry-binding`; use `--dry-run` only after required read steps and before the real publish.
7. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify the complete `Config.ColdStartConfig` readback, including that the inactive condition field is empty or zero.

## Merge Strategy Workflow

Use this workflow for `召回融合策略`.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and inspect `Type`.
2. Choose only strategies/channels valid for that scene type: `for_you` must not use `item_similarity`; `shopping_cart` supports only `item_similarity_first` or `custom`.
3. For `Strategy="custom"`, build `CustomWeights[]` from the console percentage model: write each `Weight` as `percent / 100` (for example, `35%` -> `0.35`) and make the UI-equivalent weights sum to `1`. Avoid duplicate `RecallChannel` values. For `for_you`, use the console channels `item_cf`, `user_profile`, `multimodal`, and `hot_item`; do not include `item_similarity` or `cold_start`.
4. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-merge-configs> --confirm-entry-binding`.
5. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Config.MergeConfigs[]`.

## Boost/Bury Workflow

Use this workflow for `提权、降权`.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` to identify `ItemDatasetId`.
2. Run `vs dataset get --id <item-dataset-id> --full` and confirm every condition field exists and has a compatible operator.
3. Build the complete desired `Config.BoostBuryCondConfig.Rules[]`; omit `Id` only for new rules and let the backend generate stable positive IDs. When appending, preserve existing rules and their generated `Id` values from the scene readback. When replacing, submit exactly the final rule set. To remove all boost/bury behavior, submit `{"BoostBuryCondConfig":{"Rules":[]}}`.
4. Treat boost/bury as scene-inline config, not independent `recommend rule` resources. Do not run `vs recommend rule delete` when clearing boost/bury.
5. Use `Boost > 0` for promotion and `Boost < 0` for suppression; values must be in `[-1, 1]`.
6. Do not use query-dynamic operators such as `query_equal`, `query_in`, or `query_partial_match` in recommend scene boost/bury.
7. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-boost-bury-rules> --confirm-entry-binding`.
8. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify generated rule IDs and rule content in readback.

## Impression Dedupe Workflow

Use this workflow for `去除已推荐物品`.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and preserve the existing `Config.ImpressionConfig`.
2. Set `TimeWindowSeconds > 0` and `MaxSize` in `0..30000`.
3. If changing `ExposureCfg`, also ensure `UserEventScenes[]` is valid through the Behavior Scene Binding Workflow.
4. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-impression-config> --confirm-entry-binding`.
5. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Config.ImpressionConfig`.

## Shuffle Workflow

Use this workflow for `推荐多样性`.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` to identify `ItemDatasetId`.
2. Run `vs dataset get --id <item-dataset-id> --full` and confirm the shuffle field exists.
3. Build `Config.ShuffleConfig.Rules[]`; omit `Id` for new rules and let the backend generate stable positive IDs.
4. For dimension shuffle, set `ShuffleType="dimension"` and `FieldName`.
5. For expression shuffle, set `ShuffleType="expression"` and a non-empty `ShuffleExpression`.
6. Set `WindowType` to `SLIDE` or `TOP`, with `WindowSize > 0`, `MaxSize > 0`, and `WindowSize >= MaxSize`.
7. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-shuffle-rules> --confirm-entry-binding`.
8. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify generated rule IDs and rule content in readback.

## Reason Template Workflow

Use this workflow for `单个物品推荐原因`.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and inspect scene `Type`.
2. Choose recall channels valid for the scene type; `for_you` reason channels typically exclude `item_similarity`.
3. If a template references `item.*`, run `vs dataset get --id <item-dataset-id> --full` and verify the exact field path. Do not reference fields under `array<object>` paths.
4. Build the full `Config.ReasonTemplateConfig` object with `Enable`, `Templates[]`, and `FallbackReason`.
5. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-reason-template-config> --confirm-entry-binding`.
6. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Config.ReasonTemplateConfig`.

## Recommendation Wording Workflow

Use this workflow for `推荐话术` and recommendation assistant settings.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and preserve the full scene config.
2. If the user changes the generated recommendation wording prompt, update `Config.SuggestConfig.SuggestRawPrompt`.
3. If the user changes the assistant behavior, send a full `Config.RecAssistantConfig` object with `Enable`, `AssistantRole`, `AnswerStyle`, and `FollowUpStyle`; do not patch only a nested field.
4. Run `vs recommend scene update --application-id <application-id> --scene-id <scene-id> --config <config-with-wording-or-assistant-config> --confirm-entry-binding`.
5. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify `Config.SuggestConfig` and/or `Config.RecAssistantConfig`.

## Deployment Verification Workflow

Use this workflow when the user asks whether a scene is deployed/effective or when runtime output appears stale after an update.

1. Run `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and inspect `Status`, `SceneConfigPhase`, `UserEventScenes`, `ItemDatasetId`, and the changed `Config` area.
2. If the scene is long-sequence, treat non-serving phases as async deployment progress rather than a request/config bug.
3. Run `vs app status --application-id <application-id>` and `vs app diagnose --application-id <application-id>` before blaming recall quality.
4. Run `vs recommend run --application-id <application-id> --scene-id <scene-id> ...` with the same scene and realistic user/item context.
5. Inspect `rec_results[]`, `extra_info`, recall info, boost status, diversity status, invalid parent items, and omitted params.
6. If persistent readback is correct but runtime still appears stale, report likely online-config propagation/readiness instead of issuing repeated blind updates.

Backend deployment effects to keep in mind:

| Backend effect | Meaning for CLI workflow |
| --- | --- |
| Scene row updated | `vs recommend scene get` should show the requested persistent fields. |
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
| `Config.MergeConfigs[]` | `Strategy`, `CustomWeights[]` | Strategies: `for_you` supports `user_profile_first`, `multimodal_first`, `hot_item_first`, `custom`; `related` also supports `item_similarity_first`; `shopping_cart` supports only `item_similarity_first` and `custom`. For `custom`, use `CustomWeights[].RecallChannel` and `CustomWeights[].Weight`; channels are `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, `cold_start`; weights must be non-negative and sum to `> 0`; duplicate channels are rejected. `item_similarity` is not allowed for `for_you`. |
| `Config.ReasonTemplateConfig` | `Enable`, `Templates[]`, `FallbackReason` | Template channels: `multimodal`, `user_profile`, `item_cf`, `hot_item`, `item_similarity`, `cold_start`. Enabled templates require non-empty `Template`. |
| `Config.FilterConfig.ItemTypeFilter` | `ForParent`, `Filter` | Required when the item dataset schema has an ItemType business attribute; invalid when the schema has no ItemType business attribute. The schema must also have the paired ParentId business attribute, the ItemType field must be filterable, and `Filter.field` must match item schema casing. |
| `Config.RecAssistantConfig` | `Enable`, `AssistantRole`, `AnswerStyle`, `FollowUpStyle` | Controls LLM recommendation assistant behavior. |

## Rule Resource Workflow

Use this workflow when the user explicitly asks to manage a reusable rule, or when the requested scene config references a rule ID.

1. Run `vs recommend rule list --application-id <application-id>` with the exact `--types` and dataset filters required by the rule type.
2. If updating an existing rule, run `vs recommend rule get --application-id <application-id> --rule-id <rule-id>` first because list responses may omit or trim `Config`.
3. Consult the `UpsertRecommendRuleV2` API reference before building the rule payload.
4. Run `vs recommend rule upsert --application-id <application-id> --type <rule-type> --dataset-id <dataset-id> --config <rule-config>`; use `--dry-run` only after the required list/get checks and before the real upsert.
5. Run `vs recommend rule get --application-id <application-id> --rule-id <rule-id>`.
6. If the user wants the rule to affect a scene, run the matching scene workflow above to attach the returned `RuleId` to the matching scene config field and publish the scene.
7. For deletion, first detach or replace every scene reference and verify the updated scene readback. Then run `vs recommend rule get --application-id <application-id> --rule-id <rule-id>` and require `Used=false` before `vs recommend rule delete`.
8. Do not delete a replaced rule automatically. Delete only rule IDs explicitly requested by the user, then run the same filtered `vs recommend rule list ...` command and verify their absence.

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
4. For shopping-cart style verification, provide the available cart/parent item context supported by the installed `vs recommend run` command.
5. Use `--page-size` only for this request's result count; do not treat it as a persistent scene default.
6. Inspect the raw response:
   - `rec_results[]`: returned item IDs, display fields, score, boost value, response reason, and recall info.
   - `extra_info.omitted_params[]`: request parameters ignored by the service.
   - `extra_info.boost_status[]` and `extra_info.effective_boost_bury_rule`: boost/bury effects.
   - `extra_info.invalid_parent_items[]`: invalid parent item IDs.
   - `extra_info.diversity_rule`: shuffle/diversity success or failure.
7. If results look wrong, inspect the scene with `vs recommend scene get` before proposing config changes.

## Usage Note

Use this file as a routing layer only. For command execution:

1. identify the target action here,
2. consult `vs-product-qa`, installed `vs recommend ... --help`, and the matching API reference for enum-like strings and validation constraints,
3. run the concrete command workflow,
4. read the scene or rule back after mutation,
5. run `vs recommend run` when the user needs runtime proof, not just persistent readback.

Field name case sensitivity: for any config area that references item dataset fields, field names are case-sensitive. Before writing a field name into config, first look up the exact item dataset schema via `vs dataset get --id <item-dataset-id> --full`.
