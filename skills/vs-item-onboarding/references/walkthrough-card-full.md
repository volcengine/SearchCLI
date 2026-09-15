# Walkthrough: Content Cards JSON

This walkthrough uses a generic content-card style JSON file such as:

- `./content-cards.json`

It is a good fit for showing how content-card style item data moves through the onboarding flow.

## 1. Start With Profile

```bash
vs item profile --file ./content-cards.json --pretty
```

Typical first-pass results are close to:

- `doc_id` is inferred as the primary key
- `title` is inferred as the title field
- field meanings are inferred well enough to populate `schema.json`

## 2. Generate The Plan

```bash
vs item plan \
  --file ./content-cards.json \
  --goal "Build content search"
```

In the plan directory, pay special attention to:

- `schema.json`
- `online-config.json`
- `validation.json`
- `search-scene-create.json`
- `recommend-scene-create.json`
- `report.md`
- Confirm the generated field meanings are grounded in prompt inference rather than ad-hoc guesses
- Do not expect `field-config.json` at this stage; bind-time field groups are inferred only if you later choose the `dataset+app` branch

## 3. Review The Plan Carefully

- Is `doc_id` really a stable primary key?
- Does `title` represent the main card title well enough?
- Do the generated field descriptions capture the real business meaning?
- Are content, keywords, category, and tag fields described clearly enough for later bind-time inference?

If any of these inferences look wrong, edit the generated JSON directly instead of forcing the first-pass output.

## 4. Optional Preflight Preview

If a human reviewer wants to preview the execution steps before the real app-provisioning run, use:

```bash
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
```

Typical preview steps include:

- `validation_gate`
- `schema_check`
- `create_dataset`
- `ingest_items`
- `create_application`
- `activate_application`
- `search_scene_bootstrap`
- `search_trial`
- `chat_trial`

If the user only wants dataset provisioning, skip this preview and use the `dataset-only` branch instead:

```bash
vs item plan \
  --file ./content-cards.json \
  --type item \
  --goal "Build content search" \
  --skip-app
```

If you later execute via `vs item provision` or `vs item apply` instead of the lower-level dataset commands, you may pass `--skip-app` again as an execution-time guard rail.

Then, after Stage A confirms the schema:

```bash
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Prefer the full `dataset-create.json` payload here so `Schema` and `DataFieldConfig.FieldDescMap` are submitted together. Fall back to `--schema @schema.json` only when that plan artifact is missing or clearly unsuitable for the current plan.

## 5. Run The Real Apply

```bash
vs item apply \
  --plan-dir ./.viking/item-plans/<plan> \
  --confirm-review
```

Use this real apply only for the `dataset+app` branch. Treat bind success as the end of stage one. Only add readiness checks or `--run-trials` if the user explicitly asks for second-stage verification.
After the user confirms the schema and bind-time field groups, run this real apply directly without `--dry-run` or only-save semantics.

If you already know the behavior scene types required for recommend bootstrap and the target page / module has been confirmed, add:

```bash
--confirm-recommend-entry-binding \
--recommend-bhv-scene-types your_bhv_scene
```

## 6. Fallback Paths

- If the fresh app is not ready: `vs app diagnose --application-id <app>`
- If recall quality is poor after binding: inspect the bind-time field config and the search scene first
- If chat does not trigger retrieval: inspect the chat section of `online-config.json` and the default search-scene binding
