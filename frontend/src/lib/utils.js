import { clsx } from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('tr-TR');
}

export function formatDateTime(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('tr-TR');
}

