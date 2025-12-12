export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('tr-TR');
};

export const formatDateTime = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('tr-TR');
};

export const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('tr-TR').format(num);
};

