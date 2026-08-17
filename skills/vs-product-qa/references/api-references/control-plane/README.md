# Control-Plane API Router

This file routes control-plane API contract questions to the correct second-level category. Control-plane APIs manage resources and configuration, and their contracts are grounded in the `console` repository.

## Second-Level Routing

| Question or command domain | Read next |
| --- | --- |
| Dataset create/list/get/update/delete, dataset schema, dataset metadata | [Dataset](./dataset/README.md) |
| Application create/list/get/update/delete, application metadata | [Application](./application/README.md) |
| Application-dataset binding, dataset config under an application | [Application](./application/README.md) |
| Search scene create/list/get/update/publish/delete | [Scene](./scene/README.md) |
| Application online config | [Scene](./scene/README.md) |
| Recommendation scene and recommendation rule management | [Scene](./scene/README.md) |
| Dictionary create/list/get/update/delete, dictionary validation, dictionary-scene binding | [Dictionary](./dict/README.md) |
| Datasource subscription or DTS sync subscription | [Ingestion](./ingestion/README.md) |
| Presigned import URL, schema inference task, image retry task | [Task](./task/README.md) |
| Billing order, quota, usage, dataset/app data count, statistics, effective item data count | [Usage](./usage/README.md) |

## API Name Routing

| API name signal | Read next |
| --- | --- |
| `*Dataset*`, except app-dataset config and data-count/statistics APIs | [Dataset](./dataset/README.md) |
| `*Application*`, `*AppDataConfig*`, `*AppDataset*`, `*PersonalizedInfo*`, `*AppItemFilter*`, `*IndexStatus*` | [Application](./application/README.md) |
| `*SearchScene*`, `*RecommendScene*`, `*RecommendRule*`, `*AppOnlineConfig*` | [Scene](./scene/README.md) |
| `*Dict*`, `*Dicts*`, `*DictToScenes*`, `*DictInput*` | [Dictionary](./dict/README.md) |
| `*DataSourceSubscription*` | [Ingestion](./ingestion/README.md) |
| `*InferDatasetSchema*`, `*PresignedImportUrl*`, `*DatasetImageRetryTask*` | [Task](./task/README.md) |
| `*Billing*`, `*Quota*`, `*Usage*`, `*DataCount*`, `*Statistics*`, `*DataItemSummary*` | [Usage](./usage/README.md) |
