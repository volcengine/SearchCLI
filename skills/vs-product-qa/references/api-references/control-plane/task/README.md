# Control-Plane Task API Router

This file is the final-level router for dataset task control-plane API contracts.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Get presigned import URL, upload bootstrap file, `vs dataset import-url` | [GetPresignedImportUrlV2](./GetPresignedImportUrlV2.md) |
| Start schema inference task, `vs dataset infer-schema` | [AddInferDatasetSchemaTaskV2](./AddInferDatasetSchemaTaskV2.md) |
| Get schema inference result, `vs dataset infer-result` | [GetInferDatasetSchemaResultV2](./GetInferDatasetSchemaResultV2.md) |
| Create image retry task for failed dataset images | [CreateDatasetImageRetryTask](./CreateDatasetImageRetryTask.md) |
| Get image retry task status | [GetDatasetImageRetryTask](./GetDatasetImageRetryTask.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `CreateDatasetImageRetryTask` | [CreateDatasetImageRetryTask](./CreateDatasetImageRetryTask.md) |
| `GetDatasetImageRetryTask` | [GetDatasetImageRetryTask](./GetDatasetImageRetryTask.md) |
| `GetPresignedImportUrlV2` | [GetPresignedImportUrlV2](./GetPresignedImportUrlV2.md) |
| `AddInferDatasetSchemaTaskV2` | [AddInferDatasetSchemaTaskV2](./AddInferDatasetSchemaTaskV2.md) |
| `GetInferDatasetSchemaResultV2` | [GetInferDatasetSchemaResultV2](./GetInferDatasetSchemaResultV2.md) |
