# Data-Plane API Router

This file routes data-plane API contract questions to the correct second-level category. Data-plane APIs execute runtime data operations and online requests, and their contracts are grounded in the `aisearch-online` repository.

## Second-Level Routing

| Question or command domain | Read next |
| --- | --- |
| Write, delete, list, or get dataset items | [DataAPI](./data-api/README.md) |
| Batch import dataset data | [DataAPI](./data-api/README.md) |
| Write, delete, or list dictionary terms | [DataAPI](./data-api/README.md) |
| Search runtime, including scene-based search | [OnlineAPI](./online-api/README.md) |
| Chat search runtime | [OnlineAPI](./online-api/README.md) |
| Query completion or query recommendation runtime | [OnlineAPI](./online-api/README.md) |
| Question suggestions | [OnlineAPI](./online-api/README.md) |
| Browse index | [OnlineAPI](./online-api/README.md) |
| Recommend, rerank, or deduplicate runtime | [OnlineAPI](./online-api/README.md) |

## API Name Routing

| API name signal | Read next |
| --- | --- |
| `WriteData`, `DeleteData`, `ListItems`, `GetItem` | [DataAPI](./data-api/README.md) |
| `CreateBatchImport`, `BatchImport`, `CompleteBatchImportTask`, `GetBatchImportStatus` | [DataAPI](./data-api/README.md) |
| `WriteTerms`, `DeleteTerms`, `ListTerms` | [DataAPI](./data-api/README.md) |
| `SearchWithScene`, `StreamChatSearch`, `QueryCompletionWithScene`, `QueryRecommendationWithScene`, `QuestionSuggestions`, `BrowseIndex` | [OnlineAPI](./online-api/README.md) |
| `Recommend`, `Rerank`, `Deduplicate` | [OnlineAPI](./online-api/README.md) |
