---
name: vs-product-qa
description: "Answer Viking AI Search product questions, CLI usage questions, API/auth questions, configuration questions, and troubleshooting questions by grounding every claim in either the installed `vs` CLI's own output or official Volcengine documentation. Never fabricate."
category: shared
applies_to: codex, agents, external-agent
requires_cli: ">=0.2.0"
keywords: viking ai search, product question, product concept, concept, how to, usage, api, authentication, ak sk, configuration, error, troubleshooting, docs, official docs, help, faq, data count, effective data, valid data, data volume, item-data-count
commands: doctor, auth status, llm status, skill list, skill search, skill show
---

# vs-product-qa

## When to Use

Use this skill when the user asks grounded questions about Viking AI Search, including:

- product concepts such as scene, dataset, hybrid search, ANN, rerank, or agentic search
- capability or configuration questions such as recommendation setup, boost/bury, or rerank enablement
- API and authentication questions such as AK/SK usage, field semantics, or error meaning
- CLI usage and local troubleshooting such as `vs item apply`, `vs auth status`, or local stack traces
- console path, billing, pricing, or quota questions

Do not use this skill for workflow execution. Delegate instead:

- sign-up, purchase, payment, or first AK/SK setup -> `vs-user-onboarding`
- multi-modal dataset creation and ingestion (records with image/video URLs + text) -> `vs-item-onboarding`
- web crawling for content ingestion -> `vs-crawler`
- search tuning suggestions or execution -> `vs-search-tuning`

If another skill is active and the user asks a product question outside that skill's scripted scope, answer with `vs-product-qa`, then return to the original workflow after the answer is complete.

## Preconditions

- The installed `vs` CLI is available when answering CLI behavior, local auth, LLM configuration, or local error questions.
- This skill includes a bundled internal documentation helper under [references/volcengine-documentation/SKILL.md](references/volcengine-documentation/SKILL.md).
- Official Volcengine documentation must be fetched through that bundled helper when answering product concepts, API field semantics, purchase, billing, quota, or console UI path questions.
- The agent must classify the question before choosing a source.
- If no selected source can answer, explicitly say the point is not covered by the CLI output or official documentation checked in this turn, then suggest support-ticket / oncall escalation.

## Core Principle

Treat the user's installed `vs` CLI as authoritative for how `vs` behaves on that machine. For CLI behavior, always check the real CLI first. If CLI output conflicts with documentation, trust the CLI and state that the documentation may be stale.

This skill must not rely on repository source code, generated snapshots, or model memory as the source of truth for customer-facing product answers.

## Question Routing

Classify the question before choosing a source.

| Question type | Primary source | Example |
|---|---|---|
| CLI command / flag / usage | installed CLI output: `vs <cmd> --help`; use the API Reference router only when the user asks how that command maps to an API category | "How do I use `vs item apply`" |
| Local authentication / credential | `vs auth status` / `vs doctor` | "Why does `vs auth status` say invalid" |
| Local CLI error / stack trace | the error's own recovery output | "I see `ERR_AUTH_REQUIRED`; what now" |
| Product concept | official docs via the bundled documentation helper | "What is a scene in Viking AI Search" |
| API contract / request-response shape / field semantics / enum / validation / error code | GitHub main API Reference, starting from the root README URL in the API Reference source section | "What does `RelevanceCutoffConfig` accept" |
| Application / dataset **effective (valid) data volume** | first resolve each bound dataset's `Type` (via `app get` / `app dataset-config list`). For **item/video** datasets, call `app item-data-count` per dataset and sum `ValidCnt` (`DataNum` is not the answer). For **document** datasets, do NOT call `app item-data-count` (it returns `InvalidParameter: DatasetType`) — use `app dataset-config list --full` (the `--full` flag is required; the default compact output omits `DocumentStats`) and read the document count from `Config[].Dataset.DocumentStats` (`DocumentNum` + `DocumentFromHomepageNum`), not `DataNum`. Always report the document count, including when it is `0`. For **user_event (behavior)** datasets only, exclude them entirely because they have no effective-data-volume metric at all — do not query a count and do not list them (this "omit even when 0" rule applies to user_event only, never to item/video/document, which are always reported even when their count is 0). | "How much effective data does application X have" |
| Purchase / billing / pricing / quota | official docs via the bundled documentation helper | "How do I upgrade my plan" |
| Console UI path / where to click | official docs via the bundled documentation helper | "Where do I configure boost/bury" |

