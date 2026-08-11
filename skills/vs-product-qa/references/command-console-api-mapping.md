# Command To Console API Mapping

## Purpose

This file gives `vs-product-qa` a code-grounded mapping from SearchCLI product commands to backend APIs.

Use it when an agent must answer:

- which console OpenAPI a command eventually calls
- whether a command is actually console control-plane or runtime data-plane
- how each uploaded command argument is encoded, typed, validated, and mapped into request payload fields

This file is intentionally scoped to SearchCLI product commands that have a stable backend mapping. Local-only utility commands such as `doctor`, `auth *`, `skill *`, and purchase helpers are not included because they do not map 1:1 to a single console API request body.

## Shared Encoding Rules

These rules apply to all commands below unless a command section says otherwise.

### Shared connection flags

The following flags affect transport or credential resolution, not request-body payload shape:

| Flag | CLI type | Uploaded to API | Format / notes |
| --- | --- | --- | --- |
| `--base-url` | string | no | Legacy single-base form; used to derive control/data plane URLs. |
| `--control-plane-base-url` | string | no | Console OpenAPI host override. |
| `--data-plane-base-url` | string | no | Runtime API host override. |
| `--ak` | string | no | Access key override. |
| `--sk` | string | no | Secret key override. |
| `--region` | string | no | Defaults to `cn-beijing`. Used in signed requests and translated console Action URL. |
| `--timeout-ms` | integer | no | Default `15000` for most commands; `chat run` defaults to `60000`; `app wait-ready` has additional local polling flags. |
| `--project-name` | string | sometimes | Uploaded only for commands that explicitly map it to `ProjectName`. |

### Shared JSON input behavior

`--data`, `--config`, `--field-config`, `--online-config`, `--schema`, `--fields`, `--search-config`, `--query-completion-config`, `--want-to-search-config`, `--overview-config`, `--boost-bury-config`, `--shuffle-config`, `--impression-config`, and `--suggest-config` are parsed with the same loader:

1. inline JSON object/array/string
2. `@file.json`
3. plain JSON file path

### Shared array parsing behavior

Comma-separated string flags such as `--bhv-scene-types`, `--types`, `--click-event-types`, `--positive-event-types`, and `--negative-event-types` are uploaded as string arrays. If the raw value starts with `[` it is parsed as JSON array; otherwise `a,b,c` becomes `["a","b","c"]`.

### `--data` precedence rule

If `--data` is provided, SearchCLI uses that JSON object as the entire request payload and does not synthesize request fields from the other command flags.

### Console action translation rule

Console commands below eventually call an action name, which SearchCLI translates into a control-plane OpenAPI request of the form:

`POST {controlPlaneBaseUrl}?Action=<Action>&Version=2025-03-01&Region=<region>`

### Runtime path rule

Commands marked as `runtime` do **not** call console OpenAPI. They call data-plane HTTP paths directly.

## Coverage Index

