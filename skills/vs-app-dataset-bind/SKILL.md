---
name: vs-app-dataset-bind
description: "Binds a dataset to an application with reviewed field config inference. Invoke when using `vs app dataset bind` and searchable/filter/suggest fields must be inferred and confirmed first."
category: app
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: app dataset bind, bind dataset, field config inference, index fields, filter fields, suggest fields
commands: app dataset bind, app dataset-config get, app dataset-config list, dataset schema get, dataset get
---

# Viking App Dataset Bind

## When to Use

Use this skill when the user wants to run `vs app dataset bind` and the bind step is responsible for inferring and confirming application-facing field settings instead of blindly reusing or omitting them.

## Preconditions

- an `application-id` and a `dataset-id` are available
- you can access enough representative dataset context to infer bind-time field config
- prefer an existing plan directory or raw source file when available, because the inference prompts need `Dataset_Description`, `Data`, and `Meaning`
- schema and dataset-side field attributes have already been shown to the user and explicitly reconfirmed before bind-time inference starts
- do not assume the dataset-creation `field-config.json` already contains bind-time fields such as `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, or `VideoIndexFields`
- if pulled dataset metadata already contains `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, or `VideoIndexFields`, treat them as legacy/non-standard unless a human reviewer explicitly validates them

## Commands

- `app dataset bind`: bind the dataset to the application with an explicit `--field-config`
- `app dataset-config get` / `app dataset-config list`: inspect current bound dataset config before changing it
- `dataset schema get` / `dataset get`: inspect the dataset schema and metadata needed for field inference

## Workflow

1. Start by inspecting the current app and dataset context: existing dataset config, dataset schema, and any available source plan or raw sample data
2. Build the three prompt inputs required by the inference flow:
   - `Dataset_Description`: prefer an existing dataset description or plan output; if missing, derive it from the same source context used for binding
   - `Data`: collect up to 10 representative JSON/JSONL records
   - `Meaning`: prepare field meanings in the same tree shape expected by prompt inference
3. Reuse `/Users/bytedance/go/src/SearchCLI/skills/schema.prompt` and apply these prompt templates:
   - `filter_infer_prompt` to infer `FilterFields`
   - `suggest_infer_prompt` to infer `SuggestFields`
   - `index_infer_prompt` to infer `IndexFields`
4. Assemble a proposed field config JSON for bind:
   - keep the dataset-side `FieldDescMap` if it already exists
   - ignore pulled `IndexFields` from dataset metadata when preparing bind-time config
   - set `IndexFields` from the `search` output of `index_infer_prompt`
   - ignore pulled `FilterFields` from dataset metadata when preparing bind-time config
   - re-infer `FilterFields` from `filter_infer_prompt`, grounded in the field descriptions from `FieldDescMap`
   - ignore pulled `SuggestFields` from dataset metadata when preparing bind-time config
   - set `SuggestFields` from the `suggest` output of `suggest_infer_prompt`
   - ignore pulled `ImageIndexFields` and `VideoIndexFields` from dataset metadata when preparing bind-time config
   - infer `ImageIndexFields` from schema, meanings, and sample values by selecting true image URL or image asset fields
   - infer `VideoIndexFields` from schema, meanings, and sample values by selecting true video URL or media asset fields
