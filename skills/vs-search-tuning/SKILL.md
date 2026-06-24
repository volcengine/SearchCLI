---
name: vs-search-tuning
description: "Use when a user asks an agent to evaluate or tune text search similarity for an existing Viking AI Search application and dataset."
category: search
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: search tuning, search evaluation, llm judge, ndcg, query generation, similarity tuning
commands: llm login, llm import-env, llm status, search tune llm-check, search tune validate, search tune query-generate, search tune plan, search tune run, search tune report, search tune compare, search tune apply, app status, doctor
---

# Viking Search Tuning

## When to Use

Use this skill when the user wants an external agent to evaluate and tune text search similarity for an existing AI Search application and dataset.

This first version is for similarity tuning. It defaults to text-query/text-item judging, fixes `mode=UserDefined`, and tunes the user-defined recall strategy, recall weights, keyword match ratio, and max retrieved count. It can optionally use text+image LLM judging when visual relevance matters; image fields are taken only from `GetAppDataConfig.ImageIndexFields`. It does not tune rerank, personalization, hotness, boost/bury, sort rules, serving controls, or business operating rules.

## Preconditions

- an `application-id` is available
- a `dataset-id` is preferred; if omitted, the CLI can try to infer a unique search dataset from the application
- Viking auth is configured with `vs auth status`
- LLM config is available through `vs llm login`, `vs llm import-env`, or `VIKING_LLM_BASE_URL` / `VIKING_LLM_API_KEY` / `VIKING_LLM_MODEL` when generating queries or using LLM relevance labels
- a query file with `sourceItemIds` can be evaluated with `--label-source source-item` for a fast first-pass silver-label run without LLM relevance judging
- the user understands that LLM relevance labels are silver labels and should be reviewed before high-risk production changes

## Commands

- `llm login` / `llm import-env` / `llm status`: configure and verify OpenAI-compatible LLM credentials without exposing API keys in chat or plain config
- `search tune llm-check`: verify CLI-managed LLM configuration
- `search tune validate`: validate a query set locally before planning or running; reports schema issues, duplicate ids/text, sourceItemIds coverage, query type skew, and a label-source recommendation
- `search tune query-generate`: generate a reusable synthetic query set from paged dataset samples with batched concurrent LLM calls when the user has no query set; add `--retrievable-field-only` when the user wants generation constrained to text `IndexFields` from app dataset config, excluding `ImageIndexFields`
- `search tune plan`: show query source, candidate strategies, estimated requests/labels, parameter coverage, source-item coverage, warnings, and suggested first-pass size before running
- `search tune run`: generate or load queries, run candidate search strategies, label top results, compute metrics, and write artifacts; supports `--label-source llm|source-item|auto`, `--judge-input text|text-image`, `--max-judge-images`, `--llm-retries`, `--max-label-failure-rate`, and `--verbose`; use `--resume-run-id <run-id>` to continue an interrupted run
- `search tune report`: read a previous tuning report
- `search tune compare`: compare completed tuning runs with `--run-ids`, or compare existing scenes online with `--scene-ids --queries` using source-item silver labels
- `search tune apply`: create a new candidate search scene from a completed tuning report recommendation
- `app status` / `doctor`: verify app and local environment readiness

## Workflow

1. Ask the user whether they have a tuning query set. Good sources include online search logs, customer support query collections, or a manually curated representative set. If the user has one, use it with `--queries <file>`. If not, say the CLI will generate synthetic queries from dataset samples and that those queries should be reviewed.
2. Check the local environment:
   - `vs auth status --json`
   - `vs doctor --json`
   - `vs search tune llm-check --json`
   If LLM check fails and LLM query generation or LLM judging is needed, configure LLM first:
   - interactive secure setup: `vs llm login`
   - from existing terminal env: `vs llm import-env`
   - verify secret source: `vs llm status --json`
3. Check that the application is ready:
   - `vs app status --application-id <id> --json`
