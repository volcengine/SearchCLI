# DeleteRecommendSceneV2

## Overview

- API name: `DeleteRecommendSceneV2`
- Category: Control Plane - Scene
- Description: Deletes a V2 recommend scene.

## IDL Definition

```proto
message DeleteRecommendSceneV2Req {
  string ProjectName   = 1;
  string ApplicationId = 2;
  string SceneId       = 3;
  bool DryRun          = 11;
}

message EmptyResp {}
```

## Request Parameters

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ProjectName` | string | No | Project name. |
| `ApplicationId` | string | Yes | Application ID. |
| `SceneId` | string | Yes | Recommend scene ID. |
| `DryRun` | bool | No | Validate only; do not delete. |

## CLI Notes

Use `vs recommend scene delete --dry-run` to validate deletion without removing the scene.
