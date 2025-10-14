// Helper function to format brand names
export const formatBrandName = (brand: string): string => {
  return brand
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to format currency
export const formatCurrency = (cents: number, currency = 'EUR'): string => {
  const amount = cents / 100;
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(amount);
};

// Helper function to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to format date for input
export const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