| Command | API kind | Backend action / path | Primary API reference |
| --- | --- | --- | --- |
| `app create` | console | `POST /api/v1/CreateApplication` | [CreateApplication](./api-references/modules/app-management/CreateApplication.md) |
| `app update` | console | `POST /api/v1/UpdateApplication` | [UpdateApplication](./api-references/modules/app-management/UpdateApplication.md) |
| `app get` | console | `POST /api/v1/GetApplication` | [GetApplication](./api-references/modules/app-management/GetApplication.md) |
| `app list` | console | `POST /api/v1/ListApplications` | [ListApplications](./api-references/modules/app-management/ListApplications.md) |
| `app delete` | console | `POST /api/v1/DeleteApplication` | [DeleteApplication](./api-references/modules/app-management/DeleteApplication.md) |
| `app dataset bind` | workflow over console | `GetDataset` -> `BindAppDataset` -> optional `UpsertAppOnlineConfig` -> optional readiness polling | [BindAppDataset](./api-references/modules/app-data-config/BindAppDataset.md) |
| `app dataset unbind` | console | `POST /api/v1/UnBindAppDataset` | [UnBindAppDataset](./api-references/modules/app-data-config/UnBindAppDataset.md) |
| `app dataset-config list` | console | `POST /api/v1/ListAppDataConfigs` | [ListAppDataConfigs](./api-references/modules/app-data-config/ListAppDataConfigs.md) |
| `app dataset-config get` | console | `POST /api/v1/GetAppDataConfig` | [GetAppDataConfig](./api-references/modules/app-data-config/GetAppDataConfig.md) |
| `app dataset-config update` | console | `POST /api/v1/UpdateAppDataConfig` | [UpdateAppDataConfig](./api-references/modules/app-data-config/UpdateAppDataConfig.md) |
| `app item-data-count` | console | `POST /api/v1/GetAppItemDataCount` | [GetAppItemDataCount](./api-references/modules/app-data-config/GetAppItemDataCount.md) |
| `app online-config get` | console | `POST /api/v1/GetAppOnlineConfig` | [GetAppOnlineConfig](./api-references/modules/app-online-config/GetAppOnlineConfig.md) |
| `app online-config update` | console | `POST /api/v1/UpsertAppOnlineConfig` | [UpsertAppOnlineConfig](./api-references/modules/app-online-config/UpsertAppOnlineConfig.md) |
| `app status` | workflow over console | `GetApplication` + `ListAppDataConfigs` | [GetApplication](./api-references/modules/app-management/GetApplication.md) |
| `app wait-ready` | workflow over console | repeated `GetApplication` + `ListAppDataConfigs` | [GetApplication](./api-references/modules/app-management/GetApplication.md) |
| `app diagnose` | workflow over console | `GetApplication` + `ListAppDataConfigs` | [GetApplication](./api-references/modules/app-management/GetApplication.md) |
| `dataset create` | console | `POST /api/v1/CreateDataset` | [CreateDataset](./api-references/modules/dataset-management/CreateDataset.md) |
| `dataset get` | console | `POST /api/v1/GetDataset` | [GetDataset](./api-references/modules/dataset-management/GetDataset.md) |
| `dataset list` | console | `POST /api/v1/ListDatasets` | [ListDatasets](./api-references/modules/dataset-management/ListDatasets.md) |
| `dataset update` | console | `POST /api/v1/UpdateDataset` | [UpdateDataset](./api-references/modules/dataset-management/UpdateDataset.md) |
| `dataset delete` | console | `POST /api/v1/DeleteDataset` | [DeleteDataset](./api-references/modules/dataset-management/DeleteDataset.md) |
| `dataset schema check` | console | `POST /api/v1/CheckDatasetSchema` | [CheckDatasetSchema](./api-references/modules/dataset-management/CheckDatasetSchema.md) |
| `dataset subscription create` | console | `CreateDataSourceSubscription` | [CreateDataSourceSubscription](./api-references/modules/data-source-subscriptions/CreateDataSourceSubscription.md) |
| `dataset subscription get` | console | `GetDataSourceSubscription` | [GetDataSourceSubscription](./api-references/modules/data-source-subscriptions/GetDataSourceSubscription.md) |
| `dataset subscription list` | console | `ListDataSourceSubscriptions` | [ListDataSourceSubscriptions](./api-references/modules/data-source-subscriptions/ListDataSourceSubscriptions.md) |
| `dataset subscription close` | console | `CloseDataSourceSubscription` | [CloseDataSourceSubscription](./api-references/modules/data-source-subscriptions/CloseDataSourceSubscription.md) |
| `dataset ingest` | mixed | `file mode: GetPresignedImportUrlV2 -> PUT upload -> AddInferDatasetSchemaTaskV2 -> GetInferDatasetSchemaResultV2 -> CreateDatasetV2; legacy mode: POST /api/v1/dataset/{datasetId}/write` | none; workflow behavior derived from CLI |
| `data write` | runtime | `POST /api/v1/dataset/{datasetId}/write` | none; runtime payload derived from CLI |
| `data import` | runtime shortcut | `POST /api/v1/dataset/{datasetId}/write` | none; wraps `data write` |
| `connector export` | local | none | local-only source export to JSONL bootstrap artifacts |
| `connector run` | mixed | local source polling -> `POST /api/v1/dataset/{datasetId}/write` | none; connector batches are written through the runtime data plane |
| `dict create` | console | `POST /api/v1/CreateDict` | [CreateDict](./api-references/modules/dictionary-management/CreateDict.md) |
| `dict update` | console | `POST /api/v1/UpdateDict` | [UpdateDict](./api-references/modules/dictionary-management/UpdateDict.md) |
| `dict get` | console | `POST /api/v1/GetDict` | [GetDict](./api-references/modules/dictionary-management/GetDict.md) |
| `dict delete` | console | `POST /api/v1/DeleteDict` | [DeleteDict](./api-references/modules/dictionary-management/DeleteDict.md) |
| `dict list` | console | `POST /api/v1/ListDicts` | [ListDicts](./api-references/modules/dictionary-management/ListDicts.md) |
| `dict check-input` | console | `POST /api/v1/CheckDictInput` | [CheckDictInput](./api-references/modules/dictionary-management/CheckDictInput.md) |
| `dict bind-scenes` | console | `POST /api/v1/BindDictToScenes` | [BindDictToScenes](./api-references/modules/dictionary-management/BindDictToScenes.md) |
| `dict write-terms` | workflow over console + data plane | `GetPresignedImportUrlV2` -> HTTP PUT -> `POST /api/v1/dict/{dictId}/write_terms` | none; file upload is internal when `--file` is used |
| `search scene create` | console | `CreateSearchSceneV2` | V2 action |
| `search scene list` | console | `ListSearchScenesV2` | V2 action |
| `search scene get` | console | `GetSearchSceneV2` | V2 action |
| `search scene update` | console | `PublishSearchSceneV2` | V2 action |
| `search scene delete` | console | `DeleteSearchSceneV2` | V2 action |
| `recommend scene create` | console | `POST /api/v1/CreateRecommendScene` | [CreateRecommendScene](./api-references/modules/recommendation-scenes/CreateRecommendScene.md) |
| `recommend scene list` | console | `POST /api/v1/ListRecommendScene` | [ListRecommendScene](./api-references/modules/recommendation-scenes/ListRecommendScene.md) |
| `recommend scene get` | console | `POST /api/v1/GetRecommendScene` | [GetRecommendScene](./api-references/modules/recommendation-scenes/GetRecommendScene.md) |
| `recommend scene update` | console | `POST /api/v1/OnlineRecommendScene` | [OnlineRecommendScene](./api-references/modules/recommendation-scenes/OnlineRecommendScene.md) |
| `recommend scene delete` | console | `POST /api/v1/DeleteRecommendScene` | [DeleteRecommendScene](./api-references/modules/recommendation-scenes/DeleteRecommendScene.md) |
| `recommend rule list` | console | `POST /api/v1/ListRecommendRule` | [ListRecommendRule](./api-references/modules/recommendation-rules/ListRecommendRule.md) |
| `recommend rule get` | console | `POST /api/v1/GetRecommendRule` | [GetRecommendRule](./api-references/modules/recommendation-rules/GetRecommendRule.md) |
| `recommend rule upsert` | console | `POST /api/v1/UpsertRecommendRule` | [UpsertRecommendRule](./api-references/modules/recommendation-rules/UpsertRecommendRule.md) |
| `recommend rule delete` | console | `POST /api/v1/DeleteRecommendRule` | [DeleteRecommendRule](./api-references/modules/recommendation-rules/DeleteRecommendRule.md) |
| `search run` | mixed | runtime `POST /api/v1/application/{app}/search/{scene}`; may call console `GetApplication` + `ListAppDataConfigs` to infer `dataset_id` | none; runtime payload derived from CLI |
| `recommend run` | runtime | `POST /api/v1/application/{app}/{scene}` | none; runtime payload derived from CLI |
| `chat run` | runtime | `POST /api/v1/application/{app}/chat_search` | none; runtime payload derived from CLI |

## Command Details

### `app create`

- API kind: `console`
- Action: `CreateApplication`
- Request doc: [CreateApplication](./api-references/modules/app-management/CreateApplication.md)

| CLI flag | Request field | CLI type | API type | Required when using flags | Format / range |
| --- | --- | --- | --- | --- | --- |
| `--data` | whole request | string(JSON source) | `application.CreateApplicationReq` | yes if no equivalent flags are provided | Must be a full JSON object matching the API doc. |
| `--name` | `Name` | string | string | yes unless present in `--data` | Non-empty application name. |
| `--description` | `Description` | string | string | no | Free text. |
| `--industry` | `Industry` | string | `common.IndustryType` | no | `none|ecommerce|material|video|news|social-platform|other` or numeric code `0/1/2/3/4/5/20`. |
| `--language` | `Language` | string | string | no | `zh`, `en`, or `ja`. |
| `--color` | `Icon.ColorName` | string | string | no | `cyan`, `blue`, `purple`, or `pink`. |

### `app update`

- API kind: `console`
- Action: `UpdateApplication`
- Request doc: [UpdateApplication](./api-references/modules/app-management/UpdateApplication.md)

