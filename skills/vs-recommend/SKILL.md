---
name: vs-recommend
description: "Recommend runtime and scene management: run recommendation requests, manage recommend scenes, and verify the basic recommendation path."
category: recommend
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: recommend run, recommend debug, recommend scene, personalized recommend
commands: recommend run, recommend scene create, recommend scene list, recommend scene get, recommend scene update
---

# Viking Recommend

## When to Use

Use this skill for recommendation runtime checks, recommend scene management, and first-pass verification of the recommendation path.

## Preconditions

- an `application-id` is available
- a recommendation request will usually also need `scene-id` and `user-id`
- if the scene does not exist yet, inspect the existing scene list first and only create a new one when reuse is not possible

## Commands

- `recommend run`: send a production-style recommendation request
- `recommend scene create` / `recommend scene list` / `recommend scene get`: manage recommend scenes
- `recommend scene update`: update scene configuration

## Workflow

1. Confirm `application-id`, `scene-id`, and `user-id`
2. Run `recommend scene list` first and prefer an existing/default scene before creating a new one
3. Before `recommend scene create` or `recommend scene update`, explicitly confirm the target page / module and the required `BhvSceneTypes` with the user
4. Use `recommend run` for the first verification request
5. Read recommendation items from the raw response structure, especially `result.rec_results`
6. If the result looks wrong, inspect the scene with `recommend scene list/get`
7. Update the scene configuration when needed, then rerun the request

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- Start with the scene when debugging recommendation behavior; do not jump to raw API calls first
- If the user only needs a first-pass conclusion, prefer `recommend run`
- Do not create or update a recommend scene until the user has confirmed the target page / module and `BhvSceneTypes`
- When reporting results, summarize the scene, the user context, and the raw response before proposing tuning changes
- Do not invent item titles or explanations. Ground every recommendation summary in the actual response payload
- If you show only a subset such as Top 5, explicitly say that the full response contains more items
