# Data-Plane OnlineAPI Router

This file is the final-level router for online search, chat, recommend, rerank, and deduplicate runtime API contracts. Scene configuration APIs are control-plane APIs.

## Routing Rules

1. If the user names an exact OpenAPI, use [OpenAPI Name Routing](#openapi-name-routing).
2. If the user asks from a SearchCLI command or product intent, use [Command / Intent Routing](#command--intent-routing).
3. After choosing one target API, read only that Markdown file unless it links to another structure needed for nested fields.

## Command / Intent Routing

| User question or command signal | Read |
| --- | --- |
| Browse index, index exploration | [BrowseIndex](./BrowseIndex.md) |
| Chat search runtime, stream chat search, `vs chat run` | [StreamChatSearch](./StreamChatSearch.md) |
| Search runtime with scene, `vs search run` | [SearchWithScene](./SearchWithScene.md) |
| Query completion, search autocomplete | [QueryCompletionWithScene](./QueryCompletionWithScene.md) |
| Query recommendation, search query recommendation | [QueryRecommendationWithScene](./QueryRecommendationWithScene.md) |
| Question suggestions | [QuestionSuggestions](./QuestionSuggestions.md) |
| Recommendation runtime, `vs recommend run` | [Recommend](./Recommend.md) |
| Rerank candidates | [Rerank](./Rerank.md) |
| Deduplicate results | [Deduplicate](./Deduplicate.md) |

## OpenAPI Name Routing

| OpenAPI | Read |
| --- | --- |
| `BrowseIndex` | [BrowseIndex](./BrowseIndex.md) |
| `StreamChatSearch` | [StreamChatSearch](./StreamChatSearch.md) |
| `SearchWithScene` | [SearchWithScene](./SearchWithScene.md) |
| `QueryCompletionWithScene` | [QueryCompletionWithScene](./QueryCompletionWithScene.md) |
| `QueryRecommendationWithScene` | [QueryRecommendationWithScene](./QueryRecommendationWithScene.md) |
| `QuestionSuggestions` | [QuestionSuggestions](./QuestionSuggestions.md) |
| `Recommend` | [Recommend](./Recommend.md) |
| `Rerank` | [Rerank](./Rerank.md) |
| `Deduplicate` | [Deduplicate](./Deduplicate.md) |
