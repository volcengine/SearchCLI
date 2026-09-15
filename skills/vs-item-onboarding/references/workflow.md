# Viking Item Onboarding — Workflow & Constraints

This reference holds the full, detailed workflow and constraint list for `vs-item-onboarding`. `SKILL.md` only keeps the short entry point and hard rules; everything operational lives here.

## Commands

- `item profile`: first-pass profiling for field shape, primary-key candidates, title candidates, cleanup, and validation risk
- `item plan`: generate a reviewable first-pass draft that contains `schema.json`, `online-config.json`, `validation.json`, and search/recommend templates. It may also emit draft dataset-side config artifacts such as `field-config.json` or `dataset-create.json` with `DataFieldConfig`; treat these as execution inputs, not as user-confirmed bind config. Add `--skip-app` when the requested outcome is dataset-only.
- `item provision` / `item apply`: both commands also accept `--skip-app`. Use it as an execution-time guard rail when you need to enforce dataset-only behavior from an existing plan or when the plan was generated before the boundary was finalized.
- `dataset create` / `dataset ingest`: the preferred dataset-only provisioning path after Stage A confirms the schema; prefer `dataset-create.json` so `Schema` and `DataFieldConfig.FieldDescMap` travel together
- `item apply`: stable executor for the `dataset+app` branch: `validation gate -> schema check -> create dataset -> ingest -> create app -> bind dataset -> optional smoke checks`
- `search run` / `chat run`: verify the new app with minimal runtime requests
- `recommend scene create`: continue recommend bootstrap only after the user confirms the target page / module and the required `BhvSceneTypes`
- `app diagnose`: inspect readiness, scene, or runtime-config problems

## Dataset Type Selection

The workflow supports `item` and `video` dataset types via the `--type` flag on `item profile` and `item plan`.

- If the user explicitly asks for a video dataset, you MUST pass `--type video` to both `item profile` and `item plan`.
- If the user explicitly asks for an item dataset, you MUST pass `--type item`.
- If the source data contains video-like signals (`video_url`, `duration`, `content_type=video`, `parent_content_id`, `sequence_index`) but the user did not specify the dataset type, you MUST ask a clarifying question before planning or applying.
- Do not infer dataset type from `--goal` alone (e.g. `Build video search` does not imply `--type video`).
- Before `item apply`, verify that `plan.json.defaults.datasetType` and `dataset-create.json.Type` match the requested dataset type.

## Provisioning Mode Selection

After the dataset type is clear, the agent MUST decide the requested provisioning boundary:

- `dataset-only`: the user wants a dataset created and ingested, but did not ask for app creation, bind-time field config, search/chat verification, or app-level setup
- `dataset+app`: the user explicitly wants an application created or reused, or asks for bind-time field config, search/chat verification, scene bootstrap, or app-level debugging

Rules:

- If the user did not ask for app creation or app-level setup, default to `dataset-only`.
- For `dataset-only`, prefer `item plan --skip-app`, then run `dataset create --data @dataset-create.json` and `dataset ingest` after Stage A so the dataset-side `FieldDescMap` is submitted together with the schema. Fall back to `--schema @schema.json` only when the full payload is missing or clearly unsuitable for the current plan. If execution later goes through `item provision` or `item apply`, pass `--skip-app` again as a guard rail. Stop there.
- For `dataset+app`, run the full Stage A -> Stage B -> `item apply --confirm-review` path.
- Do not create or bind an application "just in case". App creation is an explicit branch decision, not a default side effect.

Examples:

```bash
# Generic item / catalog / card-style dataset
vs item profile --file ./items.json --type item --pretty
vs item plan --file ./items.json --type item --goal "Build item search"

# Video dataset
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
```

Before provisioning anything, do not ask for a blind yes/no. Show the user the schema field-by-field (see [agent-confirmation-ux.md](agent-confirmation-ux.md) §A):

- provisioning mode (`dataset-only` or `dataset+app`)
- dataset type and dataset name
- application name (planned) or `not requested`
- every schema field (name, type, attributes such as `PK` / `Required` / `BizAttr`, and intended meaning or use)
- primary key and title field
- required fields
- for `video`, the semantic-slot status and BizAttr mappings for `content_id`, `content_type`, `video_url`, `parent_content_id`, `sequence_index`; if any slot is missing or ambiguous, stop and fix the schema before approval

Do not issue the Stage A dialog until the header block is shown, the full schema table has been rendered, and the row-count self-check passes. If a dialog was issued earlier, discard it and restart Stage A instead of asking for a second schema confirmation.

## Video Dataset Field Constraints

`--type video` carries HARD server-side constraints on the bind-time field groups (`IndexFields` / `FilterFields` / `SuggestFields`). Violations cause `CreateDataset` / `BindAppDataset` to fail with `MissingParameter.DefaultFieldStrategy`.

