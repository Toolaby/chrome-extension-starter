import extension from '../extension.json';

/**
 * What the extension is called, its colour, and which of its parts it has: extension.json, the one file to edit
 * for any of them. Turning a part off there hides it everywhere; delete its folder too (README, "Make it yours").
 * The generator at toolaby.app/create writes this file.
 */
export const brand = extension;

/** Puts the accent, and the text that reads on it, into the page's colour tokens. Each page calls it before it draws. */
export function paintBrand(title?: string) {
  const root = document.documentElement;
  root.style.setProperty('--accent', brand.accent);
  root.style.setProperty('--accent-ink', inkOn(brand.accent));
  document.title = title ?? brand.name;
}

/** Near-black on a light accent, white on a dark one: whichever of the two reads better (WCAG contrast). */
export function inkOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (l + 0.05) / 0.0556 >= 1.05 / (l + 0.05) ? '#101114' : '#ffffff';
}
