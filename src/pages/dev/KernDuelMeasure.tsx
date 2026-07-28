import { useState } from 'react';
import { ArcadeButton } from '@/components/ui/ArcadeButton';
import { KERN_DUEL_FONTS } from '@/games/kern-duel/fonts';
import words from '@/games/kern-duel/content/words.json';

interface WordEntry {
  word: string;
  fontKey: string;
  difficulty: 1 | 2 | 3;
  overrideOffsets?: number[];
}

interface MeasuredWord {
  word: string;
  fontKey: string;
  difficulty: number;
  letters: string[];
  naturalPositions: number[];
  kernedPositions: number[];
}

const FONT_SIZE_PX = 64;

/**
 * Dev-only content-measurement tool (Epic 03, plan §2.4 step 2). Loads
 * each round's real webfont and measures actual glyph positions with
 * `font-kerning: none` vs `normal` — the reference kerning solution comes
 * from the font's own GPOS table, not a guess. Never registered outside
 * `import.meta.env.DEV` (see App.tsx), so it never ships to production.
 *
 * `font-variant-ligatures: none` is forced here to match live rendering
 * exactly (plan K9) — a ligature merging two letters would silently break
 * index-based positioning.
 */
export function KernDuelMeasure() {
  const [status, setStatus] = useState('idle');
  const [output, setOutput] = useState<MeasuredWord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const measureWord = (word: string, cssFamily: string): { natural: number[]; kerned: number[] } => {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.fontFamily = cssFamily;
    container.style.fontSize = `${FONT_SIZE_PX}px`;
    (container.style as unknown as { fontVariantLigatures: string }).fontVariantLigatures = 'none';
    document.body.appendChild(container);

    // IMPORTANT: measure within a SINGLE text run, not one span per letter.
    // Kerning is a pairwise adjustment between adjacent glyphs in the same
    // shaping run — isolating each letter in its own span (the first draft
    // of this function did that) removes any neighbor to kern against, so
    // font-kerning:normal silently becomes a no-op. Range-per-character
    // positions inside one text node preserve real shaping in both modes.
    // (Range offsets are UTF-16 code units; fine for the ASCII/BMP starter
    // word list — see the module README for the multi-byte caveat.)
    const measureWith = (kerning: 'none' | 'normal'): number[] => {
      container.innerHTML = '';
      (container.style as unknown as { fontKerning: string }).fontKerning = kerning;
      const textNode = document.createTextNode(word);
      container.appendChild(textNode);
      const containerLeft = container.getBoundingClientRect().left;
      const positions: number[] = [];
      for (let i = 0; i < word.length; i++) {
        const range = document.createRange();
        range.setStart(textNode, i);
        range.setEnd(textNode, i + 1);
        positions.push(range.getBoundingClientRect().left - containerLeft);
      }
      return positions;
    };

    const natural = measureWith('none');
    const kerned = measureWith('normal');
    document.body.removeChild(container);
    return { natural, kerned };
  };

  const run = async () => {
    setStatus('measuring');
    setError(null);
    try {
      const entries = words as WordEntry[];
      const results: MeasuredWord[] = [];
      for (const entry of entries) {
        const spec = KERN_DUEL_FONTS[entry.fontKey];
        if (!spec) throw new Error(`Unknown fontKey "${entry.fontKey}" for word "${entry.word}"`);
        if (Array.from(entry.word).length < 3) {
          throw new Error(`Word "${entry.word}" has fewer than 3 letters (plan K3)`);
        }
        const face = new FontFace(spec.cssFamily, `url(${spec.woff2Url}) format('woff2')`);
        const loaded = await face.load();
        document.fonts.add(loaded);
        const { natural, kerned } = measureWord(entry.word, spec.cssFamily);
        results.push({
          word: entry.word,
          fontKey: entry.fontKey,
          difficulty: entry.difficulty,
          letters: Array.from(entry.word),
          naturalPositions: natural,
          kernedPositions: kerned,
        });
      }
      setOutput(results);
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      <h1 className="font-display text-2xl">Kern Duel content measurement (dev only)</h1>
      <p className="text-arcade-muted text-sm">
        Measures real font kerning for every entry in words.json. Copy the JSON output into
        scripts/kern-duel/measured-output.json, then run the seed generator.
      </p>
      <ArcadeButton onClick={() => void run()} disabled={status === 'measuring'}>
        {status === 'measuring' ? 'Measuring…' : 'Run measurement'}
      </ArcadeButton>
      {error && <p className="text-arcade-accent text-sm">{error}</p>}
      {output && (
        <textarea
          readOnly
          className="w-full h-96 bg-arcade-bg border-2 border-arcade-border p-3 font-mono text-xs"
          value={JSON.stringify(output, null, 2)}
        />
      )}
    </main>
  );
}
