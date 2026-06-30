# Viking Agent Quick Start

Use this flow when an external agent needs to install the CLI, install Viking skills, and complete authentication without asking the user to paste AK/SK into chat.

All commands below must run in a real machine terminal, not in a sandbox.

## 1. Install

```bash
git clone <public-repo-url> viking_cli
cd viking_cli
bash ./scripts/install.sh
npx skills add "<public-repo-url>" -y -g
```

## 2. Authenticate

Use this priority order:

1. If the current shell already has `VIKING_AK` and `VIKING_SK`, run:

```bash
vs auth import-env
```

2. Otherwise, if the agent can open a real system terminal and keep the interactive prompt alive, run:

```bash
vs auth login
```

3. Only if interactive login is not possible, ask the user to set environment variables in the current shell and then run:

```bash
vs auth import-env
```

macOS / Linux:

```bash
export VIKING_AK=...
export VIKING_SK=...
```

Windows PowerShell:

```powershell
$env:VIKING_AK="..."
$env:VIKING_SK="..."
```

## 3. Verify

```bash
vs --help
vs auth status --json
vs doctor --json
vs skill list
vs skill show --name vs-item-onboarding
vs skill show --name vs-search-tuning
```

## 4. Configure LLM For Search Tuning

Search tuning query generation and LLM relevance judging need an OpenAI-compatible LLM API. Do not ask the user to paste the LLM API key into chat.

Use this priority order:

1. If the current real terminal already has `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY`, and `VIKING_LLM_MODEL`, run:

```bash
vs llm import-env
```

2. Otherwise, if the agent can keep an interactive real terminal alive, run:

```bash
vs llm login
```

3. Only if interactive login is not possible, ask the user to set environment variables in the current terminal and then run:

```bash
vs llm import-env
```

macOS / Linux:

```bash
export VIKING_LLM_BASE_URL=...
export VIKING_LLM_API_KEY=...
export VIKING_LLM_MODEL=...
```

Windows PowerShell:

```powershell
$env:VIKING_LLM_BASE_URL="..."
$env:VIKING_LLM_API_KEY="..."
$env:VIKING_LLM_MODEL="..."
```

Verify with:

```bash
vs llm status --json
vs search tune llm-check --live --json
```

## 5. Run The First Onboarding Flow

For structured item data, pick one provisioning boundary first:

### 5.1 Dataset + App

Use this path when the user wants app creation, bind-time field config review, or runtime verification:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
# optional preflight preview
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
# after the user confirms schema and bind-time fields
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review
```

### 5.2 Dataset-Only

Use this path when the user only wants dataset creation / import / ingestion:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
# after Stage A confirms schema
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Prefer `dataset-create.json` when the plan emitted it so dataset creation keeps `Schema` and `DataFieldConfig` together. The `--name <dataset-name> --type item --schema @schema.json` form remains the manual schema-only fallback when a full create payload is unavailable or unsuitable.

If you already have a plan and want to enforce the dataset-only boundary at execution time, `vs item provision` and `vs item apply` also accept `--skip-app`.

### 4.3 Video Dataset

If the user explicitly asks for a video dataset, pass `--type video` to both `item profile` and `item plan`.

For `dataset+app`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
# optional preflight preview
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
# after the user confirms schema and bind-time fields
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review
```

For `dataset-only`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
# after Stage A confirms schema
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

For video dataset-only provisioning, prefer `dataset-create.json` so the create request includes `DataFieldConfig`; `--schema @schema.json` alone can fail with `MissingParameter.DefaultFieldStrategy`.

If the data looks like video content (for example `video_url`, `duration`, `content_type=video`, `parent_content_id`, or `sequence_index`) but the user did not explicitly say `item` or `video`, ask a clarifying question before planning or applying.

## 6. Run Search Tuning

When the user asks for search tuning, ask first whether they have a tuning query set. Use real online queries when available; otherwise tell the user the CLI can generate synthetic queries from dataset samples.

```bash
vs search tune llm-check --json
# Add --retrievable-field-only if generated queries should use only configured text IndexFields.
vs search tune query-generate --application-id <app> --dataset-id <dataset> --query-count 100 --sample-size 200 --query-batch-size 10 --llm-concurrency 100 --timeout-ms 120000 --json
vs search tune plan --application-id <app> --dataset-id <dataset> --queries <queryFile> --json
vs search tune run --application-id <app> --dataset-id <dataset> --queries <queryFile> --search-concurrency 18 --llm-concurrency 100 --timeout-ms 120000
vs search tune report --run-id <run-id> --json
vs search tune apply --application-id <app> --run-id <run-id> --dry-run
vs search tune apply --application-id <app> --run-id <run-id> --confirm-create-scene
```

The first version fixes `mode=UserDefined` and tunes only user-defined recall mode, recall weights, keyword match ratio, and max retrieved count. `search tune apply` creates a new candidate scene; it does not switch the default entrance.
If the query file has `sourceItemIds`, `search tune plan` reports source-item coverage and a suggested first-pass shape. For a fast pruning pass, run `search tune run ... --label-source source-item --json`; this does not call the LLM judge and should be presented as source-item silver-label evaluation, not final human-grade relevance.
For LLM judging, use `--llm-retries`, `--max-label-failure-rate`, and `--verbose` when diagnosing provider long tails.
Use the emitted `performance-summary.json` to identify whether time is dominated by search requests, LLM judging, metrics, artifact writes, cache misses, or label failures. LLM judging uses worker-pool scheduling; slow LLM requests should not block checkpointing of labels that already returned.
For generated query sets, inspect `requestedQueryCount`, `actualQueryCount`, `shortfall`, and `warnings`; do not continue to `plan` or `run` when `ok=false`.

If a run is interrupted, inspect `.viking/search-tuning/runs/<run-id>/run-state.json` and resume with:

```bash
vs search tune run --application-id <app> --resume-run-id <run-id> --timeout-ms 120000
```
