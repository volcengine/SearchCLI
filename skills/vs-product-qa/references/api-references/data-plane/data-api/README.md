# Data-Plane DataAPI Router

This file is the final-level router for data-plane item, batch import, and dictionary term API contracts. Dataset, application, scene, and dictionary management APIs are control-plane APIs.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Write or update dataset data, `vs data write`, `vs dataset ingest --dataset-id --fields` | [WriteData](./WriteData.md) |
| Delete dataset data | [DeleteData](./DeleteData.md) |
| Create batch import task | [CreateBatchImport](./CreateBatchImport.md) |
| Upload batch import data segment | [BatchImport](./BatchImport.md) |
| Complete batch import task | [CompleteBatchImportTask](./CompleteBatchImportTask.md) |
| Get batch import task status | [GetBatchImportStatus](./GetBatchImportStatus.md) |
| Write or update dictionary terms, `vs dict write-terms` | [WriteTerms](./WriteTerms.md) |
| Delete dictionary terms | [DeleteTerms](./DeleteTerms.md) |
| List dataset items | [ListItems](./ListItems.md) |
| Get one dataset item | [GetItem](./GetItem.md) |
| List dictionary terms | [ListTerms](./ListTerms.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `WriteData` | [WriteData](./WriteData.md) |
| `DeleteData` | [DeleteData](./DeleteData.md) |
| `CreateBatchImport` | [CreateBatchImport](./CreateBatchImport.md) |
| `BatchImport` | [BatchImport](./BatchImport.md) |
| `CompleteBatchImportTask` | [CompleteBatchImportTask](./CompleteBatchImportTask.md) |
| `GetBatchImportStatus` | [GetBatchImportStatus](./GetBatchImportStatus.md) |
| `WriteTerms` | [WriteTerms](./WriteTerms.md) |
| `DeleteTerms` | [DeleteTerms](./DeleteTerms.md) |
| `ListItems` | [ListItems](./ListItems.md) |
| `GetItem` | [GetItem](./GetItem.md) |
| `ListTerms` | [ListTerms](./ListTerms.md) |
