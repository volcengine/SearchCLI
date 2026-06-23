---
name: vs-search
description: "Search runtime and scene management: verify queries, inspect scenes, debug app readiness, and diagnose recall or scene-config issues."
category: search
applies_to: codex, agents, external-agent
requires_cli: ">=0.1.0"
keywords: search debug, search run, query run, search scene, search diagnosis, recall issue, online strategy, boost bury, rerank, synonym, diversity
commands: search run, search scene create, search scene list, search scene get, search scene update, app status, app diagnose
---

# Viking Search

## When to Use

Use this skill for:

- search query verification
- search scene inspection and updates
- online result checks
- recall or ranking issue diagnosis
- separating persistent scene config from request-only runtime parameters

If the user wants automated batch evaluation or similarity tuning across many queries and strategies, use `vs-search-tuning` instead.

## Preconditions

- an `application-id` is available
- if you will edit a scene, you should preferably know the `scene-id`
- for fresh apps, be prepared for the runtime not to be ready yet
- the agent should treat the installed CLI behavior as authoritative when help text, skill text, and runtime behavior disagree

## Config Domains

Before changing anything, choose the correct config domain. This is the main failure mode for agent-driven search changes.

- Use `search scene update` for persistent search strategy changes under `Config.SearchConfig`, `Config.QueryCompletionConfig`, `Config.WantToSearchConfig`, or `Config.OverviewConfig`.
- Use `search run` for temporary verification and request-level runtime parameters.
- Do not use `app online-config update` for search recall, ranking, rerank, synonym, diversity, boost/bury, or query-conditioned operating rules. That command is for app-level config such as `ChatConfig` and scene binding, not the search strategy itself.

## Commands

- `search run`: send a production-style search request
- `search scene create` / `search scene list` / `search scene get`: manage search scenes
- `search scene update`: update scene configuration
- `app status` / `app diagnose`: inspect readiness before blaming the query

## Natural-Language Mapping

When the user describes a search rule in natural language, use the phrases below as routing hints for which persisted config field should be inspected or changed first.

| User language or intent | Preferred config target |
| --- | --- |
| retrieval mode, keyword priority, semantic priority, balanced recall, user-defined recall | `Config.SearchConfig.RetrieveConfigs[].Mode` |
| keyword-only recall, semantic-only recall, keyword-vs-semantic recall mix | `Config.SearchConfig.RetrieveConfigs[].UserDefinedRecallMode` |
| image-search preset, image search strategy, image instruction | `Config.SearchConfig.RetrieveConfigs[].QueryConfig.InstructionType` |
| custom image-search instruction, custom image prompt | `Config.SearchConfig.RetrieveConfigs[].QueryConfig.ImageInstruction` |
| enable image retrieval, image search on/off | `Config.SearchConfig.RetrieveConfigs[].EnableImage` |
| recall count, recall upper bound, returned items upper bound | `Config.SearchConfig.RetrieveConfigs[].MaxRecallNum` |
| filter scope, restrict search scope, only search within some items | `Config.SearchConfig.RetrieveConfigs[].FilterConfig` |
| key recall protection, protected recall channel, guaranteed recall source | `Config.SearchConfig.RetrieveConfigs[].AuxiliaryPools[]` |
| personalized recall, personalization on/off, user interest recall | `Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall` |
| hotness participates in ranking, rank with hotness | `Config.SearchConfig.RetrieveConfigs[].EnableRerankWithHot` |
| rerank enabled, enable rerank | `Config.SearchConfig.RetrieveConfigs[].RerankEnabled` |
| rerank topk, rerank count, rerank only top N | `Config.SearchConfig.RetrieveConfigs[].RerankTopK` |
| rerank model | `Config.SearchConfig.RetrieveConfigs[].RerankModel` |
| rerank prompt, rerank instruction, item feature for rerank | `Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig` |
| boost, bury, promote, suppress, weight up, weight down | `Config.SearchConfig.RetrieveConfigs[].BoostBuryConfig.Rules[]` |
| sort by field, rank by field, field-based sort | `Config.SearchConfig.RetrieveConfigs[].SortRules[]` |
| search diversity, diversify results, avoid too many similar items | `Config.SearchConfig.RetrieveConfigs[].ShuffleConfig.Rules[]` |
| synonyms, equivalent words, alternate query words | `Config.SearchConfig.RetrieveConfigs[].Synonyms[]` |

For query-conditioned requests such as “for query X, do Y”, start from:

