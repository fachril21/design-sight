import type { GameModule } from '@/lib/gameModule';
import { dummyGame } from '@/games/dummy';
import { kernDuelGame } from '@/games/kern-duel';

/**
 * Game module registry (Epic 02). Adding a game = add its folder under
 * src/games/ and one entry here — zero changes to round-flow code (AC 1).
 * Modules are stored type-erased; RoundFlow re-narrows at the render seam.
 */
const MODULES: ReadonlyArray<GameModule> = [
  dummyGame as unknown as GameModule,
  kernDuelGame as unknown as GameModule,
];

export function getGameModule(slug: string): GameModule | undefined {
  return MODULES.find((m) => m.slug === slug);
}

export function listGameModules(): ReadonlyArray<GameModule> {
  return MODULES;
}
