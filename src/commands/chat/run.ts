// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Command, Flags } from '@oclif/core';
import { runChatSearchRunCommand } from '../../app/product-commands';
import { serviceFlags } from '../../command-support/service-flags';

export default class ChatRun extends Command {
  static override description = 'Run the conversational search API with auto session creation when omitted. With --format json, the command emits one JSON document rather than NDJSON.';

  static override examples = [
    '<%= config.bin %> chat run --application-id 123 --message "recommend camping gear for a weekend trip"',
    '<%= config.bin %> chat run --application-id 123 --opening-remarks true',
    '<%= config.bin %> chat run --application-id 123 --message "summarize the top results" --format json'
  ];

  static override flags = {
    ...serviceFlags,
    'application-id': Flags.string({ required: true }),
    'session-id': Flags.string({ description: 'Optional chat session ID.' }),
    message: Flags.string({ description: 'The chat message.' }),
    'opening-remarks': Flags.boolean({
      allowNo: true,
      description: 'Whether to trigger opening remarks instead of normal chat.'
    }),
    'user-id': Flags.string({ description: 'Optional user ID.' }),
    'timeout-ms': Flags.integer({
      default: 60000
    })
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ChatRun);
    await runChatSearchRunCommand({
      baseUrl: flags['base-url'],
      accessKeyId: flags.ak,
      secretKey: flags.sk,
      region: flags.region,
      timeoutMs: flags['timeout-ms'],
      data: flags.data,
      applicationId: flags['application-id'],
      sessionId: flags['session-id'],
      message: flags.message,
      openingRemarks: flags['opening-remarks'],
      userId: flags['user-id']
    });
  }
}
