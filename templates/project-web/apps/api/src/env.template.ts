function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

const runtimeApiKey = optionalEnv("VIKING_API_KEY");
const runtimeAccessKeyId = optionalEnv("VIKING_AK");
const runtimeSecretAccessKey = optionalEnv("VIKING_SK");
const runtimeUsesAccessKey = Boolean(runtimeAccessKeyId || runtimeSecretAccessKey);

export const apiEnv = {
  appId: process.env.VIKING_APP_ID ?? "{{APP_ID}}",
  authMode: "{{AUTH_MODE}}",
  apiKey: runtimeUsesAccessKey ? "" : runtimeApiKey ?? "{{API_KEY}}",
  accessKeyId: runtimeAccessKeyId ?? "{{ACCESS_KEY_ID}}",
  secretAccessKey: runtimeSecretAccessKey ?? "{{SECRET_ACCESS_KEY}}",
  region: optionalEnv("VIKING_REGION") ?? "{{REGION}}",
  features: "{{FEATURES}}".split(","),
  searchSceneId: process.env.VIKING_SEARCH_SCENE_ID ?? "{{SEARCH_SCENE_ID}}",
  searchDatasetId: process.env.VIKING_SEARCH_DATASET_ID ?? "{{SEARCH_DATASET_ID}}",
  recSceneId: process.env.VIKING_REC_SCENE_ID ?? "{{REC_SCENE_ID}}"
};
