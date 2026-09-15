---
name: vs-item-onboarding
description: "General item-level onboarding: understand structured item data, generate schema and config plans, create datasets, and create or bind apps only when the user explicitly asks for app-level setup."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: item search onboarding, structured data onboarding, dataset-only onboarding, schema design, field config, online config, validation, recommend bootstrap, item profile, item plan, item apply
commands: item profile, item plan, item apply, dataset create, dataset ingest, dataset schema check, app diagnose, search run, chat run, recommend scene create
---

# Viking Item Onboarding

## When to Use

Use this skill when a user provides structured item data and expects the agent to understand the data, design the schema, and either provision a dataset only or continue to app-level search onboarding. Understand the business goal and the requested delivery boundary first, then use `item profile / plan / apply` plus lower-level dataset commands to standardize the high-risk execution steps.

## Preconditions

- `vs` CLI and Viking skills are installed
- authentication is complete; at least `vs auth status` and `vs doctor` succeed
- input file is preferably `JSON array`, `JSONL`, or `CSV` (convert binary spreadsheets first)
- the user has stated a business goal such as "Build catalog search" or "Build content search"

## High-level Flow

For `dataset-only`, there is exactly one valid schema-level user confirmation for the current draft: Stage A. That dialog must happen only after the full schema context has been rendered.

1. `item profile --file <data> --type <item|video>` — first-pass profiling
2. Confirm the requested provisioning mode: `dataset-only` or `dataset+app`; if the user did not ask for app creation, default to `dataset-only`
3. `item plan --file <data> --type <item|video> --goal "<goal>"` — generate plan directory; add `--skip-app` when the requested mode is `dataset-only`. If execution later goes through `item provision` or `item apply`, those commands also accept `--skip-app` as an execution-time guard rail.
4. **Stage A** — render the schema header and full schema table, verify row count, then ask exactly one dialog question (see [agent-confirmation-ux.md](references/agent-confirmation-ux.md) §A)
5. If the requested mode is `dataset-only`, run `dataset create` + `dataset ingest` immediately after a valid Stage A answer and stop after dataset provisioning succeeds; do not issue another schema-level confirmation. Prefer creating the dataset from the full `dataset-create.json` payload so `Schema` and `DataFieldConfig.FieldDescMap` are submitted together. For `--type video`, this full-payload path is mandatory; do not use `schema.json` alone
6. If the requested mode is `dataset+app`, run **Stage B** — bind-time field-config review (table per group + dialog, see [agent-confirmation-ux.md](references/agent-confirmation-ux.md) §B); for `--type video` apply [video-field-constraints.md](references/video-field-constraints.md) first
7. `item apply --plan-dir <dir> --confirm-review` — stage-one execution for the `dataset+app` branch
8. Optional: `--run-trials`, recommend bootstrap, `app diagnose` for failures. For any failure, see [references/recovery.md](references/recovery.md) — do NOT blindly retry.

Full step-by-step workflow, dataset-type selection rules, examples, and extended guidance live in [workflow.md](references/workflow.md).

## Commands

See the `commands:` frontmatter above for the exhaustive list; the primary entry points are `item profile`, `item plan`, `dataset create`, `dataset ingest`, and `item apply --plan-dir <dir> --confirm-review`. Detailed command forms, flags, dataset-only branching, and dataset-type selection rules live in [workflow.md](references/workflow.md).

## Workflow

The high-level 8-step flow is listed above under **High-level Flow**. The full branch-aware workflow — including dataset-only vs. dataset+app routing, profiling, plan review, Stage A, conditional Stage B, dataset provisioning, optional app provisioning, optional `--run-trials`, and recommend bootstrap — with per-step cross-references to the Hard Rules below lives in [workflow.md](references/workflow.md).

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

The enforceable rules are organized in two layers:

- **Hard Rules (MUST / MUST NOT)** — listed below; violating any one stops the workflow.
- **Pre-apply Checklist** — listed below; a mechanical gate that the agent MUST verify before running `vs item apply --plan-dir <dir> --confirm-review`.
- **Additional MUST / Guidance** — lower-priority MUST rules and quality guidance live in [workflow.md](references/workflow.md) under *Extended Constraints*.

## Hard Rules (MUST / MUST NOT)

These rules prevent server-side failures and silent data loss. Violating any rule stops the workflow.

