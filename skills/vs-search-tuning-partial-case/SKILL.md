---
name: vs-search-tuning-partial-case
description: "Use when the user provides 1-50 concrete bad-case search queries for one Viking Search app and wants local deterministic fixes. This skill only verifies request-level fine-operation interventions against a read-only baseline scene and delivers a console-ready configuration sheet, validated payloads, and a replay script. It must not mutate scenes, apps, dictionaries, datasets, recall core parameters, or online defaults."
---

# Viking Search Partial Case Tuning

## 1. Scope

Use this skill when the user provides a small number of concrete bad-case queries, usually 1-50, and asks to "optimize the search results for these queries."

This skill only performs local, highly deterministic, fine-grained operational fixes:

- It does not replace global relevance or recall-parameter tuning.
- It does not change online configuration; it only validates candidates through request-level payloads.
- The final deliverables are a fine-grained operations configuration sheet that can be copied into the console, validated payloads, and a replay script.

## 2. Hard Boundaries

1. Do not change core recall parameters: `user_defined_recall_mode`, `dense_weight`, `text_weight`, `query_keyword_match_percent`, or `max_retrieved_num`.
2. The baseline scene is read-only; do not create, modify, derive, publish, or switch scenes.
3. Do not write app config, dataset config, dictionaries, recommend scenes; do not bind anything, and do not perform any persistent writes.
4. Validation may only take effect through a single-request payload passed to `vs search run --data`; no side effects may remain after the request finishes.
5. Do not rewrite the user's real query. Query-rewrite ideas may only be used as candidate evidence; they must not be written back to the original query or used as online trigger terms that replace the user's query.
6. Do not use conclusions from local cases to judge the overall quality of the recall strategy.
7. Do not force a search-mode change. Evaluate the currently locked baseline scene as-is; if the scene itself is not UserDefined, do not change it for this skill.
8. In the apply phase, only deliver the configuration sheet and evidence; actual launch must be performed manually in the Viking console based on the configuration sheet.

## 3. Naming Conventions

- File names and report references should use "query + strategy name"; do not use internal aliases such as `C1`, `case-3`, or `cand-1`.
- File-name slug: keep the first few words of the query, convert spaces to hyphens, and remove symbols that are unsuitable for file names.
- When referring to a plan in the report, use readable names such as `filter item scope(category=Light Sports,product_type=SHOE)`.

## 4. Known CLI Behaviors and Pitfalls

These execution constraints must be internalized. Read this section before writing scripts.

### 4.1 Command Names Must Follow the Actual CLI

Common read-only commands:

```bash
vs auth status --json
vs llm status --json
vs app status --application-id <app_id> --json
vs app get --id <app_id> --json
vs app online-config get --application-id <app_id> --json
vs app dataset-config get --application-id <app_id> --dataset-id <dataset_id> --json
vs search scene list --application-id <app_id> --json
vs search scene get --application-id <app_id> --scene-id <scene_id> --json
```

Notes:

- `vs app get` uses `--id`, not `--application-id`.
- `vs app dataset-config get` must include `--dataset-id`.
- The current CLI may not have `vs search dictionary list`; if it returns `Unknown search subcommand: dictionary`, record this as a missing capability and do not block the main flow.
- `vs search run --help` may not show service flags such as `--json`, `--output`, or `--data`; do not conclude that a flag is unsupported only because help omits it. You must verify support with probes.

### 4.2 `--data` Is a Full Request Override

`vs search run --data` does not "append fields on top of `--query` / `--page-size`"; it overrides the request body.

Incorrect example:

```bash
vs search run ... --query "white shoes for dresses" --page-size 10 --data '{}'
```

This causes the request body to omit `query.text` and pagination parameters.

A correct candidate payload must explicitly include:

```json
{
  "query": { "text": "user's original query" },
  "page_size": 10,
  "page_number": 1,
  "filter": {
    "op": "must",
    "field": "reverse",
    "conds": ["Footwear"]
  }
}
```

The CLI usually fills in `dataset_id`, but for auditability, the report must still record the actual application-id, dataset-id, scene-id, and page-size.

### 4.3 Request-Level Filter DSL

Prioritize validating the following DSL. Do not use unverified `eq`, string expressions, or `{field:value}` maps.

Single field:

```json
{
  "op": "must",
  "field": "category",
  "conds": ["Soccer"]
}
```

Multi-field AND:

```json
{
  "op": "and",
  "conds": [
    { "op": "must", "field": "category", "conds": ["Soccer"] },
    { "op": "must", "field": "product_type", "conds": ["SHOE"] }
  ]
}
```

Multiple `conds` on the same field means OR; multiple `must` clauses placed in `and.conds` mean AND.

When validating `product_id` filters, the common ID field in results is `_id`; when calculating `field_match@10`, map `product_id` to result `_id` to avoid incorrectly scoring it as 0.

