/** WCAG 2 relative luminance of a `#rrggbb` colour. */
function luminance(hex: string): number {
  const [red = 0, green = 0, blue = 0] = [1, 3, 5].map((start) => {
    const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** WCAG 2 contrast ratio, from 1 to 21. */
export function contrastRatio(first: string, second: string): number {
  const [light = 0, dark = 0] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** The colour tokens of index.css, by name without `--color-`. */
export function readColourTokens(css: string): Readonly<Record<string, string>> {
  const tokens = [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6});/g)];
  return Object.fromEntries(tokens.map(([, name = '', value = '']) => [name, value]));
}
