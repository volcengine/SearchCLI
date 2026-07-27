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
    action: 'CreateDataSourceSubscription',
    path: '/open/CreateDataSourceSubscription',
    version: '2025-03-01',
    description: 'Create a dataset data source subscription.',
    command: 'vs dataset subscription create --data @create-subscription.json',
    category: 'dataset'
  },
  {
    action: 'CloseDataSourceSubscription',
    path: '/open/CloseDataSourceSubscription',
    version: '2025-03-01',
    description: 'Close a dataset data source subscription.',
    command: 'vs dataset subscription close --task-id <task>',
    category: 'dataset'
  },
  {
    action: 'GetDataSourceSubscription',
    path: '/open/GetDataSourceSubscription',
    version: '2025-03-01',
    description: 'Get a dataset data source subscription.',
    command: 'vs dataset subscription get --task-id <task>',
    category: 'dataset'
  },
  {
    action: 'ListDataSourceSubscriptions',
    path: '/open/ListDataSourceSubscriptions',
    version: '2025-03-01',
    description: 'List dataset data source subscriptions in a project.',
    command: 'vs dataset subscription list',
    category: 'dataset'
  },
  {
    action: 'GetAppOnlineConfig',
    path: '/api/v1/GetAppOnlineConfig',
    version: '2025-03-01',
    description: 'Get application online config through the console API.',
    command: 'vs app online-config get --application-id <app>',
    payload: { AppID: 'app_123', ProjectName: 'default' },
    category: 'application'
  },
  {
    action: 'UpsertAppOnlineConfig',
    path: '/api/v1/UpsertAppOnlineConfig',
    version: '2025-03-01',
    description: 'Create or update application online config through the console API.',
    command: 'vs app online-config update --application-id <app> --config @online-config.json',
    payload: { AppID: 'app_123', Config: { ChatConfig: { SearchSceneID: 'search_scene_default' } }, ProjectName: 'default' },
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