| CLI flag | Request field | CLI type | API type | Required when using flags | Format / range |
| --- | --- | --- | --- | --- | --- |
| `--data` | whole request | string(JSON source) | `application.UpdateApplicationReq` | yes if other flags do not provide full payload | Full JSON object. |
| `--id` | `AppID` | string | string | yes unless present in `--data` | Required application ID. |
| `--name` | `Name` | string | string | no | New application name. |
| `--industry` | `Industry` | string | `common.IndustryType` | no | Same allowed values as `app create`. |
| `--icon` | `Icon` | string(JSON source) | object | no | Inline JSON, `@file`, or JSON file path for `Icon`. |
| `--color` | `Icon.ColorName` | string | string | no | `cyan`, `blue`, `purple`, or `pink`. |
| `--project-name` | `ProjectName` | string | string | no | Uploaded only when provided. |

### `app get`, `app delete`

- API kind: `console`
- Request docs: [GetApplication](./api-references/modules/app-management/GetApplication.md), [DeleteApplication](./api-references/modules/app-management/DeleteApplication.md)

| Command | CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- | --- |
| `app get` | `--data` | whole request | `application.GetApplicationReq` | yes if `--id` absent | Full JSON object. |
| `app get` | `--id` | `AppID` | string | yes unless present in `--data` | Application ID. |
| `app delete` | `--data` | whole request | `application.DeleteApplicationReq` | yes if `--id` absent | Full JSON object. |
| `app delete` | `--id` | `AppID` | string | yes unless present in `--data` | Application ID. |

### `app list`

- API kind: `console`
- Action: `ListApplications`
- Request doc: [ListApplications](./api-references/modules/app-management/ListApplications.md)

SearchCLI sends `--data` or `{}` to the API. The following filters are **local-only** and do not become request fields: `--name`, `--dataset-id`, `--industry`, `--state`, `--full`.

| CLI flag | Uploaded | Notes |
| --- | --- | --- |
| `--data` | yes | Must be a JSON object matching `ListApplicationsReq`. |
| `--name` | no | Local case-insensitive name substring filter. |
| `--dataset-id` | no | Local filter against returned dataset references. |
| `--industry` | no | Local industry filter after response. |
| `--state` | no | Local readiness/state filter after response. |
| `--full` | no | Output shaping only. |

### `app dataset bind`

- API kind: `workflow over console`
- Primary request docs: [BindAppDataset](./api-references/modules/app-data-config/BindAppDataset.md), [UpsertAppOnlineConfig](./api-references/modules/app-online-config/UpsertAppOnlineConfig.md)

Execution order:

1. `GetDataset`
2. `BindAppDataset`
3. optional `UpsertAppOnlineConfig` if `--online-config` is provided
4. optional readiness polling if `--wait-ready`

| CLI flag | Main request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | workflow payload | object | no | Full workflow payload. When present it overrides synthesized bind payload. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--dataset-id` | `DatasetID` | string | yes unless in `--data` | Dataset ID. |
| `--field-config` | `DataConfig` | object | effectively yes for normal bind flows | JSON object for bind-time field config. |
| `--schema-version` | `SchemaVersion` | integer | no | Specific schema version. |
| `--field-config-version` | `FieldsConfigVersion` | integer | no | Specific field-config version. |
| `--dry-run` | `OnlySave` | boolean | no | Validate only. |
| `--backtrack-enable` | `BacktrackReq.Enable` | boolean | no | Behavior dataset backtrack toggle. |
| `--backtrack-all` | `BacktrackReq.All` | boolean | no | Replay all historical data. |
| `--backtrack-start` | `BacktrackReq.Start` | string | no | Date-like string, example `20230101`. |
| `--backtrack-end` | `BacktrackReq.End` | string | no | Date-like string, example `20231231`. |
| `--online-config` | `Config` for `UpsertAppOnlineConfig` | object | no | JSON object matching app online-config schema. |
| `--wait-ready` | local workflow control | boolean | no | Not uploaded; triggers polling. |
| `--wait-timeout-ms` | local workflow control | integer | no | Not uploaded; timeout for polling. |
| `--poll-interval-ms` | local workflow control | integer | no | Not uploaded; poll interval. |
| `--activated-only` | polling request `ActivatedOnly` | boolean | no | Used only by readiness checks. |
| `--project-name` | `ProjectName` | string | no | Uploaded where supported by each internal console call. |

### `app dataset unbind`

- API kind: `console`
- Action: `UnBindAppDataset`
- Request doc: [UnBindAppDataset](./api-references/modules/app-data-config/UnBindAppDataset.md)

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | `application.UnBindAppDatasetReq` | yes if explicit IDs not provided | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--dataset-id` | `DatasetID` | string | yes unless in `--data` | Dataset ID. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

### `app dataset-config list`, `app dataset-config get`, `app dataset-config update`

- API docs: [ListAppDataConfigs](./api-references/modules/app-data-config/ListAppDataConfigs.md), [GetAppDataConfig](./api-references/modules/app-data-config/GetAppDataConfig.md), [UpdateAppDataConfig](./api-references/modules/app-data-config/UpdateAppDataConfig.md)

#### `app dataset-config list`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if no flag-built payload | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--dataset-type` | `DatasetType` | string/enum | no | Dataset type selector. |
| `--activated-only` | `ActivatedOnly` | boolean | no | Only list activated configs. |
| `--project-name` | `ProjectName` | string | no | Project scope. |
| `--page-number` | not uploaded | integer | no | Parsed by CLI but not included in request body. |
| `--page-size` | not uploaded | integer | no | Parsed by CLI but not included in request body. |
| `--full` | not uploaded | boolean | no | Output shaping only. |

#### `app dataset-config get`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if explicit IDs absent | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--dataset-id` | `DatasetID` | string | yes unless in `--data` | Dataset ID. |
| `--field-config-version` | `FieldsConfigVersion` | integer | no | Specific config version. |
| `--project-name` | `ProjectName` | string | no | Project scope. |
| `--full` | not uploaded | boolean | no | Output shaping only. |

#### `app dataset-config update`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if no equivalent flags | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--dataset-id` | `DatasetID` | string | yes unless in `--data` | Dataset ID. |
| `--schema-version` | `SchemaVersion` | integer | no | Specific schema version. |
| `--field-config-version` | `FieldsConfigVersion` | integer | no | Specific field-config version. |
| `--field-config` | `DataConfig` | object | effectively yes for real updates | JSON object for `DataFieldConfig`. |
| `--dry-run` | `OnlySave` | boolean | no | Validate only, do not persist. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

### `app item-data-count`

- API docs: [GetAppItemDataCount](./api-references/modules/app-data-config/GetAppItemDataCount.md)

**Deterministic recipe for "how much effective data does application X have" (follow exactly; do not explore field-by-field):**

