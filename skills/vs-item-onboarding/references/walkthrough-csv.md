# Walkthrough: Generic CSV Catalog

This walkthrough is intended for flat CSV datasets such as catalogs, content tables, asset tables, or SKU-style exports.

Assume the user provides:

- `./catalog.csv`

Typical columns include:

- `item_id`
- `title`
- `category`
- `brand`
- `price`
- `tags`
- `description`
- `image_url`

## 1. Run Profile

```bash
vs item profile --file ./catalog.csv --pretty
```

Confirm these first:

- Is `item_id` stable and unique?
- Is `title` really the display title users should search and see?
- Is `tags` already a multi-value field, or is it just a comma-joined string?
- Should `price` be used as a filter instead of an index field?

## 2. Run Plan

```bash
vs item plan --file ./catalog.csv --goal "Build catalog search"
```

If the user only wants dataset provisioning, add `--skip-app` here. If execution later goes through `vs item provision` or `vs item apply`, you may pass `--skip-app` again as an execution-time guard rail.

Pay special attention to:

- `price`, `brand`, and `category` should have clear field descriptions for later bind-time filter inference
- `description` should be described clearly enough for later search-field inference
- `image_url` must remain a clearly described displayable URL for later image-field inference
- If `tags` is a comma-separated string, split or fix its strategy before apply

## 3. Common Edits

- Improve `FieldDescMap` when field meaning is vague or misleading
- Clarify which structured fields are intended for later filter use
- Clarify which long-text fields are intended for later search use
- If CSV headers are messy, rename fields in the plan output to stable, maintainable names

## 4. Apply Strategy

If a human reviewer wants a preflight preview for the `dataset+app` branch, start with:

```bash
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
```

After the user confirms the schema and bind-time field groups, continue with the real stage-one apply for the `dataset+app` branch:

```bash
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review
```

Treat bind success as the end of stage one, and run that real apply directly without `--dry-run` or only-save semantics. Only continue with readiness checks or smoke tests when the user explicitly asks for that second-stage verification.

If the user only wants dataset provisioning, stop after Stage A and use:

```bash
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Prefer the full `dataset-create.json` payload here so `Schema` and `DataFieldConfig.FieldDescMap` are submitted together. Fall back to `--schema @schema.json` only when that plan artifact is missing or clearly unsuitable for the current plan.

## 5. When This Workflow Is Not A Good Fit

- One CSV mixes several different entities and needs table splitting first
- Key fields are nested JSON strings and require preprocessing
- There is no stable primary key
- The same column mixes incompatible value types such as price, prose, and booleans
