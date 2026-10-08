/**
 * The archive picker: every puzzle from launch to today, grouped by month,
 * with each day's status in words and symbols (never colour alone).
 */

import { LAUNCH_DATE } from '../config.ts';
import { addDays, formatShortDate, monthOf, puzzleNumber } from '../core/date.ts';
import { loadDay } from '../core/progress.ts';
import { h } from './dom.ts';
import { openModal } from './modal.ts';

function statusOf(slug: string, date: string): { symbol: string; text: string } {
  const day = loadDay(slug, date);
  if (!day) return { symbol: '·', text: 'Not played' };
  if (day.status === 'playing') return { symbol: '…', text: 'In progress' };
  return day.result?.perfect ? { symbol: '★', text: 'Perfect' } : { symbol: '✓', text: 'Finished' };
}

const monthName = (month: string) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export function openArchive(opts: { slug: string; path: string; today: string; current: string }) {
  const { slug, path, today, current } = opts;

  // Newest first, grouped into months.
  const months = new Map<string, string[]>();
  for (let d = today; d >= LAUNCH_DATE; d = addDays(d, -1)) {
    const list = months.get(monthOf(d)) ?? [];
    list.push(d);
    months.set(monthOf(d), list);
  }

  const groups = [...months].map(([month, dates], i) =>
    h(
      'details',
      { class: 'archive-month', open: i === 0 || month === monthOf(current) },
      h('summary', null, monthName(month)),
      h(
        'ul',
        { class: 'archive-list' },
        dates.map((date) => {
          const { symbol, text } = statusOf(slug, date);
          const href = date === today ? path : `${path}?date=${date}`;
          return h(
            'li',
            null,
            h(
              'a',
              { href, 'aria-current': date === current ? 'page' : null },
              h('span', { class: 'archive-num' }, `#${puzzleNumber(date)}`),
              h(
                'span',
                { class: 'archive-date' },
                date === today ? 'Today' : formatShortDate(date),
              ),
              h(
                'span',
                { class: 'archive-status' },
                h('span', { 'aria-hidden': 'true' }, symbol),
                ` ${text}`,
              ),
            ),
          );
        }),
      ),
    ),
  );

  openModal({ title: 'Archive', content: groups });
}
