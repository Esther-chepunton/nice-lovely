function parseHex(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function componentToHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, "0");
}

/** Linearly interpolate between two hex colors (0 ≤ t ≤ 1). */
export function lerpHexColor(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const bVal = b1 + (b2 - b1) * t;
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(bVal)}`;
}

/** Blend across a color array at a fractional index. */
export function blendColors(colors: string[], fractionalIndex: number): string {
  const clamped = Math.max(0, Math.min(colors.length - 1, fractionalIndex));
  const lower = Math.floor(clamped);
  const upper = Math.min(lower + 1, colors.length - 1);
  const t = clamped - lower;
  return lerpHexColor(colors[lower], colors[upper], t);
}

/** Blend across a circular color array (wraps from last → first). */
export function blendColorsCircular(
  colors: string[],
  fractionalIndex: number,
): string {
  const count = colors.length;
  if (count === 0) return "#000000";
  if (count === 1) return colors[0];

  const normalized = ((fractionalIndex % count) + count) % count;
  const lower = Math.floor(normalized) % count;
  const upper = (lower + 1) % count;
  const t = normalized - Math.floor(normalized);
  return lerpHexColor(colors[lower], colors[upper], t);
}