Do not use `vs --help` to answer product-concept questions. Do not use docs to explain command flags when the installed CLI can answer directly.

## Knowledge Sources

### CLI source

Allowed CLI checks include:

- `vs --help`
- `vs <cmd> --help`
- `vs doctor`
- `vs auth status`
- `vs llm status`
- `vs skill list`
- `vs skill search <query>`
- `vs skill show <name>`

For command-related questions, use `vs <domain> --help` or `vs <cmd> --help` as the primary source for command existence, flags, examples, and currently installed behavior. Use the online API Reference router only when the user asks how a command maps to an API category or contract.

Before recommending any command or flag, verify that it exists through `vs skill list`, `vs <domain> --help`, or `vs <cmd> --help`.

### API Reference source

API contracts are not answered from local installed snapshots. When the user asks about OpenAPI request/response shape, field semantics, enums, validation rules, or error codes, fetch the latest API Reference from GitHub main:

```text
https://raw.githubusercontent.com/volcengine/SearchCLI/main/skills/vs-product-qa/references/api-references/README.md
```

Read it progressively:

```text
api-references/README.md
  -> command/resource routing or control-plane / data-plane
  -> second-level category README, such as control-plane/scene/README.md
  -> one OpenAPI Markdown file, such as PublishSearchSceneV2.md
```

Resolve every relative Markdown link in the API Reference tree against the GitHub raw URL of the current document, not against the local workspace. For example, `./control-plane/README.md` from the root README means:

```text
https://raw.githubusercontent.com/volcengine/SearchCLI/main/skills/vs-product-qa/references/api-references/control-plane/README.md
```

Rules:

- CLI flags and command availability still come from the installed `vs --help`; the GitHub API Reference must not override observed CLI behavior.
- API contract details come from GitHub main API Reference.
- If GitHub fetching fails or the target API row is marked `missing`, say the online API Reference is unavailable or incomplete for that API. Do not fall back to old local snapshots and do not guess.

### Documentation source

This skill includes a private bundled documentation helper under [references/volcengine-documentation/SKILL.md](references/volcengine-documentation/SKILL.md). Use it only as an internal sub-workflow of `vs-product-qa`. Do not expose it as a separate skill, and do not ask the user to install, trigger, or switch to it.

Use the helper only for official Volcengine documentation, with these fixed rules:

- base root URL: `https://www.volcengine.com/docs/85296/1544972`
- Chinese questions use `https://www.volcengine.com/docs/85296/1544972?lang=cn`
- non-Chinese questions use `https://www.volcengine.com/docs/85296/1544972?lang=en`
- stay within that root page and its child pages only
- do not access sibling product pages, other documentation roots, site-wide search, homepage navigation, or external sites
- do not switch between `?lang=cn` and `?lang=en` in the same answer unless the user's language changes in a later turn

For Viking AI Search documentation lookup, the data-source restriction is hard:

- product code is `Universal AI Search`
- the helper script's `search` action must use `ServiceCodes="Universal AI Search"`
- the helper script's `fetch` action must use URLs under `https://www.volcengine.com/docs/85296` only

Documentation lookup protocol:

1. Choose the root URL by the user's language.
2. If the page URL is already known, or the user provides a page URL under the allowed root, use the helper script's `fetch` action first.
3. Otherwise, use the helper script's `search` action with `ServiceCodes="Universal AI Search"`.
4. After identifying the correct page under the same subtree, use `fetch` to retrieve the full page content and extract the relevant section.
5. If exact sub-page lookup fails because of selector change, network error, or timeout, return the selected root URL and tell the user to browse manually. Do not guess sub-page URLs.

