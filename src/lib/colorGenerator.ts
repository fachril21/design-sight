import { getContrastRatio, passesWCAG, rgbToHex } from './wcag';

export type BackgroundType = 'solid' | 'gradient' | 'pattern';

export interface GameRoundColors {
  backgroundStr: string; // The CSS value (e.g. "#123456", "linear-gradient(...)", "url(...)")
  backgroundType: BackgroundType;
  primaryBgColor: string; // The base HEX hex used for calculation (solid color)
  foregroundColor: string; // The text color
  ratio: number;
  passesNormal: boolean;
  passesLarge: boolean;
}

function randomHex(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
}

// Generate base colors, ensuring they are not pure black & white
function generateBaseColors(): { bg: string, fg: string } {
  let bg = randomHex();
  let fg = randomHex();

  // Avoid pure black & white as it's too easy and boring
  const isPureBW = (c1: string, c2: string) => 
    (c1 === '#000000' && c2 === '#FFFFFF') || (c1 === '#FFFFFF' && c2 === '#000000');
  
  while (isPureBW(bg, fg)) {
    bg = randomHex();
    fg = randomHex();
  }

  return { bg, fg };
}

// Lightens or darkens a hex color slightly for gradient purposes
function slightlyShiftColor(hex: string): string {
  // Simple heuristic: just generate a random color for now
  // For better visual design, we typically blend it. Here we just return another random one.
  return randomHex();
}

export function generateColorCombination(): GameRoundColors {
  const targetNeedsPass = Math.random() < 0.5;
  const maxAttempts = 50;
  
  let result: GameRoundColors | null = null;

  for (let i = 0; i < maxAttempts; i++) {
    const { bg, fg } = generateBaseColors();
    const ratio = getContrastRatio(bg, fg);
    const passesNormal = passesWCAG(ratio, 'normal');
    
    // Check if it fits our bucket criteria
    if (passesNormal === targetNeedsPass || i === maxAttempts - 1) {
      // It fits (or we ran out of attempts, just take the last one)
      
      const rand = Math.random();
      let type: BackgroundType = 'solid';
      let backgroundStr = bg;

      // 70% solid, 20% gradient, 10% pattern
      if (rand >= 0.9) {
        type = 'pattern';
        // Mock pattern using dots/stripes mapping
        backgroundStr = `radial-gradient(${fg} 1px, ${bg} 1px)`; // simplified pattern styling for CSS
      } else if (rand >= 0.7) {
        type = 'gradient';
        const bg2 = slightlyShiftColor(bg);
        backgroundStr = `linear-gradient(135deg, ${bg}, ${bg2})`;
      }

      result = {
        backgroundStr,
        backgroundType: type,
        primaryBgColor: bg,
        foregroundColor: fg,
        ratio,
        passesNormal,
        passesLarge: passesWCAG(ratio, 'large')
      };
      break;
    }
  }

  // Fallback if loop finishes without assign (should never happen)
  if (!result) {
    const defaultBg = '#1E1E1E';
    const defaultFg = '#FFFFFF';
    return {
      backgroundStr: defaultBg,
      backgroundType: 'solid',
      primaryBgColor: defaultBg,
      foregroundColor: defaultFg,
      ratio: getContrastRatio(defaultBg, defaultFg),
      passesNormal: true,
      passesLarge: true
    };
  }
  
  return result;
}
