const KEY = 'ink-pigment:edit-tokens';

/**
 * Secret edit tokens for the wall marks this browser made. The server only
 * stores a hash, so a mark can be edited only from the browser that signed it.
 */
export function readEditToken(id: string): string | null {
  return all()[id] ?? null;
}

export function saveEditToken(id: string, token: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...all(), [id]: token }));
  } catch {
    /* storage unavailable: the mark just can't be edited later */
  }
}

function all(): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}
