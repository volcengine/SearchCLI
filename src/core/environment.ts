// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

export type EnvironmentId =
  | 'volcano-cn-beijing'
  | 'volcano-ap-southeast-1'
  | 'byteplus-ap-southeast-1';

export interface EnvironmentEndpoints {
  envId: EnvironmentId;
  region: string;
  controlPlaneBaseUrl: string;
  dataPlaneBaseUrl: string;
  purchasePageUrl: string;
}

export const VOLCANO_PURCHASE_CN_BEIJING_PROD_URL = 'https://console.volcengine.com/common-buy/REC-SaaS-LLM-SEARCH%7C%7C7291580783171539244'
const VOLCANO_PURCHASE_CN_BEIJING_PAGE_URL = VOLCANO_PURCHASE_CN_BEIJING_PROD_URL;

const ENVIRONMENT_REGISTRY: readonly EnvironmentEndpoints[] = [
  {
    envId: 'volcano-cn-beijing',
    region: 'cn-beijing',
    controlPlaneBaseUrl: 'https://aisearch.cn-beijing.volcengineapi.com',
    dataPlaneBaseUrl: 'https://aisearch.cn-beijing.volces.com',
    purchasePageUrl: VOLCANO_PURCHASE_CN_BEIJING_PAGE_URL
  },
  {
    envId: 'volcano-ap-southeast-1',
    region: 'ap-southeast-1',
    controlPlaneBaseUrl: 'https://aisearch.ap-southeast-1.volcengineapi.com',
    dataPlaneBaseUrl: 'https://aisearch.ap-southeast-1.volces.com',
    purchasePageUrl: 'https://console.volcengine.com/common-buy/REC-SaaS-LLM-SEARCH%7C%7C7406000721643196716'
  },
  {
    envId: 'byteplus-ap-southeast-1',
    region: 'ap-southeast-1',
    controlPlaneBaseUrl: 'https://aisearch.ap-southeast-1.byteplusapi.com',
    dataPlaneBaseUrl: 'https://aisearch.ap-southeast-1.bytepluses.com',
    purchasePageUrl: 'https://console.byteplus.com/common-buy/REC-SaaS-LLM-SEARCH%7C%7C7291575107170881836'
  }
];

export const DEFAULT_ENVIRONMENT_ID: EnvironmentId = 'volcano-cn-beijing';

export const DEFAULT_CONTROL_PLANE_BASE_URL =
  ENVIRONMENT_REGISTRY[0].controlPlaneBaseUrl;
export const DEFAULT_DATA_PLANE_BASE_URL =
  ENVIRONMENT_REGISTRY[0].dataPlaneBaseUrl;
export const DEFAULT_REGION = ENVIRONMENT_REGISTRY[0].region;

export function listEnvironments(): readonly EnvironmentEndpoints[] {
  return ENVIRONMENT_REGISTRY;
}

export function getEnvironmentById(envId: EnvironmentId): EnvironmentEndpoints {
  const found = ENVIRONMENT_REGISTRY.find(env => env.envId === envId);
  if (!found) {
    throw new Error(`Unknown environment id: ${envId}`);
  }
  return found;
}

export function resolvePurchasePageUrl(environmentId: EnvironmentId): {
  environmentId: EnvironmentId;
  purchasePageUrl: string;
} {
  const env = getEnvironmentById(environmentId);
  return {
    environmentId,
    purchasePageUrl: env.purchasePageUrl
  };
}

function safeHost(input: string): string | undefined {
  try {
    return new URL(input).host.toLowerCase();
  } catch {
    return undefined;
  }
}

function originOf(input: string): string {
  return new URL(input).origin;
}

export function detectEnvironmentFromBaseUrl(
  input: string
): EnvironmentEndpoints | undefined {
  const host = safeHost(input);
  if (!host) return undefined;

  for (const env of ENVIRONMENT_REGISTRY) {
    const controlHost = safeHost(env.controlPlaneBaseUrl);
    const dataHost = safeHost(env.dataPlaneBaseUrl);
    if (controlHost === host || dataHost === host) {
      return env;
    }
  }
  return undefined;
}

export interface DeriveEndpointsInput {
  controlPlaneBaseUrl?: string;
  dataPlaneBaseUrl?: string;
  baseUrl?: string;
  region?: string;
}

export interface ResolvedEndpoints {
  envId?: EnvironmentId;
  region: string;
  controlPlaneBaseUrl: string;
  dataPlaneBaseUrl: string;
  source: 'environment-registry' | 'explicit-pair' | 'default';
}

export function resolveEndpointsOrThrow(
  input: DeriveEndpointsInput
): ResolvedEndpoints {
  const explicitControl = input.controlPlaneBaseUrl
    ? originOf(input.controlPlaneBaseUrl)
    : undefined;
  const explicitData = input.dataPlaneBaseUrl
    ? originOf(input.dataPlaneBaseUrl)
    : undefined;

  if (explicitControl && explicitData) {
    const env =
      detectEnvironmentFromBaseUrl(explicitControl) ??
      detectEnvironmentFromBaseUrl(explicitData);
    return {
      envId: env?.envId,
      region: input.region ?? env?.region ?? DEFAULT_REGION,
      controlPlaneBaseUrl: explicitControl,
      dataPlaneBaseUrl: explicitData,
      source: env ? 'environment-registry' : 'explicit-pair'
    };
  }

  const candidate = explicitControl ?? explicitData ?? input.baseUrl;
  if (candidate) {
    const env = detectEnvironmentFromBaseUrl(candidate);
    if (env) {
      return {
        envId: env.envId,
        region: input.region ?? env.region,
        controlPlaneBaseUrl: explicitControl ?? env.controlPlaneBaseUrl,
        dataPlaneBaseUrl: explicitData ?? env.dataPlaneBaseUrl,
        source: 'environment-registry'
      };
    }

    if (explicitControl || explicitData) {
      throw new Error(
        `Unrecognized base URL "${candidate}". Provide both --control-plane-base-url and --data-plane-base-url (or VIKING_CONTROL_PLANE_BASE_URL and VIKING_DATA_PLANE_BASE_URL) for custom deployments.`
      );
    }

    throw new Error(
      `Unrecognized base URL "${candidate}". Use one of the supported environments (Volcano cn-beijing / Volcano ap-southeast-1 / BytePlus ap-southeast-1) or provide both --control-plane-base-url and --data-plane-base-url.`
    );
  }

  return {
    envId: DEFAULT_ENVIRONMENT_ID,
    region: input.region ?? DEFAULT_REGION,
    controlPlaneBaseUrl: DEFAULT_CONTROL_PLANE_BASE_URL,
    dataPlaneBaseUrl: DEFAULT_DATA_PLANE_BASE_URL,
    source: 'default'
  };
}