1. Resolve the bound datasets with **`vs app get --id <appId>`** (the flag is `--id`, not `--app-id`).
   `app get` prints the raw `GetApplication` response, so each entry lives under `Result.Datasets[]` with
   raw API fields: `DatasetID`, `Name`, and `Type` (a **bare integer code** — decode it with the table in
   step 3). One `app get` call returns all of these at once; read them together (e.g. a single
   `--jq '.Result.Datasets[] | {DatasetID, Name, Type}'`). Do NOT issue multiple single-field `--jq` queries
   and do NOT grep the CLI source for the code table — the table is in step 3 below.
2. Map each dataset by type and gather its count:
   - **item (`Type=1`) / video (`Type=3`)** → `vs app item-data-count --application-id <appId> --dataset-id <datasetId>`, read `ValidCnt`; sum across all item/video datasets. Report even when `0`.
   - **document (`Type=6`, also legacy `doc`=`5`)** → `vs app dataset-config list --application-id <appId> --full`, read `Config[].Dataset.DocumentStats.DocumentNum` + `DocumentFromHomepageNum`. `--full` is required. Report even when `0`.
   - **user_event (`Type=4`, behavior)** → excluded entirely: no effective-data-volume metric, do not query and do not list (not even as `0`).
3. Dataset `Type` code table (authoritative, from `DATASET_TYPE_LABELS`): `0=unknown, 1=item, 2=query, 3=video, 4=user_event, 5=doc, 6=document`. Use this to decode the raw `Type` integer from `app get`; there is no need to look it up in source.

- Use this to answer "how much effective data does application X have" for **item/video** datasets. The
  response carries `ValidCnt` (effective/valid records) and `TotalCnt` (total records), plus
  `ImageNumTotal`/`ValidImageNum` and `DurationTotal`/`ValidDuration` for video datasets. Report `ValidCnt`
  as the application-level effective data count. Not applicable to document datasets.
- **Document datasets are not supported.** Calling this on a document dataset returns
  `InvalidParameter: DatasetType`. For document (`DatasetTypeDoc`/`DatasetTypeDocument`) datasets, read the
  count from `app dataset-config list --full` (`ListAppDataConfigs`): `Config[].Dataset.DocumentStats.DocumentNum`
  (records imported from AI Search) plus `Config[].Dataset.DocumentStats.DocumentFromHomepageNum` (records
  synced from knowledge management); `DocumentPageNum` is the page count. The `--full` flag is **required** —
  the default compact `app dataset-config list` output omits `DocumentStats`. Do not use `DataNum`. Resolve the
  dataset `Type` first and only route item/video datasets to `app item-data-count`.
- Note: for **item/video**, `app status` / `app dataset-config *` expose `DatasetProcessedDataNum` (processed
  count) and `dataset get/list` expose `DataNum` (dataset-level total) — neither is the application-scoped
  effective count, so use `app item-data-count` for the effective/valid count under an app. For **document**
  datasets the effective count instead comes from `app dataset-config list --full`
  `Config[].Dataset.DocumentStats` (see above), and it is always reported even when it is `0`. Only
  **user_event (behavior, `Type=4`)** datasets carry no effective-data-volume metric — exclude them from
  data-volume answers entirely (do not query a count and do not list them). The "omit even when 0" rule
  applies to user_event only; item/video/document counts are always reported, including `0`.

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if explicit IDs absent | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--dataset-id` | `DatasetID` | string | yes unless in `--data` | Item/video dataset ID. |
| `--project-name` | `ProjectName` | string | no | Project scope. |
| `--full` | not uploaded | boolean | no | Output shaping only. |

### `app online-config get`, `app online-config update`

- API docs: [GetAppOnlineConfig](./api-references/modules/app-online-config/GetAppOnlineConfig.md), [UpsertAppOnlineConfig](./api-references/modules/app-online-config/UpsertAppOnlineConfig.md)

| Command | CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- | --- |
| `app online-config get` | `--data` | whole request | object | yes if explicit ID absent | Full JSON object. |
| `app online-config get` | `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `app online-config get` | `--project-name` | `ProjectName` | string | no | Project scope. |
| `app online-config get` | `--full` | not uploaded | boolean | no | Output shaping only. |
| `app online-config update` | `--data` | whole request | object | yes if equivalent fields absent | Full JSON object. |
| `app online-config update` | `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `app online-config update` | `--config` | `Config` | object | effectively yes for meaningful update | JSON object matching online-config schema. |
| `app online-config update` | `--project-name` | `ProjectName` | string | no | Project scope. |

### `app status`, `app wait-ready`, `app diagnose`

These are workflow/readiness commands, not single-action writes.

- Console calls involved:
  - [GetApplication](./api-references/modules/app-management/GetApplication.md)
  - [ListAppDataConfigs](./api-references/modules/app-data-config/ListAppDataConfigs.md)

| Command | CLI flag | Internal request field | Uploaded | Notes |
| --- | --- | --- | --- | --- |
| `app status` | `--application-id` | `AppID` | yes | Required. |
| `app status` | `--project-name` | `ProjectName` | yes | Optional. |
| `app status` | `--activated-only` | `ActivatedOnly` | yes | Optional on `ListAppDataConfigs`. |
| `app wait-ready` | `--application-id` | `AppID` | yes | Required. |
| `app wait-ready` | `--project-name` | `ProjectName` | yes | Optional. |
| `app wait-ready` | `--activated-only` | `ActivatedOnly` | yes | Optional. |
| `app wait-ready` | `--wait-timeout-ms` | local polling only | no | Default `120000`. |
| `app wait-ready` | `--poll-interval-ms` | local polling only | no | Default `3000`. |
| `app diagnose` | `--application-id` | `AppID` | yes | Required. |
| `app diagnose` | `--project-name` | `ProjectName` | yes | Optional. |
| `app diagnose` | `--activated-only` | `ActivatedOnly` | yes | Optional. |

### `dataset create`, `dataset get`, `dataset list`, `dataset update`, `dataset delete`

- API docs: [CreateDataset](./api-references/modules/dataset-management/CreateDataset.md), [GetDataset](./api-references/modules/dataset-management/GetDataset.md), [ListDatasets](./api-references/modules/dataset-management/ListDatasets.md), [UpdateDataset](./api-references/modules/dataset-management/UpdateDataset.md), [DeleteDataset](./api-references/modules/dataset-management/DeleteDataset.md)

#### `dataset create`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | `dataset.CreateDatasetReq` | yes if no equivalent flags | Full JSON object. |
| `--name` | `Name` | string | yes unless in `--data` | Dataset name. |
| `--type` | `Type` | string/enum | yes unless in `--data` | CLI accepts dataset type enum value; implementation rejects internal type codes `2` and `5`. |
| `--description` | `Description` | string | no | Free text. |
| `--schema` | `Schema` | array/object | no for payload construction, but usually required by API | JSON schema payload. |

#### `dataset get`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | `dataset.GetDatasetReq` | yes if `--id` absent | Full JSON object. |
| `--id` | `DatasetID` | string | yes unless in `--data` | Dataset ID. |
| `--full` | not uploaded | boolean | no | Output shaping only. |

#### `dataset list`

SearchCLI sends `--data` or `{}`. The flags `--type`, `--name`, `--application-id`, and `--full` are local filtering/output controls rather than request fields.

#### `dataset update`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | `dataset.UpdateDatasetReq` | yes if equivalent flags absent | Full JSON object. |
| `--id` | `DatasetID` | string | yes unless in `--data` | Dataset ID. |
| `--version` | `Version` | integer | no | Schema version. |
| `--description` | `Description` | string | no | Free text. |
| `--schema` | `Schema` | array/object | no | JSON schema payload. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dataset delete`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | `dataset.GetDatasetReq` | yes if `--id` absent | Full JSON object. |
| `--id` | `DatasetID` | string | yes unless in `--data` | Dataset ID. |

