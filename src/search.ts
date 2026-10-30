/**
 * Client-side module search.
 *
 * Compiled to assets/js/search.js:
 *   npx tsc src/search.ts --outDir assets/js --target ES2019
 *
 * Kept deliberately small: normalise the text once, then every whitespace-separated
 * token in the query must appear somewhere in the haystack.
 */

export interface SearchApi {
  normalise(value: unknown): string;
  matches(query: string, haystack: string): boolean;
}

export function normalise(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matches(query: string, haystack: string): boolean {
  const q = normalise(query);
  if (!q) return true;
  const text = normalise(haystack);
  return q.split(' ').every((token) => text.indexOf(token) !== -1);
}

const api: SearchApi = { normalise, matches };

if (typeof window !== 'undefined') {
  (window as unknown as { EduSphereSearch: SearchApi }).EduSphereSearch = api;
}
