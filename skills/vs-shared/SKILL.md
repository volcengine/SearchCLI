---
name: vs-shared
description: "Shared SearchCLI setup: install, authenticate, run doctor, and verify the local environment."
category: shared
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: install cli, auth import-env, auth login, doctor, first-time setup, profile switch, shared basics
commands: auth import-env, auth login, auth status, auth use, auth list, doctor, skill list, skill install, app status, app diagnose, search run, chat run
---

# Viking Shared

## When to Use

Use this skill when an external agent is setting up SearchCLI for the first time, or when it needs to check authentication, profiles, and local readiness.

## Preconditions

- `Node.js >= 20` is installed
- the repository has already been cloned, or the CLI has already been installed with `scripts/install.sh`

## Commands

- `auth import-env`: import `VIKING_AK` / `VIKING_SK` from the current shell into the local secure store
- `auth login`: capture AK/SK interactively in a real terminal
- `auth status`: inspect the active profile, credential source, and region
- `auth use`: switch profiles
- `auth list`: list saved profiles
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

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- If the user has already placed credentials in the current shell, prefer `auth import-env` and do not ask them to paste secrets into chat
- Before installing or distributing a skill, confirm that the current CLI version satisfies `requires_cli`
