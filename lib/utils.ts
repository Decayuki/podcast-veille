/**
 * Resolve a public asset URL that may contain the production basePath.
 *
 * episodes.json stores URLs like /podcast-veille/audio/2026-03-25.mp3
 * In dev, NEXT_PUBLIC_BASE_PATH is empty, so we need to strip the prefix.
 * In prod, basePath is /podcast-veille, and Next.js handles the prefix.
 */
const PROD_BASE = '/podcast-veille';

export function resolveUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

  if (base) {
    // Production: URL should start with base
    if (url.startsWith(base)) return url;
    return base + url;
  } else {
    // Dev: strip the production basePath prefix
    if (url.startsWith(PROD_BASE)) {
      return url.slice(PROD_BASE.length);
    }
    return url;
  }
}