### `dataset schema check`

- API docs: [CheckDatasetSchema](./api-references/modules/dataset-management/CheckDatasetSchema.md)

| Command | CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- | --- |
| `dataset schema check` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `dataset schema check` | `--type` | `Type` | string/enum | yes unless in `--data` | Dataset type enum value; implementation rejects internal type codes `2` and `5`. |
| `dataset schema check` | `--schema` | `Schema` | array/object | usually yes | JSON schema payload. |
| `dataset schema check` | `--project-name` | `ProjectName` | string | no | Project scope. |

### `dataset subscription create`, `dataset subscription get`, `dataset subscription list`, `dataset subscription close`

- API docs: [CreateDataSourceSubscription](./api-references/modules/data-source-subscriptions/CreateDataSourceSubscription.md), [GetDataSourceSubscription](./api-references/modules/data-source-subscriptions/GetDataSourceSubscription.md), [ListDataSourceSubscriptions](./api-references/modules/data-source-subscriptions/ListDataSourceSubscriptions.md), [CloseDataSourceSubscription](./api-references/modules/data-source-subscriptions/CloseDataSourceSubscription.md)

#### `dataset subscription create`

Prefer `--data @payload.json` when `DataSourceConfig` contains MySQL credentials. The smaller flags are only a convenience layer for non-secret fields or for referencing JSON files.

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | `dataset.CreateDataSourceSubscriptionReq` | yes if equivalent flags absent | Full JSON object. Recommended for credential-bearing requests. |
| `--client-token` | `ClientToken` | string | recommended | Idempotency token; same token requires an identical payload. |
| `--need-create-dataset` | `NeedCreateDataset` | boolean | no | When set, backend samples the source and creates a new `multi_modal` dataset. |
| `--dataset-id` | `DatasetId` | string | yes when `NeedCreateDataset=false` | Existing target dataset ID; backend supports existing `multi_modal` / `user_event` datasets. |
| `--create-dataset-config` | `CreateDatasetConfig` | object | yes when `NeedCreateDataset=true` | Inline JSON / `@file` / JSON file path. `Type` currently supports `multi_modal` only. |
| `--type` | `Type` | string | yes unless in `--data` | Data source type; currently `mysql`. |
| `--data-source-config` | `DataSourceConfig` | object | yes unless in `--data` | Inline JSON / `@file` / JSON file path. Use `@file` for credentials. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dataset subscription get`, `dataset subscription close`

| Command | CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- | --- |
| `dataset subscription get` | `--data` | whole request | `dataset.GetDataSourceSubscriptionReq` | yes if `--task-id` absent | Full JSON object. |
| `dataset subscription get` | `--task-id` | `TaskId` | string | yes unless in `--data` | Data-source subscription task ID. |
| `dataset subscription get` | `--project-name` | `ProjectName` | string | no | Project scope. |
| `dataset subscription close` | `--data` | whole request | `dataset.CloseDataSourceSubscriptionReq` | yes if `--task-id` absent | Full JSON object. |
| `dataset subscription close` | `--task-id` | `TaskId` | string | yes unless in `--data` | Data-source subscription task ID. |
| `dataset subscription close` | `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dataset subscription list`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | `dataset.ListDataSourceSubscriptionsReq` | no | Full JSON object. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

### `dataset ingest`, `data write`, `data import`

`dataset ingest` is overloaded and has two distinct backends:

1. `--file --type` runs the V2 control-plane workflow:
   - `POST /open/GetPresignedImportUrlV2`
   - HTTP `PUT` to the returned presigned URL
   - `POST /open/AddInferDatasetSchemaTaskV2`
   - repeated `POST /open/GetInferDatasetSchemaResultV2`
   - `POST /open/CreateDatasetV2`
2. `--dataset-id --fields` is a runtime data-plane write, equivalent to `data import`.

Runtime write path:

- `POST /api/v1/dataset/{datasetId}/write`
- `data import` is only a simpler wrapper around the same runtime write.

#### `dataset ingest` file mode (`--file --type`)

| CLI flag | Workflow stage / request field | Required | Format / notes |
| --- | --- | --- | --- |
| `--file` | local upload source -> `FileName` -> PUT body | yes | Local JSON / JSONL / CSV file path. |
| `--type` | `AddInferDatasetSchemaTaskV2.Type` and `CreateDatasetV2.Type` | yes | Dataset type string. |
| `--dataset-name` | `AddInferDatasetSchemaTaskV2.Name`, `CreateDatasetV2.Name` | no | Reused across infer + create. |
| `--industry` | `AddInferDatasetSchemaTaskV2.Industry`, `CreateDatasetV2.Industry` | no | String enum / alias. |
| `--language` | `AddInferDatasetSchemaTaskV2.Language`, `CreateDatasetV2.Language` | no | `zh`, `en`, `ja`. |
| `--schema-wait-timeout-ms` | local polling control | no | Not uploaded; timeout for infer-result polling. |
| `--schema-poll-interval-ms` | local polling control | no | Not uploaded; poll interval. |
| `--dry-run` | `CreateDatasetV2.DryRun` | no | Validate without persisting. |
| `--project-name` | `ProjectName` where supported | no | Uploaded on V2 control-plane calls. |

#### `dataset ingest` runtime mode (`--dataset-id --fields`)

| CLI flag | Runtime payload field | Required | Format / range |
| --- | --- | --- | --- |
| `--dataset-id` | path param | yes | Dataset ID. |
| `--fields` | `fields` | yes | Inline JSON array, `@file`, or JSON file path. |

#### `data write`, `data import`

| Command | CLI flag | Runtime payload field | Required | Format / range |
| --- | --- | --- | --- | --- |
| `data write` | `--dataset-id` | path param | yes | Dataset ID. |
| `data write` | `--fields` | `fields` | yes if `--data` absent | Inline JSON array, `@file`, or JSON file path. |
| `data write` | `--data` | whole runtime payload | yes if `--fields` absent | Full JSON object; if provided it overrides synthesized `{ fields: ... }`. |
| `data import` | `--dataset-id` | path param | yes | Dataset ID. |
| `data import` | `--fields` | `fields` | yes if `--data` absent | Same format as `data write`. |
| `data import` | `--data` | whole runtime payload | yes if `--fields` absent | Same override rule as `data write`. |

### `connector export`, `connector init`, `connector run`, `connector status`, `connector stop`, `connector inspect`

These commands are primarily local connector lifecycle helpers, not console OpenAPI.

- `connector export` reads a supported source locally and writes `/tmp/viking/connector/<job>/bootstrap/items.jsonl` plus local metadata files. It does **not** call a backend API.
- `connector init`, `connector status`, `connector stop`, and `connector inspect` only read/write local config or runtime state under `/tmp/viking/connector/<job>/`.
- `connector run` is mixed: it reads the configured source locally, then batches records into the runtime data-plane write path `POST /api/v1/dataset/{datasetId}/write`.

### `search scene create`, `search scene list`, `search scene get`, `search scene delete`

- API actions: `CreateSearchSceneV2`, `ListSearchScenesV2`, `GetSearchSceneV2`, `DeleteSearchSceneV2`.

| Command | CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- | --- |
| `search scene create` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `search scene create` | `--application-id` | `ApplicationId` | string | yes unless in `--data` | Application ID. |
| `search scene create` | `--project-name` | `ProjectName` | string | no | Project scope. |
| `search scene create` | `--name` | `Name` | string | no | Scene name. |
| `search scene create` | `--description` | `Description` | string | no | Scene description. |
| `search scene list` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `search scene list` | `--application-id` | `ApplicationId` | string | yes unless in `--data` | Application ID. |
| `search scene list` | `--project-name` | `ProjectName` | string | no | Project scope. |
| `search scene get` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `search scene get` | `--application-id` | `ApplicationId` | string | yes unless in `--data` | Application ID. |
| `search scene get` | `--scene-id` | `SceneId` | string | yes unless in `--data` | Scene ID. |
| `search scene get` | `--project-name` | `ProjectName` | string | no | Project scope. |
| `search scene delete` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `search scene delete` | `--application-id` | `ApplicationId` | string | yes unless in `--data` | Application ID. |
| `search scene delete` | `--scene-id` | `SceneId` | string | yes unless in `--data` | Scene ID. |
| `search scene delete` | `--project-name` | `ProjectName` | string | no | Project scope. |

### `search scene update`

- API kind: `console`
- Action: `PublishSearchSceneV2`

If `--config` is absent, SearchCLI synthesizes `Config` from the more granular nested JSON flags.

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | `ApplicationId` | string | yes unless in `--data` | Application ID. |
| `--scene-id` | `SceneId` | string | yes unless in `--data` | Scene ID. |
| `--project-name` | `ProjectName` | string | no | Project scope. |
| `--name` | `Name` | string | no | Scene name. |
| `--description` | `Description` | string | no | Scene description. |
| `--config` | `Config` | object | yes unless granular config flags are used | Full nested `SearchSceneConfigV2` object. |
| `--search-config` | `Config.PerDatasetConfigs` | array | no | JSON array matching `PerDatasetConfig[]`. |
| `--query-completion-config` | `Config.QueryCompletionConfig` | object | no | JSON object matching `QueryCompletionConfig`. |
| `--want-to-search-config` | `Config.WantToSearchConfig` | object | no | JSON object matching `WantToSearchConfig`. |
| `--overview-config` | `Config.OverviewConfig` | object | no | JSON object matching `OverviewConfig`. |

Local validation constrains several nested V2 fields before upload, including `TextSearchConfig.Mode`, `TextSearchConfig.UserDefinedRecallMode`, `ImageSearchConfig.InstructionType`, `WantToSearchConfig`, and `OverviewConfig.Mode`.

Search scene response shape:

- `search scene create`, `search scene get`, and `search scene update` return a `SearchSceneV2` object directly under `Result`; read scene config from `Result.Config`, not `Result.Item.Config` or `Result.Scene.Config`.
- `search scene list` returns `Result.Scenes[]`.
- `search scene delete` returns an empty `Result` object on success.

### `recommend scene create`, `recommend scene list`, `recommend scene get`, `recommend scene delete`

- API docs: [CreateRecommendScene](./api-references/modules/recommendation-scenes/CreateRecommendScene.md), [ListRecommendScene](./api-references/modules/recommendation-scenes/ListRecommendScene.md), [GetRecommendScene](./api-references/modules/recommendation-scenes/GetRecommendScene.md), [DeleteRecommendScene](./api-references/modules/recommendation-scenes/DeleteRecommendScene.md)

#### `recommend scene create`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--project-name` | `ProjectName` | string | no | Project scope. |
| `--type` | `Type` | string | usually yes | Scene type, for example `for_you`, `related`. |
| `--name` | `Name` | string | no | Scene name. |
| `--description` | `Description` | string | no | Scene description. |
| `--item-dataset-id` | `ItemDatasetID` | string | no | Item dataset ID. |
| `--recommend-model` | `RecommendModel` | integer | no | Enum value; examples in CLI: `0` default, `1` long-sequence. |
| `--optimization-target` | `RecommendOptimizationTarget` | integer | no | Enum value; examples in CLI: `0` none, `1` ctr. |
| `--bhv-scene-types` | `BhvSceneTypes` | string[] | yes unless in `--data` | Comma-separated or JSON array; create enforces non-empty. |
| `--click-event-types` | `ClickEventTypes` | string[] | no | Comma-separated or JSON array. |
| `--positive-event-types` | `PositiveEventTypes` | string[] | no | Comma-separated or JSON array. |
| `--negative-event-types` | `NegativeEventTypes` | string[] | no | Comma-separated or JSON array. |
| `--confirm-entry-binding` | local precondition | boolean | yes for real writes | Must be true; otherwise CLI blocks the write locally. |

