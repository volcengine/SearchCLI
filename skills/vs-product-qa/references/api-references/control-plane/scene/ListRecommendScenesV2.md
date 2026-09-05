# ListRecommendScenesV2

## Overview

- API name: `ListRecommendScenesV2`
- Category: Control Plane - Scene
- Description: Lists V2 recommend scenes under an application.

## IDL Definition

```proto
message ListRecommendScenesV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  repeated string Types = 3;
}

message ListRecommendScenesV2Resp {
  repeated RecommendSceneV2 Scenes = 1;
}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `Types[]` | array<string> | No | Scene type filter: `for_you`, `related`, `shopping_cart`; empty means all. |

## Response Parameters

| Field | Type | Description |
| --- | --- | --- |
| `Scenes[]` | array<RecommendSceneV2> | Recommend scene list. List responses do not guarantee full `Config`. |

V2 removed the V1 `TotalCount` and `Items[]` response fields. Use `Scenes[]`.
