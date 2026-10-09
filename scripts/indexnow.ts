/**
 * Tells search engines that use IndexNow (Bing, Yandex, Seznam, Naver) about
 * every page in the live sitemap, so new pages are crawled soon after they
 * go live. Google doesn't use IndexNow; it reads the sitemap itself (it's
 * submitted in Google Search Console and named in robots.txt).
 *
 *   npm run indexnow
 *
 * Run it after deploying new pages. The key in src/config.ts must match the
 * file public/<key>.txt, which proves the site is ours.
 */

import { INDEXNOW_KEY, SITE_URL } from '../src/config.ts';

const sitemap = await fetch(`${SITE_URL}/sitemap.xml`);
if (!sitemap.ok) throw new Error(`Couldn't fetch the sitemap (HTTP ${sitemap.status})`);
const urlList = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({
    host: new URL(SITE_URL).host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList,
  }),
});
// 200 and 202 both mean the list was accepted.
console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} pages`);
if (!res.ok) process.exitCode = 1;
