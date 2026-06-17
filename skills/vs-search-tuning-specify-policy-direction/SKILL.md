---
name: vs-search-tuning-specify-policy-direction
description: Viking Search tuning for specified policy directions. Use this when the user provides specific queries, a type of query, or a business policy direction, and asks to boost, suppress, or fix a class of search results through request-parameter passthrough. You must only perform read-only baseline evaluation and request-level candidate testing; do not modify search scenes, app config, dictionaries, recommend scenes, or primary recall parameters.
---

# Viking Search Tuning for Specified Policy Directions (vs-search-tuning-specify-policy-direction)

## 1. When To Use

Use this Skill when the user provides specific queries or a type of query, and explicitly specifies an "optimization policy direction" such as boosting the weight of a product type, increasing exposure for seasonal products, or fixing a class of bad cases.

Difference from global `vs-search-tuning`:

- This Skill **does not modify primary recall parameters**.
- This Skill **does not create, modify, or derive scenes**.
- This Skill validates and recommends strategies only through **request-parameter passthrough**, within the scope of the 8 business intervention methods.
- It is suitable for small-scale targeted tuning with a clear direction; it is not suitable for global similarity-recall strategy search.

Mode selection:

- If the user provides specific queries or bad cases: use **Mode A**.
- If the user only provides a policy direction and no specific queries: use **Mode B**. The Agent synthesizes 50 dataset-related queries.

## 2. Intervention Boundaries

### 2.1 The 8 Allowed Intervention Methods

Only tune within the following scope. Any method outside these 8 categories must not be used as an official candidate:

1. Key recall guarantee
2. Personalization
3. Hotness boost
4. Boosting / burying
5. Field-based sorting rules
6. Search diversity
7. Recall-result reranking
8. Synonyms

`filter` / "filtering the item scope" is not one of the 8 categories above. It can only be used as:

- a probe: diagnose whether a field/object type can explain a bad case;
- an optional guard: use when the user explicitly asks to exclude a class of results, protect no-result cases, or protect against competitors/unsellable items;
- a comparison candidate: measure the upper bound, but do not use it by default as the primary strategy for goals like "show more of this type" or "increase exposure."

### 2.2 Primary Recall Parameters That Must Not Be Changed

Do not modify:

- `user_defined_recall_mode`
- `dense_weight`
- `text_weight`
- `query_keyword_match_percent`
- `max_retrieved_num`
- `mode`

If the baseline scene needs to be read, read it only. Do not write to it.

### 2.3 Hard Constraints on How Changes Take Effect

Changes may take effect only through request-parameter passthrough:

- Preferred: `vs search run --data`
- Do not use by default: `vs search tune run`

Use `tune run` only when the installed `vs search tune run --help` explicitly exposes request-level candidate payload passthrough, and after confirming that it will not tune `user_defined_recall_mode/dense_weight/text_weight/query_keyword_match_percent/max_retrieved_num/mode`. The currently observed `search tune run` is a similarity-only / recall-parameter tuning entrypoint and does not fit this Skill's boundary.

The following requirements must be met:

- Do not write persistent search scene configuration.
- Do not write app config.
- Do not write or bind dictionaries.
- Do not write recommend scenes.
- Keep the baseline scene read-only throughout. Do not create or derive a working scene.

Elimination axis (the only one): once a method does not support request-level passthrough, remove it from the candidate pool and mark it in the report as "not passthrough-capable -> skipped."

### 2.4 Known CLI Pitfalls (Must Be Avoided First)

These are empirically observed blockers and should be written into `cli-capabilities.json` or the report:

- The actual parameter for `vs app get` is `--id <app_id>`, not `--application-id`.
- `vs search dictionary list` does not exist in some installed CLI versions; it must not be treated as a blocking step. If it does not exist, mark dictionary/synonym binding as unavailable.
- `vs search run --data` is a **full request override**, not a merge patch. The payload must contain at least:
  ```json
  {"query":{"text":"<query>"},"page_size":10,"page_number":1}
  ```
