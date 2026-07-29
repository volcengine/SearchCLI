---
name: vs-project
description: "Create Viking web projects and start and verify a local preview, with agent-guided feature, eligible application, dataset, scene, and authentication choices. Use only after confirming the installed CLI exposes `vs project`; otherwise stop without taking action."
category: workflow
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: project create, web project, local preview, dev server, feature selection, app filtering, scene selection
commands: project create, app list, dataset list, search scene list, recommend scene list, auth status, auth import-env, auth login
---

# Viking Project Create

## When to Use

Use this skill to create a Viking web project from existing application resources and verify its local preview.

## Preconditions

- before doing anything else, run `vs project --help`; this availability check is the only command allowed before consulting `vs-product-qa`
- if the command is unavailable or reports an unknown command, stop immediately and state that project creation is unavailable; do not enumerate resources, create files, or install dependencies, and do not explain how to enable hidden functionality
- creation needs at least one selected feature: `search`, `recommend`, or `chat`
- the selected application needs at least one bound dataset; recommendation additionally needs a bound user-event dataset
- search needs a search scene plus a bound dataset, recommendation needs a recommend scene, and chat needs no additional resource ID
- local preview needs Node.js and npm in the environment that runs the generated project
- do not ask the user to paste API keys, AK, or SK into chat

## Commands

- `auth status` / `auth import-env` / `auth login`: establish Viking authentication without exposing credentials in chat
- `app list --full`: list application choices with bound dataset metadata for eligibility filtering
- `dataset list --application-id <id>`: list datasets bound to the selected application
- `search scene list --application-id <id>`: list search scene choices
- `recommend scene list --application-id <id>`: list recommend scene choices
- `project create`: generate the project
- `npm install` / `npm run dev`: install generated-project dependencies and keep its local API and web servers running

## Workflow

### Resource ID selection contract

Apply this contract whenever the workflow needs an existing resource ID, including an application ID, search dataset ID, search scene ID, recommendation scene ID, or any additional resource ID introduced later.

1. Before asking the user to choose or provide an ID, run the corresponding list command, scoped by every already-selected parent resource.
2. Present concrete resources returned by the CLI. Each option must include a stable number, display name, full ID, and relevant type or state. Use an interactive picker populated with those resources when supported; otherwise use a numbered Markdown table.
3. Never replace the options with only a result count or a request such as "provide the name or ID." Show all candidates when there are 20 or fewer. When a local development or test account returns more than 20, show only the first 20 in CLI order and state both the displayed and total counts; do not paginate the remainder.
4. Ask the user to select by option number, exact name, or full ID. Resolve a name only when it uniquely identifies one returned resource; otherwise show the matching concrete options and ask again.
5. For a sole candidate, show its details and ask for confirmation. Never silently select it.
6. If the user already supplied an ID, validate it against the complete list and show the matched resource before continuing. If it is invalid or belongs to another parent resource, explain the mismatch and present the valid concrete options instead of merely asking for another ID.

Use this minimum shape for non-interactive application selection, adapting the entity and metadata columns for datasets and scenes:

| # | Application | `applicationId` | State |
|---:|---|---|---|
| 1 | `<name>` | `<full-id>` | `<state>` |

For a capped test-account list, use: `Showing the first 20 of 100; reply with an option number, exact name, or full ID.`

### Create

