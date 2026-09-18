// Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
// SPDX-License-Identifier: Apache-2.0

export type ItemTypeResultMode = 'variant' | 'parent';

export function normalizeItemTypeResultMode(value: string | undefined): ItemTypeResultMode | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'variant' || normalized === 'parent') return normalized;
  throw new Error(`Invalid item type result mode: ${value}. Expected variant or parent.`);
}

export function buildItemTypeFilterConfig(itemTypeField: string, itemTypeResult: ItemTypeResultMode): Record<string, unknown> {
  const field = itemTypeField.trim();
  if (!field) {
    throw new Error('--item-type-field cannot be empty.');
  }
  if (itemTypeResult === 'parent') {
    return {
      ForParent: true,
      Filter: {
        field,
        op: 'must',
        conds: ['parent']
      }
    };
  }
  return {
    ForParent: false,
    Filter: {
      field,
      op: 'must_not',
      conds: ['parent']
    }
  };
}