- It is still recommended to pass `--dataset-id <dataset_id>` to the CLI. If the server requires it, `dataset_id` may also be included in the payload.
- Verified usable filter DSL:
  ```json
  {"op":"must","field":"gender","conds":["女子"]}
  ```
  ```json
  {
    "op":"and",
    "conds":[
      {"op":"must","field":"gender","conds":["女子"]},
      {"op":"must","field":"reverse","conds":["服装"]}
    ]
  }
  ```
- If running `vs ...` directly can read the keychain, but invoking `vs` inside a Node/shell script produces `Missing Viking auth` or `fetch failed`, do not bypass it with lower-level APIs. Instead:
  - execute the literal `vs search run ...` command directly;
  - or, if the user has already provided AK/SK, pass `--ak/--sk` / env explicitly;
  - or request elevated permission for the exact script command.
- Some OpenAI-compatible models do not support `response_format: {"type":"json_object"}`. The LLM judge should use a prompt that says "output JSON only" and parse JSON from the model text with fault tolerance.

## 3. Library of 8 Intervention Methods (Each Method Is Independent)

Field names must be based on the user's actual application schema, CLI help, and live service probes. Do not invent fields that lack a request-level passthrough entrypoint.

### 3.1 Key Recall Guarantee

Build an independent recall channel for specific items such as new products, high-engagement items, or promotional items, ensuring they are not missed because of insufficient relevance. The relevant item field must first be checked as "used for filtering / category statistics."

- Example: a new SKU "spring linen dress" launches; when searching "dress", force this SKU into the results.
- Applicable when: the expected result is not recalled at all; new product / cold-start support.
- Request-level passthrough requirement: the corresponding request payload field must be verified on the server; otherwise skip.

### 3.2 Personalization

Under the premise of maintaining relevance, adjust recall and ranking by user-interest tags such as category and brand dimensions based on behavior data.

- Only include as a candidate when the case carries a real `user_id`.
- If there is no real user_id, skip it and mark this in the report.

### 3.3 Hotness Boost

On top of relevance, rerank items by hotness score. More clicks, add-to-cart actions, purchases, comments, favorites, and shares mean higher scores.

- Applicable when: popular items are buried or hotness is not reflected.
- You must probe whether there is a request-level hotness/rerank-with-hot entrypoint. Merely having config inside a scene does not mean it can be passed through in a request.

### 3.4 Boosting / Burying

Products that match a rule are ranked higher or lower accordingly. If the same product matches multiple rules, the weights are accumulated.

- Applicable when: recall is correct but ranking is low; undesired results occupy the top positions.
- You must prove through a probe that the request-level boost/bury payload is accepted by the server and changes TopN. If it is ignored, mark "request field ignored -> skipped."

### 3.5 Field-Based Sorting Rules

For results with similar relevance, sort by a specified field value in ascending or descending order. Multiple conditions are applied from top to bottom.

- Applicable when: fields such as newness, popularity, or off-shelf status can be sorted and the user's goal is clear.
- Include as a candidate only when the field exists, its type is suitable for sorting, and it supports request-level sort passthrough.

### 3.6 Search Diversity

Reduce the probability that similar items cluster together. When there are multiple rules, priority decreases from top to bottom.

- Applicable when: Top N is homogeneous, or one brand/SKU/series dominates the screen.
- You must verify that diversity/shuffle rules can be passed through at request level.

### 3.7 Recall-Result Reranking

Move results that semantically match the retrieval intent more closely to higher positions. This is suitable for natural-language queries and rich-text items.

- You must verify that request-level rerank configuration can be passed through.
- If there is no real rerank entrypoint, do not claim reranking is enabled. You may only rewrite `query.text` as an "approximate intent expansion" candidate.

### 3.8 Synonyms

Unify search terms with different expressions but the same meaning so content is not missed because of different wording.

