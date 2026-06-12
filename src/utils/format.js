// Shared formatting helpers for reports.

// Plain 2-decimal amount (no currency symbol) — used in billing/dispensing rows.
export const fmt = (n) => (parseFloat(n) || 0).toFixed(2);

// Compact batch-expiry label, e.g. "05 Mar 26".
export const expiryLabel = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

export const inr = (n) =>
  `₹${(parseFloat(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const num = (n) => (parseFloat(n) || 0).toLocaleString('en-IN');

export const isoToday = () => new Date().toISOString().slice(0, 10);

export const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (year, month) => `${MONTHS[month] || month} ${year}`;
