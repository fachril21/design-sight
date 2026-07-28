/**
 * Kern Duel payload/answer shapes (Epic 03, plan §2.1/§2.3).
 * INVARIANT: this type must never be able to represent kerned/truth
 * positions — only naturalPositions (the neutral starting layout) ships
 * to the client pre-submission. payloadPurity.test.ts pins this.
 */
export interface KernDuelPayload {
  word: string;
  /** Split by Unicode code point (Array.from), not UTF-16 code unit. */
  letters: string[];
  fontKey: string;
  /** Cumulative unkerned x-position per letter, in px. Same length as letters. */
  naturalPositions: number[];
  /** Always [0, letters.length - 1] for v1 (first + last locked). */
  lockedIndices: number[];
  minOffsetPx: number;
  maxOffsetPx: number;
  difficulty: 1 | 2 | 3;
}

export interface KernDuelAnswerShape {
  /** Player's offset in px per letter index; 0 for locked letters. */
  offsets: number[];
}
