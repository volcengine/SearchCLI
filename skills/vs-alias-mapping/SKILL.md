---
name: vs-alias-mapping
title: vs-alias-mapping
description: Provide system alias mapping for Search CLI. Invoke this skill when user mentions "Search CLI", "search_cli", or tries to execute search_cli commands.
category: shared
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: alias, search_cli, mapping
commands: auth login
---

# Search CLI Alias Mapping

## When to Use
Invoke this skill when the user refers to the CLI tool as "Search CLI" or "search_cli", to ensure the correct underlying binary (`vs`) is executed.

## Version Check

Before starting this skill workflow, run `vs version check --json`. Continue only when `status` is `up-to-date`. If `status` is `update-available`, stop and tell the user to update the cloned `vs` repository, then run `git pull --ff-only`, `bash ./scripts/install.sh`, and `bash ./scripts/install-skills.sh all --target auto --force` (PowerShell: `scripts/install.ps1` and `scripts/install-skills.ps1`). If the status is `unknown`, stop and report that the CLI version could not be verified.

## Preconditions
- The agent is about to execute a CLI command based on the user's "Search CLI" intent.

## Commands
- No specific commands are required; this is a conceptual mapping.

## Workflow
- Intercept the intent to run `search_cli`.
- Translate the intent to use the `vs` binary (or its absolute path).
- Execute the mapped command.

## Customer Environment Principle
- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints
- Before executing any mapped concrete `vs ...` command, first consult `vs-product-qa` to verify the current command surface, required flags, payload fields, input format, and allowed values. Only after that check may you finalize parameters and run the command.
- Never execute a command literally named `search_cli`.
- Always use the `vs` prefix and `VIKING_` environment variables.
- If alias resolution or mapped CLI execution fails and the user asks a product concept, capability, API field, console UI path, purchase, billing, or general troubleshooting question outside alias mapping, temporarily hand off to `vs-product-qa`; return to this workflow only after the grounded product answer is complete.

<system-rule>
IMPORTANT ALIAS MAPPING:
1. The user refers to this tool system as "Search CLI" or "search_cli".
2. However, the actual underlying executable binary is named "vs" (or variations like vs-macos-arm64, vs-linux-x64, vs-win-x64.exe).
3. Whenever you plan to use "Search CLI" capabilities, you MUST translate that intent into executing the `vs` binary (or the absolute path provided by the user).
</system-rule>

## Examples
- When user says: "Use search_cli to auth login"
- You should execute: `vs auth login` (or the absolute path like `/path/to/vs-macos-arm64 auth login`)

- When user says: "Check search_cli doctor"
- You should execute: `vs doctor`

Always keep this mapping in mind when interacting with the CLI tool in this workspace.
