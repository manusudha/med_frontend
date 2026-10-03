const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MON = MONTHS.map((m) => m.slice(0, 3));

/** "Sunday, 27 September 2026" */
export const fmtLongDate = (d = new Date()) => `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** "9:05 AM" from a Date */
export const fmtClock = (d = new Date()) => {
  const h = d.getHours();
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

/** "2026-04-16" → "16 Apr 2026" */
export const fmtYmd = (ymd) => {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${MON[m - 1]} ${y}`;
};

/** "14:30" → "2:30 PM" */
export const fmtTime = (hhmm) => {
  if (!hhmm) return 'To be scheduled';
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

/** Local YYYY-MM-DD (device timezone) — for date inputs */
export const localYmd = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

export const initials = (name = '') => {
  const p = name.replace(/^(dr|mr|mrs|ms)\.?\s+/i, '').trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase() || '?';
};

export const greeting = (d = new Date()) => {
  const h = d.getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};
