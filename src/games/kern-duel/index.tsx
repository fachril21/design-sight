import type { GameModule } from '@/lib/gameModule';
import type { KernDuelAnswerShape, KernDuelPayload } from '@/games/kern-duel/types';
import { KernDuelPlay } from '@/games/kern-duel/KernDuelPlay';
import { KernDuelReveal } from '@/games/kern-duel/KernDuelReveal';

/**
 * Kern Duel game module (Epic 03). See src/games/kern-duel/README.md for
 * the content-authoring pipeline.
 */
export const kernDuelGame: GameModule<KernDuelPayload, KernDuelAnswerShape> = {
  slug: 'kern-duel',
  displayName: 'Kern Duel',
  tagline: 'Space the letters like a typographer.',
  Play: KernDuelPlay,
  Reveal: KernDuelReveal,
  validateAnswer: (a): a is KernDuelAnswerShape =>
    typeof a === 'object' &&
    a !== null &&
    Array.isArray((a as KernDuelAnswerShape).offsets) &&
    (a as KernDuelAnswerShape).offsets.every((n) => typeof n === 'number' && Number.isFinite(n)),
};