- `Config.SearchConfig.RetrieveConfigs[].ServingControls[]`

Inside each `ServingControls[]` rule, map the action to the smallest matching block:

- filtering or restricting item scope -> `FilterConfig`
- adjusting recall strategy or recall mix -> `RecallWeight`
- protecting a recall source or auxiliary channel -> `AuxiliaryPools`
- changing ranking order -> `SortRules`
- increasing diversity -> `ShuffleConfig`
- conditional boost / bury -> `BoostBuryCondConfig`

## Request-Level vs Persistent

Some controls belong to the runtime request, not the persisted scene config.

- Use `search run` when validating request-only parameters such as runtime `filter`, `disable_personalize`, or other per-request search inputs.
- Do not assume every runtime behavior has a persisted `search scene update` equivalent.
- If the packaged CLI, `--help`, and observed behavior do not expose a stable persistent field for the requested change, stop and ask the user instead of inventing a mapping.

## Workflow

1. Start by determining whether the user wants:
   - a persistent search strategy change
   - a temporary runtime verification
   - an app-level chat or scene-binding change
2. If the request is a persistent search strategy change, use `search scene list/get` first and inspect the current scene before mutating it.
3. Classify the requested rule into the correct bucket before writing any JSON:
   - global search strategy
   - query-conditioned business rule
   - request-only runtime control
   - app-level online-config
4. When using `search scene update`, prefer the narrowest valid input:
   - use `--search-config` when only `Config.SearchConfig` should change
   - use companion flags like `--query-completion-config`, `--want-to-search-config`, and `--overview-config` only for those sections
   - use `--config` when you already have the full `Config` object or when multiple sections must change together
   - use `--data` only when you intentionally need top-level payload control
5. For query-conditioned rules such as “for query X, do Y”, prefer `RetrieveConfigs[].ServingControls[]` over a global top-level rule.
6. For global strategy rules such as default rerank, default boost/bury, or default field sorting, prefer the top-level fields inside the target `RetrieveConfig`.
7. After every scene mutation, immediately read the scene back with `search scene get` and verify that the intended field changed online.
8. If a fresh app fails, check `app status` and then `app diagnose`.
9. Only after readiness is clear should you focus on recall quality or scene configuration.
10. If the command behavior conflicts with the skill text or `--help`, trust the installed CLI behavior first, and only then inspect repository code when needed to explain or fix the gap.

## Enums and Allowed Values

Use this section when updating fields under `Config.SearchConfig.RetrieveConfigs[]`.

### Enum Reference by Field

Use this reference when you need a stricter mapping from natural-language intent to a concrete enum field.

The same `Mode` and `UserDefinedRecallMode` mapping also applies to `ServingControls[].RecallWeight` when that block contains those fields.

#### `Config.SearchConfig.RetrieveConfigs[].Mode`

Definition: top-level text recall strategy mode for a retrieve config.  
Value range: integer enum, allowed values are `1 | 2 | 3 | 4`.

| Value | Name | Meaning | Typical use |
| --- | --- | --- | --- |
| `1` | `Balanced` | Balance keyword recall and semantic recall. | Use when the user wants a neutral default search mode. |
| `2` | `SemanticPriority` | Give semantic recall higher priority than keyword recall. | Use when the user asks for semantic-first retrieval or stronger semantic matching. |
| `3` | `KeywordPriority` | Give keyword recall higher priority than semantic recall. | Use when the user asks for keyword-first retrieval or exact-term preference. |
| `4` | `UserDefined` | Use an explicitly configured custom recall path. | Use when the user wants manual control over recall composition. |

When `Mode = UserDefined (4)`, also set `UserDefinedRecallMode` in the same retrieve config.  
The same mapping also applies to `ServingControls[].RecallWeight.Mode` when that block is present.

#### `Config.SearchConfig.RetrieveConfigs[].UserDefinedRecallMode`

Definition: custom recall-path selector used only when `Mode = UserDefined`.  
Value range: integer enum, allowed values are `0 | 1 | 2`.

| Value | Name | Meaning | Typical use |
| --- | --- | --- | --- |
| `0` | `KeywordSemantic` | Combine keyword recall and semantic recall. | Use for mixed custom recall. |
| `1` | `KeywordOnly` | Use only keyword recall. | Use when the user wants exact-term recall only. |
| `2` | `SemanticOnly` | Use only semantic recall. | Use when the user wants vector or semantic recall only. |

The same mapping also applies to `ServingControls[].RecallWeight.UserDefinedRecallMode` when that block is present.

