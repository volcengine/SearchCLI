# API Reference Router

This file is the first-level router for Viking AI Search API contracts. Use it only to decide whether to read control-plane or data-plane references next.

When following links in this API Reference tree, resolve every relative Markdown link against the local directory that contains the current document.

## First-Level Routing Rules

1. If the question is about managing resources or configuration, read [control-plane](./control-plane/README.md).
2. If the question is about writing data, reading data, search runtime, chat runtime, or recommend runtime, read [data-plane](./data-plane/README.md).
3. If the question is about CLI flags or command existence, check the installed `vs <cmd> --help`; use this API Reference only after deciding the question needs backend API contracts.
4. If the question is about product concepts, console UI path, billing explanation, purchase, or quota policy rather than an API contract, use official product documentation instead of this tree.

## Command To First-Level Route

| User-facing command or resource | First-level route | Why |
| --- | --- | --- |
| `vs dataset create/get/list/update/delete` | [control-plane](./control-plane/README.md) | Dataset management. |
| `vs dataset import-url`, `vs dataset infer-schema`, `vs dataset infer-result` | [control-plane](./control-plane/README.md) | Dataset task and provisioning APIs. |
| `vs dataset subscription *` | [control-plane](./control-plane/README.md) | Datasource subscription management. |
| `vs app create/get/list/update/delete` | [control-plane](./control-plane/README.md) | Application management. |
| `vs app attach-dataset`, `vs app dataset-config *` | [control-plane](./control-plane/README.md) | Application-dataset configuration. |
| `vs app item-data-count` | [control-plane](./control-plane/README.md) | Usage/count API under control-plane. |
| `vs app online-config *` | [control-plane](./control-plane/README.md) | Online config management. |
| `vs search scene *` | [control-plane](./control-plane/README.md) | Search scene management. |
| `vs recommend scene *`, `vs recommend rule *` | [control-plane](./control-plane/README.md) | Recommendation scene and rule management. |
| `vs dict *` | [control-plane](./control-plane/README.md) | Dictionary management; term write/list/delete are data-plane if the question is specifically about term runtime APIs. |
| `vs data write/import` | [data-plane](./data-plane/README.md) | Dataset data write runtime. |
| `vs dataset ingest --dataset-id --fields` | [data-plane](./data-plane/README.md) | Direct dataset data write runtime. |
| `vs search run`, `vs chat run` | [data-plane](./data-plane/README.md) | Online search and chat runtime. |
| `vs recommend run` | [data-plane](./data-plane/README.md) | Online recommendation runtime. |
| `vs connector run` | [data-plane](./data-plane/README.md) | Local connector polling followed by data write runtime. |
| `vs connector export/init/status/stop/inspect` | No API Reference route | Local connector state and artifacts only. |

## API Name To First-Level Route

| API name signal | First-level route |
| --- | --- |
| Application, Dataset, SearchScene, RecommendScene, RecommendRule, Dict, DataSourceSubscription, InferDatasetSchema, PresignedImportUrl, Billing, Quota, Usage | [control-plane](./control-plane/README.md) |
| WriteData, DeleteData, ListItems, GetItem, BatchImport, WriteTerms, DeleteTerms, ListTerms | [data-plane](./data-plane/README.md) |
| SearchWithScene, StreamChatSearch, QueryCompletionWithScene, QueryRecommendationWithScene, QuestionSuggestions, BrowseIndex, Recommend, Rerank, Deduplicate | [data-plane](./data-plane/README.md) |