1. **Dataset type is explicit.** MUST pass `--type <item|video>` on both `profile` and `plan`. MUST NOT infer dataset type from `--goal`. If data looks video-like but the user did not specify, MUST ask before continuing.
2. **App creation is explicit.** MUST ask or infer from an explicit user request whether the target is `dataset-only` or `dataset+app`. If the user did not ask for app creation, bind-time config, search/chat verification, or app-level setup, MUST default to `dataset-only`. MUST NOT create or bind an app on the user's behalf.
3. **Stage A gates every provisioning path.** MUST run Stage A (schema confirmation) before `dataset create`, `dataset ingest`, `item apply`, or any app-level bind. MUST NOT treat first-pass plan generation as schema approval.
4. **Stage A lists every field and every relevant schema attribute.** MUST render a per-field table (name, type, attributes, meaning) covering every field in `schema.json`; MUST NOT summarize only key fields. For `--type video`, MUST also surface the status of the semantic slots `content_id`, `content_type`, `video_url`, `parent_content_id`, and `sequence_index` before approval.
5. **Stage A dialog comes last and only once per unchanged draft.** MUST NOT issue the Stage A dialog before the header block, the full schema table, and the row-count self-check are complete. If a dialog is issued earlier, MUST discard it and restart Stage A instead of asking a second schema-level confirmation. For `dataset-only`, once a valid Stage A dialog answer is captured for the current schema draft, MUST NOT ask another schema-level confirmation unless the schema changes.
6. **Stage B is conditional and app-only.** MUST run Stage B (bind-time field-config confirmation) only when the requested outcome includes application creation or dataset binding. MUST NOT run bind-time confirmation for a `dataset-only` request, and MUST NOT skip Stage B when app binding will happen.
7. **Plan artifacts are drafts, not confirmed bind config.** `item plan` may emit draft dataset-side config artifacts such as `field-config.json` or `dataset-create.json` with `DataFieldConfig`. Treat them as execution inputs, not as user-confirmed bind config. For `dataset-only`, dataset creation SHOULD prefer the full `dataset-create.json` payload so `Schema` and `DataFieldConfig.FieldDescMap` are submitted together. For `dataset-only` + `--type video`, dataset creation MUST use a full payload that includes `DataFieldConfig`; using only `--schema @schema.json` can fail with `MissingParameter.DefaultFieldStrategy`. For `dataset-only` + `--type item`, fall back to `--schema @schema.json` only when `dataset-create.json` is missing or clearly unsuitable for the current plan.
8. **Video DefaultFieldStrategy is mandatory for app/bind flows.** For `--type video`, any Stage B proposal MUST satisfy every row of [video-field-constraints.md](references/video-field-constraints.md). Fix violations in memory before rendering Stage B; MUST NOT write a violating proposal to `field-config.json` or `review-confirmation.json`.
9. **Real bind is real.** After Stage B confirmation, MUST run `vs item apply --plan-dir <dir> --confirm-review` without `--dry-run` and MUST NOT degrade into `OnlySave=true` semantics.
10. **Stop at the requested boundary.** For `dataset-only`, stage one ends after dataset creation and ingest succeed. For `dataset+app`, stage one ends after dataset creation, ingest, app creation, and bind succeed. MUST NOT continue beyond the requested boundary unless the user explicitly asks.
11. **Recommend bootstrap needs explicit input.** MUST NOT auto-create or update recommend scenes without both `--recommend-bhv-scene-types` and `--confirm-recommend-entry-binding`.

## Pre-apply Checklist

Before provisioning anything, the agent MUST first decide whether the requested path is `dataset-only` or `dataset+app`. Use the checklist below only for the `dataset+app` path. If the request is `dataset-only`, stop after Stage A and dataset provisioning; do not run Stage B or `item apply`.

1. **Plan directory resolved** — `<plan-dir>` points to the latest `item plan` output for the current dataset (not a stale one from earlier in the conversation).
2. **Dataset type matches intent** — `plan.json.defaults.datasetType` and `dataset-create.json.Type` both equal the requested `--type` (`item` or `video`).
3. **Provisioning mode confirmed** — the user explicitly asked for app-level setup, or explicitly agreed to continue from dataset-only into `dataset+app`. If not, do not run app-level provisioning.
4. **Stage A done** — the header block was rendered, a per-field schema table was rendered (row count == `len(schema.json.Fields)`), and the user answered one valid interactive question dialog with a non-abort option. For `--type video`, the Stage A summary also surfaced the status of `content_id`, `content_type`, `video_url`, `parent_content_id`, and `sequence_index`.
5. **Stage B done** — per-group tables for `IndexFields / FilterFields / SuggestFields / ImageIndexFields / VideoIndexFields` were rendered with `Field / Type / Meaning / Reason to include / Risk or note`, and the user answered an interactive dialog with a non-abort option.
6. **Video DefaultFieldStrategy satisfied** — for `--type video`, the final proposal satisfies every row of [video-field-constraints.md](references/video-field-constraints.md). MUST re-verify after any user adjustment in Stage B.
7. **Artifacts written** — `field-config.json` reflects the final Stage B groups, and `review-confirmation.json` has `status=confirmed`, every `requiredChecks.*` true, and a `fieldConfigReview` block with the final groups.
8. **Validation not bypassed** — `validation.json` has no unresolved blocking issues (or `--force` has been explicitly acknowledged by the user for a controlled test).
9. **Apply command is real** — the command about to run is exactly `vs item apply --plan-dir <dir> --confirm-review`, with no `--dry-run` and without any flag that would degrade into `OnlySave=true` semantics.

If the user makes a follow-up edit (rename a field, drop a group member, switch `--type`, etc.) after this checklist passed, MUST re-run the affected checks before apply.

## References

- Full workflow & extended guidance: [references/workflow.md](references/workflow.md)
- Artifact review checklist: [references/review-checklist.md](references/review-checklist.md)
- Stage A / Stage B UX contract: [references/agent-confirmation-ux.md](references/agent-confirmation-ux.md)
- Video `DefaultFieldStrategy` (authoritative): [references/video-field-constraints.md](references/video-field-constraints.md)
- Failure recovery & idempotency: [references/recovery.md](references/recovery.md)
- JSON walkthrough: [references/walkthrough-card-full.md](references/walkthrough-card-full.md)
- CSV walkthrough: [references/walkthrough-csv.md](references/walkthrough-csv.md)
- External agent prompt: [references/agent-prompt-template.md](references/agent-prompt-template.md)
