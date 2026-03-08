/**
 * @module web/utils/assetUrl
 *
 * Resolves a public asset path (e.g. "/characters/Ali.jpg") to the
 * correct URL by prepending Vite's base path.
 *
 * In development base is "/", in production on GitHub Pages it's
 * "/guessWho/" — so a raw "/characters/Ali.jpg" would 404 in prod
 * without this helper.
 */

const BASE = import.meta.env.BASE_URL; // Vite injects this from `base` config

/**
 * Prefix a public-folder asset path with the Vite base URL.
 * Handles double-slash deduplication automatically.
 */
export function assetUrl(path: string): string {
  // BASE always ends with "/", path always starts with "/" → trim one.
  return BASE + path.replace(/^\//, "");
}
