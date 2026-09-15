# Agent Prompt Template

Use the text below when you want an external agent to run item-data onboarding with the `vs-item-onboarding` skill. The template is kept in sync with `SKILL.md` Hard Rules; if you change it, re-check the rule list there.

## Template

Help me onboard a structured item dataset into Viking for item-level search.

Please confirm the following first:

1. SearchCLI and Viking skills are installed; if not, install them first.
2. The current terminal is already authenticated for Viking; if not, handle auth in this order:
   - if `VIKING_AK` / `VIKING_SK` already exist in the current shell, run `vs auth import-env`;
   - otherwise, if you can keep a real terminal session open for user input, run `vs auth login`;
   - otherwise, ask me to set `VIKING_AK` / `VIKING_SK` in the current shell and then run `vs auth import-env`.

Then run this workflow:

1. Understand my business goal and the meaning of the dataset fields before using any generated plan.
2. Decide the dataset type explicitly:
   - if I ask for a video dataset, use `--type video`;
   - if I ask for an item / catalog / card dataset, use `--type item`;
   - if the data contains video-like signals (`video_url`, `duration`, `content_type=video`, `parent_content_id`, `sequence_index`) but I did not specify the type, ask me to choose `item` or `video` before running any command;
   - never infer the dataset type from `--goal` alone.
3. Decide the provisioning mode explicitly:
   - if I ask only for dataset creation / import / ingestion, use the `dataset-only` path;
   - if I ask for application creation, bind-time field config, search/chat verification, or app-level debugging, use the `dataset+app` path;
   - if I did not ask for app creation, default to `dataset-only`.
