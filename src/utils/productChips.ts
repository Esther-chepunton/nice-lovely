function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatPurposeChip(purpose: string): string {
  const segments = purpose.split(";").map((segment) => segment.trim());

  if (segments.length >= 2) {
    const finish = segments[1]
      .replace(/^leaves (a )?/i, "")
      .split(",")[0]
      .trim();
    const leadWord = segments[0].split(",")[0].trim().split(/\s+/)[0];
    return `${capitalize(finish)} · ${capitalize(leadWord)}`;
  }

  const first = segments[0].split(",")[0].trim();
  return first.length > 30 ? `${first.slice(0, 27)}…` : first;
}

export function formatWhoChip(who: string): string {
  const parts: string[] = [];

  if (/normal\/oily|oily/i.test(who)) {
    parts.push("Oily");
  } else if (/very dry|extremely dry|dry to very dry|dry-skin/i.test(who)) {
    parts.push("Dry skin");
  } else if (/sensitive|irritation-prone/i.test(who)) {
    parts.push("Sensitive");
  } else if (/everyday|normal to slightly dry/i.test(who)) {
    parts.push("Everyday");
  } else if (/glow-focused|nourishing daily/i.test(who)) {
    parts.push("Glow-focused");
  }

  const climateMatch = who.match(/(?:especially in |in )([^,;.]+)/i);
  if (climateMatch) {
    parts.push(climateMatch[1].trim());
  }

  if (parts.length > 0) {
    return parts.join(" / ");
  }

  const fallback = who
    .replace(/^People with /i, "")
    .replace(/^Users /i, "")
    .split(/[,;]/)[0]
    .trim();

  return fallback.length > 30 ? `${fallback.slice(0, 27)}…` : fallback;
}

export function formatSizesChip(sizes: string[]): string {
  return sizes.join(" · ");
}
