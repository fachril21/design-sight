import { describe, it, expect } from 'vitest';
import { hexToRgb, getLuminance, getContrastRatio, passesWCAG, rgbToHex } from './wcag';

describe('WCAG Math Functions', () => {
  it('converts hex to rgb correctly', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('123456')).toEqual({ r: 18, g: 52, b: 86 });
  });

  it('handles shorthand hex codes', () => {
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('369')).toEqual({ r: 51, g: 102, b: 153 });
  });

  it('converts rgb to hex correctly', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#FFFFFF');
    expect(rgbToHex(255, 0, 0)).toBe('#FF0000');
  });

  it('calculates expected luminance values', () => {
    // Pure black and pure white
    expect(getLuminance(0, 0, 0)).toBeCloseTo(0, 4);
    expect(getLuminance(255, 255, 255)).toBeCloseTo(1, 4);
    
    // Pure red (WCAG standard mapping)
    expect(getLuminance(255, 0, 0)).toBeCloseTo(0.2126, 4);
  });

  it('calculates the precise contrast ratio', () => {
    // Black and white should be 21:1
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
    
    // Identical colors should be 1:1
    expect(getContrastRatio('#123456', '#123456')).toBeCloseTo(1, 2);

    // Some specific tested values from WCAG color contrast analyzer tools
    // Red (#FF0000) and White (#FFFFFF) is ~ 3.998:1
    expect(getContrastRatio('#FF0000', '#FFFFFF')).toBeCloseTo(3.998, 2);
    
    // Blue (#0000FF) and White (#FFFFFF) is ~ 8.59:1
    expect(getContrastRatio('#0000FF', '#FFFFFF')).toBeCloseTo(8.59, 2);
  });

  it('validates pass/fail properly', () => {
    // White on Black - 21:1
    expect(passesWCAG(21, 'normal')).toBe(true);
    expect(passesWCAG(21, 'large')).toBe(true);

    // Red on White - ~4.0:1
    expect(passesWCAG(4.0, 'normal')).toBe(false);
    expect(passesWCAG(4.0, 'large')).toBe(true); // Passes for large text since >= 3.0
    
    // Low contrast - 1.5:1
    expect(passesWCAG(1.5, 'normal')).toBe(false);
    expect(passesWCAG(1.5, 'large')).toBe(false);
    
    // Exactly 4.5
    expect(passesWCAG(4.5, 'normal')).toBe(true);
    
    // Exactly 3.0
    expect(passesWCAG(3.0, 'large')).toBe(true);
    expect(passesWCAG(3.0, 'normal')).toBe(false);
  });
});
