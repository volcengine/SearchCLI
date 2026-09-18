// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

export interface ConsoleTopAction {
  action: string;
  path: string;
  version: string;
  description: string;
  command?: string;
  payload?: unknown;
  category?: string;
  rpcName?: string;
}

const PUBLIC_CONSOLE_TOP_ACTIONS: ConsoleTopAction[] = [
  {
    action: 'GetAppOnlineConfigV2',
    path: '/open/GetAppOnlineConfigV2',
    version: '2025-03-01',
    description: 'Get application online config through the console API.',
    command: 'vs app online-config get --application-id <app>',
    payload: { ApplicationId: 'app_123', ProjectName: 'default' },
    category: 'application'
  },
  {
    action: 'PublishAppOnlineConfigV2',
    path: '/open/PublishAppOnlineConfigV2',
    version: '2025-03-01',
    description: 'Publish application online config through the console API.',
    command: 'vs app online-config update --application-id <app> --config @online-config.json',
    payload: {
      ApplicationId: 'app_123',
      Config: { ChatConfig: { SearchSceneId: 'search_scene_default', OpeningRemarksConfig: {} } },
      ProjectName: 'default'
    },
    category: 'application'
  }
];

export function listConsoleTopActions(): ConsoleTopAction[] {
  return PUBLIC_CONSOLE_TOP_ACTIONS.map(action => ({ ...action }));
}

export function getConsoleTopAction(nameOrPath: string): ConsoleTopAction | undefined {
  const lookup = nameOrPath.trim().toLowerCase();
  return PUBLIC_CONSOLE_TOP_ACTIONS.find(
    action => action.action.toLowerCase() === lookup || action.path.toLowerCase() === lookup
  );
}
