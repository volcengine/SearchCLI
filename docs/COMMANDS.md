# SearchCLI (vs) Commands and Parameters

SearchCLI is an interactive AI search command-line tool. Below is the list of currently supported core commands and their parameters.

## 1. Authentication and Environment (CORE)

### `auth` - Authentication Management
*   `vs auth login`
    *   Parameters: `[--profile <name>] [--ak <ak>] [--sk <sk>] [--base-url <url>] [--region <region>] [--store auto|keychain|file|ephemeral] [--no-prompt] [--format <format>]`
*   `vs auth import-env`
    *   Parameters: `[--profile <name>] [--base-url <url>] [--region <region>] [--store auto|keychain|file|ephemeral] [--format <format>]`
*   `vs auth status`
    *   Parameters: `[--profile <name>] [--format <format>]`
*   `vs auth logout`
    *   Parameters: `[--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>]`
*   `vs auth list`
    *   Parameters: `[--format <format>]`
*   `vs auth use <profile>`
    *   Parameters: `[--format <format>]`

### `llm` - OpenAI-Compatible LLM Credential Management
*   `vs llm login`
    *   Parameters: `[--provider openai-compatible] [--base-url <url>] [--model <model>] [--api-key <key>] [--profile <name>] [--store auto|keychain|file|ephemeral] [--no-prompt] [--format <format>]`
    *   Description: store an OpenAI-compatible LLM API key in the local secure credential store; prefer the interactive prompt or environment variables over `--api-key`
*   `vs llm import-env`
    *   Parameters: `[--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>]`
    *   Description: import `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY`, and `VIKING_LLM_MODEL`; the API key goes to the secure store and non-secret metadata goes to config
*   `vs llm status`
    *   Parameters: `[--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>]`
    *   Description: inspect LLM base URL, model, provider, and secret source without revealing the API key
*   `vs llm logout`
    *   Parameters: `[--profile <name>] [--store auto|keychain|file|ephemeral] [--format <format>]`

### `doctor` - Environment Check
*   `vs doctor`
    *   Parameters: `[--format <format>] [--jq <selector>] [--output <path>]`

### `skill` - Skill Management
*   `vs skill list`
    *   Parameters: `[--category <name>]`
*   `vs skill show --name <skill-name>`
*   `vs skill search --query <text>`
    *   Parameters: `[--category <name>] [--max-results <n>]`
*   `vs skill install <skill-name...|all>`
    *   Parameters: `[--target global|codex|agents|both] [--dest <dir>] [--force]`
*   `vs skill init <skill-name>`
    *   Parameters: `[--root <dir>] [--category <name>] [--keywords <csv>] [--commands <csv>] [--force]`
*   `vs skill validate`
    *   Parameters: `[--root <dir>]`

## 2. Product and Workflows (PRODUCT)

### `item` - Item/Product Onboarding Workflow
*   `vs item profile --file <path>`
    *   Parameters: `[--type <item|video>] [output flags]`
*   `vs item plan --file <path>`
    *   Parameters: `[--type <item|video>] [--goal <text>] [--output-dir <dir>] [--dataset-name <name>] [--application-name <name>] [--skip-app] [--project-name <name>] [output flags]`
*   `vs item apply --plan-dir <dir>`
    *   Parameters: `[--phase <provision|verify|all>] [--application-id <id> --dataset-id <id>] [--application-name <name> --dataset-name <name>] [--skip-app] [--confirm-review | --interactive-review] [--reviewer <name>] [--review-notes <text>] [--run-trials --force --dry-run] [--confirm-recommend-entry-binding --recommend-bhv-scene-types <scene_a,scene_b>] [--search-query <text> --chat-message <text>] [workflow flags]`
*   `vs item review --plan-dir <dir>`
    *   Parameters: `[--reviewer <name>] [--review-notes <text>] [output flags]`
*   `vs item provision --plan-dir <dir>`
    *   Parameters: `[--application-id <id> --dataset-id <id>] [--application-name <name> --dataset-name <name>] [--skip-app] [--confirm-review | --interactive-review] [--reviewer <name>] [--review-notes <text>] [--force --dry-run] [workflow flags]`
*   `vs item verify --plan-dir <dir>`
    *   Parameters: `[--application-id <id> --dataset-id <id>] [--wait-indexed] [--search-query <text> --chat-message <text>] [--skip-search --skip-chat] [workflow flags]`