#### `Config.SearchConfig.RetrieveConfigs[].QueryConfig.InstructionType`

Definition: image-search instruction preset selector.  
Value range: string enum, allowed values are `"preset_image" | "preset_item" | "custom"`.

| Value | Meaning | Typical use |
| --- | --- | --- |
| `"preset_image"` | Use the built-in image-similarity retrieval preset. | Use for requests such as “根据图片相似性检索”. |
| `"preset_item"` | Use the built-in item-similarity or same-item retrieval preset. | Use for requests such as “根据物品相似性检索” or “查同款商品”. |
| `"custom"` | Use a user-provided image instruction instead of a built-in preset. | Use only when the user explicitly wants a custom image-search prompt. |

If `InstructionType = "custom"`, `QueryConfig.ImageInstruction` MUST be non-empty.

#### `Config.SearchConfig.RetrieveConfigs[].PersonalizedRecall.Mode`

Definition: personalized recall intensity for the retrieve config.  
Value range: string enum, allowed values are `"strong" | "weak"`.

| Value | Meaning | Typical use |
| --- | --- | --- |
| `"strong"` | Apply stronger personalized intervention. | Use when the user explicitly asks for strong personalization. |
| `"weak"` | Apply weaker personalized intervention. | Use when the user wants personalization enabled but less aggressive. |

If `PersonalizedRecall.Enable = true`, set `PersonalizedRecall.Mode` explicitly instead of relying on an implicit default.

#### `Config.SearchConfig.RetrieveConfigs[].RerankModel`

Definition: rerank engine selection for the retrieve config.  
Value range: string enum, confirmed values are `"gte-rerank" | "doubao-rerank"`.

| Value | Meaning | Typical use |
| --- | --- | --- |
| `"gte-rerank"` | Use the default text-oriented rerank model. | Use for standard text rerank unless the user asks for a Doubao-based rerank path. |
| `"doubao-rerank"` | Use the Doubao rerank model. | Use when the user wants Doubao rerank or multimodal rerank behavior. |

#### `Config.SearchConfig.RetrieveConfigs[].RerankDoubaoConfig.ItemFeature`

Definition: item-feature mode for Doubao rerank.  
Value range: string enum, confirmed values are `"text" | "mixed" | "image"`.

| Value | Meaning | Typical use |
| --- | --- | --- |
| `"text"` | Use text features only. | Use for text-only rerank. |
| `"mixed"` | Use multimodal features. | Use when the user asks for “多模态” rerank. |
| `"image"` | Use image features only. | Use when rerank should focus on visual similarity. |

## Customer Environment Principle

- In customer environments, assume repository source code is unavailable.
- Execute tasks using only the installed skills, the packaged `vs` CLI surface (`--help`, command output, and observed runtime behavior), and explicit user-provided information.
- Do not rely on reading local repository source files, generated repo snapshots, or implementation details to decide runtime actions.
- If the installed CLI behavior conflicts with a skill, trust the installed CLI behavior first.
- If the skills and the packaged CLI still do not provide enough information to proceed safely, stop and ask the user instead of searching source code.

## Constraints

- When an app is bound to exactly one dataset, the CLI can infer `dataset-id`
- For fresh apps, treat readiness as the first hypothesis before blaming the query
- Prefer public `vs search ...` commands over bypassing the CLI and calling lower-level APIs directly
- Use `search scene update` for persistent search behavior and reserve `app online-config update` for app/chat config only
- Treat `精细化运营`-style query-triggered rules as `RetrieveConfigs[].ServingControls[]`, not as a flat top-level field
- Treat `重点保障召回` as recall-channel / auxiliary-pool style config, not as generic boost/bury by default
- Treat `召回结果重排` as rerank config, not as sort rules or boost/bury
- Treat `根据字段排序` as `SortRules[]`, and `搜索多样性` as `ShuffleConfig.Rules[]`
- Do not assume `--help`, skill text, and the installed command implementation are perfectly aligned; verify the actual command behavior before making high-risk scene changes
- For scene updates, prefer a small scoped payload and a readback check over writing a hand-crafted full config unless a full config update is actually required
- If a scene update unexpectedly fails or appears to no-op, verify the accepted flags and payload shape before retrying with a broader config object
- If a command failure or user follow-up turns into a product concept, capability, API field, purchase, billing, or general troubleshooting question outside this search workflow, temporarily hand off to `vs-product-qa`; return to this workflow only after the grounded product answer is complete.
