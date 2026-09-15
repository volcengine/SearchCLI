---
name: vs-search
description: "Search runtime and scene management: run queries, inspect scenes, debug app readiness, and diagnose recall or config issues."
category: search
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: search debug, search run, query run, search scene, search diagnosis, recall issue
commands: search run, search scene create, search scene list, search scene get, search scene update, app status, app diagnose
---

# Viking Search

## When to Use

Use this skill for search query verification, scene management, online result checks, recall issues, and runtime configuration debugging.

## Preconditions

- an `application-id` is available
- if you will edit a scene, you should preferably know the `scene-id`
- for fresh apps, be prepared for the runtime not to be ready yet
- the agent should treat the installed CLI behavior as authoritative when help text, skill text, and runtime behavior disagree

## Commands

- `search run`: send a production-style search request
- `search scene create` / `search scene list` / `search scene get`: manage search scenes
- `search scene update`: update scene configuration
- `app status` / `app diagnose`: inspect readiness before blaming the query

## Workflow

1. Start with `search run`
2. If the first request succeeds, iterate on the query or scene as needed
3. Before mutating a scene, inspect it first with `search scene list/get`
4. When using `search scene update`, prefer the narrowest valid input:
   - use `--search-config` when only `Config.SearchConfig` should change
   - use companion flags like `--query-completion-config`, `--want-to-search-config`, and `--overview-config` only for those sections
   - use `--config` when you already have the full `Config` object or when multiple sections must change together
   - use `--data` only when you intentionally need top-level payload control
5. After every scene mutation, immediately read the scene back with `search scene get` and verify the intended field changed online
6. If the command behavior conflicts with the skill text or `--help`, trust the installed CLI behavior first, and only then inspect repository code when needed to explain or fix the gap
7. If a fresh app fails, check `app status` and then `app diagnose`
8. Only after readiness is clear should you focus on recall quality or scene configuration

## Search Mode Enums

When you update `SearchConfig.RetrieveConfigs[]`, use these enum mappings explicitly instead of guessing from UI labels:

- `Mode`
  - `Balanced = 1`
  - `SemanticPriority = 2`
  - `KeywordPriority = 3`
  - `UserDefined = 4`
- `UserDefinedRecallMode`
  - `KeywordSemantic = 0`
  - `KeywordOnly = 1`
  - `SemanticOnly = 2`

If you set `Mode=UserDefined(4)`, you SHOULD also set `UserDefinedRecallMode` in the same retrieve config so the intended custom recall behavior is explicit.

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- When an app is bound to exactly one dataset, the CLI can infer `dataset-id`
- For fresh apps, treat readiness as the first hypothesis before blaming the query
- Prefer public `vs search ...` commands over bypassing the CLI and calling lower-level APIs directly
- Do not assume `--help`, skill text, and the installed command implementation are perfectly aligned; verify the actual command behavior before making high-risk scene changes
- For scene updates, prefer a small scoped payload and a readback check over writing a hand-crafted full config unless a full config update is actually required
- If a scene update unexpectedly fails or appears to no-op, verify the accepted flags and payload shape before retrying with a broader config object
