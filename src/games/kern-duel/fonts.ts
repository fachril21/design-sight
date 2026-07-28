/**
 * Kern Duel font manifest (Epic 03, plan §2.5). Self-hosted under
 * public/fonts/kern-duel/, lazy-loaded per round (never all four at once)
 * via the CSS Font Loading API. Each entry's license text ships alongside
 * its woff2 (K13: license compliance is a real requirement, not a footnote).
 */
export interface KernDuelFontSpec {
  cssFamily: string;
  woff2Url: string;
  licenseUrl: string;
}

export const KERN_DUEL_FONTS: Record<string, KernDuelFontSpec> = {
  poppins: {
    cssFamily: 'KernDuel Poppins',
    woff2Url: '/fonts/kern-duel/poppins.woff2',
    licenseUrl: '/fonts/kern-duel/LICENSE-poppins.txt',
  },
  'playfair-display': {
    cssFamily: 'KernDuel Playfair Display',
    woff2Url: '/fonts/kern-duel/playfair-display.woff2',
    licenseUrl: '/fonts/kern-duel/LICENSE-playfair-display.txt',
  },
  inter: {
    cssFamily: 'KernDuel Inter',
    woff2Url: '/fonts/kern-duel/inter.woff2',
    licenseUrl: '/fonts/kern-duel/LICENSE-inter.txt',
  },
  merriweather: {
    cssFamily: 'KernDuel Merriweather',
    woff2Url: '/fonts/kern-duel/merriweather.woff2',
    licenseUrl: '/fonts/kern-duel/LICENSE-merriweather.txt',
  },
};

/** System-font fallback family used whenever a webfont fails to load in time (K1). */
export const KERN_DUEL_FALLBACK_FAMILY = 'system-ui, sans-serif';

const LOAD_TIMEOUT_MS = 4000;
const loaded = new Set<string>();

/**
 * Loads a round's font, resolving to the family to actually render with.
 * Never rejects: on 404/timeout it resolves to the fallback family so a
 * round can never render blank (K1).
 */
export async function loadKernDuelFont(fontKey: string): Promise<string> {
  const spec = KERN_DUEL_FONTS[fontKey];
  if (!spec) return KERN_DUEL_FALLBACK_FAMILY;
  if (loaded.has(fontKey)) return spec.cssFamily;

  const timeout = new Promise<'timeout'>((resolve) =>
    setTimeout(() => resolve('timeout'), LOAD_TIMEOUT_MS),
  );

  try {
    const face = new FontFace(spec.cssFamily, `url(${spec.woff2Url}) format('woff2')`);
    const result = await Promise.race([face.load(), timeout]);
    if (result === 'timeout') return KERN_DUEL_FALLBACK_FAMILY;
    document.fonts.add(result);
    loaded.add(fontKey);
    return spec.cssFamily;
  } catch {
    return KERN_DUEL_FALLBACK_FAMILY;
  }
}
