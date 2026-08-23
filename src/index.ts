export { StackContainer } from './StackContainer';
export { StackCard } from './StackCard';
export { useStackProgress, computeProgress } from './useStackProgress';
export { refresh as refreshStack } from './scheduler';

export type {
  Length,
  StackFrom,
  StackEffects,
  StackLayout,
  StackContainerProps,
  StackCardProps,
  UseStackProgressOptions,
} from './types';

import { StackContainer } from './StackContainer';
import { StackCard } from './StackCard';

/**
 * @deprecated Renamed to `StackContainer` in v2. This alias still works and
 * has no removal date, but new code should use the full name.
 */
export const Outer = StackContainer;

/**
 * @deprecated Renamed to `StackCard` in v2. This alias still works and has no
 * removal date, but new code should use the full name.
 */
export const Card = StackCard;
