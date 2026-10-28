export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PROBE_KEY = '__nana_pearl_storage_probe__';

/** localStorage can exist but throw on every access in private mode. */
export function browserStorage(): StorageAdapter | null {
  if (typeof window === 'undefined') return null;
  try {
    const storage = window.localStorage;
    storage.setItem(PROBE_KEY, '1');
    storage.removeItem(PROBE_KEY);
    return storage;
  } catch {
    return null;
  }
}

/** Used when storage is unavailable, and by tests. */
export class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>();

  constructor(initial?: Readonly<Record<string, string>>) {
    if (!initial) return;
    for (const [key, value] of Object.entries(initial)) {
      this.values.set(key, value);
    }
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}
