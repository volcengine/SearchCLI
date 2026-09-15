# Review Checklist

Before provisioning anything, first confirm whether the requested path is `dataset-only` or `dataset+app`. The schema review below always applies; the bind-time field-config review applies only to the `dataset+app` branch before running `item apply`.

## 1. schema.json

- Is `PrimaryKey` a stable identifier rather than a display field or temporary ID?
- Is the requested provisioning boundary explicit (`dataset-only` or `dataset+app`), so the agent does not create an application by default?
- Are field names normalized into maintainable long-term names?
- Do field types match the raw data, especially for numeric, boolean, and multi-value fields?
- Are obvious large noise fields excluded from the stored schema?
- Before approval, has every schema field been shown to the user with its name, type, attributes, and intended meaning or use instead of only a key-field summary?
- **Row-count anchor (Stage A)**: does the rendered schema table contain exactly `len(schema.json.Fields)` data rows, with the fields in the same order as in `schema.json`? If the count differs, Stage A MUST be re-rendered before issuing the dialog.
- Are all `Meaning` cells populated? Empty meanings MUST be surfaced as `⚠️ missing (please fix)` in the table so the user can see the omission.
- For `--type video`, did the Stage A summary explicitly show the status of `content_id`, `content_type`, `video_url`, `parent_content_id`, and `sequence_index`, including whether each semantic slot is present and which BizAttr mapping currently claims it?

## 2. field-config.json

- This section applies only to the `dataset+app` path. Skip it entirely for `dataset-only`.
- Does `FieldDescMap` describe the stored fields accurately and with stable business meaning?
- Are field descriptions clear enough for later bind-time inference and manual review?
- Are image-like or display-facing fields described clearly enough for later `ImageIndexFields` confirmation?
- Have the field attributes and display-facing expectations been confirmed with the user?
- For bind-time review (Stage B), has each of `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, and `VideoIndexFields` been presented to the user as a dedicated per-group table with columns `Field / Type / Meaning / Reason to include / Risk or note`?
- **Row-count anchor (Stage B)**: for every group `G`, does the rendered table contain exactly `len(field-config.json.<G>)` data rows, in the same order as in `field-config.json`? If any group mismatches, Stage B MUST be re-rendered before issuing the dialog.
- **Empty groups are still rendered**: are all five groups rendered with a table header, even when the group is empty (shown with zero data rows + an italic line `_No fields currently proposed for this group._`)? An absent group table MUST NOT be silently skipped.
- **No blank cells**: are `Reason to include` and `Risk / note` populated for every row (defaulting to `business-goal alignment` / `none observed` when no stronger signal exists)?
- Has an interactive question dialog been issued to collect the user's decision for Stage B, instead of relying on a free-form yes/no or the `vs item review` terminal `y/N`?
- After Stage B confirmation, has `review-confirmation.json` been updated with `status=confirmed`, all `requiredChecks=true`, and a `fieldConfigReview` block that records the final field groups shown to the user?
- For `--type video` datasets, does the proposed field-config satisfy the `DefaultFieldStrategy` server constraint? The authoritative rule table lives in [video-field-constraints.md](video-field-constraints.md) — this checklist intentionally does not duplicate the per-field rows to avoid drift. Verify by re-loading that file row by row against the current `field-config.json`, and if any row fails, fix the proposal and rerun Stage B before writing `review-confirmation.json`.

## 3. online-config.json

- Do default search parameters align with the business goal?
- Does the chat config already include `SearchSceneID`?
- Have fields that should not be used online been excluded?
- Has the intended result-card or display style already been clarified with the user?

## 4. validation.json

- Are there any blocking issues?
- Are there duplicate primary keys, missing primary keys, missing titles, or mixed types?
- Did cleanup rename fields or normalize values more aggressively than expected?

## 5. search-scene*.json

- Are the scene name and description understandable to the next maintainer?
- Is the scene type appropriate for the current item-search scenario?
- If this is a new app, is the default search scene good enough for the first smoke check?

## 6. recommend-scene*.json

- Does the user actually need recommendation?
- Are `BhvSceneTypes` already known?
- Has the target page / module been confirmed with the user?
- If behavior scene types are not known, do not force a recommend scene into production
- If the page / module is not confirmed yet, do not create or update the recommend scene

## When Not To Continue With Apply

- The business goal is too vague to choose stable field descriptions or later bind-time field groups
- The user only asked for dataset provisioning, but the current plan would continue into app creation or binding
- The primary-key strategy is obviously unstable
- The raw data needs splitting, flattening, or aggregation before it can represent an item cleanly
- Validation still has blocking issues that the user has not accepted
- The page / module for recommendation is still unknown

## When It Is Safe To Continue

- The schema and field config only need small edits
- Validation has warnings but no blocking issues
- If you chose to run an optional preflight preview, `item apply --dry-run` shows the expected steps and resource names
- The user has explicitly confirmed the full schema field-by-field, field attributes, display style, bind-time field groups, and any recommend entry binding
- The real bind step will run directly without `--dry-run` or `OnlySave=true` semantics once the user confirms