4. Run `vs item profile --file <DATA_FILE> --type <item|video> --pretty`.
5. Run `vs item plan --file <DATA_FILE> --type <item|video> --goal "<BUSINESS_GOAL>"`; add `--skip-app` when the requested path is `dataset-only`. If execution later goes through `vs item provision` or `vs item apply`, those commands also accept `--skip-app` as an execution-time guard rail.
6. Review the plan artifacts that actually exist at this stage: `schema.json`, `online-config.json`, `validation.json`, and the search / recommend templates. If `item plan` also emitted `field-config.json` or embedded `DataFieldConfig` in `dataset-create.json`, treat those as draft execution artifacts only; they are not user-confirmed bind config yet.
7. Stage A — follow `agent-confirmation-ux.md` §A as the sole detailed UX contract. Render the header block first, then the full per-field schema table, then risk notes, and only then issue one interactive question dialog for approval of the generated `schema.json` draft (not a free-form yes/no, not a terminal `y/N`). Do not summarize only key fields. Make sure the `Meaning` values came from prompt-based inference grounded in the source data and the business goal; if they look wrong, fix `schema.json` before continuing. For `--type video`, also show whether `content_id`, `content_type`, `video_url`, `parent_content_id`, and `sequence_index` are present and which BizAttr mapping currently claims each slot. Never ask for schema confirmation before rendering the complete schema table; if you did, discard that dialog and restart Stage A instead of asking a second schema-level confirmation.
8. If the requested path is `dataset-only`, stop after one valid Stage A answer and provision only the dataset. Prefer `vs dataset create --data @dataset-create.json` so `Schema` and `DataFieldConfig.FieldDescMap` are submitted together. For `--type video`, this full-payload path is mandatory; using only `--schema @schema.json` can fail with `MissingParameter.DefaultFieldStrategy`. For `--type item`, fall back to `vs dataset create --name <DATASET_NAME> --type item --schema @schema.json` only when `dataset-create.json` is missing or clearly unsuitable for the current plan. Then run `vs dataset ingest --dataset-id <DATASET_ID> --fields @<NORMALIZED_ITEMS_ARTIFACT>`. Do not create or bind an application in this branch, and do not ask any second schema-level confirmation unless the schema changes and Stage A restarts.
9. If the requested path is `dataset+app` and a human reviewer wants a preflight preview, you may optionally run `vs item apply --plan-dir <PLAN_DIR> --dry-run` and summarize the planned steps. This is optional; do not let it replace Stage A or Stage B.
10. Stage B — only for the `dataset+app` path, after Stage A is confirmed, drive the bind-time field-config review yourself. Render one per-group table for `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, `VideoIndexFields`, each with columns `Field / Type / Meaning / Reason to include / Risk or note`, and issue an interactive question dialog. For `--type video`, first load the authoritative `DefaultFieldStrategy` constraint table from `references/video-field-constraints.md`, enforce every row of it on the proposal in memory, and explain any auto-fix above the tables. Do not hard-code the constraint list into your own reasoning — always re-read the file; the server-side rules may evolve. Do not replace the agent dialog with a CLI-only confirmation step.
11. After Stage B is confirmed, write back `field-config.json` (if any group changed) and `review-confirmation.json` (`status=confirmed`, all `requiredChecks=true`, `fieldConfigReview` populated with the final groups), then run `vs item apply --plan-dir <PLAN_DIR> --confirm-review` directly. Do not keep `--dry-run` on this real bind step and do not degrade the request into `OnlySave=true` semantics.
12. Treat stage one as complete at the requested boundary: after dataset creation + ingest for `dataset-only`, or after dataset creation + ingest + app creation + bind for `dataset+app`. Do not add `--wait-ready` unless I explicitly ask for readiness verification.
13. For recommend bootstrap, only bind recommend scenes automatically when both the target page / module and the required `BhvSceneTypes` are known; in that case pass `--confirm-recommend-entry-binding --recommend-bhv-scene-types <scene_a,scene_b>`. Otherwise keep the generated recommend template and tell me what input is still needed.
14. If `search` or `chat` verification fails later, fall back to `vs app diagnose --application-id <APP_ID>`.

Output requirements:

- Start by summarizing your understanding of the business goal and the dataset.
- Explain the reasoning behind your schema, online-config, and (at bind time) field-config choices.
- If you ran an optional preflight preview, summarize its result before the real apply.
- Never merge Stage A and Stage B; always keep them as two separate table + dialog exchanges in that order.
- For Stage A, list every schema field (name, type, attributes, meaning) and, for `video`, also list the status of `content_id`, `content_type`, `video_url`, `parent_content_id`, and `sequence_index`; for Stage B, list every field in every group with `Reason to include` and `Risk or note`.
- Never ask for Stage A confirmation before rendering the full schema table and completing the row-count self-check.
- Never auto-confirm either stage on my behalf. Free-form replies from me do not count as confirmation unless you captured them through the interactive question dialog.
- Never write `field-config.json` or `review-confirmation.json` before Stage B is confirmed through the dialog.
- If I only asked for dataset provisioning, do not create or bind an application by default.
- If I only asked for dataset provisioning, do not ask a second schema-level confirmation after a valid Stage A answer for the current schema draft.
- Treat a successful dataset ingest (`dataset-only`) or a successful bind (`dataset+app`) as the end of stage one; do not wait for readiness or run trials unless I explicitly ask.
- If you find blocking issues, data-modeling problems, or a conflict between my answer and the video `DefaultFieldStrategy`, stop and explain before continuing.

## Filled Example

Help me onboard `./content-cards.json` into Viking for content search.

Please understand the fields and the search use case first, then follow the `vs-item-onboarding` workflow:

1. Decide dataset type — this is a content-card catalog, so use `--type item`.
2. Run `vs item profile --file ./content-cards.json --type item --pretty` and `vs item plan --file ./content-cards.json --type item --goal "Build content search"`.
3. Review `schema.json`, `online-config.json`, `validation.json`, and the search / recommend templates. If `item plan` emitted `field-config.json` or embedded `DataFieldConfig` in `dataset-create.json`, treat those as draft artifacts rather than confirmed bind config.
4. Stage A: render a per-field schema table (name, type, attributes, meaning) for every field and confirm it with me through an interactive question dialog. Make sure field meanings came from prompt inference grounded in source samples; fix any wrong meanings in `schema.json` before continuing.
5. Because I asked for content search, use the `dataset+app` branch rather than `dataset-only`.
6. Optional preflight: `vs item apply --plan-dir <PLAN_DIR> --dry-run` for a preview; this does not replace Stage A or Stage B.
7. Stage B: render per-group tables for `IndexFields / FilterFields / SuggestFields / ImageIndexFields / VideoIndexFields` with `Field / Type / Meaning / Reason to include / Risk or note`, and confirm through the dialog. Write back `field-config.json` and `review-confirmation.json` only after the dialog answer.
8. Real apply: `vs item apply --plan-dir <PLAN_DIR> --confirm-review` (no `--dry-run`, no only-save).
9. Stop here unless I explicitly ask for readiness checks, smoke trials, or recommend bootstrap. If recommend is needed and the target page / module and `BhvSceneTypes` are known, add `--confirm-recommend-entry-binding --recommend-bhv-scene-types <scene_a,scene_b>`; otherwise keep the template and tell me what is still missing.

If at any point you see a conflict with the video `DefaultFieldStrategy` constraint or blocking validation issues, stop and explain instead of force-applying.
