# Control-Plane Application API Router

This file is the final-level router for Application control-plane API contracts.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Create an application, `vs app create` | [CreateApplicationV2](./CreateApplicationV2.md) |
| Update application name, description, industry, icon, or language, `vs app update` | [UpdateApplication](./UpdateApplication.md) |
| Get one application, application detail, `vs app get` | [GetApplication](./GetApplication.md) |
| List applications through SearchCLI, `vs app list` | [ListApplications](./ListApplications.md) |
| List lightweight application metadata or optimize console application list performance | [ListApplicationsMeta](./ListApplicationsMeta.md) |
| Delete an application, `vs app delete` | [DeleteApplication](./DeleteApplication.md) |
| Item pool filter, application item filter, restrict item pool for an application | [UpdateAppItemFilter](./UpdateAppItemFilter.md) |
| Personalized info, user profile summary, search personalization status | [GetPersonalizedInfo](./GetPersonalizedInfo.md) |
| Unbind dataset from application, `vs app dataset unbind` | [UnBindAppDataset](./UnBindAppDataset.md) |
| Attach or bind dataset to application, `vs app attach-dataset` | [AttachDatasetToApplicationV2](./AttachDatasetToApplicationV2.md) |
| List application dataset configs, `vs app dataset-config list` | [ListAppDataConfigs](./ListAppDataConfigs.md) |
| Get one application dataset config, `vs app dataset-config get` | [GetAppDataConfig](./GetAppDataConfig.md) |
| Update application dataset config, `vs app dataset-config update` | [UpdateAppDataConfig](./UpdateAppDataConfig.md) |
| List index status for application datasets | [ListIndexStatusV2](./ListIndexStatusV2.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `CreateApplicationV2` | [CreateApplicationV2](./CreateApplicationV2.md) |
| `UpdateApplication` | [UpdateApplication](./UpdateApplication.md) |
| `GetApplication` | [GetApplication](./GetApplication.md) |
| `ListApplications` | [ListApplications](./ListApplications.md) |
| `ListApplicationsMeta` | [ListApplicationsMeta](./ListApplicationsMeta.md) |
| `DeleteApplication` | [DeleteApplication](./DeleteApplication.md) |
| `UpdateAppItemFilter` | [UpdateAppItemFilter](./UpdateAppItemFilter.md) |
| `GetPersonalizedInfo` | [GetPersonalizedInfo](./GetPersonalizedInfo.md) |
| `UnBindAppDataset` | [UnBindAppDataset](./UnBindAppDataset.md) |
| `AttachDatasetToApplicationV2` | [AttachDatasetToApplicationV2](./AttachDatasetToApplicationV2.md) |
| `ListAppDataConfigs` | [ListAppDataConfigs](./ListAppDataConfigs.md) |
| `GetAppDataConfig` | [GetAppDataConfig](./GetAppDataConfig.md) |
| `UpdateAppDataConfig` | [UpdateAppDataConfig](./UpdateAppDataConfig.md) |
| `ListIndexStatusV2` | [ListIndexStatusV2](./ListIndexStatusV2.md) |
