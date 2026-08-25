/**
 * Lightweight Browser Cache Utility using sessionStorage (with localStorage fallback).
 * Stores data with timestamps and Time-To-Live (TTL).
 * Enables instant loading of Jobs, Courses, and Roadmaps when switching tabs.
 */

const CACHE_PREFIX = 'cg_cache_';
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch (e) {
    // sessionStorage might be restricted in some iframe/incognito modes
  }
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch (e) {}
  return null;
}

/**
 * Retrieve cached data by key if present and not expired.
 * @param {string} key
 * @returns {any|null}
 */
export function getCache(key) {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    // Check expiration
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      storage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed.data;
  } catch (e) {
    console.warn('[Cache Read Error]:', e);
    return null;
  }
}

/**
 * Store data in browser cache with TTL.
 * @param {string} key
 * @param {any} data
 * @param {number} ttlMs
 */
export function setCache(key, data, ttlMs = DEFAULT_TTL_MS) {
  const storage = getStorage();
  if (!storage) return;
  try {
    const entry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    storage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch (e) {
    console.warn('[Cache Write Error]:', e);
  }
}

/**
 * Remove a specific key from cache.
 * @param {string} key
 */
export function removeCache(key) {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(CACHE_PREFIX + key);
  } catch (e) {}
}

/**
 * Clear all cache entries or entries matching prefix.
 * @param {string} prefix
 */
export function clearCacheByPrefix(prefix = '') {
  const storage = getStorage();
  if (!storage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(CACHE_PREFIX + prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => storage.removeItem(k));
  } catch (e) {}
}
