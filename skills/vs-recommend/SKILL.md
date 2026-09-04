---
name: vs-recommend
description: "Recommend runtime and scene management: run recommendation requests, manage recommend scenes and rules, and verify the recommendation path."
category: recommend
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: recommend run, recommend debug, recommend scene, recommend rule, personalized recommend, cold start, boost bury, shuffle, reason template
commands: recommend run, recommend scene create, recommend scene list, recommend scene get, recommend scene update, recommend scene delete, recommend rule list, recommend rule get, recommend rule upsert, recommend rule delete
---

# Viking Recommend

## When to Use

Use this skill for:

- recommendation runtime checks
- recommend scene inspection, creation, and updates
- recommend rule inspection and management
- first-pass verification of the recommendation path
- diagnosing whether bad results come from scene config, behavior-scene binding, user context, item context, or readiness

## Version Check

Before starting this skill workflow, run `vs version check --json`. Continue only when `status` is `up-to-date`. If `status` is `update-available`, stop and tell the user to update the cloned `vs` repository, then run `git pull --ff-only`, `bash ./scripts/install.sh`, and `bash ./scripts/install-skills.sh all --target auto --force` (PowerShell: `scripts/install.ps1` and `scripts/install-skills.ps1`). If the status is `unknown`, stop and report that the CLI version could not be verified.

## Preconditions

- an `application-id` is available
- runtime checks need a `scene-id` and usually at least one of `user-id` or `parent-id`
- scene creation needs an item dataset bound to the application and at least one behavior scene type from a bound UserEvent dataset
- if the scene does not exist yet, inspect the existing scene list first and only create a new one when reuse is not possible
- the agent should treat the installed CLI behavior as authoritative when help text, skill text, and runtime behavior disagree

## Scope

Before changing anything, decide whether the user wants:

- a temporary runtime verification with `recommend run`
- a persistent recommend scene change
- a new recommend scene for a target page or module
- a reusable recommend rule change
- a readiness or configuration diagnosis for a failing recommendation app

This skill stays at the recommendation workflow level. Do not embed low-level API field mappings, payload design, or enum interpretation here. When a concrete command needs exact parameters, first consult `vs-product-qa` and the matching API reference. For `recommend scene update`, the authoritative scene update contract is `vs-product-qa/references/api-references/control-plane/scene/OnlineRecommendScene.md`.

## Commands

- `recommend run`: send a production-style recommendation request
- `recommend scene create` / `recommend scene list` / `recommend scene get`: manage recommend scenes
- `recommend scene update`: update recommend scene metadata or online config
- `recommend scene delete`: delete a recommend scene
- `recommend rule list` / `recommend rule get`: inspect reusable recommend rules
- `recommend rule upsert` / `recommend rule delete`: create, update, or delete reusable recommend rules

## Workflow

1. Start by determining whether the user wants:
   - a runtime recommendation check
   - a persistent recommend scene change
   - a new recommend scene
   - a reusable recommend rule change
   - a readiness or configuration diagnosis
2. Before running any concrete command, consult `vs-product-qa` to confirm the current command behavior and exact parameter requirements.
3. For runtime checks, use `recommend run` first, then inspect `result.rec_results`, `extra_info`, recall info, boost status, and invalid parent items from the raw response.
4. For persistent scene changes, run `recommend scene list/get` first and inspect the current scene before mutating it.
5. For natural-language scene-change requests, use `references/recommend-scene-natural-language-routing.md` to identify the target config area or rule-resource workflow.
6. Before building a `recommend scene create` or `recommend scene update` payload, consult `vs-product-qa/references/api-references/control-plane/scene/CreateRecommendScene.md` or `vs-product-qa/references/api-references/control-plane/scene/OnlineRecommendScene.md` for concrete field semantics, enum-like string values, and validation constraints.
7. Before creating or updating a recommend scene, explicitly confirm the target page / module and the required `BhvSceneTypes` with the user, then pass `--confirm-entry-binding`.
8. For rule-resource changes, run `recommend rule list/get` before `recommend rule upsert`; after a rule change, update the scene only when the user also wants that rule attached or replaced in a scene.
9. After every scene mutation, immediately read the scene back with `recommend scene get` and verify that the intended change is visible online.
10. If command behavior conflicts with the skill text or `--help`, trust the installed CLI behavior first, and only then inspect repository code when needed to explain or fix the gap.

