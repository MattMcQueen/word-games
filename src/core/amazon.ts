/**
 * Amazon UK affiliate links, built without contacting Amazon (as on Brand New:
 * Brand-New/brandnew/amazon.py). A book link is a title + author search in
 * Books rather than one edition's page, since classic novels come in many
 * editions and we can't check which Amazon sells without asking it.
 */

import { AMAZON_TAG } from '../config.ts';

const BASE = 'https://www.amazon.co.uk';

/** rel for every affiliate link: it's paid, so search engines shouldn't follow it. */
export const AFFILIATE_REL = 'sponsored nofollow noopener';

/** Amazon's required wording, shown wherever an affiliate link appears. */
export const AMAZON_DISCLOSURE = 'As an Amazon Associate I earn from qualifying purchases.';

/** A Books search for a title and author, with the tracking tag; null if no tag is set. */
export function bookSearchUrl(title: string, author: string, tag: string = AMAZON_TAG) {
  if (!tag) return null;
  // Main title only ("Frankenstein; or, the Modern Prometheus" → "Frankenstein"), first author.
  const query = `${title.split(/[:;]/)[0]?.trim()} ${author.split(',')[0]?.trim()}`;
  const params = new URLSearchParams({ k: query, i: 'stripbooks', tag });
  return `${BASE}/s?${params}`;
}