1. Ask the user to select one or more features from `search`, `recommend`, and `chat`. Use a multi-select picker when supported; otherwise show a numbered list and accept multiple values. Require at least one selection and do not infer or preselect a feature.
2. Run `vs auth status --json` (or add `--profile <name>` when the user selected a non-active profile). Reuse a configured `VIKING_API_KEY` when reported as the source; otherwise reuse valid logged-in AK/SK. If needed, prefer `vs auth import-env` for AK/SK already present in the shell; otherwise use `vs auth login` in a real interactive terminal.
3. Run `vs app list --full --json` and inspect every application's bound `Datasets` entries. For `recommend`, normalize the user-event type from either numeric enums or labels: `4`, `DatasetTypeUserEvent`, `user_event`, or `user-event`.
4. Filter applications before presenting choices. Every supported feature requires at least one bound dataset; if `recommend` is selected, also require at least one bound user-event dataset. For multiple features, apply the intersection of their requirements. Treat a dataset as eligible when it is bound, regardless of dataset state or application state.
5. Apply the Resource ID selection contract only to eligible applications and wait for the user to choose one. If the user supplied an application ID, validate both that it exists in the complete list and that it satisfies the selected feature requirements. If no application is eligible, stop and identify the missing required dataset declarations or bindings; do not show ineligible applications as selectable choices.
6. For `search`, run both `vs dataset list --application-id <app-id> --json` and `vs search scene list --application-id <app-id> --json`. Offer all returned datasets as choices. For `recommend`, run `vs recommend scene list --application-id <app-id> --json`. Do not query an additional resource for `chat`.
7. Apply the Resource ID selection contract separately to every required dataset and scene list. Wait for each user selection and never silently choose the first result. If a required list is empty, stop and identify the missing resource; do not invent an ID or create unrelated resources unless the user asks.
8. If the user already supplied a project name, use it. Otherwise, do not ask for or explain the project name or target directory; omit the optional `[project-name]` argument and let the CLI select its default directory (`viking-web-app`, `viking-web-app2`, and so on). An explicitly supplied target directory must be absent or empty.
9. Summarize the application, enabled features, selected IDs, authentication source, and an explicitly supplied project name, if any. Warn that generated `apps/api/src/env.ts` contains plaintext credentials, must not be committed, and can be overridden with runtime `VIKING_*` environment variables.
10. Show the exact `vs project create` command without resolved secrets, then run it. Always pass `--features <comma-separated-features>`. Omit the optional `[project-name]` argument when the user did not already supply one. Use `--profile <name>` only when selecting a non-active auth profile; the command does not accept API keys or AK/SK as flags. Search must pass `--search-scene-id` and `--search-dataset-id` together; recommendation must pass `--rec-scene-id`; chat needs no additional resource flag.
11. Read the generated `projectDir` from the command result. Run `npm install` in that directory unless its `node_modules` directory already exists. Stop and report the install failure if dependencies cannot be installed; do not claim that a preview is available.
12. Run `npm run dev` in the generated directory using a persistent terminal or background session that remains alive after the response. Watch the live output until both the API server and Vite web server report that they are listening. Treat an early process exit, `EADDRINUSE`, or another fatal startup error as a failed preview; do not detach an unobserved process or treat process creation alone as success.
13. Extract the web preview URL from Vite's actual `Local:` output instead of assuming port 5173. Vite may select another port when its default is occupied. Normalize its origin without a trailing slash, then run `curl -fsS -o /dev/null <preview-origin>/` and `curl -fsS <preview-origin>/api/config`; require both requests to succeed and confirm that `/api/config` returns the selected features.
14. Report the generated directory, enabled features, and verified local preview URL, and state that the development service is still running. Keep the service session alive for the user's preview. If startup or either probe fails, report the observed failure and no preview URL.

## Constraints

- before executing a concrete `vs ...` command, consult `vs-product-qa` to verify the installed command surface and allowed flags
- trust installed CLI help and observed behavior over repository implementation details in customer environments
- never reveal resolved credentials in a command preview, transcript, or summary
- never pass `--api-key`, `--ak`, `--sk`, or `--region` to `project create`; configure `VIKING_API_KEY` or a `vs auth` profile instead
- always select at least one feature before authentication and application enumeration; never infer features from scene flags
- after successful creation, install dependencies, start the local development service, and verify the returned preview URL by HTTP before reporting success
- never assume a local web port, invent a preview URL, or stop the verified development service before handing the result to the user
- never bypass resource selection when multiple valid applications, datasets, or scenes exist
- never ask the user to recall or manually provide a resource ID when the CLI can enumerate valid choices
- never ask for a project name or target directory when the user did not provide one; omit `[project-name]` and use the CLI default
