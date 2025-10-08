import { useState, useEffect, useRef } from 'react';

interface StorageData<T> {
  data: T;
  timestamp: string;
  version: string;
}

type ParsedStorage<T> = {
  data: T | undefined;
  isStructured: boolean;
};

const STORAGE_PREFIX = 'sales_system_';

const buildStorageKey = (key: string) =>
  key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;

const parseStoredValue = <T,>(rawValue: string | null): ParsedStorage<T> | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      return { data: (parsed as StorageData<T>).data, isStructured: true };
    }

    return { data: parsed as T, isStructured: false };
  } catch (error) {
    console.error('Error parsing localStorage value:', error);
    return null;
  }
};

const mergeArrayValues = (primary: unknown, secondary: unknown): unknown[] | undefined => {
  if (!Array.isArray(primary) && !Array.isArray(secondary)) {
    return undefined;
  }

  const primaryArray = Array.isArray(primary) ? primary : [];
  const secondaryArray = Array.isArray(secondary) ? secondary : [];
  const seen = new Set<string>();
  const result: unknown[] = [];

  const buildIdentifier = (item: unknown) => {
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      if ('id' in record) {
        return `id:${String(record.id)}`;
      }
    }
    return JSON.stringify(item);
  };

  const pushIfNew = (item: unknown) => {
    const identifier = buildIdentifier(item);
    if (!seen.has(identifier)) {
      seen.add(identifier);
      result.push(item);
    }
  };

  primaryArray.forEach(pushIfNew);
  secondaryArray.forEach(pushIfNew);

  return result;
};

export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const initialValueRef = useRef(initialValue);
  const [value, setValue] = useState<T>(() => initialValueRef.current);

  useEffect(() => {
    initialValueRef.current = initialValue;
  }, [initialValue]);

  useEffect(() => {
    const namespacedKey = buildStorageKey(key);
    const legacyKey = key.startsWith(STORAGE_PREFIX) ? null : key;

    try {
      const namespacedStored = parseStoredValue<T>(localStorage.getItem(namespacedKey));
      const legacyStored = legacyKey ? parseStoredValue<T>(localStorage.getItem(legacyKey)) : null;

      let resolvedValue = initialValueRef.current;
      let shouldPersist = false;

      if (namespacedStored?.data !== undefined && legacyStored?.data !== undefined) {
        const merged = mergeArrayValues(namespacedStored.data, legacyStored.data);
        resolvedValue = (merged as T) ?? namespacedStored.data;
        shouldPersist = true;
      } else if (namespacedStored?.data !== undefined) {
        resolvedValue = namespacedStored.data;
        shouldPersist = !namespacedStored.isStructured || Boolean(legacyStored?.data);
      } else if (legacyStored?.data !== undefined) {
        resolvedValue = legacyStored.data;
        shouldPersist = true;
      }

      if (shouldPersist) {
        const dataToSave: StorageData<T> = {
          data: resolvedValue,
          timestamp: new Date().toISOString(),
          version: '1.0',
        };

        localStorage.setItem(namespacedKey, JSON.stringify(dataToSave));

        if (legacyKey) {
          localStorage.removeItem(legacyKey);
        }
      }

      setValue(resolvedValue);
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
    }
  }, [key]);

  const setStoredValue = (newValue: T) => {
    const namespacedKey = buildStorageKey(key);

    try {
      const dataToSave: StorageData<T> = {
        data: newValue,
        timestamp: new Date().toISOString(),
        version: '1.0',
      };

      localStorage.setItem(namespacedKey, JSON.stringify(dataToSave));

      if (!key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }

      setValue(newValue);
    } catch (error) {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  };

  return [value, setStoredValue] as const;
};
