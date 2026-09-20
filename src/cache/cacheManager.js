/**
 * A utility for managing cached data with expiration.
 * Stores data in localStorage.
 */
class CacheManager {
  constructor(prefix = 'app-cache-') {
    this.prefix = prefix;
  }

  /**
   * Set a value in the cache with an expiration time in minutes.
   */
  set(key, value, expirationMinutes = 60) {
    const item = {
      value: value,
      expiry: new Date().getTime() + expirationMinutes * 60 * 1000,
    };
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (e) {
      console.warn('CacheManager: Error saving to localStorage', e);
    }
  }

  /**
   * Get a value from the cache if it hasn't expired.
   */
  get(key) {
    try {
      const itemStr = localStorage.getItem(this.prefix + key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      if (new Date().getTime() > item.expiry) {
        // Expired
        this.remove(key);
        return null;
      }
      return item.value;
    } catch (e) {
      console.warn('CacheManager: Error reading from localStorage', e);
      return null;
    }
  }

  /**
   * Remove a specific item from the cache.
   */
  remove(key) {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all items managed by this cache manager.
   */
  clear() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}

export const cache = new CacheManager();
export default CacheManager;
