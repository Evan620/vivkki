import { useState, useMemo } from 'react';
import { Edit2, ChevronDown, ChevronUp, MoreHorizontal, Filter, Download, DollarSign, CreditCard, Receipt, AlertTriangle } from 'lucide-react';
import EditMedicalBillModal from './EditMedicalBillModal';
import { formatCurrency } from '../../utils/formatting';
import { calculateMedicalBillBalanceDue } from '../../utils/calculations';
import { supabase } from '../../utils/database';

interface MedicalTableProps {
  medicalBills: any[];
  casefileId: number;
  selectedProviders: number[];
  onSelectionChange: (selected: number[]) => void;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  financialTotals?: {
    totalBilled: number;
    insurancePaid: number;
    insuranceAdjusted: number;
    medpayPaid: number;
    patientPaid: number;
    reductionAmount: number;
    piExpense: number;
    balanceDue: number;
  };
}

interface Column {
  id: string;
  label: string;
  sortable?: boolean;
  visible?: boolean;
  renderCell?: (bill: any) => React.ReactNode;
}

export default function MedicalTable({
  medicalBills,
  casefileId,
  selectedProviders,
  onSelectionChange,
  onUpdate,
  onShowToast,
  financialTotals
}: MedicalTableProps) {
  const [editingBill, setEditingBill] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('provider');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'provider',
    'type',
    'client',
    'hipaa',
    'bills',
    'records',
    'amountBilled',
    'insurancePaid',
    'insuranceAdjusted',
    'medpayPaid',
    'patientPaid',
    'reductionAmount',
    'piExpense',
    'balanceDue',
    'actions'
  ]);
  const [filterText, setFilterText] = useState('');

  const columns: Column[] = [
    {
      id: 'provider',
      label: 'Provider Name',
      sortable: true,
      renderCell: (bill) => bill.medical_provider?.name || 'Unknown Provider'
    },
    {
      id: 'type',
      label: 'Type',
      sortable: true,
      renderCell: (bill) => bill.medical_provider?.type || '-'
    },
    {
      id: 'client',
      label: 'Client',
      sortable: true,
      renderCell: (bill) => {
        const client = bill.client || {};
        // Handle both snake_case and camelCase field names
        const firstName = client.first_name || client.firstName || '';
        const lastName = client.last_name || client.lastName || '';
        return `${firstName} ${lastName}`.trim() || 'Unknown Client';
      }
    },
    {
      id: 'hipaa',
      label: 'HIPAA',
      renderCell: (bill) => (
        <input
          type="checkbox"
          checked={bill.hipaa_sent || false}
          onChange={() => handleToggle(bill.id, 'hipaa_sent', bill.hipaa_sent)}
          disabled={updating === `${bill.id}-hipaa_sent`}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      )
    },
    {
      id: 'bills',
      label: 'Bills',
      renderCell: (bill) => (
        <input
          type="checkbox"
          checked={bill.bill_received || false}
          onChange={() => handleToggle(bill.id, 'bill_received', bill.bill_received)}
          disabled={updating === `${bill.id}-bill_received`}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      )
    },
    {
      id: 'records',
      label: 'Records',
      renderCell: (bill) => (
        <input
          type="checkbox"
          checked={bill.records_received || false}
          onChange={() => handleToggle(bill.id, 'records_received', bill.records_received)}
          disabled={updating === `${bill.id}-records_received`}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
      )
    },
    {
      id: 'amountBilled',
      label: 'Amount Billed',
      sortable: true,
      renderCell: (bill) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-gray-400" />
          <span className="font-medium">{formatCurrency(bill.amountBilled || bill.total_billed)}</span>
        </div>
      )
    },
    {
      id: 'insurancePaid',
      label: 'Insurance Paid',
      sortable: true,
      renderCell: (bill) => (
        <div className="flex items-center gap-1">
          <CreditCard className="w-3 h-3 text-green-500" />
          <span className="font-medium">{formatCurrency(bill.insurancePaid || bill.insurance_paid)}</span>
        </div>
      )
    },
    {
      id: 'insuranceAdjusted',
      label: 'Insurance Adjusted',
      sortable: true,
      renderCell: (bill) => (
        <div className="flex items-center gap-1">
          <Receipt className="w-3 h-3 text-orange-500" />
          <span className="font-medium">{formatCurrency(bill.insuranceAdjusted || bill.insurance_adjusted)}</span>
        </div>
      )
    },
    {
      id: 'medpayPaid',
      label: 'MedPay Paid',
      sortable: true,
      renderCell: (bill) => (
        <div className="flex items-center gap-1">
          <CreditCard className="w-3 h-3 text-blue-500" />
          <span className="font-medium">{formatCurrency(bill.medpayPaid || bill.medpay_paid)}</span>
        </div>
      )
    },
    {
      id: 'patientPaid',
      label: 'Patient Paid',
      sortable: true,
      renderCell: (bill) => (
        <div className="flex items-center gap-1">
          <CreditCard className="w-3 h-3 text-purple-500" />
          <span className="font-medium">{formatCurrency(bill.patientPaid || bill.patient_paid)}</span>
        </div>
      )
    },
    {
      id: 'reductionAmount',
      label: 'Reduction',
      sortable: true,
      renderCell: (bill) => (
        <div className="flex items-center gap-1">
          <Receipt className="w-3 h-3 text-yellow-500" />
          <span className="font-medium">{formatCurrency(bill.reductionAmount || bill.reduction_amount)}</span>
        </div>
      )
    },
    {
      id: 'piExpense',
      label: 'PI Expense',
      sortable: true,
      renderCell: (bill) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-indigo-500" />
          <span className="font-medium">{formatCurrency(bill.piExpense || bill.pi_expense)}</span>
        </div>
      )
    },
    {
      id: 'balanceDue',
      label: 'Balance Due',
      sortable: true,
      renderCell: (bill) => {
        const balanceDue = calculateMedicalBillBalanceDue(bill);
        const isOverdue = balanceDue > 0 && bill.date_of_service && 
          new Date(bill.date_of_service) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        
        return (
          <div className="flex items-center gap-1">
            {isOverdue && <AlertTriangle className="w-3 h-3 text-red-500" />}
            <span className={`font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>
        );
      }
    }
  ];

  const uniqueProviders = medicalBills.filter((bill, index, self) =>
    index === self.findIndex((b) => b.medical_provider_id === bill.medical_provider_id)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allProviderIds = uniqueProviders.map(bill => bill.medical_provider_id);
      onSelectionChange(allProviderIds);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectProvider = (providerId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedProviders, providerId]);
    } else {
      onSelectionChange(selectedProviders.filter(id => id !== providerId));
    }
  };

  const isAllSelected = uniqueProviders.length > 0 &&
    uniqueProviders.every(bill => selectedProviders.includes(bill.medical_provider_id));

  const handleToggle = async (billId: number, field: string, currentValue: boolean) => {
    setUpdating(`${billId}-${field}`);
    try {
      const { error } = await supabase
        .from('medical_bills')
        .update({ [field]: !currentValue })
        .eq('id', billId);

      if (error) throw error;

      onShowToast('Status updated successfully', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error updating medical bill:', error);
      onShowToast('Failed to update status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRowExpansion = (billId: number) => {
    setExpandedRows(prev =>
      prev.includes(billId)
        ? prev.filter(id => id !== billId)
        : [...prev, billId]
    );
  };

  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const sortedAndFilteredBills = useMemo(() => {
    let filtered = medicalBills;

    if (filterText) {
      const searchTerm = filterText.toLowerCase();
      filtered = medicalBills.filter(bill => {
        const providerName = (bill.medical_provider?.name || '').toLowerCase();
        const providerType = (bill.medical_provider?.type || '').toLowerCase();
        const client = bill.client || {};
        const clientFirstName = (client.first_name || client.firstName || '').toLowerCase();
        const clientLastName = (client.last_name || client.lastName || '').toLowerCase();
        const clientFullName = `${clientFirstName} ${clientLastName}`.trim();
        
        return providerName.includes(searchTerm) ||
               providerType.includes(searchTerm) ||
               clientFirstName.includes(searchTerm) ||
               clientLastName.includes(searchTerm) ||
               clientFullName.includes(searchTerm);
      });
    }

    return filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case 'provider':
          aValue = a.medical_provider?.name || '';
          bValue = b.medical_provider?.name || '';
          break;
        case 'type':
          aValue = a.medical_provider?.type || '';
          bValue = b.medical_provider?.type || '';
          break;
        case 'client':
          aValue = `${a.client?.firstName || ''} ${a.client?.lastName || ''}`.trim();
          bValue = `${b.client?.firstName || ''} ${b.client?.lastName || ''}`.trim();
          break;
        case 'amountBilled':
          aValue = a.amountBilled || a.total_billed || 0;
          bValue = b.amountBilled || b.total_billed || 0;
          break;
        case 'insurancePaid':
          aValue = a.insurancePaid || a.insurance_paid || 0;
          bValue = b.insurancePaid || b.insurance_paid || 0;
          break;
        case 'insuranceAdjusted':
          aValue = a.insuranceAdjusted || a.insurance_adjusted || 0;
          bValue = b.insuranceAdjusted || b.insurance_adjusted || 0;
          break;
        case 'medpayPaid':
          aValue = a.medpayPaid || a.medpay_paid || 0;
          bValue = b.medpayPaid || b.medpay_paid || 0;
          break;
        case 'patientPaid':
          aValue = a.patientPaid || a.patient_paid || 0;
          bValue = b.patientPaid || b.patient_paid || 0;
          break;
        case 'reductionAmount':
          aValue = a.reductionAmount || a.reduction_amount || 0;
          bValue = b.reductionAmount || b.reduction_amount || 0;
          break;
        case 'piExpense':
          aValue = a.piExpense || a.pi_expense || 0;
          bValue = b.piExpense || b.pi_expense || 0;
          break;
        case 'balanceDue':
          aValue = calculateMedicalBillBalanceDue(a);
          bValue = calculateMedicalBillBalanceDue(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [medicalBills, sortField, sortDirection, filterText]);

  const calculateTotals = () => {
    return sortedAndFilteredBills.reduce(
      (acc, bill) => {
        const balanceDue = calculateMedicalBillBalanceDue(bill);
        return {
          totalBilled: acc.totalBilled + (bill.amountBilled || bill.total_billed || 0),
          insurancePaid: acc.insurancePaid + (bill.insurancePaid || bill.insurance_paid || 0),
          insuranceAdjusted: acc.insuranceAdjusted + (bill.insuranceAdjusted || bill.insurance_adjusted || 0),
          medpayPaid: acc.medpayPaid + (bill.medpayPaid || bill.medpay_paid || 0),
          patientPaid: acc.patientPaid + (bill.patientPaid || bill.patient_paid || 0),
          reductionAmount: acc.reductionAmount + (bill.reductionAmount || bill.reduction_amount || 0),
          piExpense: acc.piExpense + (bill.piExpense || bill.pi_expense || 0),
          balanceDue: acc.balanceDue + balanceDue
        };
      },
      {
        totalBilled: 0,
        insurancePaid: 0,
        insuranceAdjusted: 0,
        medpayPaid: 0,
        patientPaid: 0,
        reductionAmount: 0,
        piExpense: 0,
        balanceDue: 0
      }
    );
  };

  const totals = calculateTotals();

  if (medicalBills.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No medical providers added yet
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <input
              type="text"
              placeholder="Filter providers..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Filter className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <div className="relative">
            <button
              className="p-2 border rounded-lg hover:bg-gray-50"
              onClick={() => document.getElementById('column-menu')?.click()}
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
            <div
              id="column-menu"
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10 hidden group-focus:block"
            >
              {columns.map(column => (
                <label
                  key={column.id}
                  className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(column.id)}
                    onChange={() => toggleColumnVisibility(column.id)}
                    className="mr-2"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
          onClick={() => {/* Export functionality */}}
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  title="Select all providers"
                />
              </th>
              {columns.map(column => (
                visibleColumns.includes(column.id) && (
                  <th
                    key={column.id}
                    className={`
                      px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider
                      ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                      ${column.id === 'billed' || column.id === 'paid' || column.id === 'due' ? 'text-right' : ''}
                    `}
                    onClick={() => column.sortable && handleSort(column.id)}
                  >
                    <div className="flex items-center gap-1">
                      {column.label}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp
                            className={`w-3 h-3 ${
                              sortField === column.id && sortDirection === 'asc'
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`}
                          />
                          <ChevronDown
                            className={`w-3 h-3 ${
                              sortField === column.id && sortDirection === 'desc'
                                ? 'text-blue-600'
                                : 'text-gray-400'
                            }`}
                          />
                        </div>
                      )}
                    </div>
              </th>
                )
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredBills.map((bill, index) => {
              const amountDue = (bill.total_billed || 0) - (bill.insurance_paid || 0) - (bill.insurance_adjusted || 0);
              const provider = bill.medical_provider || {};
              const isSelected = selectedProviders.includes(bill.medical_provider_id);
              const isFirstOfProvider = sortedAndFilteredBills.findIndex(b => b.medical_provider_id === bill.medical_provider_id) === index;
              const isExpanded = expandedRows.includes(bill.id);

              return (
                <>
                  <tr
                    key={bill.id}
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      ${isExpanded ? 'border-b-0' : ''}
                      hover:bg-gray-100 transition-colors
                    `}
                  >
                  <td className="px-4 py-3 text-center">
                    {isFirstOfProvider && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectProvider(bill.medical_provider_id, e.target.checked)}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Select provider"
                      />
                    )}
                  </td>
                    {columns.map(column => (
                      visibleColumns.includes(column.id) && (
                        <td
                          key={column.id}
                          className={`
                            px-4 py-3 text-sm
                            ${column.id === 'provider' ? 'font-medium text-gray-900' : 'text-gray-600'}
                            ${column.id === 'billed' || column.id === 'paid' || column.id === 'due' ? 'text-right' : ''}
                            ${column.id === 'hipaa' || column.id === 'bills' || column.id === 'records' ? 'text-center' : ''}
                          `}
                        >
                          {column.renderCell ? column.renderCell(bill) : bill[column.id]}
                  </td>
                      )
                    ))}
                  <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setEditingBill(bill)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Edit bill"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleRowExpansion(bill.id)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          title={isExpanded ? 'Show less' : 'Show more'}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                    </button>
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan={visibleColumns.length + 2} className="px-4 py-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Provider Details</h4>
                            <dl className="space-y-1">
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Address:</dt>
                                <dd className="text-gray-900">{provider.address || 'N/A'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Phone:</dt>
                                <dd className="text-gray-900">{provider.phone || 'N/A'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Fax:</dt>
                                <dd className="text-gray-900">{provider.fax || 'N/A'}</dd>
                              </div>
                            </dl>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Bill Details</h4>
                            <dl className="space-y-1">
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Date of Service:</dt>
                                <dd className="text-gray-900">{bill.date_of_service || 'N/A'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Bill Number:</dt>
                                <dd className="text-gray-900">{bill.bill_number || 'N/A'}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-gray-600">Insurance Adjusted:</dt>
                                <dd className="text-gray-900">{formatCurrency(bill.insurance_adjusted)}</dd>
                              </div>
                            </dl>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Notes</h4>
                            <p className="text-gray-600">
                              {bill.notes || 'No notes available'}
                            </p>
                          </div>
                        </div>
                  </td>
                </tr>
                  )}
                </>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
            <tr>
              <td colSpan={visibleColumns.filter(col => !['amountBilled', 'insurancePaid', 'insuranceAdjusted', 'medpayPaid', 'patientPaid', 'reductionAmount', 'piExpense', 'balanceDue'].includes(col)).length + 1} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                TOTALS
              </td>
              {visibleColumns.includes('amountBilled') && (
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totals.totalBilled)}
                </td>
              )}
              {visibleColumns.includes('insurancePaid') && (
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totals.insurancePaid)}
                </td>
              )}
              {visibleColumns.includes('insuranceAdjusted') && (
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totals.insuranceAdjusted)}
                </td>
              )}
              {visibleColumns.includes('medpayPaid') && (
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totals.medpayPaid)}
                </td>
              )}
              {visibleColumns.includes('patientPaid') && (
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totals.patientPaid)}
                </td>
              )}
              {visibleColumns.includes('reductionAmount') && (
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totals.reductionAmount)}
              </td>
              )}
              {visibleColumns.includes('piExpense') && (
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  {formatCurrency(totals.piExpense)}
              </td>
              )}
              {visibleColumns.includes('balanceDue') && (
              <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  <span className={`font-bold ${totals.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(totals.balanceDue)}
                  </span>
              </td>
              )}
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden space-y-4">
        {sortedAndFilteredBills.map((bill, index) => {
          const amountDue = (bill.total_billed || 0) - (bill.insurance_paid || 0) - (bill.insurance_adjusted || 0);
          const provider = bill.medical_provider || {};
          const isSelected = selectedProviders.includes(bill.medical_provider_id);
          const isFirstOfProvider = sortedAndFilteredBills.findIndex(b => b.medical_provider_id === bill.medical_provider_id) === index;

          return (
            <div
              key={bill.id}
              className="bg-white rounded-lg shadow-sm p-4 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isFirstOfProvider && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectProvider(bill.medical_provider_id, e.target.checked)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {provider.name || 'Unknown Provider'}
                    </h3>
                    <p className="text-sm text-gray-600">{provider.type || '-'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingBill(bill)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 py-2 border-t border-b">
                <div className="text-center">
                  <p className="text-xs text-gray-600">HIPAA</p>
                  <input
                    type="checkbox"
                    checked={bill.hipaa_sent || false}
                    onChange={() => handleToggle(bill.id, 'hipaa_sent', bill.hipaa_sent)}
                    disabled={updating === `${bill.id}-hipaa_sent`}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Bills</p>
                  <input
                    type="checkbox"
                    checked={bill.bill_received || false}
                    onChange={() => handleToggle(bill.id, 'bill_received', bill.bill_received)}
                    disabled={updating === `${bill.id}-bill_received`}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-600">Records</p>
                  <input
                    type="checkbox"
                    checked={bill.records_received || false}
                    onChange={() => handleToggle(bill.id, 'records_received', bill.records_received)}
                    disabled={updating === `${bill.id}-records_received`}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Billed</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(bill.total_billed)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Paid</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(bill.insurance_paid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Due</p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(amountDue)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editingBill && (
        <EditMedicalBillModal
          isOpen={!!editingBill}
          onClose={() => setEditingBill(null)}
          medicalBill={editingBill}
          providerName={editingBill.medical_provider?.name || 'Unknown Provider'}
          casefileId={casefileId}
          onUpdate={onUpdate}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}