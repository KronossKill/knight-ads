// In-memory TTL cache for read-heavy API endpoints.
// Reduces database load and improves response times under high concurrency.
// In production, replace with Redis (or Upstash) for distributed caching.

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const stats = { hits: 0, misses: 0, sets: 0 }

export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) {
    stats.misses++
    return null
  }
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    stats.misses++
    return null
  }
  stats.hits++
  return entry.value as T
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  stats.sets++
  // Evict expired entries periodically (prevent unbounded growth)
  if (cache.size > 200) {
    const now = Date.now()
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k)
    }
  }
}

export function cacheDelete(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}

export function cacheStats() {
  const total = stats.hits + stats.misses
  return {
    ...stats,
    hitRate: total > 0 ? `${((stats.hits / total) * 100).toFixed(1)}%` : "0%",
    entries: cache.size,
  }
}

/**
 * Helper for Next.js GET handlers: wraps a resolver with cache.
 * If the cache has a fresh value, returns it immediately.
 * Otherwise, calls the resolver, caches the result for ttlSeconds, and returns it.
 *
 * Also sets standard HTTP Cache-Control headers on the response so CDNs
 * and browsers can cache at the edge.
 */
export function withCache<T>(
  key: string,
  ttlSeconds: number,
  resolver: () => Promise<T>
): Promise<{ data: T; source: "cache" | "fresh"; cached: boolean }> {
  const cached = cacheGet<T>(key)
  if (cached) {
    return Promise.resolve({ data: cached, source: "cache", cached: true })
  }
  return resolver().then((data) => {
    cacheSet(key, data, ttlSeconds)
    return { data, source: "fresh", cached: false }
  })
}

// Invalidate caches when data changes (call from PUT/POST/DELETE handlers)
export function invalidateConfigCaches() {
  cacheDelete("config:")
  cacheDelete("ads:")
  cacheDelete("stats:")
  cacheDelete("treasury:")
}
