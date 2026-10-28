export function hashString(value: string): number {
  let hash = 1779033703;
  for (let index = 0; index < value.length; index += 1) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  return hash >>> 0;
}

export function createRandom(seed: number): () => number {
  let state = hashString(String(seed)) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomInt(
  random: () => number,
  min: number,
  max: number,
): number {
  return min + Math.floor(random() * (max - min + 1));
}

export function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = copy[index];
    const other = copy[swapIndex];
    if (current === undefined || other === undefined) continue;
    copy[index] = other;
    copy[swapIndex] = current;
  }
  return copy;
}
