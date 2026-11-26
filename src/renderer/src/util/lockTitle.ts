/** Clips made by hand only have a name like "Through ball 1"; without the number it is the move shown on the lock */
export function nameWithoutNumber(name: string | undefined): string {
  return (name ?? '').replace(/\s+\d+\s*$/, '').trim();
}

/** "דין עישת Through ball 1" -> player "דין עישת" and move "Through ball" (leading non-English words, then English) */
export function splitClipName(name: string | undefined): { player: string, action: string } {
  const whole = nameWithoutNumber(name);
  const words = whole.split(/\s+/).filter(Boolean);
  const firstEnglish = words.findIndex((w) => /[A-Za-z]/.test(w));
  if (firstEnglish <= 0) return { player: '', action: whole };
  return { player: words.slice(0, firstEnglish).join(' '), action: words.slice(firstEnglish).join(' ') };
}
