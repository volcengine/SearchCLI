# Search Scene Natural-Language Routing

This reference is for the `vs-search` skill. Use it when a user describes a search-scene change in natural language and you need to decide which persistent SearchSceneV2 area should be updated.

This is a workflow-oriented routing guide, not a full API reference. SearchCLI search-scene writes now use V2 actions and V2 config shape:

- scene create/list/get/update/delete use `CreateSearchSceneV2`, `ListSearchScenesV2`, `GetSearchSceneV2`, `PublishSearchSceneV2`, and `DeleteSearchSceneV2`.
- request identity fields use `ApplicationId` and `SceneId`.
- scene config is `Config: SearchSceneConfigV2`.
- dataset-level search settings live under `Config.PerDatasetConfigs[]`, keyed by `DatasetId`.
- `search scene update` publishes via `PublishSearchSceneV2`; pass a partial V2 `Config` because absent child config fields are not overwritten.
- Use this file only to identify the config area. Before deciding concrete string enum values, range limits, defaulting behavior, or required sibling fields, consult `../../vs-product-qa/references/api-references/control-plane/scene/PublishSearchSceneV2.md`.

## Intent Routing

| Natural-language request or intent | Preferred action |
| --- | --- |
| retrieval mode, keyword priority, semantic priority, balanced recall, user-defined recall | Run `search scene update` and modify `Config.PerDatasetConfigs[].TextSearchConfig.Mode` |
| keyword-only recall, semantic-only recall, keyword-vs-semantic recall mix | Run `search scene update` and modify `Config.PerDatasetConfigs[].TextSearchConfig.UserDefinedRecallMode` |
| query keyword match percent, keyword match threshold, qkmp | Run `search scene update` and modify `Config.PerDatasetConfigs[].TextSearchConfig.QueryKeywordMatchPercent` |
| semantic weight, keyword weight, dense/text weight | Run `search scene update` and modify `Config.PerDatasetConfigs[].TextSearchConfig.DenseWeight` / `TextWeight` |
| image-search preset, image-search strategy, image instruction type | Run `search scene update` and modify `Config.PerDatasetConfigs[].ImageSearchConfig.InstructionType` |
| custom image-search prompt, custom image instruction | Run `search scene update` and modify `Config.PerDatasetConfigs[].ImageSearchConfig.ImageInstruction` |
| enable image recall, disable image recall | Run `search scene update` and modify `Config.PerDatasetConfigs[].ImageSearchConfig.Enable` |
| image relevance cutoff, image similarity cutoff, truncate low-relevance image results, 图片相关性截断, 图片低相关性结果截断 | Run `search scene update` and modify `Config.PerDatasetConfigs[].RelevanceCutoffConfig`; use `Rules[].ScoreType=image_semantic` for image relevance |
| recall count, recall upper bound, returned items upper bound | Run `search scene update` and modify `Config.PerDatasetConfigs[].MaxRecallNum` |
| filter item scope, restrict search scope, search only within some items | Run `search scene update` and modify `Config.PerDatasetConfigs[].FilterConfig.Config`; optionally set `Config.PerDatasetConfigs[].FilterConfig.Name` |
| protected recall channel, guaranteed recall source, auxiliary recall pool | Run `search scene update` and modify `Config.PerDatasetConfigs[].AuxiliaryPoolsConfig.Pools[]` |
| strong personalization, strong personalized recall, 强个性化, 强个性化干预 | Run `search scene update` and modify `Config.PerDatasetConfigs[].PersonalizedRecallConfig`; set `Enable=true` and `Mode="strong"`; preserve existing `UserInterest[]` unless the user asks to change it |
| weak personalization, weak personalized recall, 弱个性化, 弱个性化干预 | Run `search scene update` and modify `Config.PerDatasetConfigs[].PersonalizedRecallConfig`; set `Enable=true` and `Mode="weak"`; preserve existing `UserInterest[]` unless the user asks to change it |
| personalized recall, personalization on/off, user-interest recall | Run `search scene update` and modify `Config.PerDatasetConfigs[].PersonalizedRecallConfig`; for concrete mode values and validation details, consult the `PublishSearchSceneV2` API reference before writing the payload |
| hotness participates in ranking, rank with hotness | Run `search scene update` and modify `Config.PerDatasetConfigs[].EnableRerankWithHot` |
| enable rerank, disable rerank | Run `search scene update` and modify `Config.PerDatasetConfigs[].RerankConfig.Enable` |
| rerank topK, rerank count, rerank only top N | Run `search scene update` and modify `Config.PerDatasetConfigs[].RerankConfig.RerankTopK` |
| rerank model | Run `search scene update` and modify `Config.PerDatasetConfigs[].RerankConfig.RerankModel` |
| rerank prompt, rerank instruction, rerank item feature | Run `search scene update` and modify `Config.PerDatasetConfigs[].RerankConfig.RerankDoubaoConfig` |
| boost, bury, promote, suppress, weight up, weight down | Run `search scene update` and modify `Config.PerDatasetConfigs[].BoostBuryCondConfig.Rules[]` |
| sort by field, field-based ranking | Run `search scene update` and modify `Config.PerDatasetConfigs[].SortRulesConfig.Rules[]` |
| diversify results, avoid too many similar items, shuffle results | Run `search scene update` and modify `Config.PerDatasetConfigs[].ShuffleConfig.Rules[]` |
| synonyms, equivalent words, alternate query words, 同义词 | If the request involves binding/uploading/importing a synonym dictionary, use the Dictionary Binding Workflow below; otherwise run `search scene update` and modify `Config.PerDatasetConfigs[].SynonymConfig.DictIds` |
| guess-you-want-to-search, suggested queries, search suggestions, 猜你想搜 | If the request involves binding/uploading/importing a suggestion dictionary, use the Dictionary Binding Workflow below; otherwise run `search scene update` and modify `Config.WantToSearchConfig` |
| query completion, autocomplete, typeahead, 搜索补全 | If the request involves binding/uploading/importing a completion dictionary, use the Dictionary Binding Workflow below; otherwise run `search scene update` and modify `Config.QueryCompletionConfig` |
| search-term correction, spell correction, typo correction, 搜索词纠错 | If the request involves binding/uploading/importing a correction-exemption dictionary, use the Dictionary Binding Workflow below; otherwise run `search scene update` and modify `Config.PerDatasetConfigs[].CorrectionConfig` |
| search result facet stats, facet aggregation, 搜索结果分类统计 | Run `search scene update` and modify `Config.PerDatasetConfigs[].FacetConfig` |
| trigger summary, search overview, 触发摘要 | Run `search scene update` and modify `Config.OverviewConfig` |
| fine-grained operations, query-specific search rules, specific-query rules, 指定搜索词的搜索规则, 精细化运营 | Use the dedicated ServingControls Workflow below instead of treating this as a direct inline scene-field edit |

