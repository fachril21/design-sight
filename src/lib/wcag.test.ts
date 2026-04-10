import { describe, expect, it } from 'vitest';
import { hexToRgb, getLuminance, getContrastRatio, passesWCAG } from './wcag';

describe('WCAG Math Engine', () => {
  it('correctly converts hex to RGB', () => {
    expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
    
    // Short hex format
    expect(hexToRgb('#F00')).toEqual({ r: 255, g: 0, b: 0 });
    
    // Without hashtag
    expect(hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('correctly calculates relative luminance', () => {
    expect(getLuminance(0, 0, 0)).toBeCloseTo(0);
    expect(getLuminance(255, 255, 255)).toBeCloseTo(1);
    expect(getLuminance(255, 0, 0)).toBeCloseTo(0.2126);
    expect(getLuminance(0, 255, 0)).toBeCloseTo(0.7152);
    expect(getLuminance(0, 0, 255)).toBeCloseTo(0.0722);
  });

  it('correctly calculates standard WebAIM contrast cases', () => {
    // Black and white
    expect(getContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21);
    expect(getContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21);
    
    // Same colors
    expect(getContrastRatio('#123456', '#123456')).toBeCloseTo(1);
    expect(getContrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1);
    
    // Known WebAIM examples
    // Example: #0000FF (blue) and #FFFFFF (white)
    expect(getContrastRatio('#0000FF', '#FFFFFF')).toBeCloseTo(8.59, 1);
    
    // Example: #767676 and #FFFFFF
    expect(getContrastRatio('#767676', '#FFFFFF')).toBeCloseTo(4.54, 1);
  });

  it('validates pass/fail properly', () => {
    expect(passesWCAG(4.5, 'normal')).toBe(true);
    expect(passesWCAG(4.49, 'normal')).toBe(false);
    
    expect(passesWCAG(3.0, 'large')).toBe(true);
    expect(passesWCAG(2.99, 'large')).toBe(false);
    expect(passesWCAG(4.5, 'large')).toBe(true);
  });
});