## References

- `references/recommend-scene-natural-language-routing.md`: workflow-oriented mapping from natural-language recommend-scene requests to the first config area, scene field, or rule-resource workflow you should inspect
- `../vs-product-qa/references/api-references/control-plane/scene/CreateRecommendScene.md`: authoritative recommend-scene creation fields, enum values, and behavior-event constraints
- `../vs-product-qa/references/api-references/control-plane/scene/OnlineRecommendScene.md`: authoritative recommend-scene update payload, `Config` fields, enum-like string values, and validation notes
- `../vs-product-qa/references/api-references/control-plane/scene/UpsertRecommendRule.md`: authoritative reusable recommend-rule upsert payload and rule type values
- `../vs-product-qa/references/api-references/data-plane/online-api/Recommend.md`: authoritative online recommendation request and response contract for `recommend run`

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- Before executing any concrete `vs ...` command in this recommend workflow, first consult `vs-product-qa` to verify the current command surface, required flags, payload fields, input format, and allowed values. Only after that check may you finalize parameters and run the command.
- Before building a `recommend scene create` or `recommend scene update` payload, consult the matching `vs-product-qa` API reference. The routing reference only identifies the config area; it is not sufficient for final payload values.
- When the user request includes a scene type, model, optimization, strategy, channel, or mode qualifier such as `for_you`, `related`, `shopping_cart`, `long sequence`, `CTR`, `custom merge`, `cold start`, `item similarity`, `always`, `boost`, or `bury`, do not treat enabling the feature as sufficient. Set the corresponding field explicitly and verify that exact value in the readback response.
- **Field name case sensitivity**: All item dataset field names used in recommendation filters, `Shuffle.Rules[].FieldName`, `ShuffleExpr.field`, `BoostBuryConfig.Rules[].Field`, `BoostBuryCondConfig.Rules[].Config.field`, `ColdStartConfig.ItemFilter.field`, and rule `Config` are **case-sensitive**. Before writing any field name into config, first look up the exact item dataset schema or data-config via `dataset get --id <item-dataset-id> --full` or `app dataset-config get --application-id <id> --dataset-id <id> --full`, and copy the field name exactly as it appears there. If the field name does not match the schema, stop and ask the user to confirm which field they mean instead of guessing.
- `BhvSceneTypes[]` values must come from the bound UserEvent dataset's `event_scene` enum values. `ClickEventTypes[]`, `PositiveEventTypes[]`, and `NegativeEventTypes[]` values must come from that dataset's `event_type` enum values.
- Do not create or update a recommend scene until the user has confirmed the target page / module and `BhvSceneTypes`; use `--confirm-entry-binding` for real writes.
- Start with the scene when debugging recommendation behavior; do not jump to raw API calls first.
- Use `recommend scene update` for persistent recommendation behavior and do not invent low-level API mappings inside this skill.
- For natural-language scene-change requests, use `references/recommend-scene-natural-language-routing.md` as the routing layer; if the target is a rule-resource workflow, do not reduce it to a single inline scene field edit.
- For scene updates, prefer a readback check after mutation instead of assuming the write succeeded.
- If a scene update unexpectedly fails or appears to no-op, verify the accepted command behavior and parameter requirements before retrying.
- When reporting runtime results, summarize the scene, user context, item context, raw `rec_results`, and relevant `extra_info` before proposing tuning changes.
- Do not invent item titles or explanations. Ground every recommendation summary in the actual response payload.
- If you show only a subset such as Top 5, explicitly say that the full response contains more items.
- If a command failure or user follow-up turns into a product concept, capability, API field, console UI path, purchase, billing, or general troubleshooting question outside this recommend workflow, temporarily hand off to `vs-product-qa`; return to this workflow only after the grounded product answer is complete.
