# Recovery Paths

When `vs item apply`, `vs app dataset bind`, or a subsequent search / chat verification fails, do NOT re-run the last command blindly. Diagnose the error, then follow the minimal fix path below. All recovery paths MUST preserve the Stage A / Stage B confirmation contract — if a fix changes `schema.json` or `field-config.json`, the corresponding stage MUST be re-rendered and re-confirmed through the dialog before re-applying.

## Decision Procedure

For any failure, the agent MUST:

1. Capture the full error payload (code + message + any `Detail` / `ResponseMetadata` fields).
2. Match it to one of the entries below; if none match, run `vs app diagnose --application-id <app>` and surface its output to the user.
3. Apply the "Minimal fix" column exactly — do NOT combine unrelated fixes in one pass.
4. Re-run only the step that failed (usually the bind step), not the full `item apply`, unless the entry says otherwise.
5. If the fix changes plan artifacts, re-run the affected Stage (A or B) before re-applying.

## Failure Catalogue

### F1. `MissingParameter.DefaultFieldStrategy`

- **Where it surfaces**: `CreateDataset` or `BindAppDataset` for `--type video`.
- **Root cause**: proposed `IndexFields` / `FilterFields` / `SuggestFields` violate [video-field-constraints.md](video-field-constraints.md).
- **Minimal fix**:
  1. Re-load the authoritative table from [video-field-constraints.md](video-field-constraints.md).
  2. Apply the deterministic correction described in [agent-confirmation-ux.md §B.2.1](agent-confirmation-ux.md).
  3. Rewrite `field-config.json` with the corrected groups.
  4. Re-render Stage B per-group tables and re-issue the dialog (a violating proposal means the previous Stage B was effectively invalid).
  5. Re-run `vs item apply --plan-dir <dir> --confirm-review`.

### F2. `InvalidParameter.SchemaMismatch` / dataset schema conflict

- **Where it surfaces**: `BindAppDataset`, after data was already ingested with a different schema.
- **Root cause**: `schema.json` in the plan no longer matches the dataset's stored schema.
- **Minimal fix**:
  1. Run `vs dataset schema check --dataset-id <id>` to diff the two schemas.
  2. Decide with the user whether to:
     - align the plan to the stored schema (edit `schema.json`, re-run Stage A dialog), or
     - drop and recreate the dataset (only when data is reingestable and the user explicitly agrees).
  3. Never silently mutate a live dataset's schema to satisfy the plan.

### F3. `ResourceAlreadyExists` — dataset / app already exists

- See [idempotency rules](#idempotency-rules) below. Not a real failure when the agent is reusing an existing resource; becomes a failure only when the agent tried to create a duplicate.

### F4. `PrimaryKey` / duplicate-doc errors during ingest

- **Where it surfaces**: `ingest_items` step of `item apply`.
- **Root cause**: source data contains duplicate primary-key values, or `PrimaryKey` was inferred incorrectly.
- **Minimal fix**:
  1. Run `vs item profile --file <data> --type <item|video> --pretty` and inspect `primaryKeyCandidates` / `duplicateCount`.
  2. If the primary-key field is wrong: fix `schema.json.PrimaryKey`, re-run Stage A dialog, then re-apply.
  3. If the data itself has duplicates: dedupe the source file first; do NOT bypass with `--force` unless the user explicitly acknowledges the loss.

### F5. Bind succeeds but `app diagnose` reports `NotReady`

- **Where it surfaces**: after a successful bind, when the user requested second-stage verification.
- **Root cause**: default scene or runtime config has not finished provisioning, or `ChatConfig.SearchSceneID` is missing.
- **Minimal fix**:
  1. Run `vs app diagnose --application-id <app>` and read `readiness` / `sceneBindings` sections.
  2. If `SearchSceneID` is missing, run `vs item apply --plan-dir <dir> --run-trials` (this bootstraps the default search scene and binds it).
  3. If the scene exists but the app is still not ready, wait and re-check — do NOT re-bind.

### F6. `search run` / `chat run` returns empty / irrelevant results

- **Where it surfaces**: smoke verification.
- **Root cause**: usually `IndexFields` / `FilterFields` chosen in Stage B are not aligned with the query shape.
- **Minimal fix**:
  1. Inspect the resolved field config via `vs app dataset describe`.
  2. If the config is wrong, rewrite `field-config.json`, re-run Stage B dialog, and re-run `vs app dataset bind`.
  3. If the config is fine but recall is still poor, suspect data quality (nulls, short titles, URL-only fields) — discuss with the user before touching the plan.

### F7. Auth / token expired mid-flow

- **Minimal fix**: run the auth recovery chain from [agent-prompt-template.md](agent-prompt-template.md) (`vs auth import-env` → `vs auth login` → ask user to set `VIKING_AK` / `VIKING_SK`), then resume from the failed step. No plan changes.

## Idempotency Rules

Creating resources is NOT always retryable; Viking distinguishes between "resource exists with matching config" (safe) and "resource exists with mismatched config" (not safe).

### Dataset already exists

- If `plan.json.defaults.datasetName` matches an existing dataset:
  1. Call `vs dataset describe --dataset-id <id>` and diff its stored config against `dataset-create.json`.
  2. If type, schema, and primary key all match → skip `create_dataset`; proceed to ingest.
  3. If any of them differ → STOP and surface the diff to the user. Do NOT silently reuse the dataset.
- Never call `CreateDataset` twice for the same name assuming the second call is a no-op; the server may return `ResourceAlreadyExists` and the agent MUST treat that as a match check, not as a success.

### Application already exists

- If `plan.json.defaults.applicationName` matches an existing app:
  1. Call `vs app describe --application-id <id>`.
  2. If the app is unbound or bound to the same dataset the plan is targeting → reuse; proceed to `bind` (which itself is idempotent when the binding already matches).
  3. If the app is bound to a different dataset → STOP and ask the user whether to rebind (destructive) or rename the plan target.

### Binding already exists

- `BindAppDataset` with the same `(AppID, DatasetID, fieldConfig)` IS idempotent server-side: it returns success without re-provisioning.
- `BindAppDataset` with the same `(AppID, DatasetID)` but a different `fieldConfig` REPLACES the binding. The agent MUST re-run Stage B dialog before submitting a replacement bind; a silent overwrite is a bug.

## Multi-dataset Context Isolation

When a single conversation onboarded more than one dataset, stale plan directories are a major source of silent corruption.

- The agent MUST always resolve `<plan-dir>` from the most recent successful `vs item plan` output in the conversation. Never reuse an earlier `<plan-dir>` implicitly.
- Every Stage A / Stage B dialog MUST echo back the resolved `<plan-dir>` in its header so the user can catch a mismatch.
- `review-confirmation.json.fieldConfigReview` MUST reflect the current plan's reviewed field groups; never reuse a review record from a different plan.
- If the user's follow-up message implies a different dataset (new file path, new `--type`, new goal), the agent MUST NOT continue with the previous `<plan-dir>` — run a new `item profile` + `item plan` first.

## What NOT to Recover With

- Do NOT use `--force` to bypass validation unless the user explicitly asked for a controlled test.
- Do NOT degrade the real bind to `--dry-run` or `OnlySave=true` in order to "get past" a bind failure; the server rejection is the signal, not the obstacle.
- Do NOT re-run `item apply` from scratch when only the bind step failed — re-binding via `vs app dataset bind` is cheaper and avoids re-ingesting data.
- Do NOT invent recovery steps that are not listed above; when unsure, ask the user or run `vs app diagnose` and surface the output.
