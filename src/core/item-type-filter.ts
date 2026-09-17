// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

export type ItemTypeResultMode = 'variant' | 'parent';

export function normalizeItemTypeResultMode(value: ItemTypeResultMode | undefined): ItemTypeResultMode {
  if (!value) {
    return 'variant';
  }
  if (value === 'variant' || value === 'parent') {
    return value;
  }
  throw new Error(`Invalid item type result mode: ${value}. Expected variant or parent.`);
}

export function buildItemTypeFilterConfig(itemTypeField: string | undefined, itemTypeResult: ItemTypeResultMode): Record<string, unknown> | undefined {
  if (!itemTypeField) {
    return undefined;
  }
  if (itemTypeResult === 'parent') {
    return {
      ForParent: true,
      Filter: {
        op: 'must',
        field: itemTypeField,
        conds: ['parent']
      }
    };
  }
  return {
    ForParent: false,
    Filter: {
      op: 'must_not',
      field: itemTypeField,
      conds: ['parent']
    }
  };
}