### 4.4 Authentication Pitfalls in Batch Scripts

Running `vs search run ...` directly may read secure-store successfully, while spawning `vs` from a Node/Bash batch script in a restricted sandbox may fail with:

```text
Missing Viking auth. Run `vs auth import-env` ...
```

This does not necessarily mean the user is not logged in. Handle it as follows:

- First verify auth with the direct command `vs auth status --json`.
- If the direct command works but the batch script fails, request external execution / real terminal permission for the current environment and rerun the batch script.
- Do not attribute this error to the app or query.

### 4.5 Query File Format

`vs search tune validate` accepts `text` or `query.text`; do not use an arbitrary field name `query`.

Recommended JSONL:

```jsonl
{"id":"white-shoes-for-dresses","text":"white shoes for dresses"}
{"id":"TF-soccer-shoes","text":"TF soccer shoes"}
```

## 5. Fine-Grained Operations Action Library

By default, the trigger condition should be "search term equals the user's original query" for exact matching and low spillover. Only use broader conditions such as contains, search-term type, or search-term length when the business explicitly wants to cover a class of queries.

Candidates must first pass capability confirmation. Fields must come from the dataset config's `filterFields` or from verified request-level capabilities; do not invent fields.

| Failure Mode | Preferred Action | Console Configuration | Request Validation Field | Notes |
|---|---|---|---|---|
| Wrong category / wrong top-level class recalled | Filter item scope | Search term equals X; field category/reverse/product_type/gender equals Y | `filter` | Prefer low-risk structured fields |
| Audience mismatch | Filter item scope | gender equals Women/Men/Boys/Girls | `filter` | Suitable for kids', women's, and men's queries |
| Product attribute has no structured field | Product ID whitelist, or guaranteed recall after business confirmation | product_id contains ID list | Approximate validation via `filter.product_id` | Medium risk; requires maintaining a product pool; mark as requiring business confirmation in the report |
| Target is not recalled and CLI supports guaranteed recall | Guaranteed recall | Product ID contains item_id | `guaranteed_recall` | Generate only when cli-capabilities proves support |
| Already recalled but ranked too low | Boost / bury | Product ID weight | `boost_rules` / `bury_rules` | Generate only when a request-level entry point is proven to exist |
| Need sorting by field | Field sorting | Field online_time/sales descending | `rank_rules` | Field must exist and be sortable |
| Out of stock / prohibited / competitor items | Strong filter + empty-result protection | stock > 0 and sellable = true | `filter` | stock/sellable must be `filterFields`; otherwise do not generate |
| Same brand / series dominates the page | Diversity | Per-page upper limit N for brand | `diversity` | Generate only when a request-level entry point is proven to exist |

If an action-library item has no CLI request-level entry point, write "Not evaluated: the CLI does not expose an equivalent request entry point" in the report; do not generate fake payloads.

## 6. Standard Flow

### Step 1. Preflight Checks

Minimum requirements:

```bash
vs auth status --json
vs app status --application-id <app_id> --json
vs search scene list --application-id <app_id> --json
```

Confirm that the app is ready, that there is a unique or specified dataset-id, and that an available search scene exists.

### Step 2. Lock the Baseline Scene

Priority:

1. A scene explicitly specified by the user.
2. The scene corresponding to a known best global tuning result that has already been applied.
3. The current default scene.

After locking it, treat it as read-only. Record the scene id, name, whether it is the default, and a summary of the main SearchConfig.

### Step 3. Research Capabilities and Save Them

First inspect help:

```bash
vs search run --help
vs search tune run --help
vs search tune plan --help
vs search tune validate --help
```

Then collect read-only information:

```bash
vs auth status --json
vs llm status --json
vs app status --application-id <app_id> --json
vs app get --id <app_id> --json
vs app online-config get --application-id <app_id> --json
vs app dataset-config get --application-id <app_id> --dataset-id <dataset_id> --json
vs search scene get --application-id <app_id> --scene-id <baseline_scene_id> --json
```

You must confirm capabilities with probes:

```bash
vs search run --application-id <app_id> --scene-id <scene_id> --dataset-id <dataset_id> \
  --query "<q>" --page-size 2 --json --output <session>/probe-output.json

vs search run --application-id <app_id> --scene-id <scene_id> --dataset-id <dataset_id> \
  --query "<q>" --page-size 2 \
  --data '{"query":{"text":"<q>"},"page_size":2,"page_number":1}' \
  --json --output <session>/probe-data.json

vs search run --application-id <app_id> --scene-id <scene_id> --dataset-id <dataset_id> \
  --query "<q>" --page-size 2 \
  --data '{"query":{"text":"<q>"},"page_size":2,"page_number":1,"filter":{"op":"must","field":"reverse","conds":["Footwear"]}}' \
  --json --output <session>/probe-filter.json
```

