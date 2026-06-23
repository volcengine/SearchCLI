---
name: vs-search
description: "Search runtime and scene management: verify queries, inspect scenes, debug app readiness, and diagnose recall or scene-config issues."
category: search
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: search debug, search run, query run, search scene, search diagnosis, recall issue, online strategy, boost bury, rerank, synonym, diversity
commands: search run, search scene create, search scene list, search scene get, search scene update, app status, app diagnose
---

# Viking Search

## When to Use

Use this skill for:

- search query verification
- search scene inspection and updates
- online result checks
- recall or ranking issue diagnosis
- separating persistent scene config from request-only runtime parameters

If the user wants automated batch evaluation or similarity tuning across many queries and strategies, use `vs-search-tuning` instead.

## Preconditions

- an `application-id` is available
- if you will edit a scene, you should preferably know the `scene-id`
- for fresh apps, be prepared for the runtime not to be ready yet
- the agent should treat the installed CLI behavior as authoritative when help text, skill text, and runtime behavior disagree

## Scope

Before changing anything, decide whether the user wants:

- a persistent search strategy change
- a temporary runtime verification
- a readiness diagnosis for a failing app

This skill stays at the search workflow level. Do not embed low-level API field mappings, payload design, or enum interpretation here. When a concrete command needs exact parameters, first consult `vs-product-qa`.

## Commands

- `search run`: send a production-style search request
- `search scene create` / `search scene list` / `search scene get`: manage search scenes
- `search scene update`: update scene configuration
- `app status` / `app diagnose`: inspect readiness before blaming the query

## Workflow

1. Start by determining whether the user wants:
   - a persistent search strategy change
   - a temporary runtime verification
   - a readiness diagnosis for a failing app
2. If the request is a persistent search strategy change, use `search scene list/get` first and inspect the current scene before mutating it.
3. Before running any concrete command, consult `vs-product-qa` to confirm the current command behavior and the exact parameter requirements.
4. Use `search run` for verification requests and `search scene update` for persistent scene changes.
5. After every scene mutation, immediately read the scene back with `search scene get` and verify that the intended change is visible online.
6. If a fresh app fails, check `app status` and then `app diagnose`.
7. Only after readiness is clear should you focus on recall quality or scene configuration.
8. If the command behavior conflicts with the skill text or `--help`, trust the installed CLI behavior first, and only then inspect repository code when needed to explain or fix the gap.

## References

- `references/search-scene-natural-language-routing.md`: workflow-oriented mapping from natural-language search-scene requests to the first config area or workflow you should inspect

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- Before executing any concrete `vs ...` command in this search workflow, first consult `vs-product-qa` to verify the current command surface, required flags, payload fields, input format, and allowed values. Only after that check may you finalize parameters and run the command.
- **Field name case sensitivity**: All dataset field names (used in `ShuffleConfig.Rules[].FieldName`, `ShuffleExpr.field`, `BoostBuryCondConfig.Rules[].Config.field`, `FilterConfig.Config.field`, `AuxiliaryPools[].Filter.field`, etc.) are **case-sensitive**. Never infer or normalize field name casing from the user's natural-language description. Before writing any field name into a config, first look up the exact field name from the dataset schema or data-config via `dataset get --id <dataset-id> --full` or `app dataset-config get --application-id <id> --dataset-id <id> --full`, and copy the field name exactly as it appears there (case-for-case). If the field name you have doesn't match any field in the schema, stop and ask the user to confirm which field they mean instead of guessing.
- When an app is bound to exactly one dataset, the CLI can infer `dataset-id`
- For fresh apps, treat readiness as the first hypothesis before blaming the query
- Prefer public `vs search ...` commands over bypassing the CLI and calling lower-level APIs directly
- Use `search scene update` for persistent search behavior and do not invent low-level API mappings inside this skill
- For natural-language scene-change requests, use `references/search-scene-natural-language-routing.md` as the routing layer; if the target is a rule-resource workflow such as filter-item-scope, do not reduce it to a single inline scene field edit
- Do not assume `--help`, skill text, and the installed command implementation are perfectly aligned; verify the actual command behavior before making high-risk scene changes
- For scene updates, prefer a readback check after mutation instead of assuming the write succeeded
- If a scene update unexpectedly fails or appears to no-op, verify the accepted command behavior and parameter requirements before retrying
- If a command failure or user follow-up turns into a product concept, capability, API field, purchase, billing, or general troubleshooting question outside this search workflow, temporarily hand off to `vs-product-qa`; return to this workflow only after the grounded product answer is complete.