4. Confirm the tuning boundary with the user:
   - text query similarity tuning
   - similarity-only profile
   - fixed `mode=UserDefined`
   - tunes only `user_defined_recall_mode`, `dense_weight`, `text_weight`, `query_keyword_match_percent`, and `max_retrieved_num`
   - LLM judging defaults to `--judge-input text`; use `--judge-input text-image` only when the user asks for image-aware relevance or the domain is strongly visual and image quality/content should affect relevance
   - no rerank, personalization, hotness, boost/bury, sort rules, serving controls, or business operating rules
5. If the user has no query set, generate one first:
   - `vs search tune query-generate --application-id <id> --dataset-id <dataset> --query-count 100 --sample-size 200 --query-batch-size 10 --llm-concurrency 100 --timeout-ms 120000 --json`
   - if synthetic queries should only use configured text retrievable fields: add `--retrievable-field-only`, which reads `GetAppDataConfig.DataConfig.IndexFields` and excludes `ImageIndexFields`
   Show the returned `sampleQueries`, `typeCounts`, `requestedQueryCount`, `actualQueryCount`, `shortfall`, and `warnings` to the user. If `ok=false`, do not continue to `plan` or `run`; retry with larger timeout/sample size or ask for a real query set. Use the returned `queryFile` only after the user accepts the query set for first-pass tuning.
6. Validate the accepted query set before planning:
   - `vs search tune validate --queries <file> --json`
   Summarize `ok`, `validQueryCount`, `duplicateIdCount`, `sourceItemQueryCoverage`, `labelSourceRecommendation`, and any blocking `problems`. If `ok=false`, fix or regenerate the query set before continuing.
   When a user provides `--queries <file>`, `search tune plan` and `search tune run` evaluate the whole file by default; pass `--query-count <n>` only when the user explicitly wants a smaller prefix.
7. Run a plan before any expensive evaluation:
   - with user queries: `vs search tune plan --application-id <id> --dataset-id <dataset> --queries <file> --profile similarity-only --json`
   - with generated queries: use the `queryFile` returned by `query-generate`
   Summarize the estimated search requests, max pointwise LLM judgements, source-item coverage, suggested first-pass size, warnings, and parameter coverage.
8. Run tuning only after the plan is acceptable:
   - fast first pass when the query file has enough `sourceItemIds`: `vs search tune run --application-id <id> --dataset-id <dataset> --queries <file> --profile similarity-only --label-source source-item --search-concurrency 18 --timeout-ms 120000 --json`
   - LLM judgement run: `vs search tune run --application-id <id> --dataset-id <dataset> --queries <file> --profile similarity-only --label-source llm --search-concurrency 18 --llm-concurrency 100 --llm-retries 1 --max-label-failure-rate 0.01 --timeout-ms 120000`
   - image-aware LLM judgement run, only when visual relevance is needed: `vs search tune run --application-id <id> --dataset-id <dataset> --queries <file> --profile similarity-only --label-source llm --judge-input text-image --max-judge-images 1 --search-concurrency 18 --llm-concurrency 100 --timeout-ms 120000`
   - with generated queries: use the `queryFile` returned by `query-generate`
   Use the command form above for first-pass tuning unless the user explicitly asks for a different evaluation scope. Search requests default to 18-way concurrency, and LLM judgements default to 100-way concurrency. LLM judging runs as a worker pool, so completed labels are checkpointed while slower LLM requests continue in their own worker slots.
9. While a run is active, use the artifact paths from progress output if troubleshooting is needed:
   - `run-state.json`: current status, completed searches, labels, and resume metadata
   - `partial-metrics.json`: partial metrics from completed query/strategy pairs
   - `performance-summary.json`: elapsed time, search/LLM wall time, average and percentile latency, throughput, cache hits, label failures, and configured concurrency
   - `rankings.jsonl`, `labels-used.jsonl`, and `label-failures.jsonl`: completed rankings, labels used by the run, and tolerated/diagnostic label failures
   If the process is interrupted, resume with `vs search tune run --application-id <id> --resume-run-id <run-id>`.