## ServingControls Workflow

If the target is `ServingControlConfig.ServingControls[]`, use this workflow:

1. First configure `QueryCondition` for the serving-control rule, because serving controls are conditional overrides rather than plain inline config blocks.
2. Then inspect the user's requested override area and map it back to the matching intent in the Intent Routing table above.
3. If that matched intent already has a dedicated workflow, reuse that workflow, but write the final config under `Config.PerDatasetConfigs[].ServingControlConfig.ServingControls[]` instead of the top-level dataset config path.
4. If that matched intent is a direct inline config edit, keep the same V2 field semantics as the top-level config area, but change the final write target to the corresponding nested field under `ServingControls[]`.

Common V2 serving-control override fields:

| Top-level dataset config | Serving-control override field |
| --- | --- |
| `TextSearchConfig` | `ServingControls[].TextSearchConfig` |
| `AuxiliaryPoolsConfig` | `ServingControls[].AuxiliaryPoolsConfig` |
| `SortRulesConfig` | `ServingControls[].SortRulesConfig` |
| `ShuffleConfig` | `ServingControls[].ShuffleConfig` |
| `FilterConfig` | `ServingControls[].FilterConfig` |
| `BoostBuryCondConfig` | `ServingControls[].BoostBuryCondConfig` |
| `RelevanceCutoffConfig` | `ServingControls[].RelevanceCutoffConfig` |

## Dictionary Binding Workflow

If the request involves associating/uploading/importing/binding a dictionary for synonyms, query recommendation, query completion, or search-term correction, use this workflow.

First, determine the dictionary `Type` from the target config area:

| Target config area | Dict Type | Scene config field |
| --- | --- | --- |
| SynonymConfig (同义词) | `bidirection_synonyms` or `unidirection_synonyms` | `Config.PerDatasetConfigs[].SynonymConfig.DictIds` |
| WantToSearchConfig (猜你想搜) | `query_recommendation` | `Config.WantToSearchConfig.DictIds` |
| QueryCompletionConfig (搜索补全) | `query_completion` | `Config.QueryCompletionConfig.DictIds` |
| CorrectionConfig (搜索词纠错) | `query_correction_exemption` | `Config.PerDatasetConfigs[].CorrectionConfig.DictIds` |

Then branch based on whether the user provides a CSV/term file or an existing `DictId`:

Path A - user provides a CSV/term file:

1. Run `dict create --name <name> --type <type>` and capture the returned `DictId`.
2. Run `dict get --dict-id <id>` to confirm creation.
3. Run `dict write-terms --dict-id <id> --file <file-path>` to import dictionary terms.
4. Run `dict bind-scenes --dict-id <id> --scenes @scenes.json` to bind the dictionary to target application scenes. For synonyms and correction dictionaries, include `DatasetId` in each scene entry (`{"AppId":"...","SceneId":"...","DatasetId":"..."}`).
5. Run `search scene update` and write the dictionary ID into the matching V2 `DictIds` field above.

Path B - user provides an existing `DictId`:

1. Run `dict bind-scenes --dict-id <id> --scenes @scenes.json`.
2. Run `search scene update` and write the dictionary ID into the matching V2 `DictIds` field above.

## Usage Note

Use this file as a routing layer only. For command execution:

1. identify the target action here,
2. consult `vs-product-qa`, `vs search scene update --help`, and `../../vs-product-qa/references/api-references/control-plane/scene/PublishSearchSceneV2.md` for enum-like strings and validation constraints,
3. run the concrete command workflow,
4. read the scene back after mutation.

Field name case sensitivity: for any config area that references dataset field names (e.g. `ShuffleConfig.Rules[].FieldName`, `ShuffleExpr.field`, `BoostBuryCondConfig.Rules[].Config.field`, `FilterConfig.Config.field`, `AuxiliaryPoolsConfig.Pools[].Filter.field`), field names are case-sensitive. Before writing a field name into config, first look up the exact field name from the dataset schema via `dataset get --id <dataset-id> --full` or `app dataset-config get --application-id <id> --dataset-id <id> --full`.