5. Show the proposed `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, and `VideoIndexFields` to the user and explicitly confirm them before binding
   - when driven by an agent chat, the confirmation MUST follow the Stage B contract in `vs-item-onboarding/references/agent-confirmation-ux.md`: render one per-group table (columns `Field / Type / Meaning / Reason to include / Risk or note`), then ask through an interactive question dialog
   - if the CLI later prints a summary-only confirmation step, do not treat that as a substitute for the agent's own table + dialog review
   - when binding a `video` dataset, the proposed field groups MUST additionally satisfy the `DefaultFieldStrategy` server constraint described in the **Video Dataset Field Constraints** section below and in `vs-item-onboarding/references/video-field-constraints.md`; fix the proposal before asking for confirmation rather than letting the user confirm a payload that will be rejected
6. Run `vs app dataset bind --application-id <id> --dataset-id <id> --field-config @field-config.json`
7. After binding, verify the effective config with `app dataset-config get`
8. Treat bind success as the end of stage one; do not wait for app readiness unless the user explicitly asks for readiness or runtime verification

## Video Dataset Field Constraints (DefaultFieldStrategy)

Video datasets (`Dataset.Type = 3`, produced with `--type video` in the onboarding skill) carry HARD server-side constraints on the bind-time field groups. Violating them causes `BindAppDataset` / `CreateDataset` to fail with:

```
Error.Code    = MissingParameter.DefaultFieldStrategy
Error.Message = The default field strategy is missing.
```

These rules are enforced by `checkFieldConstraint` on the server and cannot be bypassed by inference, prompt tuning, or user preference. Any bind-time proposal that violates them must be fixed before binding.

| Field               | IndexFields  | FilterFields | SuggestFields |
|---------------------|--------------|--------------|---------------|
| `video_url`         | **Must**     | Forbidden    | Forbidden     |
| `content_id`        | Forbidden    | **Must**     | Forbidden     |
| `content_type`      | Forbidden    | **Must**     | Forbidden     |
| `parent_content_id` | Forbidden    | **Must**     | Forbidden     |
| `sequence_index`    | Forbidden    | **Must**     | Forbidden     |

- `Must` → the field MUST appear in that group.
- `Forbidden` → the field MUST NOT appear in that group.
- Other fields (title, director, actors, genres, duration, language, alias, …) carry no server constraint; choose them based on the business goal and the inferred output.
- `ImageIndexFields` and `VideoIndexFields` are selected independently from the actual image / video asset fields in the schema. `video_url` is commonly added to `VideoIndexFields` as well; that is independent of the table above.

Before calling `vs app dataset bind`, the agent MUST verify every row of the table against the current proposal. If the proposal violates any row:

1. fix the proposal (move / add / remove the constrained fields),
2. re-render the affected per-group table,
3. ask the user to reconfirm through the Stage B dialog,
4. only then run `vs app dataset bind`.

See the authoritative reference at `vs-item-onboarding/references/video-field-constraints.md`.

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- Do not run `app dataset bind` with a guessed or empty bind-time `field-config` when searchable/filter/suggest/image/video fields are part of the user request
- Do not start bind-time inference until schema and dataset-side field attributes have been explicitly reconfirmed with the user
- Do not skip user confirmation for `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, or `VideoIndexFields`
- When the bind is driven by an agent chat, confirmation MUST use per-group tables plus an interactive question dialog as specified in `vs-item-onboarding/references/agent-confirmation-ux.md`; do not downgrade to a single plain-text summary, a free-form yes/no chat reply, or the CLI terminal `y/N`
- Do not auto-confirm a CLI summary step on the user's behalf. The agent-side table + dialog review remains the source of truth
- Reuse the prompt contracts in `schema.prompt`; do not invent alternate output keys for these inference steps
- Treat dataset creation and dataset binding as separate stages: `FieldDescMap` belongs to dataset creation, while `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, and `VideoIndexFields` are inferred at bind time
- Treat pulled dataset-side `IndexFields`, `FilterFields`, `SuggestFields`, `ImageIndexFields`, and `VideoIndexFields` as untrusted historical data by default; use `FieldDescMap` plus representative samples to re-infer the bind-time field groups
- Treat prompt output as a proposal, not ground truth; remove noisy fields when the sampled data or business goal contradicts the prompt result
- For `video` datasets, the bind-time proposal MUST satisfy the `DefaultFieldStrategy` server constraint table (see the **Video Dataset Field Constraints** section above): `video_url` MUST be in `IndexFields` and MUST NOT be in `FilterFields` / `SuggestFields`; `content_id`, `content_type`, `parent_content_id`, and `sequence_index` MUST each be in `FilterFields` and MUST NOT be in `IndexFields` / `SuggestFields`. Verify this table before rendering the Stage B dialog and before calling `vs app dataset bind`; never submit a proposal that violates it, regardless of what the LLM inference or a user override suggests.
- Do not call `app wait-ready` or otherwise block on readiness after a successful bind unless the user explicitly requests that second-stage verification
- If the dataset lacks enough sample data to support the prompts, stop and ask for a better source sample instead of binding blindly