### `app` - Application Management
*   `vs app create --name <name>`
    *   Parameters: `[--description <text>] [--industry <type>] [--language <lang>] [--color <color>] [service flags]`
*   `vs app update --id <application-id>`
    *   Parameters: `[--name <name> --industry <type> --icon @icon.json --color <color>] [service flags]`
*   `vs app get --id <application-id>`
    *   Parameters: `[service flags]`
*   `vs app list`
    *   Parameters: `[--name <text> --dataset-id <id> --industry <type> --state <state> --full] [service flags]`
*   `vs app delete --id <application-id>`
    *   Parameters: `[--force] [service flags]`

*   `vs app diagnose --application-id <id>`
    *   Parameters: `[--activated-only] [service flags]`
*   `vs app status --application-id <id>`
    *   Parameters: `[--activated-only] [service flags]`
*   `vs app wait-ready --application-id <id>`
    *   Parameters: `[--wait-timeout-ms <ms> --poll-interval-ms <ms> --activated-only] [service flags]`
*   `vs app dataset bind --application-id <id> --dataset-id <id>`
    *   Parameters: `[--field-config @config.json --dry-run] [service flags]`
*   `vs app dataset unbind --application-id <id> --dataset-id <id>`
    *   Parameters: `[service flags]`
*   `vs app dataset-config get --application-id <id> --dataset-id <id>`
    *   Parameters: `[--field-config-version <n> --full] [service flags]`
*   `vs app dataset-config list --application-id <id>`
    *   Parameters: `[--dataset-type <type> --page-number <n> --page-size <n> --activated-only --full] [service flags]`
*   `vs app dataset-config update --application-id <id> --dataset-id <id>`
    *   Parameters: `[--schema-version <n> --field-config-version <n> --field-config @config.json --dry-run] [service flags]`
*   `vs app online-config get --application-id <id>`
    *   Parameters: `[--full] [service flags]`
*   `vs app online-config update --application-id <id> --config @config.json`
    *   Parameters: `[--dry-run] [service flags]`

### `dataset` - Dataset Management
*   `vs dataset create --name <name> --type <item|event|behavior|image_text|video|user-event|document>`
    *   Parameters: `[--description <text>] [--schema @schema.json] [service flags]`
*   `vs dataset get --id <dataset-id>`
    *   Parameters: `[--full] [service flags]`
*   `vs dataset update --id <dataset-id>`
    *   Parameters: `[--version <n>] [--description <text>] [--schema @schema.json] [service flags]`
*   `vs dataset ingest --dataset-id <id> --fields @items.json`
    *   Parameters: `[workflow flags]`
*   `vs dataset schema check --type <item|event|behavior|image_text|video|user-event|document>`
    *   Parameters: `[--schema @schema.json] [service flags]`
*   `vs dataset list`
    *   Parameters: `[--type <type> --name <text> --application-id <id> --full] [service flags]`
*   `vs dataset delete --id <dataset-id>`
    *   Parameters: `[--force] [service flags]`

### `data` - Data Operations
*   `vs data write --dataset-id <id> --fields @fields.json`
    *   Parameters: `[service flags]`
*   `vs data import --dataset-id <id> --fields @items.json`
    *   Parameters: `[service flags]`
*   `vs data delete --dataset-id <id> --id <item-id>`
    *   Parameters: `[service flags]`

### `search` - Search Runtime and Scenes
*   `vs search run --application-id <id> --scene-id <id> --query <text>`
    *   Usage: `vs search run --application-id <id> --scene-id <id> [--dataset-id <id>] --query <text> [--page-size <n>] [service flags]`
    *   Description: run a normal runtime search request against an explicit application scene; `--dataset-id` is usually optional when the app is bound to exactly one dataset
    *   Key flags: `--application-id`, `--scene-id`, `--dataset-id`, `--query`, `--page-size`
    *   Examples: `vs search run --application-id 123 --scene-id default-search --query "wireless headphones"`; `vs search run --application-id 123 --scene-id default-search --query "running shoes" --page-size 5`
