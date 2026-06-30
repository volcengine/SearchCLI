<p align="center">
  <img src="docs/assets/searchcli-logo.svg" alt="SearchCLI logo" width="560" />
</p>

# SearchCLI

English | [简体中文](README.zh_CN.md) | [日本語](README.ja_JP.md) | [Deutsch](README.de_DE.md) | [한국어](README.ko_KR.md) | [Français](README.fr_FR.md) | [Русский](README.ru_RU.md) | [Italiano](README.it_IT.md) | [Español](README.es_ES.md) | [Português](README.pt_BR.md) | [Türkçe](README.tr_TR.md) | [ไทย](README.th_TH.md) | [Bahasa Indonesia](README.id_ID.md)

Connect stable, tunable search, recommendation, and conversational retrieval to your agent system or business system.

[Quick Start](#quick-start-human-users) · [AI Agent Setup](#quick-start-ai-agents) · [Full Agent Guide](docs/agent-quick-start.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md)

SearchCLI is the open CLI for AI Search on Volcengine.

If your agent system or business system needs stable, tunable information distribution services, SearchCLI gives you a practical path to integrate production-grade search, recommendation, and conversational retrieval into real workflows.

With SearchCLI and its installable `Viking skills`, external agents can onboard data, build and validate search and recommendation flows, run conversational retrieval, tune strategy configuration, inspect bad cases, and iterate on retrieval quality in a stable, reviewable way.

## What SearchCLI Is

- The command-line integration surface for AI Search on Volcengine.
- A stable path for external systems to access search, recommendation, and conversational retrieval capabilities.
- An agent-friendly workflow layer built around installable skills and automation-safe command output.
- A reviewable execution model with dry-runs, confirmation gates, and read-after-write verification.

## Who It Is For

- Developers integrating AI-powered information distribution into business systems.
- Teams building agent systems that need stable, configurable search, recommendation, and retrieval workflows.
- Operators and solution teams who need a reviewable way to onboard data, configure applications, and verify runtime behavior before production use.

## What It Enables

- Item and catalog search on top of structured business data.
- Recommendation flows connected to application scenes and user behavior.
- Conversational retrieval experiences grounded in application search.
- Agent workflows that can onboard data, configure applications, and validate runtime behavior with explicit review steps.

## Core Capabilities

- `vs item profile | plan | apply` for structured item onboarding.
- `vs app`, `vs dataset`, and `vs data` for application and dataset management.
- `vs search run`, `vs recommend run`, and `vs chat run` for runtime verification.
- `vs search tune query-generate | plan | run | report` for first-version automated text-similarity evaluation and tuning.
- Installable `Viking skills` so external agents can use the same workflows.

## Requirements

- Node.js 20 or newer
- `git`
- Volcengine AK/SK with access to AI Search

## Quick Start (Human Users)

### 1. Install

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Authenticate

If the current shell already has `VIKING_AK` and `VIKING_SK`:

```bash
vs auth import-env
vs auth status --json
vs doctor --json
```

Otherwise, run interactive login in a real terminal:

```bash
vs auth login
```

If you will use search tuning query generation or LLM relevance judging, configure an OpenAI-compatible LLM API without placing the API key in plain config:

```bash
vs llm login
vs llm status --json
vs search tune llm-check --live --json
```

If the current shell already has `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY`, and `VIKING_LLM_MODEL`, use `vs llm import-env` instead. The API key is stored in the local secure credential store; base URL and model are stored as non-secret config.

### 3. Run the First Onboarding Flow

If the user wants a new app plus bind-time config review and runtime verification, use the `dataset+app` path:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

If you only need dataset provisioning, use the `dataset-only` path, generate a dataset-only plan with `--skip-app`, and stop after dataset create + ingest:

```bash
vs item profile --file ./items.json --pretty
vs item plan --file ./items.json --goal "Build item search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

Prefer `dataset-create.json` when the plan emitted it so dataset creation keeps `Schema` and `DataFieldConfig` together. The `--name <dataset-name> --type item --schema @schema.json` form remains the manual schema-only fallback when a full create payload is unavailable or unsuitable.

`--skip-app` is also accepted by `vs item provision` and `vs item apply` as an execution-time guard rail when you need to enforce the dataset-only boundary from an existing plan.

If you need a video dataset, do not rely on the default type. Always pass `--type video` explicitly:

For `dataset+app`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search"
vs item apply --plan-dir ./.viking/item-plans/<plan> --dry-run
vs item apply --plan-dir ./.viking/item-plans/<plan> --confirm-review --wait-ready --run-trials
```

For `dataset-only`:

```bash
vs item profile --file ./videos.jsonl --type video --pretty
vs item plan --file ./videos.jsonl --type video --goal "Build video search" --skip-app
vs dataset create --data @dataset-create.json
vs dataset ingest --dataset-id <dataset-id> --fields @<normalized-items-artifact>
```

For video dataset-only provisioning, prefer `dataset-create.json` so the create request includes `DataFieldConfig`; `--schema @schema.json` alone can fail with `MissingParameter.DefaultFieldStrategy`.

## Quick Start (AI Agents)

If an external agent needs to operate AI Search through this repository:

### 1. Install SearchCLI

```bash
git clone git@github.com:volcengine/SearchCLI.git vs
cd vs
bash ./scripts/install.sh
```

### 2. Install Viking skills

```bash
npx skills add "git@github.com:volcengine/SearchCLI.git" -y -g
```

The default public skill bundle is:

- `vs-shared`
- `vs-item-onboarding`
- `vs-search`
- `vs-search-tuning`
- `vs-chat`
- `vs-recommend`

### 3. Authenticate

If the current shell already has `VIKING_AK` and `VIKING_SK`, prefer:

```bash
vs auth import-env
```

Otherwise:

```bash
vs auth login
```

### 4. Verify

```bash
vs --help
vs auth status --json
vs llm status --json
vs doctor --json
vs skill list
```

## Public Command Groups

- `vs auth`
- `vs llm`
- `vs doctor`
- `vs skill`
- `vs item`
- `vs app`
- `vs dataset`
- `vs data`
- `vs search`
- `vs chat`
- `vs recommend`

## Documentation

- [Agent Quick Start](docs/agent-quick-start.md)
- [Contributing](CONTRIBUTING.md)
- [Security](SECURITY.md)

## Maintainer Workflow

If you are maintaining the open-source repository itself, the local skill tooling is:

```bash
vs skill list
vs skill init viking-demo-skill
vs skill validate
vs skill install all
```

Build and run repository checks:

```bash
npm install
npm run validate:skills
npm run build
npm run test:acceptance:dist
```

## Contribution

Please check [Contributing](CONTRIBUTING.md) for more details.

External contributors must complete the Contributor License Agreement (CLA) before a pull request can be accepted.

## Code of Conduct

Please check [Code of Conduct](CODE_OF_CONDUCT.md) for more details.

## Security and privacy
This project takes security seriously. 
For vulnerability reporting and supported versions, see [SECURITY.md](SECURITY.md)

## License

This project is licensed under the [Apache-2.0 License](LICENSE).
