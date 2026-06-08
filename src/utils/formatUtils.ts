export const formatAmount = (amount: number, currency = 'NGN'): string =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

/** Partnership / giving amounts in Christ Embassy Espees */
export const formatEspees = (amount: number): string =>
  `${new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)} ESPEES`;

export const formatGhs = (amount: number): string =>
  new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
