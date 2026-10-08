/**
 * Visits are counted with Cloudflare Web Analytics, as on the card games and
 * Brand New: no cookies, nothing that follows a visitor from site to site, and
 * no record of who they are. The beacon only loads on the live site, so local
 * previews, the browser tests and CI never count as visits.
 */

const BEACON = 'https://static.cloudflareinsights.com/beacon.min.js';

/** Whether this is a live address, where visits count. */
export function isLiveSite(hostname: string): boolean {
  return hostname === 'matt-rarely-writes.co.uk' || hostname.endsWith('.matt-rarely-writes.co.uk');
}

/** Load Cloudflare's beacon with the site's token (public: it's in every page). */
export function countVisits(token: string): void {
  if (!token || !isLiveSite(location.hostname)) return;
  const script = document.createElement('script');
  script.type = 'module'; // as in Cloudflare's own snippet
  script.src = BEACON;
  script.dataset.cfBeacon = JSON.stringify({ token });
  document.head.append(script);
}