*   `vs search scene create --application-id <id> --name <name>`
    *   Usage: `vs search scene create --application-id <id> --name <name> [--description <text>] [service flags]`
    *   Usage: `vs search scene create --application-id <id> --data @payload.json [service flags]`
    *   Description: create a new search scene under the target application; use `--data` when you need full control over the create payload
    *   Key flags: `--application-id`, `--name`, `--description`, `--data`
    *   Examples: `vs search scene create --application-id 123 --name "default-search"`; `vs search scene create --application-id 123 --name "image-search" --description "Search scene for image-heavy queries"`; `vs search scene create --application-id 123 --data @payload.json`
*   `vs search scene list --application-id <id>`
    *   Usage: `vs search scene list --application-id <id> [service flags]`
    *   Usage: `vs search scene list --application-id <id> --data @payload.json [service flags]`
    *   Description: list the search scenes currently attached to the target application; use this first to confirm the default scene and target `scene-id`
    *   Key flags: `--application-id`, `--data`
    *   Examples: `vs search scene list --application-id 123`; `vs search scene list --application-id 123 --format json`; `vs search scene list --application-id 123 --data @payload.json`
*   `vs search scene get --application-id <id> --scene-id <id>`
    *   Usage: `vs search scene get --application-id <id> --scene-id <id> [service flags]`
    *   Usage: `vs search scene get --application-id <id> --scene-id <id> --data @payload.json [service flags]`
    *   Description: get the current definition of one search scene, including its published `Config`; use this before `scene update`
    *   Key flags: `--application-id`, `--scene-id`, `--data`
    *   Examples: `vs search scene get --application-id 123 --scene-id abc`; `vs search scene get --application-id 123 --scene-id abc --format json`; `vs search scene get --application-id 123 --scene-id abc --jq '.Result.Scene.Config'`
*   `vs search scene update --application-id <id> --scene-id <id>`
    *   Usage: `vs search scene update --application-id <id> --scene-id <id> --config @scene.json [service flags]`
    *   Usage: `vs search scene update --application-id <id> --scene-id <id> --search-config @search.json [--query-completion-config @qc.json] [--want-to-search-config @wts.json] [--overview-config @overview.json] [service flags]`
    *   Usage: `vs search scene update --application-id <id> --scene-id <id> --data @payload.json [service flags]`
    *   Description: update and publish a search scene through `OnlineSearchScene`; prefer `scene get` first, then update only the intended parts
    *   Key flags: `--application-id`, `--scene-id`, `--config`, `--search-config`, `--query-completion-config`, `--want-to-search-config`, `--overview-config`, `--data`
    *   Search mode enums: `RetrieveConfigs[].Mode`: `Balanced=1`, `SemanticPriority=2`, `KeywordPriority=3`, `UserDefined=4`
    *   Custom recall enums: `RetrieveConfigs[].UserDefinedRecallMode`: `KeywordSemantic=0`, `KeywordOnly=1`, `SemanticOnly=2`
    *   Note: when `RetrieveConfigs[].Mode=UserDefined(4)`, also set `RetrieveConfigs[].UserDefinedRecallMode` in the same retrieve config
    *   Examples: `vs search scene get --application-id 123 --scene-id abc --format json > scene.json`; `vs search scene update --application-id 123 --scene-id abc --config @scene.json`; `vs search scene update --application-id 123 --scene-id abc --search-config @search.json`; `vs search scene update --application-id 123 --scene-id abc --data @payload.json`
*   `vs search scene delete --application-id <id> --scene-id <id>`
    *   Usage: `vs search scene delete --application-id <id> --scene-id <id> [service flags]`
    *   Usage: `vs search scene delete --application-id <id> --scene-id <id> --data @payload.json [service flags]`
    *   Description: delete a search scene from an application; inspect the scene first with `scene get` or `scene list` when the target `scene-id` is not fully confirmed
    *   Key flags: `--application-id`, `--scene-id`, `--data`
    *   Examples: `vs search scene delete --application-id 123 --scene-id abc`; `vs search scene delete --application-id 123 --scene-id abc --format json`; `vs search scene delete --application-id 123 --scene-id abc --data @payload.json`
*   `vs search tune llm-check`
    *   Usage: `vs search tune llm-check [--live] [service flags]`
    *   Description: check whether CLI-managed LLM configuration is available for automated search tuning; if unavailable, configure with `vs llm login` or `vs llm import-env`
