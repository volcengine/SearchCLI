// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

import { Help, type Command } from '@oclif/core';
import { withOpenApiReferenceHint } from './help-utils';

export default class OpenApiHelp extends Help {
  override async showCommandHelp(command: Command.Loadable): Promise<void> {
    await super.showCommandHelp(command);
    this.log(withOpenApiReferenceHint(''));
  }
}
