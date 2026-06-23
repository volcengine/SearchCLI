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
| synonyms, equivalent words, alternate query words | Run `search scene update` and modify `Config.SearchConfig.RetrieveConfigs[].SynonymConfig.Dicts[]` |

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

## Usage Note

Use this file as a routing layer only. For command execution:

1. identify the target action here,
2. consult `vs-product-qa`,
3. run the concrete command workflow,
4. read the scene back after mutation.

**Field name case sensitivity**: For any config area that references dataset field names (e.g. `ShuffleConfig.Rules[].FieldName`, `ShuffleExpr.field`, `BoostBuryCondConfig.Rules[].Config.field`, `FilterConfig.Config.field`, `AuxiliaryPools[].Filter.field`), field names are **case-sensitive**. Never infer casing from the user's natural-language description. Before writing a field name into config, first look up the exact field name from the dataset schema via `dataset get --id <dataset-id> --full` or `app dataset-config get --application-id <id> --dataset-id <id> --full`, and copy it exactly as it appears. If the field name doesn't match any schema field, stop and ask the user to confirm instead of guessing.
