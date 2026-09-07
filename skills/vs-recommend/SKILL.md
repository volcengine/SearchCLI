---
name: vs-recommend
description: "Recommend runtime and V2 scene management: run recommendation requests, manage recommend scenes and rules, and verify the deployed recommendation path."
category: recommend
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: recommend run, recommend debug, recommend scene, recommend rule, personalized recommend, behavior scene binding, event_scene, user_event_scenes, cold start, boost bury, shuffle, merge recall, reason template, rec assistant
commands: recommend run, recommend scene create, recommend scene list, recommend scene get, recommend scene update, recommend scene delete, recommend rule list, recommend rule get, recommend rule upsert, recommend rule delete, dataset get, app dataset-config get, app status, app diagnose
---

# Viking Recommend

## When to Use

Use this skill for:

- recommendation runtime checks
- V2 recommend scene inspection, creation, publishing, deletion, and deployment verification
- V2 recommend rule inspection and management
- diagnosing whether bad recommendation results come from scene config, behavior-scene binding, user context, parent/item context, data readiness, or online config propagation
- separating persistent scene defaults from request-only runtime parameters

If the user asks a general product/API/auth/pricing question rather than a recommend workflow action, temporarily hand off to `vs-product-qa` and return here only after the grounded product answer is complete.

## Version Check

Before starting this skill workflow, run `vs version check --json`. Continue only when `status` is `up-to-date`. If `status` is `update-available`, stop and tell the user to update the cloned `vs` repository, then run `git pull --ff-only`, `bash ./scripts/install.sh`, and `bash ./scripts/install-skills.sh all --target auto --force` (PowerShell: `scripts/install.ps1` and `scripts/install-skills.ps1`). If the status is `unknown`, stop and report that the CLI version could not be verified.

## Preconditions

- an `application-id` is available
- runtime checks need a `scene-id` and usually at least one of `user-id`, `parent-id`, or shopping-cart item context
- scene creation needs an item dataset bound to the application and at least one behavior scene value from the bound UserEvent dataset; when the value is not explicit, resolve it with `vs dataset get --id <user-event-dataset-id> --full` from the UserEvent schema field whose business attribute is UserEventScene
- if the scene does not exist yet, inspect the existing scene list first and only create a new scene when reuse is not possible
- the agent should treat the installed CLI behavior as authoritative when help text, skill text, and runtime behavior disagree

## Scope

Before changing anything, decide whether the user wants:

- a temporary runtime verification with `vs recommend run`
- a persistent V2 recommend scene publish
- a new V2 recommend scene for a target page or module
- a reusable V2 recommend rule change
- a readiness, binding, or online-config diagnosis for a failing recommendation app

This skill stays at the recommendation workflow level. Do not embed low-level API field mappings, payload design, or enum interpretation here. When a concrete command needs exact parameters, first consult `vs-product-qa` and the matching API reference. For `recommend scene update`, the authoritative update contract is `PublishRecommendSceneV2`.

## V2 API Semantics

Recommend scene and rule commands now use the V2 OpenAPI surface.

- `recommend scene create` -> `CreateRecommendSceneV2`
- `recommend scene list` -> `ListRecommendScenesV2`
- `recommend scene get` -> `GetRecommendSceneV2`
- `recommend scene update` -> `PublishRecommendSceneV2`
- `recommend scene delete` -> `DeleteRecommendSceneV2`
- `recommend rule list` -> `ListRecommendRulesV2`
- `recommend rule get` -> `GetRecommendRuleV2`
- `recommend rule upsert` -> `UpsertRecommendRuleV2`
- `recommend rule delete` -> `DeleteRecommendRuleV2`

V2 naming differences:

- request IDs use `ApplicationId`, `SceneId`, `RuleId`, `DatasetId`, `ItemDatasetId`
- behavior-scene binding is `UserEventScenes[]`; use `--user-event-scenes`
- `RecommendModel` is a string: `default` or `long_sequence`
- `RecommendOptimizationTarget` is a string: `ctr` or empty
- create/publish/delete/upsert write APIs support `DryRun`
- scene lists return `Scenes[]`; rule lists return `Rules[]`
- rule type values are snake_case in V2, for example `user_interest`, `item_cf`, `force_item`, `boost_bury_cond`, `cold_start`, `rec_reason`