#### `recommend scene list`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--project-name` | `ProjectName` | string | no | Project scope. |
| `--types` | `Types` | string[] | no | Comma-separated or JSON array. |

#### `recommend scene get`, `recommend scene delete`

| Command | CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- | --- |
| `recommend scene get` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `recommend scene get` | `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `recommend scene get` | `--scene-id` | `SceneID` | string | yes unless in `--data` | Scene ID. |
| `recommend scene get` | `--project-name` | `ProjectName` | string | no | Project scope. |
| `recommend scene delete` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `recommend scene delete` | `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `recommend scene delete` | `--scene-id` | `SceneID` | string | yes unless in `--data` | Scene ID. |
| `recommend scene delete` | `--project-name` | `ProjectName` | string | no | Project scope. |

### `recommend scene update`

- API kind: `console`
- Action: `OnlineRecommendScene`
- Request doc: [OnlineRecommendScene](./api-references/modules/recommendation-scenes/OnlineRecommendScene.md)

If `--config` is absent, SearchCLI synthesizes `Config` from the granular config flags.

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--scene-id` | `SceneID` | string | yes unless in `--data` | Scene ID. |
| `--project-name` | `ProjectName` | string | no | Project scope. |
| `--type` | `Type` | string | no | Scene type. |
| `--name` | `Name` | string | no | Scene name. |
| `--description` | `Description` | string | no | Scene description. |
| `--item-dataset-id` | `ItemDatasetID` | string | no | Item dataset ID. |
| `--bhv-scene-types` | `BhvSceneTypes` | string[] | no | Comma-separated or JSON array. |
| `--config` | `Config` | object | yes unless granular config flags are used | Full nested config object. |
| `--count` | `Config.Count` | integer | no | Max number of items returned. |
| `--degrade-rule-id` | `Config.DegradeRuleID` | string | no | Degrade rule ID. |
| `--boost-bury-config` | `Config.BoostBuryConfig` | object | no | JSON object. |
| `--shuffle-config` | `Config.ShuffleConfig` | object | no | JSON object. |
| `--impression-config` | `Config.ImpressionConfig` | object | no | JSON object. |
| `--suggest-config` | `Config.SuggestConfig` | object | no | JSON object. |
| `--confirm-entry-binding` | local precondition | boolean | yes for real writes | Must be true; otherwise CLI blocks the write locally. |

### `recommend rule list`, `recommend rule get`, `recommend rule upsert`, `recommend rule delete`

- API kind: `console`
- Actions: `ListRecommendRule`, `GetRecommendRule`, `UpsertRecommendRule`, `DeleteRecommendRule`
- API docs: [ListRecommendRule](./api-references/modules/recommendation-rules/ListRecommendRule.md), [GetRecommendRule](./api-references/modules/recommendation-rules/GetRecommendRule.md), [UpsertRecommendRule](./api-references/modules/recommendation-rules/UpsertRecommendRule.md), [DeleteRecommendRule](./api-references/modules/recommendation-rules/DeleteRecommendRule.md)

#### `recommend rule list`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--project-name` | `ProjectName` | string | no | Project scope. |
| `--types` | `Types` | string[] | no | Comma-separated or JSON array. Allowed values: `degrade`, `filter`, `search_filter`, `impression`, `suggest`, `userInterest`, `itemCf`, `forceItem`. |
| `--dataset-id` | `DatasetID` | string | no | Dataset ID filter. For rules with both behavior and item datasets, this is the behavior dataset ID. |
| `--invert-item-dataset-id` | `InvertItemDatasetID` | string | no | Inverted item dataset ID. For inverted-index rule queries, this is the item dataset ID. |