Fetch budget:

- at most 3 fetches per answer
- at most 5 seconds per fetch
- total budget 15 seconds or less
- on timeout or overrun, degrade honestly and cite the root URL

Not used in MVP:

- `https://www.volcengine.com/llms.txt`
- `https://www.volcengine.com/sitemap.xml`
- undocumented per-page markdown endpoints

These may be used later only if they become publicly available and are actually fetched during the current turn.

## Commands

- `doctor`: inspect local CLI environment and service readiness
- `auth status`: inspect local Viking AK/SK auth state
- `llm status`: inspect local LLM auth state for LLM-backed features
- `skill list`: list installed skills before recommending handoff
- `skill search`: find a relevant installed skill before recommending handoff
- `skill show`: inspect another skill's workflow before delegating
- `vs <cmd> --help`: inspect command usage and flags; this is a source rule, not a frontmatter command entry

## Workflow

1. Classify the question using **Question Routing**.
2. Pick the source:
   - CLI usage -> run the relevant `vs ... --help`; use the online API Reference router only for command-to-API-category questions
   - local auth / environment -> use `vs auth status`, `vs doctor`, or `vs llm status`
   - local CLI error -> use the recovery output from this turn first; only run more CLI checks if needed
   - API contract -> fetch GitHub main API Reference from the root README, then follow category and endpoint links
   - product docs -> use the bundled documentation helper privately, with the hard `Universal AI Search` + `docs/85296` restriction
3. Extract only the lines or sections needed to answer.
4. Respond using the required output format.
5. If the topic involves credentials, environment variables, or `vs auth import-env`, append the AK/SK security notice from [references/aksk-notice.md](references/aksk-notice.md).
6. If the request implies write operations such as `apply`, `update`, `create`, or `bind`, explain only the safe draft or dry-run path unless the user explicitly switches to the correct execution workflow.
7. If no grounded source can answer, return `unknown`, cite the checked CLI command or documentation root URL, and suggest support-ticket / oncall escalation.

## Output Format

Use this structure and omit fields that have no grounded content:

```text
**Conclusion**: <one-line direct answer>
**Source**: <doc URL + section heading> OR <CLI command + relevant output>
**Steps**: <ordered steps, only if actionable>
**CLI entry**: <`vs ...` command, or "see `vs <x> --help`">
```

`CLI entry` is only for questions that ask **how to use a command**. For a data/result question
(e.g. "how much effective data does app X have"), omit `CLI entry` entirely — do not list the commands you
ran to obtain the number.

For a data/result question, output **only** `Conclusion`. Omit `Source`, `Steps`, and `CLI entry` entirely
— do not name the command or backend action, do not add a provenance line, and do not list the commands you
ran to obtain the number.

Rules:

- for CLI-usage questions, `Source` cites the command output used in this turn
- for doc-grounded answers, `Source` must be a real URL retrieved in this turn
- do not fill missing fields with speculation
- do not paste large documentation blocks; summarize in your own words and link the source
- do not narrate internal method selection or source-routing decisions in the answer (e.g. which field/API/skill was chosen, or why another field such as `DataNum` was rejected); report the grounded result directly
- do not list the commands used to fetch a result (no `CLI entry` command dump) unless the user explicitly asked how to run it
- for a data/result answer, output only the `Conclusion` line; do not emit a `Source` line at all (no command name, no backend action, no field references)

## Constraints

