'use client';

import { createContext, useContext } from 'react';
import type { StackEffects, StackLayout } from './types';

export interface StackContextValue extends Required<StackLayout>, Required<StackEffects> {
  /** Position assigned to the card currently being rendered. */
  index: number;
  /** How many cards the container found. Needed to stack from the bottom. */
  count: number;
}

/** Used both as the default offset and as the numeric fallback when a
 * non-pixel offset cannot be resolved from the DOM. */
export const DEFAULT_OFFSET_PX = 25;

/** Everything a card can inherit, with nothing left optional. */
export type StackSettings = Omit<StackContextValue, 'index' | 'count'>;

export const DEFAULTS: StackSettings = {
  offset: DEFAULT_OFFSET_PX,
  height: '100vh',
  inset: 0,
  stackFrom: 'top',
  scaleStep: 0,
  fadeStep: 0,
  rotateStep: 0,
  respectReducedMotion: true,
};

/**
 * `null` when a card is rendered outside a container. That is allowed — the
 * card just falls back to its own props and an index of 0.
 */
export const StackContext = createContext<StackContextValue | null>(null);

export function useStackContext(): StackContextValue | null {
  return useContext(StackContext);
}