- Generate real synonym candidates only when `cli-capabilities.json` confirms that a request-level `synonym_overrides` entrypoint exists.
- Otherwise, use only `query.text` rewriting for approximate validation, and mark in the report that this is "not a real synonym effect."
- Do not write or bind dictionaries.

## 4. Failure Mode -> Candidate Method Mapping (Independent Lookup Table)

The Agent automatically labels failure modes based on baseline Top N, then maps them to candidate methods according to the table below. All candidates must first be filtered through `cli-capabilities.json`.

| Failure Mode | Candidate Methods (Limited to the 8 Categories) |
|---|---|
| Expected result is not recalled at all | Key recall guarantee |
| Recall is correct but ranking is low / wrong category occupies Top | Boosting/burying, field-based sorting rules |
| Top N is homogeneous, brand/SKU dominates | Search diversity |
| Natural-language intent is not semantically matched | Recall-result reranking; if there is no rerank entrypoint, only `query.text` rewriting approximation is allowed |
| Alias / bilingual term / abbreviation is not covered | Synonyms; if there is no request-level synonym entrypoint, only `query.text` rewriting approximation is allowed |
| Same query should produce different results for different users | Personalization (requires user_id) |
| Popular/new products are buried, hotness is not reflected | Hotness boost, field-based sorting rules |
| User asks to show more of a product type | Prefer boosting/reranking/synonym approximation; do not default to hard filter |
| User asks to exclude a product type / protect no-result cases | `filter` may be used as an optional guard, but it must be marked as not belonging to the 8 primary methods |

## 5. Evaluation Module (Two Decoupled Modes)

### Mode A: User-Provided Queries

For each query, output a set of before/after effect differences:

- Titles / categories / key fields for each Top10 from baseline and candidate.
- `target_hit@10`, `bad_hit@10`, `first_target_rank`, `field_match@10` (before / after).
- `result_count_delta`.

Run method:

```bash
# baseline
vs search run --application-id <id> --scene-id <baseline> --dataset-id <ds> \
  --query "<q>" --page-size 10 --json --output <session>/baseline-<case>.json

# candidate: --data is a full request override, so the payload must contain query/page_size/page_number
vs search run --application-id <id> --scene-id <baseline> --dataset-id <ds> \
  --query "<q>" --page-size 10 --data '<requestPayload>' --json \
  --output <session>/candidate-<case>-<cand>.json
```

Produce `strategy-effect-matrix.json`, recording the fields above for each query x candidate. For out-of-stock / unsellable queries, candidate Top10 may be 0; focus on whether `bad_hit@10` drops from >0 to 0.

### Mode B: User Specifies Only a Policy Direction (No Specific Queries)

The Agent creates 50 dataset-related queries for evaluation and reports NDCG@10 and NDCG@20. Do not directly use the current `vs search tune run` for candidate strategy evaluation unless it explicitly supports request-level candidate payloads and does not tune the forbidden primary recall parameters.

Standard procedure:

1. Generate 50 synthetic queries and save them to `<session>/synthetic-queries.jsonl`.
2. Queries must match the dataset categories / brands / user goals, and cover layered groups:
   - broad trigger terms, such as "women's apparel" and "women's clothing";
   - policy-direction terms, such as "women's summer apparel" and "women's summer clothing";
   - explicit target terms, such as "women's dress" and "summer dress";
   - narrow anti-overtrigger terms, such as "women's jacket" and "women's short-sleeve shirt", used to verify that the policy does not over-hijack results.
3. Use `vs search run --data` to run equivalent TopK for baseline and each candidate.
4. For each query, take the union of baseline/candidate TopK and use the same LLM rubric to create silver labels.
5. Based on the same batch of labels, compute each strategy's NDCG@10, NDCG@20, silver-label failure rate, and business counts such as target category@10, 0-score@10, and result count changes.

Do not pretend rule hit rate is NDCG. Rule hit rate may be reported additionally, but it must be distinguished from NDCG.

## 6. Standard Workflow (Concise)

### Step 1 - Lock the Baseline Scene

