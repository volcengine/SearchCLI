# Search Scene Natural-Language Routing

This reference is for the `vs-search` skill. Use it when a user describes a search-scene change in natural language and you need to decide which persistent search-scene area should be updated.

This is a workflow-oriented routing guide, not an API reference. Exact payload structure, field constraints, and allowed values must still be checked against `vs-product-qa` and the copied API references before executing a concrete command.

## Intent Routing

| Natural-language request or intent | Preferred action |
| --- | --- |
| retrieval mode, keyword priority, semantic priority, balanced recall, user-defined recall | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].Mode` |
| keyword-only recall, semantic-only recall, keyword-vs-semantic recall mix | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].UserDefinedRecallMode` |
| image-search preset, image-search strategy, image instruction type | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].QueryConfig.InstructionType` |
| custom image-search prompt, custom image instruction | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].QueryConfig.ImageInstruction` |
| enable image recall, disable image recall | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].EnableImage` |
| recall count, recall upper bound, returned items upper bound | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].MaxRecallNum` |
| filter item scope, restrict search scope, search only within some items | Use the dedicated FilterConfig workflow below instead of treating this as a direct inline scene-field edit |
| protected recall channel, guaranteed recall source, auxiliary recall pool | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[]` |
| personalized recall, personalization on/off, user-interest recall | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall` |
| hotness participates in ranking, rank with hotness | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].EnableRerankWithHot` |
| enable rerank, disable rerank | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].RerankEnabled` |
| rerank topK, rerank count, rerank only top N | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].RerankTopK` |
| rerank model | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].RerankModel` |
| rerank prompt, rerank instruction, rerank item feature | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig` |
| boost, bury, promote, suppress, weight up, weight down | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].BoostBuryCondConfig.Rules[]` |
| sort by field, field-based ranking | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].SortRules[]` |
| diversify results, avoid too many similar items, shuffle results | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[]` |
| synonyms, equivalent words, alternate query words, 同义词 | If the request involves binding/uploading/importing a synonym dictionary, use the Dictionary Binding Workflow below; otherwise run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].SynonymConfig` |
| guess-you-want-to-search, suggested queries, search suggestions, 猜你想搜 | If the request involves binding/uploading/importing a suggestion dictionary, use the Dictionary Binding Workflow below; otherwise run `search scene update` and modify `Config.WantToSearchConfig` |
| query completion, autocomplete, typeahead, 搜索补全 | If the request involves binding/uploading/importing a completion dictionary, use the Dictionary Binding Workflow below; otherwise run `search scene update` and modify `Config.QueryCompletionConfig` |
| search-term correction, spell correction, typo correction, 搜索词纠错 | If the request involves binding/uploading/importing a correction-exemption dictionary, use the Dictionary Binding Workflow below; otherwise run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].CorrectionConfig` |
| search result facet stats, facet aggregation, 搜索结果分类统计 | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].FacetConfig` |
| trigger summary, search overview, 触发摘要 | Run `search scene update` and modify `Config.OverviewConfig` |
| fine-grained operations, query-specific search rules, specific-query rules, 指定搜索词的搜索规则, 精细化运营 | Use the dedicated ServingControls Workflow below instead of treating this as a direct inline scene-field edit |

## ServingControls Workflow

If the target is `ServingControls[]`, use this workflow:

1. First configure `QueryCondition` for the serving-control rule, because `ServingControls[]` is a conditional override workflow rather than a plain inline config block.
2. Then inspect the user's requested override area and map it back to the matching intent in the **Intent Routing** table above.
3. If that matched intent already has a dedicated workflow, reuse that workflow, but write the final config under `Config.SearchConfig.RetrieveConfigs[].ServingControls[]` instead of the top-level retrieve-config path.
4. If that matched intent is a direct inline config edit, keep the same payload shape and field semantics as the top-level config area, but change the final write target to the corresponding nested field under `ServingControls[]`.

Interpretation:

- `ServingControls[]` should be handled as “configure trigger condition first, then apply an override”, not as a flat bag of unrelated fields.
- Nested fields inside `ServingControls[]` do not define a new config language; they reuse the same config meaning and workflow as the corresponding top-level areas, with only the final write path changed.

## FilterConfig Workflow

If the target is FilterConfig, use this workflow:

1. Run `recommend rule upsert` with `--type search_filter`, save the filter configuration as a separate rule resource, and capture the returned `RuleID` from the response.
2. Run `recommend rule get --rule-id <id>` to fetch that rule again and verify that the stored `Config` is correct.
3. If the rule was written correctly, run `search scene update` and write both `RuleID` and `Config` into the corresponding scene `FilterConfig` object:
   - `Config.SearchConfig.RetrieveConfigs[].FilterConfig.RuleID` — the rule reference ID
   - `Config.SearchConfig.RetrieveConfigs[].FilterConfig.Config` — the full filter rule body (same structure as the rule's `Config` field returned by the rule-get API/command)
   - Also applies to `Config.SearchConfig.RetrieveConfigs[].ServingControls[].FilterConfig` when the target is a serving-control override

Interpretation:

- FilterConfig is a rule-resource workflow, not just an inline scene payload edit.
- The scene stores a `RuleID` reference rather than the full filter rule body.

## Dictionary Binding Workflow

If the request involves associating/uploading/importing/binding a dictionary (词库/词典/关联词库) for synonyms, query recommendation, query completion, or search-term correction, use this workflow.

First, determine the dictionary `Type` from the target config area:

| Target config area | Dict Type |
| --- | --- |
| SynonymConfig (同义词) | `bidirection_synonyms` or `unidirection_synonyms` |
| WantToSearchConfig (猜你想搜) | `query_recommendation` |
| QueryCompletionConfig (搜索补全) | `query_completion` |
| CorrectionConfig (搜索词纠错) | `query_correction_exemption` |

Then branch based on whether the user provides a CSV/term file or an existing `DictId`:

**Path A — User provides a CSV/term file (new dictionary):**

1. Run `dict create --name <name> --type <type>` to create the dictionary resource, and capture the returned `DictId`. Select `--type` from the table above based on which config area the user is targeting.
2. Run `dict get --dict-id <id>` to confirm the dictionary was created successfully.
3. Run `dict write-terms --dict-id <id> --file <file-path>` (data plane API: `POST /api/v1/dict/{dict_id}/write_terms`) to batch write/update dictionary terms from the uploaded file. The CLI fetches the upload signature and uploads the file internally; do not call the upload-signature API as a separate user-facing step. If terms are provided as inline JSON instead of a file, use `--entries @entries.json`.
4. Run `dict bind-scenes --dict-id <id> --scenes @scenes.json` to bind the dictionary to the target application scenes. For synonyms and correction dictionaries, include `DatasetId` in each scene entry (`{"AppId":"...","SceneId":"...","DatasetId":"..."}`).

**Path B — User directly provides an existing `DictId`:**

1. Skip steps 1–4. Run `dict bind-scenes --dict-id <id> --scenes @scenes.json` directly to bind the existing dictionary to target scenes.

Interpretation:

- Dictionary binding is a multi-step resource workflow: create dict → verify → `dict write-terms --file ...` (internal signature + upload) → bind to scenes.
- Do not reduce this to a single inline `search scene update` payload edit when the user mentions uploading a file, creating a dictionary, importing a word list, or associating a new dictionary.
- When the user only wants to toggle a feature on/off or adjust numeric parameters (e.g. suggestion count, min prefix length, correction mode) without touching the dictionary itself, use the direct `search scene update` path instead.

## Usage Note

Use this file as a routing layer only. For command execution:

1. identify the target action here,
2. consult `vs-product-qa`,
3. run the concrete command workflow,
4. read the scene back after mutation.

**Field name case sensitivity**: For any config area that references dataset field names (e.g. `ShuffleConfig.Rules[].FieldName`, `ShuffleExpr.field`, `BoostBuryCondConfig.Rules[].Config.field`, `FilterConfig.Config.field`, `AuxiliaryPools[].Filter.field`), field names are **case-sensitive**. Never infer casing from the user's natural-language description. Before writing a field name into config, first look up the exact field name from the dataset schema via `dataset get --id <dataset-id> --full` or `app dataset-config get --application-id <id> --dataset-id <id> --full`, and copy it exactly as it appears. If the field name doesn't match any schema field, stop and ask the user to confirm instead of guessing.
