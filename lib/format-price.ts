/**
 * Prices are displayed in whole shekels. Amounts under ₪1 keep their agorot,
 * so a positive price is never shown as ₪0.
 */
export function formatShekels(amount: number | string): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (value > 0 && value < 1) {
    return value.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return Math.round(value).toLocaleString('he-IL');
}