Priority: user explicitly specified > current online default scene. Keep it read-only throughout. Do not derive a working scene.

Must record:

- application id
- dataset id
- baseline scene id
- baseline scene `UpdatedAt`

### Step 2 - Capability Investigation

Run in parallel and produce `.viking/search-case-tuning/<session>/cli-capabilities.json`:

```bash
vs auth status --json
vs llm status --json
vs search tune llm-check --live --json
vs app status --application-id <id> --json
vs app get --id <id> --json
vs app dataset-config get --application-id <id> --dataset-id <ds> --json
vs app online-config get --application-id <id> --json
vs search scene list --application-id <id> --json
vs search scene get --application-id <id> --scene-id <baseline> --json
vs search run --help
vs search tune run --help
```

Optionally run:

```bash
vs search dictionary list --application-id <id> --json
```

If the optional command does not exist, record "CLI unsupported -> skipped" and do not interrupt the main flow.

The capability matrix must record at least:

- `search_run_raw_data`
- `search_run_raw_data_semantics = full_request_override`
- required payload fields: `query.text/page_size/page_number`
- dataset/schema/filter/index/image fields
- whether boost/rerank/sort/hotness/diversity/synonym/persona support request-level passthrough
- whether the probe actually changes TopN; being accepted alone does not count as taking effect
- whether the LLM judge is available

### Step 3 - Query Preparation

- Mode A: save the user's real bad cases to `queries.jsonl`. Probe queries do not enter the official set and do not count toward metrics.
- Mode B: the Agent synthesizes 50 queries and saves them to `synthetic-queries.jsonl`. Broad terms, direction terms, target terms, and anti-overtrigger terms must all be covered.

### Step 4 - Baseline and Failure-Mode Inference (Mode A)

Run baseline Top10 for each query. The Agent automatically infers failure modes from Top N titles / categories / brands / field distributions.

For queries suspected of alias issues, out-of-stock cases, competitor cases, or wrong object types, derive a small number of probe queries for diagnosis. Probes do not enter the official set and do not count toward metrics. Conclusions must be disclosed in the report.

### Step 5 - Assemble Candidates

Generate 2-5 independent candidates for each query or each policy direction, capped by `candidate-budget` with default 5.

Each candidate must be saved independently and include:

- `id`
- `queryText`
- `candidateId`
- `failureMode`
- `method`
- `requestPayload`
- `effectGoal`
- `risk`
- `reversibility`

Candidates must not be stacked with each other. For methods without a passthrough entrypoint, mark "not passthrough-capable -> skipped." If `user_id` is missing, skip personalization.

For goals like "show more" or "increase exposure", first generate low-risk soft candidates:

```json
{
  "query": {
    "text": "<original query> 夏季 连衣裙 裙装 无袖 吊带 背带 清爽 透气"
  },
  "page_size": 20,
  "page_number": 1
}
```

This candidate belongs to "query.text rewriting as approximate synonym / intent expansion." It is not a persistent synonym and is not real reranking.

Hard filter candidates are used only as optional guards or upper-bound comparisons. For example:

```json
{
  "query": {
    "text": "<original query> 夏季 连衣裙 裙装 无袖 吊带 背带 清爽 透气"
  },
  "page_size": 20,
  "page_number": 1,
  "filter": {
    "op": "and",
    "conds": [
      {"op":"must","field":"gender","conds":["女子"]},
      {"op":"must","field":"reverse","conds":["服装"]}
    ]
  }
}
```

### Step 6 - Run Evaluation

Execute equivalent baseline and candidate runs according to the corresponding mode in Section 5.

Requirements:

- Same application.
- Same baseline scene.
- Same dataset.
- Same query set.
- Same page size/topK.
- Same LLM rubric.
- Save all raw responses.

If invoking the CLI inside a script encounters authentication/network sandbox issues, handle them according to 2.4 first. Do not rewrite online configuration to bypass them.

### Step 7 - Select the Best Candidate and Report

Mode A chooses the best per query:

