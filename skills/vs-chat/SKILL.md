---
name: vs-chat
description: "Conversational search runtime: send messages, keep sessions consistent, and verify retrieval behavior and responses."
category: chat
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: chat run, chat search, dialogue search, multi-turn, session id
commands: chat run, app status, app diagnose
---

# Viking Chat

## When to Use

Use this skill for conversational search requests, session continuity, multi-turn checks, retrieval verification, and response inspection.

## Preconditions

- an `application-id` is available
- the application is preferably already ready

## Commands

- `chat run`: send a conversational search request with full payload control
- `app status` / `app diagnose`: confirm readiness before testing chat behavior

## Workflow

1. Check `app status` first and confirm the application is ready
2. Use `chat run` for the first message
3. If you need multi-turn behavior, pass `session-id` explicitly
4. Use the full request payload when you need tighter control over the request
5. If you request `--format json`, parse one JSON document; do not treat the output as NDJSON
6. Summarize whether retrieval was triggered, whether relevant items were returned, and whether session continuity is preserved

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- `vs chat ...` is the conversational search runtime surface
- When debugging parsing issues, inspect the raw JSON response first instead of adding an extra line-oriented parser
