// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

export function formatMissingVikingAuthMessage(): string {
  return [
    'You are not authenticated. To get started:',
    '- For runtime API access with an API key: set VIKING_API_KEY or pass --api-key.',
    '- If you already have AK/SK: run `vs auth login` or `vs auth import-env`.',
    '- If you are new to Viking AI Search: run `vs skill show vs-user-onboarding`.'
  ].join('\n');
}

export function formatMissingVikingControlPlaneAuthMessage(): string {
  return [
    'This command calls Viking OpenAPI/control-plane and requires AK/SK.',
    '- Configure AK/SK with `vs auth login`, `vs auth import-env`, or VIKING_AK/VIKING_SK.',
    '- Runtime API keys are only used for data-plane requests such as search, chat, and dataset item APIs.'
  ].join('\n');
}
