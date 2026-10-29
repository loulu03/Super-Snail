// Parses "Code Drop!" posts from the Super Snail Discord into structured entries.

const isoDay = (d) => d.toISOString().slice(0, 10);

export function parseCodeDrop(text, postedAt) {
  const lines = String(text ?? "").split(/\r?\n/).map((l) => l.trim());
  const start = lines.findIndex((l) => /^code drop/i.test(l));
  if (start === -1) return null;

  const postedOn = isoDay(new Date(postedAt));
  return {
    postedOn,
    expiresOn: parseExpiry(lines[start], postedOn),
    // Every non-empty line after the header is a code (codes contain spaces).
    codes: lines.slice(start + 1).filter((l) => l && !/https?:|[<>]/.test(l)),
  };
}

// "They expired around 12/25" has no year: take the first such date on/after the post date.
function parseExpiry(header, postedOn) {
  const m = header.match(/expir\w*\s+(?:around\s+)?(\d{1,2})\/(\d{1,2})/i);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(postedOn.slice(0, 4));
  for (const y of [year, year + 1]) {
    const d = new Date(Date.UTC(y, month - 1, day));
    if (d.getUTCMonth() !== month - 1) return null; // invalid date like 13/40
    if (isoDay(d) >= postedOn) return isoDay(d);
  }
  return null;
}

export function mergeCodes(existing, drop) {
  const byKey = new Map(existing.map((e) => [e.code.toUpperCase(), e]));
  for (const code of drop.codes) {
    const key = code.toUpperCase();
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { code, rewards: null, postedOn: drop.postedOn, expiresOn: drop.expiresOn });
    } else if (drop.expiresOn && (!prev.expiresOn || drop.expiresOn > prev.expiresOn)) {
      prev.expiresOn = drop.expiresOn;
    }
  }
  return [...byKey.values()].sort((a, b) => b.postedOn.localeCompare(a.postedOn));
}