Generate `<session>/cli-capabilities.json`, containing at least:

- application-id, dataset-id, and baseline scene-id.
- `search_run_output`, `search_run_raw_data`, and `request_filter`.
- `request_filter_dsl`.
- Dataset `filterFields`, `indexFields`, and `imageIndexFields`.
- Whether `tune_run_scene_id` and `tune_run_interventions_file` appear in help.
- Unsupported capabilities and error messages, for example dictionary list does not exist.
- `effective_evaluation_mode`: default `search-topn-strategy-effect`.

Only consider `llm-candidate-matrix` when `tune run` clearly supports scene-id and equivalent pass-through of candidate payloads; otherwise do not use an LLM matrix.

### Step 4. Run Baseline and Probes

Run Top10 for each real user query:

```bash
vs search run --application-id <app_id> --scene-id <scene_id> --dataset-id <dataset_id> \
  --query "<q>" --page-size 10 --json --output <session>/baselines/baseline-<q-slug>.json
```

Automatically attribute failure based on Top10:

- Wrong top-level class: reverse/category/product_type are clearly mismatched.
- Wrong audience: gender mismatch, for example children/adult items are mixed in.
- Missing attribute: the query requires attributes such as "wide feet / heavy weight / flat feet / rainy days / does not rub the foot," but `filterFields` has no corresponding field.
- Stock / competitor issues: continue only when relevant `filterFields` exist.

Run a small number of filter probes for suspected field strategies to prove the fields actually take effect.

### Step 5. Generate Candidates

By default, generate at most 5 candidates per query. Do not generate invalid or unsupported actions just to fill the count.

Candidate generation priority:

1. Low-risk structured filters: `reverse`, `category`, `product_type`, and `gender`.
2. Multi-field combined filters.
3. For semantic attributes that have no structured field, use a `product_id` whitelist for approximate validation, and mark it as medium risk requiring business confirmation of the product pool.
4. Generate guaranteed recall, boost, bury, sorting, diversity, and similar candidates only when capability checks prove support.

Each candidate must include:

- `strategy_name`: a readable strategy name.
- `console_config`: trigger condition + rule action + field/value.
- `request_payload`: a full payload including `query.text`, `page_size`, and `page_number`.
- `risk` and the reason for the risk.

### Step 6. Validate Candidates

Baseline and candidate runs must use the same application-id / dataset-id / scene-id / page-size. The only effective difference for the candidate is the `--data` payload.

Candidate command:

```bash
vs search run --application-id <app_id> --scene-id <scene_id> --dataset-id <dataset_id> \
  --query "<q>" --page-size 10 \
  --data '<full_request_payload_json>' \
  --json --output <session>/candidates/candidate-<q-slug>-<strategy-slug>.json
```

For each query x candidate, output:

- `strategy_name`
- `console_config`
- `request_payload`
- `baseline_top10`
- `candidate_top10`
- `target_hit@10`
- `bad_hit@10`
- `first_target_rank`
- `field_match@10`
- `result_count_delta`
- `decision_reason`

Scores are only auxiliary. If the baseline is already perfect, do not force a no-benefit rule recommendation; mark it as "optional guardrail: baseline already satisfies the requirement" or "not recommended for launch."

### Step 7. Report and Deliverables

The report's primary content is the fine-grained operations configuration sheet for the console:

| Search Term (Trigger Condition) | Rule Action | Field / Parameter | Value | Risk Level | Recommended for Launch |
|---|---|---|---|---|---|
| Equals X | Filter item scope | category equals AND product_type equals | Light Sports; SHOE | Low | Yes |
| Equals Y | Filter item scope | product_id contains | 123,456 | Medium | Launch after business confirms product pool |

The report must include:

1. Console configuration sheet: directly copyable.
2. Before/after evidence: Top10 titles, product IDs, reverse/category/gender/product_type, and metric changes.
3. Validated payload appendix: the raw request payload for each selected rule.
4. Out-of-stock / competitor-specific section: if there are no relevant fields or relevant queries, explain why no rule was generated.
5. Spillover and maintenance risk: exact-query triggers have low spillover; product_id whitelists require maintenance; campaign rules need time windows and expiration cleanup.

Also deliver:

- `cli-capabilities.json`
- `candidate-evaluation.json`
- `selected-strategies.json`
- `replay.sh`

`replay.sh` should rerun baseline, candidate, analysis, and report generation; do not use `--resume-run-id`.

## 7. Default Execution Summary

Lock a read-only baseline scene -> collect app/dataset/scene/capabilities -> use probes to confirm `--output`, `--data`, and filter DSL -> save real queries and validate them -> run baseline Top10 -> infer failure modes -> generate only fine-grained operations candidates supported by capabilities -> validate before/after with full `--data` payloads -> select the best options and label risks -> output the console configuration sheet, payloads, evidence, and replay script.
