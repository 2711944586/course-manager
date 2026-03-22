function resolveStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function safeStorageGetItem(key: string): string | null {
  try {
    return resolveStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeStorageSetItem(key: string, value: string): void {
  try {
    resolveStorage()?.setItem(key, value);
  } catch {
    // Ignore storage write failures so the UI can still render.
  }
}

export function safeStorageRemoveItem(key: string): void {
  try {
    resolveStorage()?.removeItem(key);
  } catch {
    // Ignore storage removal failures so reset flows still complete.
  }
}

export function safeStorageKeys(prefix?: string): readonly string[] {
  try {
    const storage = resolveStorage();
    if (!storage) {
      return [];
    }

    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) {
        continue;
      }

      if (!prefix || key.startsWith(prefix)) {
        keys.push(key);
      }
    }

    return keys;
  } catch {
    return [];
  }
}