1. **Grounded only**: every factual claim must be backed by CLI output from this turn or an official documentation URL retrieved in this turn. Citing that provenance in a `Source` line is required for CLI-usage and doc-grounded answers, but for a data/result answer (e.g. an effective-data-count number) do not print a `Source` line — stay grounded internally and output only the `Conclusion`.
2. **No memory answers**: do not answer Viking AI Search product questions from training memory.
3. **No fabricated URLs**: sub-page URLs must come from routing actually performed in this turn. Do not guess paths.
4. **No CLI hallucination**: do not recommend commands or flags that do not exist.
5. **CLI overrides docs**: when CLI help and documentation conflict, trust the installed CLI and say the docs may be stale.
5a. **Command questions check installed CLI first**: when the user asks about a concrete command, its parameters, or flags, first confirm the installed CLI surface with `vs ... --help`. Use the online API Reference router only for command-to-API-category questions.
5b. **API contract questions use GitHub main API Reference**: when the user asks about OpenAPI request/response, fields, enums, validation, or error codes, fetch the root API Reference README from GitHub main and follow links progressively to the target endpoint. Do not answer API contracts from local installed snapshots.
6. **No silent execution**: do not run write commands such as `apply`, `update`, `create`, or `bind` on the user's behalf.
7. **AK/SK notice required**: whenever credentials or `vs auth import-env` are involved, append the AK/SK security notice.
8. **Honest unknowns**: if available sources cannot answer, say `unknown`, explain what source was checked, and suggest escalation.
9. **Honest fallback**: if exact sub-page lookup fails, explicitly say: "exact sub-page lookup failed; here is the chapter root."
10. **No large doc dumps**: summarize rather than pasting long documentation blocks.
11. **Bundled helper only**: use the documentation helper only inside `vs-product-qa`; do not expose it as a standalone skill.
12. **Language-aware docs**: use `?lang=cn` for Chinese questions and `?lang=en` for non-Chinese questions.
13. **Strict doc scope**: only access `https://www.volcengine.com/docs/85296/1544972` and its child pages in the same subtree.
14. **Hard source restriction**: for Viking AI Search docs, `search` must use `ServiceCodes="Universal AI Search"`, and `fetch` must stay under `https://www.volcengine.com/docs/85296`.
15. **Delegate specialized workflows**: use [references/delegation.md](references/delegation.md) when the user actually needs onboarding, item workflow execution, or tuning execution.
16. **No routing narration**: keep internal method/source selection out of the user-facing answer. Do not explain which field, API, command, or skill was chosen, and do not justify rejecting an alternative field (for example, do not add remarks like "using validCnt instead of DataNum" or "DataNum reflects a legacy field"). State the grounded result plainly; provenance belongs in `Source`, not in an explanatory aside.

## Delegation

Use [references/delegation.md](references/delegation.md). When delegating, briefly say which skill takes over and why, then stop.

## Examples

### CLI usage question

User: "What does the `--scene-id` flag of `vs search run` do?"

1. Classify as CLI usage.
2. Run `vs search run --help`.
3. Answer using only that command output.

Expected shape:

```text
**Conclusion**: Per `vs search run --help`, `--scene-id` selects the configured search scene used for the request.
**Source**: `vs search run --help` output from this turn.
**CLI entry**: `vs search run --scene-id <id> ...`
```

### Product concept question

User: "What is a scene in Viking AI Search?"

1. Classify as product concept.
2. Use the bundled documentation helper privately inside `vs-product-qa`.
3. Choose the documentation root by user language: `?lang=cn` for Chinese, otherwise `?lang=en`.
4. Run the helper script's `search` action with `ServiceCodes="Universal AI Search"`.
5. Use the helper script's `fetch` action only if the chosen page URL stays under `https://www.volcengine.com/docs/85296`.
6. Answer using only retrieved documentation.

### Delegation question

User: "How do I buy Viking AI Search and create my first AK/SK?"

Answer: "This is covered by `vs-user-onboarding` because it is a sign-up, purchase, and first AK/SK workflow. Handing off."

## References

- AK/SK security notice: [references/aksk-notice.md](references/aksk-notice.md)
- Delegation matrix: [references/delegation.md](references/delegation.md)
- Bundled documentation helper: [references/volcengine-documentation/SKILL.md](references/volcengine-documentation/SKILL.md)
- Online API Reference entry: `https://raw.githubusercontent.com/volcengine/SearchCLI/main/skills/vs-product-qa/references/api-references/README.md`
