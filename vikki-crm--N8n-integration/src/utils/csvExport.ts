/**
 * CSV Export Utility
 * 
 * Converts JSON data to CSV format with proper handling of special characters
 */

export interface SOUCaseData {
  caseId: number;
  clientName: string;
  firstBase: 'Complete' | string;
  secondBase: 'Complete' | string;
  thirdBase: 'Complete' | string;
  notes: string;
}

/**
 * Escape CSV field value (handles commas, quotes, newlines)
 */
function escapeCSVField(value: string): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert SOU case data array to CSV string
 */
export function jsonToCSV(data: SOUCaseData[]): string {
  if (!data || data.length === 0) {
    return 'Client,1st Base,2nd Base,3rd Base,Notes\n';
  }
  
  // CSV Headers
  const headers = ['Client', '1st Base', '2nd Base', '3rd Base', 'Notes'];
  
  // Build CSV rows
  const rows = data.map(item => [
    escapeCSVField(item.clientName),
    escapeCSVField(item.firstBase),
    escapeCSVField(item.secondBase),
    escapeCSVField(item.thirdBase),
    escapeCSVField(item.notes)
  ]);
  
  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Download CSV file from string
 */
export function downloadCSV(csvContent: string, filename: string = 'state_of_union.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Convert CSV string to base64 for webhook transmission
 */
export function csvToBase64(csvContent: string): string {
  return btoa(unescape(encodeURIComponent(csvContent)));
}