#### `recommend rule get`, `recommend rule delete`

| Command | CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- | --- |
| `recommend rule get` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `recommend rule get` | `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `recommend rule get` | `--rule-id` | `RuleID` | string | yes unless in `--data` | Rule ID. |
| `recommend rule get` | `--project-name` | `ProjectName` | string | no | Project scope. |
| `recommend rule delete` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `recommend rule delete` | `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `recommend rule delete` | `--rule-id` | `RuleID` | string | yes unless in `--data` | Rule ID. |
| `recommend rule delete` | `--project-name` | `ProjectName` | string | no | Project scope. |

#### `recommend rule upsert`

Create (omit `--rule-id`) or update (provide `--rule-id`) a recommend rule.

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | `AppID` | string | yes unless in `--data` | Application ID. |
| `--rule-id` | `RuleID` | string | no | Omit to create; provide to update. Response returns the RuleID. |
| `--name` | `Name` | string | yes for create | Rule name. |
| `--type` | `Type` | string | yes for create | Rule type. Allowed values: `degrade`, `filter`, `search_filter`, `impression`, `suggest`, `userInterest`, `itemCf`, `forceItem`. |
| `--description` | `Description` | string | no | Rule description. |
| `--dataset-id` | `DatasetID` | string | no | Dataset ID associated with the rule. |
| `--config` | `Config` | object | no | Rule config JSON. For `search_filter` / `filter` rules, this is a recursive rule tree (group nodes with `and`/`or`, leaf nodes with `must`/`must_not`/`range`/`time_range`). See [UpsertRecommendRule Config 结构说明](./api-references/modules/recommendation-rules/UpsertRecommendRule.md#L34-L104). |
| `--project-name` | `ProjectName` | string | no | Project scope. |

### `dict create`, `dict update`, `dict get`, `dict delete`, `dict list`, `dict check-input`, `dict bind-scenes`, `dict write-terms`

- API kind: `console` for create/update/get/delete/list/check-input/bind-scenes; `workflow over console + data plane` for write-terms
- Actions: `CreateDict`, `UpdateDict`, `GetDict`, `DeleteDict`, `ListDicts`, `CheckDictInput`, `BindDictToScenes`, `WriteTerms`
- API docs: [CreateDict](./api-references/modules/dictionary-management/CreateDict.md), [UpdateDict](./api-references/modules/dictionary-management/UpdateDict.md), [GetDict](./api-references/modules/dictionary-management/GetDict.md), [DeleteDict](./api-references/modules/dictionary-management/DeleteDict.md), [ListDicts](./api-references/modules/dictionary-management/ListDicts.md), [CheckDictInput](./api-references/modules/dictionary-management/CheckDictInput.md), [BindDictToScenes](./api-references/modules/dictionary-management/BindDictToScenes.md)

#### `dict create`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--name` | `Name` | string | yes unless present in `--data` | Dictionary name. |
| `--type` | `Type` | string | yes unless present in `--data` | Allowed values: `query_recommendation`, `query_completion`, `query_correction_exemption`, `bidirection_synonyms`, `unidirection_synonyms`. |
| `--description` | `Description` | string | no | Dictionary description. |
| `--enable-idempotent` | `EnableIdempotent` | boolean | no | When `true`, backend returns the existing same-name dictionary instead of failing. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dict update`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--dict-id` | `DictId` | string | yes unless present in `--data` | Dictionary ID. |
| `--name` | `Name` | string | yes unless present in `--data` | Updated dictionary name. Backend performs a full update and re-validates `Name` length (1-100). |
| `--description` | `Description` | string | no | Updated dictionary description. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dict get`, `dict delete`

| Command | CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- | --- |
| `dict get` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `dict get` | `--dict-id` | `DictId` | string | yes unless present in `--data` | Dictionary ID. |
| `dict get` | `--project-name` | `ProjectName` | string | no | Project scope. |
| `dict delete` | `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `dict delete` | `--dict-id` | `DictId` | string | yes unless present in `--data` | Dictionary ID. |
| `dict delete` | `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dict list`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--dict-ids` | `DictIds` | string[] | no | Comma-separated or JSON array of dictionary IDs. |
| `--types` | `Types` | string[] | no | Comma-separated or JSON array. Allowed values: `query_recommendation`, `query_completion`, `query_correction_exemption`, `bidirection_synonyms`, `unidirection_synonyms`. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dict check-input`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--dict-id` | `DictId` | string | no | Existing dictionary ID. When provided, backend ignores uploaded `Type` and validates against the existing dictionary. |
| `--language` | `Language` | string | no | Allowed values: `zh`, `en`, `ja`. |
| `--type` | `Type` | string | no | Dictionary type when validating pre-create entries. |
| `--tos-bucket` | `TosBucket` | string | no | TOS bucket for source-file validation. |
| `--tos-key` | `TosKey` | string | no | TOS object key for source-file validation. |
| `--entries` | `Entries` | object[] | no | Inline JSON / `@file` / JSON file path. Entry shape: `[{ "Fields": ["..."] }]`. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dict bind-scenes`

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--data` | whole request | object | yes if equivalent flags absent | Full JSON object. |
| `--dict-id` | `DictId` | string | yes unless present in `--data` | Dictionary ID. |
| `--scenes` | `Scenes` | object[] | yes unless present in `--data` | Inline JSON / `@file` / JSON file path. Scene shape: `[{ "AppId": "...", "SceneId": "...", "DatasetId": "..." }]`. |
| `--project-name` | `ProjectName` | string | no | Project scope. |

#### `dict write-terms`

- Execution modes:
  1. `--file`: internal workflow `GetPresignedImportUrlV2` -> HTTP PUT upload -> data-plane `POST /api/v1/dict/{dictId}/write_terms`
  2. `--entries`: direct data-plane `POST /api/v1/dict/{dictId}/write_terms`
- SearchCLI first calls `GetDict` to resolve the dictionary `Type`, then sends that type as data-plane field `term_type`.
- File-import mode uses DonaldTrump-compatible payload shape: `{ "term_type": "<dict-type>", "items": [], "_data_tos_link": "<FileKey>" }`.
- Non-file mode uses DonaldTrump-compatible payload shape: `{ "term_type": "<dict-type>", "items": [...] }`, where each item is a write-item object with `_last_data` and `_current_data`.

| CLI flag | Request field | API type | Required | Format / range |
| --- | --- | --- | --- | --- |
| `--dict-id` | path param | string | yes | Target dictionary ID (in URL path). |
| `--file` | `items=[]`, `_data_tos_link`, `term_type` | local file path | no (use with `--entries`) | Local CSV file. CLI uploads it internally, then sends the returned `FileKey` as `_data_tos_link`. |
| `--entries` | `items`, `term_type` | object[] | no | Inline JSON / `@file` / JSON file path for `items[]`. Entry shape: `[{ "_last_data": {...}, "_current_data": {...} }]`. |
| `--project-name` | n/a | n/a | no | Not sent to data-plane API (kept for CLI config consistency). |

### `search run`

- API kind: `mixed`
- Runtime path: `POST /api/v1/application/{applicationId}/search/{sceneId}`
- Optional console preflight: `GetApplication` + `ListAppDataConfigs` only when payload lacks `dataset_id` and CLI must infer it.

| CLI flag | Runtime payload field | Required | Format / range |
| --- | --- | --- | --- |
| `--data` | whole runtime payload | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | path param | yes | Application ID. |
| `--scene-id` | path param | yes | Scene ID. |
| `--dataset-id` | `dataset_id` | no | Dataset ID. If omitted and payload also lacks `dataset_id`, CLI tries to infer one from console state. |
| `--query` | `query.text` | yes unless present in `--data` | Search text string. |
| `--page-size` | `page_size` | no | Integer; default `10`. |

Default synthesized payload when `--data` is absent:

```json
{
  "query": { "text": "<query>" },
  "dataset_id": "<dataset-id or inferred>",
  "page_number": 1,
  "page_size": 10
}
```

### `recommend run`

- API kind: `runtime`
- Runtime path: `POST /api/v1/application/{applicationId}/{sceneId}`

| CLI flag | Runtime payload field | Required | Format / range |
| --- | --- | --- | --- |
| `--data` | whole runtime payload | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | path param | yes | Application ID. |
| `--scene-id` | path param | yes | Scene ID. |
| `--user-id` | `user._user_id` | no | User ID string. |
| `--parent-id` | `parent_items[0]._id` | no | Parent item ID string. |
| `--page-size` | `page_size` | no | Integer; default `20`. |

### `chat run`

- API kind: `runtime`
- Runtime path: `POST /api/v1/application/{applicationId}/chat_search`

| CLI flag | Runtime payload field | Required | Format / range |
| --- | --- | --- | --- |
| `--data` | whole runtime payload | yes if equivalent flags absent | Full JSON object. |
| `--application-id` | path param | yes | Application ID. |
| `--session-id` | `session_id` | no | Session ID string. If omitted, CLI generates a UUID. |
| `--message` | `input_message.content[0].text` | yes unless using `--opening-remarks` or full `--data` | Chat message text. |
| `--opening-remarks` / `--no-opening-remarks` | `opening_remarks` | no | Boolean flag. |
| `--user-id` | `user._user_id` | no | User ID string. |

## Agent Usage Notes

1. For any command that accepts `--data`, prefer `--data @payload.json` when multiple nested fields must be uploaded together.
2. For any `--config`-style flag, the nested object schema must be taken from the linked API reference file under `references/api-references/`.
3. For list commands with local-only filters, do not claim those flags are part of the request body.
4. For runtime commands, do not map them to console OpenAPI just because they are part of the same product surface.
5. For readiness workflows (`app status`, `app wait-ready`, `app diagnose`, and the dataset inference step in `search run`), the command may call more than one backend API in sequence.
