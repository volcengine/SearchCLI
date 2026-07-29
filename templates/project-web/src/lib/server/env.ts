import "server-only";

import {
  projectFeatures,
  type ProjectFeature,
} from "@/lib/project";

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readFeatures(): ProjectFeature[] {
  const configured = new Set(
    (optionalEnv("VIKING_FEATURES") ?? "")
      .split(",")
      .map((feature) => feature.trim()),
  );
  return projectFeatures.filter((feature) => configured.has(feature));
}

export const env = {
  appId: optionalEnv("VIKING_APP_ID") ?? "",
  apiKey: optionalEnv("VIKING_API_KEY"),
  accessKeyId: optionalEnv("VIKING_AK"),
  secretAccessKey: optionalEnv("VIKING_SK"),
  region: optionalEnv("VIKING_REGION"),
  features: readFeatures(),
  searchSceneId: optionalEnv("VIKING_SEARCH_SCENE_ID") ?? "",
  searchDatasetId: optionalEnv("VIKING_SEARCH_DATASET_ID") ?? "",
  recSceneId: optionalEnv("VIKING_REC_SCENE_ID") ?? "",
};
