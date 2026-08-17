# Control-Plane Dictionary API Router

This file is the final-level router for dictionary control-plane API contracts. Dictionary term write/list/delete runtime APIs are data-plane APIs.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Create dictionary, `vs dict create` | [CreateDict](./CreateDict.md) |
| Update dictionary metadata, `vs dict update` | [UpdateDict](./UpdateDict.md) |
| Get dictionary detail, `vs dict get` | [GetDict](./GetDict.md) |
| Delete dictionary, `vs dict delete` | [DeleteDict](./DeleteDict.md) |
| List dictionaries, `vs dict list` | [ListDicts](./ListDicts.md) |
| Check dictionary input format, `vs dict check-input` | [CheckDictInput](./CheckDictInput.md) |
| Bind dictionary to scenes, `vs dict bind-scenes` | [BindDictToScenes](./BindDictToScenes.md) |
| Dictionary word count | [ListDictsWordNum](./ListDictsWordNum.md) |
| List scenes bound to dictionaries | [ListDictsBindScene](./ListDictsBindScene.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `CreateDict` | [CreateDict](./CreateDict.md) |
| `UpdateDict` | [UpdateDict](./UpdateDict.md) |
| `GetDict` | [GetDict](./GetDict.md) |
| `DeleteDict` | [DeleteDict](./DeleteDict.md) |
| `ListDicts` | [ListDicts](./ListDicts.md) |
| `CheckDictInput` | [CheckDictInput](./CheckDictInput.md) |
| `BindDictToScenes` | [BindDictToScenes](./BindDictToScenes.md) |
| `ListDictsWordNum` | [ListDictsWordNum](./ListDictsWordNum.md) |
| `ListDictsBindScene` | [ListDictsBindScene](./ListDictsBindScene.md) |
