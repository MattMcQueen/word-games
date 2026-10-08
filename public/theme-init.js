// Runs before the page paints (loaded without defer in <head>) so a player who
// picked light or dark mode never sees a flash of the other theme.
// Mirrors src/ui/theme.ts, which owns the toggle; the storage key must match.
try {
  const theme = JSON.parse(localStorage.getItem('wg:theme') || 'null');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {
  // Storage unavailable: just follow the system setting.
}
