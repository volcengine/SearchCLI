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
```

## 4. Run The First Onboarding Flow

For structured item data, pick one provisioning boundary first:

### 4.1 Dataset + App

Use this path when the user wants app creation, bind-time field config review, or runtime verification:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
# optional preflight preview
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
# after the user confirms schema and bind-time fields
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review
```

### 4.2 Dataset-Only

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