The authoritative table and the agent checklist live in [video-field-constraints.md](video-field-constraints.md). This file intentionally does not repeat the table to avoid drift.

Before `vs item apply --confirm-review` on a video dataset, the agent MUST verify the Stage B proposal against that table. If the user explicitly adjusts Stage B in a way that violates the table, do not silently override the user; stop, explain the server constraint, and ask the user to amend the proposal.

## Workflow

Each step below annotates which Hard Rules in `SKILL.md` constrain it, so the agent can map "what I am doing now" to "which rule stops me from making the common mistake".

1. Clarify the business goal and desired search experience: what users will search for, which fields matter most for recall, and whether the user wants `dataset-only` or `dataset+app`.
2. Determine the dataset type (`item` or `video`) using the rules above. **(Hard Rule #1)**
3. Determine the provisioning mode (`dataset-only` or `dataset+app`) using the rules above. If the user did not ask for app creation, default to `dataset-only`. **(Hard Rule #2)**
4. Skim a few raw rows, then run `item profile --file <data> --type <item|video>` for first-pass profiling. **(Hard Rule #1)**
5. Run `item plan --file <data> --type <item|video> --goal "<business goal>"` to generate the plan directory. Add `--skip-app` when the requested path is `dataset-only`. If execution later goes through `item provision` or `item apply`, those commands also accept `--skip-app` as an execution-time guard rail. **(Hard Rules #1, #2, #6)**
6. Review `schema.json`, `online-config.json`, `validation.json` with [review-checklist.md](review-checklist.md). If `item plan` also emitted `field-config.json` or embedded `DataFieldConfig` in `dataset-create.json`, treat them as draft artifacts only; bind-time confirmation is still deferred to Stage B. **(Hard Rule #6)**
7. Stage A: explicitly ask the user for approval of the generated `schema.json` draft (name, type, attributes such as `PK` / `Required` / `BizAttr`, intended meaning). For `--type video`, explicitly show whether the semantic slots `content_id`, `content_type`, `video_url`, `parent_content_id`, and `sequence_index` are present and how they map to BizAttr. Do not treat first-pass plan generation as approval. Do not ask the user to confirm dataset-side field groups at this stage. The Stage A dialog may be issued only after the full schema context has been rendered. **(Hard Rules #3, #4; UX contract in [agent-confirmation-ux.md §A](agent-confirmation-ux.md))**
8. Verify that schema `Meaning` values came from prompt-based inference grounded in source data and business goal. If meanings are wrong, or if any required video semantic slot is missing or ambiguously mapped, fix `schema.json` before continuing. If the plan emitted `FieldDescMap` or other draft field-group config, do not treat it as confirmed until the appropriate review stage. **(Hard Rules #4, #6; "Additional MUST" below)**
9. If automatic inference is wrong, edit the generated JSON directly. Fall back to lower-level `dataset` / `app` / `search` commands only when the item workflow is clearly a bad fit.
10. If the requested path is `dataset-only`, provision only the dataset and then stop after ingest succeeds. This branch has exactly one valid schema-level confirmation for the current draft: the Stage A dialog. Prefer `dataset create --data @dataset-create.json` so `Schema` and `DataFieldConfig.FieldDescMap` are submitted together. For `--type video`, this full-payload path is mandatory; `--schema @schema.json` alone can fail with `MissingParameter.DefaultFieldStrategy`. For `--type item`, fall back to `dataset create --name <dataset> --type item --schema @schema.json` only when `dataset-create.json` is missing or clearly unsuitable for the current plan, and surface that the remote dataset may not retain field meanings as reliably. Then run `dataset ingest --dataset-id <id> --fields @<normalized-items-artifact>`. Do not create or bind an application. **(Hard Rules #2, #3, #9)**
11. If the requested path is `dataset+app` and a human reviewer wants a preflight preview, optionally run `item apply --plan-dir <dir> --dry-run` and review the planned steps.
12. Stage B: for the `dataset+app` branch only, drive the bind-time field-config review per [agent-confirmation-ux.md §B](agent-confirmation-ux.md) (one table per group + dialog). For `--type video`, first enforce the DefaultFieldStrategy constraint in memory. **(Hard Rules #5, #7; the `vs-app-dataset-bind` skill's own Stage B MUST NOT be re-initiated here — see "Additional MUST" below)**
13. After Stage B confirmation, hand off to the real apply path described in [agent-confirmation-ux.md](agent-confirmation-ux.md) §"Agent-mode handoff to `vs item apply`". Do NOT assume the agent can safely hand-write `review-confirmation.json` from `field-config.json` alone. Use the CLI's own runtime snapshot path when recording the final review artifact, then run the real stage-one apply. Do NOT add `--dry-run` and do NOT degrade into `OnlySave=true` semantics. **(Hard Rule #8; Pre-apply Checklist in `SKILL.md` MUST all pass first)**
14. Treat the first stage as complete at the requested boundary: after dataset creation + ingest for `dataset-only`, or after dataset creation + ingest + app creation + bind for `dataset+app`. Do not keep waiting after that boundary by default. **(Hard Rule #9)**
15. `item apply --run-trials` is an optional second-stage verification that bootstraps a default search scene and binds it into `ChatConfig.SearchSceneID`.
16. If required behavior scene types are known and the target page / module has been confirmed, add `--confirm-recommend-entry-binding --recommend-bhv-scene-types <scene_a,scene_b>` for recommend bootstrap. Otherwise keep the generated recommend template and wait for user input. **(Hard Rule #10)**
17. If `search` or `chat` verification fails, use `app diagnose --application-id <app>` to inspect readiness, scene, and runtime config. For specific failure codes, see [recovery.md](recovery.md).

## Extended Constraints

The Hard Rules in `SKILL.md` are the MUST / MUST NOT set that would cause server-side failures or silent data corruption. The rules below complement them: some are additional MUST rules that were not hot enough to go into `SKILL.md`; others are Guidance that affect quality but not executability. Keeping them separated lets the agent recognise priority at a glance.

### Additional MUST / MUST NOT

- Field `Meaning` in `schema.json` MUST come from prompt-based inference grounded in source samples and the business goal; MUST NOT silently invent or hand-wave field meanings when prompt inference is available.
- When asking the user to confirm `schema.json`, MUST list every schema field with name, type, attributes, and intended meaning or use; MUST NOT summarize only key fields.
- For Stage A, MUST NOT issue the dialog before the header block, the full schema table, and the row-count self-check are complete.
- If a Stage A dialog was issued before the schema context was fully rendered, MUST discard it and restart Stage A; MUST NOT compensate by asking a second schema-level confirmation for the same unchanged draft.
- When the user did not ask for application provisioning, MUST keep the flow in `dataset-only` mode and MUST NOT create or bind an app as a default side effect.
- For `dataset-only`, after one valid Stage A dialog answer is captured for the current schema draft, MUST proceed to provisioning or schema edits; MUST NOT ask another schema-level confirmation unless the schema changes and Stage A restarts.
- For `--type video`, Stage A MUST explicitly show the status of `content_id`, `content_type`, `video_url`, `parent_content_id`, and `sequence_index`, including whether each semantic slot is present and which BizAttr mapping currently claims it.
- For `dataset+app`, all dataset-side field config (`FieldDescMap`, `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, `VideoIndexFields`, `TitleField`) MUST be confirmed at bind time via `vs app dataset bind` or the bind stage of `item apply`; draft values emitted by `item plan` MUST NOT be treated as already approved.
- For `dataset-only`, prefer `dataset create --data @dataset-create.json` whenever that plan artifact exists, because it preserves dataset-side `FieldDescMap` while keeping the workflow short. Do not re-run extra inference or ask a second confirmation just to use the full payload.
- For binding, MUST use `item apply` stage-one semantics or `vs app dataset bind`; MUST NOT rely on `app activate`.
- MUST NOT bypass blocking validation issues; exception is an explicit controlled test with `--force` acknowledged by the user.
- When driven by this skill, Stage B (bind-time field-config review) MUST be handled by this skill's flow; MUST NOT be re-initiated separately by the `vs-app-dataset-bind` skill's own Stage B. Call `vs item apply --plan-dir <dir> --confirm-review` directly after this skill's Stage B dialog.
- Agents MUST write `review-confirmation.json` only after Stage B is confirmed through the agent dialog. The file should record the final bind-time groups that were shown to the user; do not add extra runtime-alignment logic beyond that review record.
- When failures occur, MUST follow [recovery.md](recovery.md) (diagnose → match failure catalogue → apply minimal fix → re-run affected stage); MUST NOT blindly retry or combine unrelated fixes.
- When an existing dataset or app name matches the plan target, MUST follow the idempotency rules in [recovery.md](recovery.md); MUST NOT silently reuse a resource with mismatched config.

### Guidance (quality / process expectations)

- `item profile / plan / apply` are stable execution primitives, not a substitute for human or agent judgement.
- The generated `schema.json` from `item plan` is a first-pass proposal; allow review and manual edits for complex data.
- `item apply` generates recommend templates; it only bootstraps recommend scenes automatically when `--recommend-bhv-scene-types` is provided and `--confirm-recommend-entry-binding` is explicitly acknowledged.
- If the dataset obviously requires custom modeling, table splitting, or semantic cleanup, do not force the item workflow; explain why and switch to lower-level commands.
- When the same conversation onboards multiple datasets, always resolve `<plan-dir>` from the most recent `item plan` output; do not reuse a stale one (see [recovery.md](recovery.md) "Multi-dataset Context Isolation").