*   `vs search tune plan --application-id <id>`
    *   Usage: `vs search tune plan --application-id <id> [--dataset-id <id>] [--queries <file>] [--profile similarity-only] [--query-count <n>] [--top-k <n>] [--max-strategies <n>] [service flags]`
    *   Description: plan first-version text-query similarity evaluation without calling search or LLM services; prints query source, request/label estimate, fixed `mode=UserDefined`, tuned parameter list, strategy coverage, source-item coverage, warnings, and a suggested smaller first-pass shape
*   `vs search tune query-generate --application-id <id>`
    *   Usage: `vs search tune query-generate --application-id <id> [--dataset-id <id>] [--query-count <n>] [--min-query-count <n>] [--sample-size <n>] [--query-batch-size <n>] [--llm-concurrency <n>] [--retrievable-field-only] [--output-dir <dir>] [service flags]`
    *   Description: generate a reusable synthetic JSONL query set from paged dataset samples with batched concurrent LLM calls; pass `--retrievable-field-only` to generate from text `IndexFields` only while excluding `ImageIndexFields`; output includes requested/actual counts, shortfall, warnings, and generation performance
*   `vs search tune run --application-id <id>`
    *   Usage: `vs search tune run --application-id <id> [--dataset-id <id>] [--queries <file>] [--resume-run-id <id>] [--label-source <llm|source-item|auto>] [--profile similarity-only] [--query-count <n>] [--top-k <n>] [--max-strategies <n>] [--search-concurrency <n>] [--llm-concurrency <n>] [--llm-retries <n>] [--max-label-failure-rate <ratio>] [--verbose] [--timeout-ms <ms>] [--output-dir <dir>] [service flags]`
    *   Description: run first-version text-query similarity evaluation and tuning with loaded/generated queries, candidate searches, and either LLM pointwise labels or fast `sourceItemIds` labels; request timeout defaults to 120000ms, search requests default to 18-way concurrency, and LLM judgements default to a 100-worker pool with retry/failure-threshold controls; writes `run-state.json`, `rankings.jsonl`, `labels-used.jsonl`, `label-failures.jsonl`, `partial-metrics.json`, and `performance-summary.json` during execution so interrupted runs can be resumed and bottlenecks can be inspected
*   `vs search tune apply --application-id <id> --run-id <id>`
    *   Usage: `vs search tune apply --application-id <id> --run-id <id> [--scene-name <name>] [--scene-description <text>] [--dry-run | --confirm-create-scene] [--output-dir <dir>] [service flags]`
    *   Description: create a new search scene from a completed tuning report recommendation; request-only params such as `query_keyword_match_percent` are returned as `unappliedRequestParams`
*   `vs search tune report --run-id <id>`
    *   Usage: `vs search tune report --run-id <id> [--output-dir <dir>] [service flags]`
    *   Description: read a previous search tuning report

### `chat` - Conversational Search
*   `vs chat run --application-id <id>`
    *   Parameters: `[--session-id <id>] [--message <text>|--opening-remarks true] [--pretty] [service flags]`

### `recommend` - Recommend Runtime and Scenes
*   `vs recommend run --application-id <id> --scene-id <id>`
    *   Parameters: `[--user-id <id>] [--parent-id <id>] [--page-size <n>] [service flags]`
*   `vs recommend scene create --application-id <id> --type for_you --name <name> --item-dataset-id <id>`
    *   Parameters: `[--description <text>] [--recommend-model <n>] [--optimization-target <n>] [--bhv-scene-types <types>] [--click-event-types <types>] [--positive-event-types <types>] [--negative-event-types <types>] [--confirm-entry-binding] [service flags]`
*   `vs recommend scene list --application-id <id>`
    *   Parameters: `[--types <types>] [service flags]`
*   `vs recommend scene get --application-id <id> --scene-id <id>`
    *   Parameters: `[service flags]`
*   `vs recommend scene update --application-id <id> --scene-id <id>`
    *   Parameters: `[--type <type>] [--name <name>] [--description <text>] [--item-dataset-id <id>] [--bhv-scene-types <types>] [--config @scene.json] [--confirm-entry-binding] [service flags]`
*   `vs recommend scene delete --application-id <id> --scene-id <id>`
    *   Parameters: `[service flags]`

## 3. Advanced (ADVANCED)

*   `vs version`
    *   Print the current CLI version.

---

**Note:**
*   `[service flags]` typically includes: `--base-url --ak --sk --region --timeout-ms --project-name --data --format --jq --output`.
*   Parameters with an `@` prefix (e.g., `@items.json`) indicate that JSON content can be read from a local file.