10. Read and summarize the generated report:
   - `vs search tune report --run-id <run-id> --json`
11. Explain the recommended strategy, metric deltas, parameter coverage, and risk notes. Treat the output as a recommendation.
12. If the user asks to compare multiple completed runs or candidate scenes:
   - completed runs: `vs search tune compare --run-ids <run_a,run_b> --json`
   - online scene source-item compare: `vs search tune compare --application-id <id> --dataset-id <dataset> --scene-ids <scene_a,scene_b> --queries <file> --json`
   For scene compare, every query must include `sourceItemIds`; otherwise use `search tune run` with LLM labels and compare completed run IDs.
13. If the user asks to materialize the recommendation as a candidate scene, inspect first:
   - `vs search tune apply --application-id <id> --run-id <run-id> --dry-run --json`
   Explain `unappliedRequestParams`; request-only params such as `query_keyword_match_percent` are not persisted in scene config.
14. If the user accepts the dry-run payload, create a new candidate scene:
   - `vs search tune apply --application-id <id> --run-id <run-id> --confirm-create-scene --json`

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- Before executing any concrete `vs ...` command in this tuning workflow, first consult `vs-product-qa` to verify the current command surface, required flags, payload fields, input format, and allowed values. Only after that check may you finalize parameters and run the command.
- Do not run tuning before asking the user whether they have a query set.
- Do not run tuning before `search tune validate` has checked the accepted query file, unless the user explicitly asks to skip validation.
- Do not run tuning before `search tune plan` has been shown and summarized.
- Do not let `search tune run` auto-generate queries during agent-led tuning. If the user has no query set, run `search tune query-generate`, show query samples, and then pass the generated `queryFile` to `plan` and `run`.
- Do not continue from a generated query set when `query-generate` returns `ok=false`; inspect `warnings` and retry generation before asking the user.
- Do not run LLM query generation or LLM judging until `search tune llm-check` succeeds. A `--label-source source-item` run may skip LLM judging only when the query file already contains usable `sourceItemIds`.
- Do not ask the user to paste LLM API keys into chat. Use `vs llm login` in a real terminal, or ask the user to set `VIKING_LLM_BASE_URL`, `VIKING_LLM_API_KEY`, and `VIKING_LLM_MODEL` in that terminal and then run `vs llm import-env`.
- Do not present the recommendation as an online change. `search tune apply` creates a new candidate scene only; it does not switch the default entrance.
- If a tuning process is interrupted, prefer `--resume-run-id` over starting a duplicate run with the same query set and strategy space.
- Do not tune or attribute changes to rerank, personalization, hotness, boost/bury, sort rules, serving controls, or business rules in this first-version workflow.
- Do not enable `--judge-input text-image` by default. Use it only when image relevance is part of the user's evaluation goal; if `GetAppDataConfig.ImageIndexFields` is empty, stay with text judging and tell the user image-aware judging is unavailable for that app+dataset config.
- Do not create, update, publish, or switch search scenes as a fallback for failed automatic tuning. Only use `search tune apply` after a completed report and explicit user approval.
- Do not call a result "optimal" or "best" unless a completed `search tune run` report exists. If the report used `--label-source source-item`, call it a fast source-item silver-label recommendation and explain that LLM or human labels can be used for higher-confidence validation.
- Do not delete or prune `.viking/search-tuning` artifacts unless the user explicitly asks.
- If `search tune run` generates queries automatically, tell the user the query set is synthetic and should be reviewed for high-risk usage.
- If a tuning failure or user follow-up turns into a product concept, capability, API field, console UI path, purchase, billing, or general troubleshooting question outside this tuning workflow, temporarily hand off to `vs-product-qa`; return to this workflow only after the grounded product answer is complete.
