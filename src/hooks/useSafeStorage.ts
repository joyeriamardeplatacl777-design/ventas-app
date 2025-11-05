export function useSafeStorage() {
  const getItem = (key: string): string | null => {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      console.error('localStorage.getItem error:', e);
      return null;
    }
  };

  const setItem = (key: string, value: string): boolean => {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error('localStorage.setItem error:', e);
      return false;
    }
  };

  const removeItem = (key: string): boolean => {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('localStorage.removeItem error:', e);
      return false;
    }
  };

  const getItemJSON = <T,>(key: string, fallback: T): T => {
    const raw = getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      console.warn('JSON.parse error for key:', key, e);
      return fallback;
    }
  };

  const setItemJSON = <T,>(key: string, value: T): boolean => {
    try {
      return setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('setItemJSON error:', e);
      return false;
    }
  };

  return { getItem, setItem, removeItem, getItemJSON, setItemJSON } as const;
}

