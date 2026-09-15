# Agent Confirmation UX

This reference defines the **in-chat confirmation UX** an agent MUST use during item / video onboarding. Stage A always applies before provisioning; Stage B applies only when the requested outcome includes app creation or dataset binding. The two review stages are:

- Stage A — `schema.json` draft approval (before any dataset is created)
- Stage B — bind-time `field-config` review (before `vs app dataset bind` or the bind stage of `item apply`)

The goal is to keep both stages consistent: **tables first, then an interactive question dialog**. Do NOT degrade either stage into a terminal `y/N` prompt or a single-line summary.
Stage A is a single review cycle with exactly one valid order: `header -> full schema table -> risk notes -> one dialog`. If that order is broken, the Stage A attempt is invalid and MUST be restarted from the top rather than patched with an extra confirmation.

---

## Core Rules

1. Both stages MUST render a **field-by-field table** before asking the user for a decision.
2. Both stages MUST ask the user through an **interactive question dialog** (the agent's question tool). A free-form chat answer or a terminal `y/N` does NOT count as confirmation, even if the user's text clearly says "yes". If the dialog was never issued, the stage is unconfirmed.
3. The agent MUST NOT auto-confirm either stage on the user's behalf, and MUST NOT treat chat messages, verbal approvals, or dialog previews as substitutes for the dialog answer.
4. When an item / video onboarding is driven from an agent chat, the agent MUST drive the required stages itself through the dialog. Stage A always applies; Stage B applies only to the `dataset+app` branch. Do not replace the agent dialog with a CLI-only confirmation step.
5. Any manual edit triggered by the review MUST be written back to the plan directory before continuing:
   - schema edits → `schema.json`
   - field-config edits → `field-config.json`
   - confirmation snapshot → `review-confirmation.json` (`status=confirmed`, `requiredChecks` all true, and a `fieldConfigReview` block with the final field groups)
6. `review-confirmation.json` MUST NOT be set to `status=confirmed` unless the corresponding stage's dialog has been issued and answered with a non-abort option. The agent MUST NOT write `confirmed` based on a free-form message alone.
7. For Stage A, the dialog is valid only after the header block, the full schema table, and the row-count self-check are complete. A placeholder confirmation or a "preview" dialog issued earlier does not count.

---

## Stage A — schema.json Review

Stage A is the single schema-approval cycle for the current draft. For `dataset-only`, once a valid Stage A dialog answer is captured, do not ask for another schema-level confirmation unless the schema itself changes and the review is restarted from the top.

### A.1 Header block (plain text)

Before the table, list:

- Provisioning mode (`dataset-only` / `dataset+app`)
- Dataset type (`item` / `video`)
- Dataset name
- Application name (planned) or `not requested`
- Primary key field
- Title field
- Required fields
- For `video`: a semantic-slot checklist for `content_id`, `content_type`, `video_url`, `parent_content_id`, `sequence_index`, showing `present / missing / ambiguous` plus the current BizAttr mapping for each slot
- Source file path and record count

### A.2 Schema table (one row per field)

| # | Name | Type | Attributes | Meaning |
|---|------|------|------------|---------|

- **Row-count anchor (hard rule)**: the table MUST contain exactly `len(schema.json.Fields)` data rows — one row per schema field, in the order they appear in `schema.json`. No summarization, no "key fields only" view, no omissions. Before issuing the dialog, the agent MUST self-check that `rendered_rows == len(schema.json.Fields)`; if they differ, re-render and do NOT proceed to §A.4.
- `#` MUST be a monotonically increasing integer starting at 1, so the user can see at a glance whether every field made it into the table.
- `Name` MUST match the exact field name in `schema.json.Fields[i].Name`. Do not rename, pluralize, or translate it in the table.
- `Type` MUST show both the numeric code and a human-readable name, e.g. `1 (string)`, `3 (int64)`, `6 (array<string>)`.
- `Attributes` MUST list `PK`, `Required`, and `BizAttr=<code> (<semantic name>)` when present; use `—` when empty.
- `Meaning` MUST come from `schema.json` (prompt-inferred). If the meaning is empty or clearly wrong, flag it and offer to fix it instead of continuing. The `Meaning` cell MUST NOT be left blank — use `⚠️ missing (please fix)` when the source is empty, so the omission is visible to the user.
- The dialog in §A.4 MUST NOT be issued until the header block has been shown, the full table has been rendered, and the row-count self-check has passed.

### A.3 Risk notes (optional but recommended)

Right after the table, highlight any risk signals observed in `profile` / `validation`:

- fields with `missingCount > 0`
- high-cardinality text fields
- URL-like values in non-media fields
- likely duplicated fields (e.g. `actors` vs. `actor_list`)
- samples that are `null` or `[null]`
- for `video`: any missing or ambiguously mapped semantic slot among `content_id`, `content_type`, `video_url`, `parent_content_id`, `sequence_index`

### A.4 Dialog

Ask exactly one question using the question dialog, with these options:

- "Confirm as-is, continue to the requested provisioning path" (recommended default)
- "Change application / dataset name first"
- "Fix schema first (I will tell you which fields)"

The dialog MUST be issued; MUST NOT proceed until the user picks an option through the dialog. A free-form chat reply (even one that clearly says "yes / ok / confirm") does NOT count as Stage A confirmation — in that case, still issue the dialog and use the chat reply only as context for the "Other" option. Each Stage A attempt allows exactly one valid dialog after the table is complete. For `dataset-only`, a successful Stage A confirmation should lead directly to dataset provisioning, not to another schema-level dialog or bind-time review. Writing `review-confirmation.requiredChecks` to true or proceeding to Stage B without a dialog answer is a bug.

### A.5 Invalid sequence recovery

If the agent asks the Stage A dialog before rendering the complete schema context, that dialog is invalid. The agent MUST:

1. discard that dialog as a confirmation source,
2. restart Stage A from `A.1 Header block`,
3. re-render the full schema table and any risk notes,
4. issue one new dialog only after the table is complete.

Do not treat the first premature dialog as "the first confirmation" and then ask a second schema-level confirmation to compensate. The restarted Stage A produces the only valid dialog for that schema draft.

---

## Stage B — Bind-time field-config Review

This stage applies only when the requested path includes application creation or dataset binding. Skip this entire stage for `dataset-only`. When Stage B is needed, replace the legacy `vs item review` summary-only `y/N` flow with the process below.

### B.1 Summary block (plain text)

- Plan directory
- Dataset type and name
- Group sizes: `IndexFields=N, FilterFields=N, SuggestFields=N, ImageIndexFields=N, VideoIndexFields=N`
- `TitleField` and `PrimaryKey`

### B.2 Per-group tables

Render **one table per group** in this order:

1. `IndexFields` — text / lexical recall
2. `FilterFields` — filter, facet, range
3. `SuggestFields` — search suggest
4. `ImageIndexFields` — image asset recall
5. `VideoIndexFields` — video asset / metadata recall

Each table MUST have the columns below. `Reason` and `Risk` are mandatory; this is what lifts the UX above a plain field-name list.

| Field | Type | Meaning | Reason to include | Risk / note |
|-------|------|---------|--------------------|-------------|

**Row-count anchors (hard rules):**

- For every group `G`, the corresponding table MUST contain exactly `len(field-config.json.<G>)` data rows — one row per field currently proposed in that group, in the same order. No summarization, no "key fields only" view, no omissions.
- All five groups MUST have a rendered table, even when the group is empty. For an empty group, render the table with zero data rows and a single italic line `_No fields currently proposed for this group._` below it, so the user sees that the agent explicitly decided to leave it empty rather than forgot about it.
- Before issuing the Stage B dialog, the agent MUST self-check `rendered_rows_in_group == len(field-config.json.<G>)` for each of the five groups; if any mismatch, re-render and do NOT proceed to §B.3.
- Every cell MUST be populated. If no business signal is available, use these defaults instead of leaving blanks:
  - `Reason to include` → `business-goal alignment` (default) or a more specific phrase from the guidance below
  - `Risk / note` → `none observed` (default) or a more specific phrase from the guidance below
- For `--type video`, the row-count check runs AFTER the DefaultFieldStrategy correction described in §B.2.1; the proposal fed into §B.2 MUST already satisfy that server constraint.

Guidance for `Reason to include` — prefer a specific phrase; fall back to the `business-goal alignment` default only when none of these apply:

- `IndexFields`: "primary text recall", "named-entity recall (person / role / org)", "semantic long text", "category recall"
- `FilterFields`: "faceted filter", "range filter", "id-style filter", "language / locale filter"
- `SuggestFields`: "short title / alias for type-ahead"
- `ImageIndexFields`: "true image URL / asset field"
- `VideoIndexFields`: "video URL / duration / content type metadata"

Guidance for `Risk / note` — prefer a specific phrase; fall back to the `none observed` default only when no risk signal is present:

- "duplicate with `<other_field>`"
- "URL-like value, usually not useful for lexical index"
- "samples are null / `[null]`, recall will be empty"
- "high-cardinality text, may hurt suggest relevance"
- "stored as string, range filter will be lexical not numeric"

### B.2.1 Video DefaultFieldStrategy constraint (mandatory for `--type video`)

For `--type video` datasets, the server enforces a hard `DefaultFieldStrategy` constraint table on the bind-time field groups (`IndexFields` / `FilterFields` / `SuggestFields`). The authoritative table lives in [video-field-constraints.md](video-field-constraints.md); this file intentionally does not duplicate it to avoid drift.

Before rendering the per-group tables for a `video` dataset, the agent MUST:

1. Load the constraint table from [video-field-constraints.md](video-field-constraints.md).
2. Compare the current proposal (including LLM-inferred defaults) against every row of that table.
3. If any row is violated, fix the proposal in memory BEFORE rendering Stage B tables and BEFORE asking the Stage B dialog. The corrective action is deterministic: add missing mandatory placements, remove forbidden placements. Do NOT ask the user to resolve the violation — surface the corrected proposal and explain what was changed in a short note above the tables (e.g. "Adjusted to satisfy video DefaultFieldStrategy: added `video_url` to IndexFields; moved `content_id/content_type/parent_content_id/sequence_index` into FilterFields.").
4. Re-run step 2 after the correction; only a fully constraint-satisfying proposal may go into the Stage B dialog.

Additional rules:

- The Stage B dialog (§B.3) MUST still be issued after the correction; the user confirms the final, constraint-satisfying proposal, never a violating one.
- Violating proposals MUST NEVER be written to `field-config.json` or `review-confirmation.json`, and MUST NEVER be submitted to `vs item apply` / `vs app dataset bind`, because the server will reject them with `MissingParameter.DefaultFieldStrategy`.
- If the user's Stage B answer asks for a change that would re-introduce a violation, do not silently override the user; stop, cite [video-field-constraints.md](video-field-constraints.md), and ask the user to amend the proposal.

### B.3 Dialog

Stage B MUST be confirmed through an interactive question dialog. A free-form chat reply, a summary message, or the user saying "looks good" in chat does NOT count as Stage B confirmation. Ask the user per-group, using the question dialog. Two equivalent flows are available; pick one:

**Flow B.3.a — compact (preferred when the config is reasonable):**
One question with these options:

- "Confirm all groups, continue to provision" (recommended default)
- "Adjust one or more groups (I will tell you which)"
- "Abort and regenerate the plan"

**Flow B.3.b — per-group (preferred when several risks exist):**
Ask one question per non-trivial group, each with options:

- "Keep this group as-is"
- "Drop the following fields: …"
- "I will edit `field-config.json` manually"

After collecting the answers, summarize the final groups and issue ONE final confirmation dialog before writing `review-confirmation.json` and invoking `item apply`. If the final confirmation dialog was not issued or not answered, Stage B is unconfirmed — do not proceed to apply.

### B.4 Post-confirmation actions (agent-side)

After the user confirms:

1. If any group changed, rewrite `field-config.json` with the new groups.
2. Update `review-confirmation.json`:
   - `status = "confirmed"`
   - `confirmedBy = "<reviewer name or 'user'>"`
   - `confirmedAt = <current ISO timestamp>`
   - `requiredChecks.{fieldTypesReviewed, fieldAttributesReviewed, displayStyleReviewed, runtimeFieldConfigReviewed} = true`
   - `fieldConfigReview.{indexFields, filterFields, suggestFields, imageIndexFields, videoIndexFields}` = final arrays
3. Run `vs item apply --plan-dir <dir> --confirm-review` (do NOT add `--dry-run`, do NOT degrade into `OnlySave=true`).

### B.5 What NOT to do

- Do NOT merge Stage A and Stage B into a single confirmation.
- Do NOT skip Stage B because Stage A already happened; they cover different artifacts.
- Do NOT rely on a CLI-only confirmation step when the user is driving the workflow through an agent chat — that path loses the table + dialog UX.
- Do NOT claim the groups are "confirmed" just because `field-config.json` exists; confirmation requires an explicit dialog answer.
- Do NOT auto-confirm CLI bind prompts (`Proceed to bind the dataset with this field config? (yes/no):`).
- Do NOT treat a free-form chat reply ("yes", "ok", "looks good", "go ahead", etc.) as a dialog answer. The dialog MUST still be issued; the free-form text can at most populate the `Other` option of that dialog.
- Do NOT write `review-confirmation.json` with `status=confirmed` or any `requiredChecks=true` until the matching stage's dialog has been issued and answered with a non-abort option.
- Do NOT issue a placeholder Stage A confirmation before rendering the full schema table.
- Do NOT re-ask the same Stage A confirmation in a `dataset-only` flow once a valid dialog has already been answered for the current schema draft.

---

## Agent-mode apply handoff

After the agent has completed Stage A and, when needed, Stage B through in-chat tables + interactive dialogs:

1. Treat the dialog answers as the human review source of truth.
2. If the requested path is `dataset-only`, run `dataset create` and `dataset ingest`, then stop. Prefer the full `dataset-create.json` payload so `Schema` and `DataFieldConfig.FieldDescMap` are submitted together. Do not write a bind-time `fieldConfigReview` snapshot for a flow that never binds an app.
3. If the requested path is `dataset+app`, persist any approved group edits back to `field-config.json`.
4. For the `dataset+app` path, write `review-confirmation.json` with:
   - `status = "confirmed"`
   - `confirmedBy`
   - `confirmedAt`
   - all `requiredChecks = true`
   - `fieldConfigReview` containing the final reviewed groups
5. For the `dataset+app` path, run `vs item apply --plan-dir <dir> --confirm-review`.

The CLI review artifact is now a simple review record. Agents do not need to
compute or align a separate fingerprint.

---

## Minimal Pseudocode for an Agent

```text
# Stage A
render_header(plan)
render_schema_table(plan.schema)
render_risks(plan.profile, plan.validation)
answer_a = ask_dialog(
  question = "schema confirmation?",
  options = [confirm, rename_app, fix_schema]
)
if answer_a != confirm: handle and loop

if provisioning_mode == "dataset-only":
    if file_exists("dataset-create.json"):
        run("vs dataset create --data @dataset-create.json")  # preferred: keeps Schema + FieldDescMap together; mandatory for video
    elif plan.datasetType == "video":
        stop("dataset-create.json is required for video dataset creation")
    else:
        run("vs dataset create --name <dataset> --type item --schema @schema.json")  # fallback only when full payload is unavailable or unsuitable
    run("vs dataset ingest --dataset-id <id> --fields @<normalized-items-artifact>")
    stop

# Stage B
render_bind_summary(plan.fieldConfig)
if plan.datasetType == "video":
    enforce_video_default_field_strategy(plan.fieldConfig)  # see video-field-constraints.md
    # fixes: video_url -> IndexFields; content_id/content_type/parent_content_id/sequence_index -> FilterFields;
    # removes any of those fields from forbidden groups (SuggestFields, IndexFields vs FilterFields, etc.)
for group in [IndexFields, FilterFields, SuggestFields, ImageIndexFields, VideoIndexFields]:
    render_group_table(group, with_reason_and_risk=True)
answer_b = ask_dialog(
  question = "bind-time field-config confirmation?",
  options = [confirm_all, adjust_groups, abort]
)
if answer_b == adjust_groups: per_group_dialog_loop()
if answer_b == abort: stop

persist_field_config_if_changed()
write_review_confirmation_json()
run("vs item apply --plan-dir <dir> --confirm-review")
```

---

## Related Files

- Plan artifacts consumed by this UX: `schema.json`, `field-config.json`, `review-confirmation.json`, `plan.json`
- Stage A constraint comes from [review-checklist.md](review-checklist.md) §1.
- Stage B constraint comes from [review-checklist.md](review-checklist.md) §2 and the bind-time rules in `vs-app-dataset-bind/SKILL.md`.
- Stage B video-specific server constraint comes from [video-field-constraints.md](video-field-constraints.md) (applied automatically in §B.2.1 before the dialog).