- Normally sellable: prioritize the largest increase in `target_hit@10`, then the largest improvement in `first_target_rank`, then the largest decrease in `bad_hit@10`; if effects are close, choose the simpler payload.
- Wrong object type: prioritize the largest increase in `field_match@10`.
- Out-of-stock / competitor / unsellable: if probes do not find a real product and baseline has obvious false recall, choose a no-result guard, with the goal of reducing `bad_hit@10` to 0.
- If results become too narrow or sellable products are harmed, mark for manual review even if `target_hit@10` improves.

Mode B selects the best candidate:

- First provide `metric_best`: sort by NDCG@10 -> NDCG@20 -> business target@10 -> 0-score@10.
- Then provide `primary_recommendation`: combine business goal, reversibility, risk, and whether it uses hard filter.
- When hard filter has the highest metrics but a soft candidate is close, primarily recommend the soft candidate and list hard filter only as `optional_guard`.

### Step 8 - Application (Do Not Land Online)

Only produce offline / request-level integration recommendations:

- `recommended-strategy.json`
- `best-per-query.jsonl`
- `candidate-params.json`
- `replay.sh`
- `report.md`

Whether to integrate into the online call chain is decided manually by the user. The online integration method is for the caller to carry the request payload, not to write a scene.

### Step 9 - Side-Effect Verification

Before finishing, read the baseline scene again:

```bash
vs search scene get --application-id <id> --scene-id <baseline> --json
```

In the report, state that the scene `UpdatedAt` / key config did not change. If external drift occurred, only describe the observed drift; do not roll it back without permission.

## 7. Report Requirements

The report must include:

- application id / dataset id / baseline scene id.
- Query source: user's real queries or 50 Agent-synthesized queries.
- Mode A or Mode B.
- Summary of `cli-capabilities.json`.
- Skipped items: methods whose passthrough is unsupported by the CLI, personalization skipped due to missing user_id, dictionary unavailable, reasons the LLM did not run, and so on.
- Candidate table: query / failure mode / recommended strategy / requestPayload / strategy type / risk / whether online launch is recommended.
- Mode A: before/after Top10 plus `target_hit@10`, `bad_hit@10`, `first_target_rank`, `field_match@10`, and `result_count_delta`.
- Mode B: baseline vs candidate NDCG@10, NDCG@20, silver-label failure rate, and business target@10.
- Explain `metric_best` and `primary_recommendation` separately.
- Conditions for using optional guards.
- Out-of-stock / competitor queries: probe evidence, reason for choosing 0-result protection, and whether manual inventory confirmation is needed.
- Side-effect verification: confirm that no scene/app/dictionary/recommend scene was modified.
- Rollback method: stop carrying the payload in requests; delete local artifacts.
- Entry points for `strategy-effect-matrix.json` or `ndcg-matrix.json` and `replay.sh`.

## 8. Hard Constraints

- Use only the 8 methods in Section 2.1 as official business intervention methods.
- Do not modify primary recall parameters.
- Use request-parameter passthrough only.
- Do not create or modify scenes, app config, dictionaries, or recommend scenes.
- Keep the baseline scene read-only.
- The only elimination axis is whether the CLI/server supports request-level passthrough.
- Number of candidates per query <= `candidate-budget` (default 5).
- Baseline and candidate must undergo equivalent complete evaluation; do not run only one side.
- Query sets can only come from user-provided real queries (Mode A) or 50 Agent-synthesized dataset-related queries (Mode B). Do not mix them.
- Enable a visual judge (`--judge-input text-image` or a custom text-image judge) only when visual relevance is the goal, ImageIndexFields is non-empty, and the user is informed.
- LLM judges and LLM suggestions are silver labels. Manual review is required before online launch.
- Do not call a strategy "optimal" or "best" before evaluation is complete.
- Do not infer the overall quality of the recall strategy from local case results.
- Do not equate hard filter's metric advantage directly with the primary solution for "show more / increase exposure" goals.