## Deployment Semantics

Recommend scene deployment is not just a row update.

- `recommend scene update` calls `PublishRecommendSceneV2`. The backend validates the scene, persists the updated scene/config/rule bindings, generates online recommendation metadata, writes runtime config, and marks the scene as `published`.
- Standard-model scene creation with an item dataset can synchronously deploy through the same online path. Long-sequence scene creation submits an async workflow; treat `SceneConfigPhase` / `Status` as part of the deployment state.
- Online deployment writes generated `recommend_scene_meta` under the scene namespace in ConfigCenter; DTS then syncs it to the online runtime store used by rec-retriever.
- Deployment also updates application-level behavior-scene mapping under `event_scene_mapping`: it stores `scene-id -> selected UserEventScenes[]`. This is the selected binding, not the full list of possible `event_scene` values.
- Deployment updates deduplication/invert configs when impression/exposure dedupe is enabled.
- `GetRecommendSceneExpConfigV2` is a preview/experience-config helper and is not a public CLI/OpenAPI workflow.

Important difference from search scenes: SearchSceneV2 supports partial `Config` publish semantics. Recommend `PublishRecommendSceneV2` should be treated as a full scene publish. Build update payloads from the current `vs recommend scene get` response and preserve unrelated config areas unless the user explicitly asks to replace them. When using the CLI, `--config` and advanced flags are merged over the readback at the first `Config` level; if changing a nested field, provide the full updated first-level object.

## Commands

- `vs recommend run`: send a production-style recommendation request
- `vs recommend scene create` / `vs recommend scene list` / `vs recommend scene get`: manage V2 recommend scenes
- `vs recommend scene update`: publish V2 recommend scene metadata and `RecommendSceneConfigV2`
- `vs recommend scene delete`: delete and undeploy a recommend scene
- `vs recommend rule list` / `vs recommend rule get`: inspect V2 reusable recommend rules
- `vs recommend rule upsert` / `vs recommend rule delete`: create, update, or delete V2 reusable recommend rules
- `vs dataset get --full`: inspect item/UserEvent schema, enum metadata, and exact field casing
- `vs app dataset-config get --full`: inspect app-bound dataset field config when a non-workflow diagnostic explicitly needs app-level config
- `vs app status` / `vs app diagnose`: inspect readiness before blaming runtime results

## Workflow

1. Start by determining whether the user wants:
   - a runtime recommendation check
   - a persistent recommend scene publish
   - a new recommend scene
   - a reusable recommend rule change
   - a readiness, behavior-scene binding, or online-config diagnosis
2. Before running any concrete command, consult `vs-product-qa` to confirm the current command behavior and exact parameter requirements.
3. For runtime checks, use `vs recommend run` first, then inspect `result.rec_results`, `extra_info`, recall info, boost status, diversity status, and invalid parent items from the raw response.
4. For natural-language scene-change requests, use `references/recommend-scene-natural-language-routing.md` to identify the target V2 field, config area, deployment check, or rule-resource workflow before running resource-specific read/write commands such as `vs dataset get`, `vs recommend rule list/get/upsert/delete`, or `vs recommend scene update`.
5. For persistent changes to an existing scene, run the selected workflow's first `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` step before any later schema, dataset, rule, or publish command. Treat the readback as the base payload for a full publish; first-level `Config` sections may be replaced, but nested field edits require a full updated first-level section.
6. Before building a `recommend scene create` or `recommend scene update` payload, consult the matching V2 API reference. The routing reference identifies where to edit; it is not sufficient for final payload values.
7. Before creating or updating a recommend scene, resolve the target page/module and the required `UserEventScenes`. For real writes, pass `--confirm-entry-binding`.
8. Resolve dataset facts before writing:
   - use `vs dataset get --id <user-event-dataset-id> --full` to inspect `event_scene` and `event_type` enum values; for `event_scene`, find the schema field whose business attribute is UserEventScene and read `EnumerateMeta[].EnumerateValue`
   - use `vs dataset get --id <item-dataset-id> --full` for exact item field casing and filterable fields
