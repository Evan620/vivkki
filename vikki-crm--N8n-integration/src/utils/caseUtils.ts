export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return 'N/A';

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minutes} ${ampm}`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function getDaysSinceDate(dateString: string | null | undefined): number {
  if (!dateString) return 0;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 0;

  const today = new Date();
  const diffTime = Math.abs(today.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function getClientFullName(client: any): string {
  if (!client) return 'Unknown Client';

  // Handle both camelCase and snake_case
  const firstName = client.firstName || client.first_name || '';
  const middleName = client.middleName || client.middle_name || '';
  const lastName = client.lastName || client.last_name || '';
  
  const middleInitial = middleName ? `${middleName.charAt(0)}.` : '';
  const fullName = `${firstName} ${middleInitial} ${lastName}`.trim();
  
  return fullName || 'Unknown Client';
}

export function getStageColor(stage: string): string {
  const colors: { [key: string]: string } = {
    'Intake': 'bg-gray-100 text-gray-700',
    'Processing': 'bg-blue-100 text-blue-700',
    'Demand': 'bg-yellow-100 text-yellow-700',
    'Closed': 'bg-green-100 text-green-700'
  };

  return colors[stage] || 'bg-gray-100 text-gray-700';
}

export function getStatusColor(status: string): string {
  return 'bg-gray-100 text-gray-600';
}
