# Control-Plane Dataset API Router

This file is the final-level router for Dataset control-plane API contracts. Use the actual SearchCLI action name: create uses `CreateDatasetV2`; list/get/update/delete currently use non-V2 dataset actions.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Create a dataset, `vs dataset create` | [CreateDatasetV2](./CreateDatasetV2.md) |
| Validate dataset schema, `vs dataset schema check`, item apply schema precheck | [CheckDatasetSchema](./CheckDatasetSchema.md) |
| List datasets, `vs dataset list` | [ListDatasets](./ListDatasets.md) |
| Get dataset detail, `vs dataset get` | [GetDataset](./GetDataset.md) |
| Delete a dataset, `vs dataset delete` | [DeleteDataset](./DeleteDataset.md) |
| Update dataset schema or description, `vs dataset update` | [UpdateDataset](./UpdateDataset.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `CreateDatasetV2` | [CreateDatasetV2](./CreateDatasetV2.md) |
| `CheckDatasetSchema` | [CheckDatasetSchema](./CheckDatasetSchema.md) |
| `ListDatasets` | [ListDatasets](./ListDatasets.md) |
| `GetDataset` | [GetDataset](./GetDataset.md) |
| `DeleteDataset` | [DeleteDataset](./DeleteDataset.md) |
| `UpdateDataset` | [UpdateDataset](./UpdateDataset.md) |
