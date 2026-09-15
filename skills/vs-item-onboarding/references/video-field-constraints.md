# Video Dataset Field Constraints (DefaultFieldStrategy)

This reference documents the hard bind-time field-group constraints that the
Viking aisearch server enforces for `video` datasets. Violating these
constraints causes `CreateDataset` / `BindAppDataset` to fail with:

```
Error.Code    = MissingParameter.DefaultFieldStrategy
Error.Message = The default field strategy is missing.
```

These rules are NOT business recommendations. They are server-side validation
rules (`checkFieldConstraint` in `app_data_config.go`). Any Stage B proposal
that violates them will be rejected, regardless of how the agent reasons about
the business goal.

## Scope

- Applies to every dataset created with `--type video` (`Dataset.Type = 3`).
- Applies to both dataset-creation time (`DataFieldConfig` in `CreateDataset`)
  and bind time (`vs app dataset bind --field-config`).
- Does NOT apply to `item` datasets; `--type item` has no `DefaultFieldStrategy`
  constraint of this form.

## Constraint Table

For every field below, the server enforces a fixed status (`Must` / `Forbidden`
/ `Any`) in each of the three bind-time field groups. `Any` means the agent is
free to include or exclude the field based on business judgement.

| Field               | IndexFields  | FilterFields | SuggestFields |
|---------------------|--------------|--------------|---------------|
| `video_url`         | **Must**     | Forbidden    | Forbidden     |
| `content_id`        | Forbidden    | **Must**     | Forbidden     |
| `content_type`      | Forbidden    | **Must**     | Forbidden     |
| `parent_content_id` | Forbidden    | **Must**     | Forbidden     |
| `sequence_index`    | Forbidden    | **Must**     | Forbidden     |

Legend:

- **Must** — the field MUST appear in that group. Omitting it causes
  `MissingParameter.DefaultFieldStrategy`.
- **Forbidden** — the field MUST NOT appear in that group. Including it causes
  the same error.
- `Any` — no server-side constraint. Decide based on business goal and data.

`ImageIndexFields` and `VideoIndexFields` are not part of the
`DefaultFieldStrategy` constraint table and are chosen based on the actual
image / video asset fields in the schema. The fixed field `video_url` is
commonly also added to `VideoIndexFields` for video feature extraction, but
that is independent of the `DefaultFieldStrategy` table above.

## Agent Checklist (Stage B for video datasets)

Before presenting the Stage B per-group tables and asking for confirmation,
the agent MUST verify:

1. `video_url`
   - [x] listed in `IndexFields`
   - [ ] NOT in `FilterFields`
   - [ ] NOT in `SuggestFields`
2. `content_id`
   - [x] listed in `FilterFields`
   - [ ] NOT in `IndexFields`
   - [ ] NOT in `SuggestFields`
3. `content_type`
   - [x] listed in `FilterFields`
   - [ ] NOT in `IndexFields`
   - [ ] NOT in `SuggestFields`
4. `parent_content_id`
   - [x] listed in `FilterFields`
   - [ ] NOT in `IndexFields`
   - [ ] NOT in `SuggestFields`
5. `sequence_index`
   - [x] listed in `FilterFields`
   - [ ] NOT in `IndexFields`
   - [ ] NOT in `SuggestFields`

If any row fails, fix `field-config.json` / the Stage B proposal before
running `vs item apply --confirm-review` or `vs app dataset bind`.

## Why These Constraints Exist

The server relies on these fixed fields for video understanding and cross-video
linking:

- `video_url` is the primary index signal that the video content pipeline
  consumes. It must be indexable as a content field, so the server requires it
  in `IndexFields`. Treating it as a filter or suggest source would break the
  pipeline.
- `content_id`, `content_type`, `parent_content_id`, and `sequence_index`
  describe the hierarchical relationship between a collection (series) and its
  videos. They are structural identifiers rather than free-text search
  signals, so the server requires them only in `FilterFields` and forbids
  them in `IndexFields` / `SuggestFields`.

## Common Failure Modes

- Putting `video_url` into `VideoIndexFields` only and forgetting to put it in
  `IndexFields` → `MissingParameter.DefaultFieldStrategy`.
- Treating `content_id` / `parent_content_id` / `sequence_index` as "internal
  system fields" and omitting them from `FilterFields` →
  `MissingParameter.DefaultFieldStrategy`.
- Including `content_type` in `IndexFields` because it looks like a search
  facet → `MissingParameter.DefaultFieldStrategy`.
- Including `video_url` in `SuggestFields` because it is a string array →
  `MissingParameter.DefaultFieldStrategy`.

## See Also

- `vs-item-onboarding/SKILL.md` Stage B video constraints section
- `vs-app-dataset-bind/SKILL.md` Stage B video constraints section
- `vs-item-onboarding/references/review-checklist.md` §2 bind-time review
- `vs-item-onboarding/references/agent-confirmation-ux.md` Stage B pseudo-flow
