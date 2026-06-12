// Counter-sale pricing helpers — strip vs unit billing.

// Units-per-strip ratio for a line (default 1 = drug has no strip ratio).
export const lineRatio = (item) => item.drug?.unitsPerStrip || 1;

// batch.sellingPrice is stored per base unit; STRIP mode bills per strip (× ratio).
export const lineRate = (item) => {
  const sp = item.batch?.sellingPrice ?? 0;
  return item.uom === 'STRIP' ? sp * lineRatio(item) : sp;
};
