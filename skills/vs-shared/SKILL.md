---
name: vs-shared
description: "Shared SearchCLI setup: install, authenticate, run doctor, and verify the local environment."
category: shared
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: install cli, auth import-env, auth login, llm login, doctor, first-time setup, profile switch, shared basics
commands: auth import-env, auth login, auth status, auth use, auth list, llm login, llm import-env, llm status, llm logout, doctor, skill list, skill install, app status, app diagnose, search run, chat run
---

# Viking Shared

## When to Use

Use this skill when an external agent is setting up SearchCLI for the first time, or when it needs to check authentication, profiles, and local readiness.

## Version Check

Before starting this skill workflow, run `vs version check --json`. Continue only when `status` is `up-to-date`. If `status` is `update-available`, stop and tell the user to update the cloned `vs` repository, then run `git pull --ff-only`, `bash ./scripts/install.sh`, and `bash ./scripts/install-skills.sh all --target auto --force` (PowerShell: `scripts/install.ps1` and `scripts/install-skills.ps1`). If the status is `unknown`, stop and report that the CLI version could not be verified.

## Preconditions

- `Node.js >= 20` is installed
- the repository has already been cloned, or the CLI has already been installed with `scripts/install.sh`

## Commands

- `auth import-env`: import `VIKING_AK` / `VIKING_SK` from the current shell into the local secure store
- `auth login`: capture AK/SK interactively in a real terminal
- `auth status`: inspect the active profile, credential source, and region
- `auth use`: switch profiles
- `auth list`: list saved profiles
- `llm login`: capture OpenAI-compatible LLM base URL, model, and API key interactively; stores the API key in the local secure store
- `llm import-env`: import `VIKING_LLM_BASE_URL` / `VIKING_LLM_API_KEY` / `VIKING_LLM_MODEL` into config plus secure store
- `llm status`: inspect the active LLM provider, model, base URL, and secret source without revealing the API key
- `llm logout`: delete the stored LLM API key for a profile
- `doctor`: check local dependencies, auth, and configuration
- `skill list`: inspect the published Viking skills
- `skill install`: install Viking skills from the local repository checkout
- `app status` / `app diagnose`: inspect app readiness before blaming runtime behavior
- `search run` / `chat run`: run a minimal verification request

## Regions

Built-in region checklist (for `--region` and auth profiles):

- Beijing: `cn-beijing`
- Johor: `ap-southeast-1`

## Workflow

1. Confirm that the CLI is installed, then run `auth status`
2. If the current shell already has `VIKING_AK` / `VIKING_SK`, prefer `auth import-env`
3. Otherwise, if the agent can keep an interactive real terminal alive, run `auth login`
4. If interactive login is not possible, ask the user to set `VIKING_AK` / `VIKING_SK` in the current shell and then run `auth import-env`
5. Run `doctor` to verify the local environment
6. External agents should install Viking skills with `npx skills add "<repo-url>" -y -g`
7. Repository maintainers can use `skill install all` or install named skills from the local checkout
8. Before deeper debugging, use `app status` or `search/chat run` for a minimal runtime check

## LLM Setup

Search tuning query generation and LLM relevance judging need an OpenAI-compatible LLM API. Do not ask the user to paste an LLM API key into chat.

Use this priority order:

1. If the current real terminal already has `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY`, and `VIKING_LLM_MODEL`, run `vs llm import-env`.
2. Otherwise, if the agent can keep an interactive real terminal alive, run `vs llm login` and wait for the user to enter the API key in that terminal.
3. If interactive login is not possible, tell the user to set `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY`, and `VIKING_LLM_MODEL` in the current terminal, then run `vs llm import-env`.

The first version supports only the `openai-compatible` protocol. Non-secret LLM metadata is written to `~/.viking/config.json`; the API key is stored through the local secure credential store.

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- **Sandbox must allow writing `~/.viking/config.json`**: `vs auth login` / `vs auth import-env` / `vs auth use` (and even some `--help` paths) persist non-secret config to `~/.viking/config.json`. If the agent runs inside a sandbox with a read-only home directory, these commands fail with `EACCES: permission denied` / `Not allow operate files`. Before running any `vs` command that touches auth or config, ensure the sandbox grants write access to `~/.viking/` (or run those commands outside the sandbox). Do not misread this environment restriction as a CLI bug.
- **Mandatory command verification**: before executing any concrete `vs ...` command in this shared workflow, the agent MUST first consult `vs-product-qa` to verify the current command surface, required flags, payload fields, input format, allowed values, and relevant command-specific constraints. This is a non-optional precondition for all shared workflow commands, including auth, doctor, LLM setup, app readiness checks, search/chat runtime checks, and skill installation. Only after that verification may the agent finalize parameters and run the command.
- If the user has already placed credentials in the current shell, prefer `auth import-env` and do not ask them to paste secrets into chat
- If LLM credentials are needed, prefer `llm import-env` or `llm login`; do not ask the user to paste LLM API keys into chat
- Before installing or distributing a skill, confirm that the current CLI version satisfies `requires_cli`
- If setup, auth, doctor, or runtime checks fail and the user asks a product concept, capability, API field, console UI path, purchase, billing, or general troubleshooting question outside this shared setup workflow, temporarily hand off to `vs-product-qa`; return to this workflow only after the grounded product answer is complete.