9. For rule-resource changes, follow the concrete command sequence in `references/recommend-scene-natural-language-routing.md`; do not replace a required `vs recommend rule get` step with `vs recommend rule list`, or replace a required `vs recommend scene get` step with `vs recommend scene list`.
10. After every scene mutation, immediately read the scene back with `vs recommend scene get --application-id <application-id> --scene-id <scene-id>` and verify that the intended persistent fields are visible.
11. When deployment matters, run a runtime check with `vs recommend run` after readback. If results do not reflect the update, inspect readiness/status and propagation before changing config again.
12. If command behavior conflicts with the skill text or `--help`, trust the installed CLI behavior first, and only then inspect repository code when needed to explain or fix the gap.

## References

- `references/recommend-scene-natural-language-routing.md`: workflow-oriented mapping from natural-language recommend-scene requests to the first V2 config area, scene field, deployment check, or rule-resource workflow you should inspect
- `../vs-product-qa/references/api-references/control-plane/scene/CreateRecommendSceneV2.md`: authoritative V2 recommend-scene creation fields, enum values, and behavior-event constraints
- `../vs-product-qa/references/api-references/control-plane/scene/PublishRecommendSceneV2.md`: authoritative V2 recommend-scene publish payload, `Config` fields, enum-like string values, and validation notes
- `../vs-product-qa/references/api-references/control-plane/scene/GetRecommendSceneV2.md`: authoritative V2 recommend-scene readback shape
- `../vs-product-qa/references/api-references/control-plane/scene/UpsertRecommendRuleV2.md`: authoritative V2 reusable recommend-rule upsert payload and rule type values
- `../vs-product-qa/references/api-references/data-plane/online-api/Recommend.md`: authoritative online recommendation request and response contract for `vs recommend run`

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- Before executing any concrete `vs ...` command in this recommend workflow, first consult `vs-product-qa` to verify the current command surface, required flags, payload fields, input format, and allowed values. Only after that check may you finalize parameters and run the command.
- Numbered workflows in `references/recommend-scene-natural-language-routing.md` are ordered command sequences. Execute their required `vs ...` commands serially in the documented order; do not parallelize, reorder, or replace required read commands with list-style alternatives unless the workflow explicitly says the step is optional.
- The first resource command in a numbered workflow is mandatory even when IDs are already available from test context or user input. Do not run later dataset/schema/rule reads before earlier `vs recommend scene get` steps; use the scene readback as the authoritative source for scene-bound IDs such as `ItemDatasetId`.
- When a numbered rule-attachment workflow creates a reusable rule with `vs recommend rule upsert` and then lists `vs recommend rule get`, the rule readback is a required in-flow validation step to explicitly confirm the rule was created successfully before continuing to the next numbered step.
- Before building a `recommend scene create` or `recommend scene update` payload, consult the matching V2 API reference. The routing reference only identifies the config area; it is not sufficient for final payload values.
- Recommend scene update is a full publish workflow. Start from `vs recommend scene get`, carry forward top-level fields and existing `Config`, then modify only the requested area. The CLI may accept first-level `Config` patches and merge them over readback; do not send or recommend tiny nested patches such as only `RecAssistantConfig.AnswerStyle`.
- When the user request includes a scene type, model, optimization, strategy, channel, or mode qualifier such as `for_you`, `related`, `shopping_cart`, `long_sequence`, `ctr`, `custom merge`, `cold_start`, `item_similarity`, `always`, `boost`, or `bury`, do not treat enabling the feature as sufficient. Set the corresponding field explicitly and verify that exact value in the readback response.
- **Field name case sensitivity**: All item dataset field names used in recommendation filters, `ShuffleConfig.Rules[].FieldName`, `ShuffleConfig.Rules[].ShuffleExpression.field`, `BoostBuryCondConfig.Rules[].Config.field`, `ColdStartConfig.ItemFilter.field`, `FilterConfig.ItemTypeFilter.Filter.field`, and rule `Config` are **case-sensitive**. Before writing any field name into config, first complete any earlier `vs recommend scene get` step required by the selected workflow, then run `vs dataset get --id <item-dataset-id> --full` with the dataset ID from that readback and copy the field name exactly as it appears there. If the field name does not match the schema, stop and ask the user to confirm which field they mean instead of guessing.
- `UserEventScenes[]` values must come from the bound UserEvent dataset's `event_scene` enum values. In console, the dropdown is populated from the UserEvent schema field whose business attribute is UserEventScene, using `EnumerateMeta[].EnumerateValue` returned by `GetDataset`; mirror that with `vs dataset get --id <user-event-dataset-id> --full`. `ClickEventTypes[]`, `PositiveEventTypes[]`, and `NegativeEventTypes[]` values must come from that dataset's `event_type` enum values.
- `event_scene` option discovery is read-time metadata: `vs dataset get --id <user-event-dataset-id> --full` returns schema enum metadata plus offline-received event_scene values when available. Do not assume those candidate values are written to scene config until the user selects them and publishes the scene.
- `FilterConfig.ItemTypeFilter` is schema-dependent: it is required when the item dataset has an ItemType business attribute, invalid when the dataset has no ItemType business attribute, and requires the paired ParentId business attribute plus a filterable ItemType field.
- For cold-start item-field filtering, first run `vs dataset get --id <item-dataset-id> --full`, use `ItemConditionType="custom_filter"` with a non-empty `ItemFilter` whose field names exactly match filterable schema fields, and submit the complete first-level `ColdStartConfig` object. Do not combine `custom_filter` with an import-time condition or send only a nested `ItemFilter` patch.
- `ColdStartConfig.ItemFilter` uses the console item-filter DSL directly. For a single equality condition such as `category = 短袖`, send exactly `{"field":"category","op":"must","conds":["短袖"]}`. Do not wrap a single condition in `{"op":"and","conds":[...]}`, and do not use condition-tree operators such as `{"field":"category","op":"eq","value":"短袖"}`. Console maps `=` / `==` and `in` to `op:"must"`; it maps `!=` and `not_in` to `op:"must_not"`; range comparisons use `op:"range"` with `gt`/`gte`/`lt`/`lte`.
- Removing or replacing a scene's reusable rule binding does not authorize deleting the old rule by itself. Keep detached rules by default. When cleanup is explicitly requested, publish and read back the scene first, then verify each exact old rule has `Used=false` before deleting it; never delete a system-generated default rule.
- Check scene-specific merge constraints before writing `MergeConfigs`: `for_you` does not support `item_similarity`, and `shopping_cart` supports only `item_similarity_first` or `custom`.
- Do not create or update a recommend scene until the target page/module and `UserEventScenes` are resolved; use `--confirm-entry-binding` for real writes.
- Start with the scene when debugging recommendation behavior; do not jump to raw API calls first.
- Use `vs recommend scene update` for persistent recommendation behavior and do not invent low-level API mappings inside this skill.
- For natural-language scene-change requests, use `references/recommend-scene-natural-language-routing.md` as the routing layer; if the target is a rule-resource workflow, do not reduce it to a single inline scene field edit.
- For scene updates, prefer a readback check after mutation instead of assuming the write succeeded.
- If a scene update unexpectedly fails or appears to no-op, verify the accepted command behavior and parameter requirements before retrying.
- When reporting runtime results, summarize the scene, user context, item context, raw `rec_results`, and relevant `extra_info` before proposing tuning changes.
- Do not invent item titles or explanations. Ground every recommendation summary in the actual response payload.
- If you show only a subset such as Top 5, explicitly say that the full response contains more items.
- If a command failure or user follow-up turns into a product concept, capability, API field, console UI path, purchase, billing, or general troubleshooting question outside this recommend workflow, temporarily hand off to `vs-product-qa`; return to this workflow only after the grounded product answer is complete.
