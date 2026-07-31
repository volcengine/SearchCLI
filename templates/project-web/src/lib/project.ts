export const projectFeatures = ["search", "recommend", "chat"] as const;

export type ProjectFeature = (typeof projectFeatures)[number];
