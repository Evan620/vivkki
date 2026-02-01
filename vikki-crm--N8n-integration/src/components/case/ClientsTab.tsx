import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, User, Users, Car, ChevronUp, ChevronDown, DollarSign, Activity, Heart, Phone } from 'lucide-react';
import EditClientModal from './EditClientModal';
import { formatPhone, maskSSN, formatCurrency } from '../../utils/formatting';
import { formatDate } from '../../utils/formatters';
import { supabase } from '../../utils/database';
import type { Client } from '../../types';
import { useConfirmDialog } from '../../hooks/useConfirmDialog.tsx';

interface ClientsTabProps {
  clients: Client[];
  medicalBills?: any[];
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function ClientsTab({ clients, medicalBills = [], casefileId, onUpdate, onShowToast }: ClientsTabProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedClient, setExpandedClient] = useState<number | null>(0);
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();

  // Calculate medical bills per client
  const getClientMedicalBills = (clientId: number) => {
    return medicalBills.filter(bill => bill.client_id === clientId);
  };

  // Calculate totals for a client's medical bills
  const calculateClientTotals = useMemo(() => {
    return (clientId: number) => {
      const clientBills = getClientMedicalBills(clientId);
      return {
        totalBilled: clientBills.reduce((sum, bill) => sum + (bill.amount_billed || 0), 0),
        totalPaid: clientBills.reduce((sum, bill) => sum + (bill.insurance_paid || 0) + (bill.patient_paid || 0) + (bill.medpay_paid || 0), 0),
        totalAdjusted: clientBills.reduce((sum, bill) => sum + (bill.insurance_adjusted || 0), 0),
        totalReduced: clientBills.reduce((sum, bill) => sum + (bill.reduction_amount || 0), 0),
        balanceDue: clientBills.reduce((sum, bill) => sum + (bill.balance_due || 0), 0),
        billCount: clientBills.length
      };
    };
  }, [medicalBills]);

  // Calculate grand total across all clients
  const grandTotals = useMemo(() => {
    return clients.reduce((totals, client) => {
      const clientBills = getClientMedicalBills(client.id);
      return {
        totalBilled: totals.totalBilled + clientBills.reduce((sum, bill) => sum + (bill.amount_billed || 0), 0),
        totalPaid: totals.totalPaid + clientBills.reduce((sum, bill) => sum + (bill.insurance_paid || 0) + (bill.patient_paid || 0) + (bill.medpay_paid || 0), 0),
        totalAdjusted: totals.totalAdjusted + clientBills.reduce((sum, bill) => sum + (bill.insurance_adjusted || 0), 0),
        totalReduced: totals.totalReduced + clientBills.reduce((sum, bill) => sum + (bill.reduction_amount || 0), 0),
        balanceDue: totals.balanceDue + clientBills.reduce((sum, bill) => sum + (bill.balance_due || 0), 0),
        billCount: totals.billCount + clientBills.length
      };
    }, { totalBilled: 0, totalPaid: 0, totalAdjusted: 0, totalReduced: 0, balanceDue: 0, billCount: 0 });
  }, [clients, medicalBills]);

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditModalOpen(true);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteClient = async (clientId: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this client? This action cannot be undone.',
      { title: 'Delete Client', variant: 'danger' }
    );
    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      onShowToast('Client deleted successfully', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting client:', error);
      onShowToast('Failed to delete client', 'error');
    }
  };

  const handleReorderClient = async (clientId: number, direction: 'up' | 'down') => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    const currentOrder = client.clientOrder || 1;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

    // Find the client that would be swapped
    const swapClient = clients.find(c => (c.clientOrder || 1) === newOrder);
    if (!swapClient) return;

    try {
      // Update both clients' order
      const { error: error1 } = await supabase
        .from('clients')
        .update({ client_order: newOrder })
        .eq('id', clientId);

      const { error: error2 } = await supabase
        .from('clients')
        .update({ client_order: currentOrder })
        .eq('id', swapClient.id);

      if (error1 || error2) throw error1 || error2;

      onShowToast('Client order updated', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error reordering client:', error);
      onShowToast('Failed to reorder client', 'error');
    }
  };

  const getDriverCount = () => {
    return clients.filter(client => client.isDriver).length;
  };

  const getClientSummary = () => {
    const driverCount = getDriverCount();
    const totalClients = clients.length;
    
    if (totalClients === 1) {
      return clients[0].firstName && clients[0].lastName 
        ? `${clients[0].firstName} ${clients[0].lastName}`
        : '1 client';
    }
    
    return `${totalClients} clients (${driverCount} driver${driverCount !== 1 ? 's' : ''})`;
  };

  if (!clients || clients.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Clients Found</h3>
          <p className="text-gray-500 mb-6">This case doesn't have any clients yet.</p>
          <button
            onClick={handleAddClient}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Client
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Clients</h2>
              <p className="text-sm text-gray-600">{getClientSummary()}</p>
            </div>
          </div>
          
          <button
            onClick={handleAddClient}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Client Cards */}
      <div className="space-y-4">
        {clients
          .sort((a, b) => (a.clientOrder || 1) - (b.clientOrder || 1))
          .map((client, index) => (
          <div key={client.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Client Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {client.firstName && client.lastName 
                        ? `${client.firstName} ${client.lastName}`
                        : client.firstName 
                        ? client.firstName
                        : client.lastName
                        ? client.lastName
                        : `Client #${client.clientOrder || index + 1}`}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Client #{client.clientOrder || index + 1}</span>
                      {client.isDriver && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          <Car className="w-3 h-3" />
                          Driver
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorderClient(client.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorderClient(client.id, 'down')}
                      disabled={index === clients.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {expandedClient === client.id ? 'Collapse' : 'Expand'}
                    </button>
                    
                    <button
                      onClick={() => handleEditClient(client)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    
                    {clients.length > 1 && (
                      <button
                        onClick={() => handleDeleteClient(client.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-700 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Client Details */}
            {expandedClient === client.id && (
              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Full Name</p>
                      <p className="text-sm font-bold text-gray-900">
                        {client.firstName} {client.middleName} {client.lastName}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Date of Birth</p>
                      <p className="text-sm font-medium text-gray-900">{formatDate(client.dateOfBirth)}</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">SSN</p>
                      <p className="text-sm font-mono font-medium text-gray-900">{maskSSN(client.ssn)}</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-100">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Marital Status</p>
                      <p className="text-sm font-medium text-gray-900">{client.maritalStatus || 'Not specified'}</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Is Driver</p>
                      <p className="text-sm font-medium text-gray-900">{client.isDriver ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-green-600" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Address</p>
                      <p className="text-sm font-medium text-gray-900">
                        {client.streetAddress && client.city && client.state && client.zipCode
                          ? `${client.streetAddress}, ${client.city}, ${client.state} ${client.zipCode}`
                          : 'Not provided'}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Primary Phone</p>
                      <p className="text-sm font-medium text-gray-900">{formatPhone(client.primaryPhone)}</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Secondary Phone</p>
                      <p className="text-sm font-medium text-gray-900">{formatPhone(client.secondaryPhone) || 'Not provided'}</p>
                    </div>

                    <div className="sm:col-span-2 p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-100">
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{client.email || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    Medical Information
                  </h4>
                  <div className="space-y-4">
                    {client.injuryDescription && (
                      <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Injury Description</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {client.injuryDescription}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Prior Accidents</p>
                        <p className="text-sm font-medium text-gray-900">{client.priorAccidents || 'None'}</p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100">
                        <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Prior Injuries</p>
                        <p className="text-sm font-medium text-gray-900">{client.priorInjuries || 'None'}</p>
                      </div>

                      <div className="sm:col-span-2 p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                        <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Work Impact</p>
                        <p className="text-sm font-medium text-gray-900">{client.workImpact || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Referral Information */}
                {(client.referrer || client.referrerRelationship) && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4">Referral Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-100">
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Referred By</p>
                        <p className="text-sm font-medium text-gray-900">{client.referrer || 'Not specified'}</p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-yellow-50 to-white rounded-lg border border-yellow-100">
                        <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-2">Relationship</p>
                        <p className="text-sm font-medium text-gray-900">{client.referrerRelationship || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical Bills Summary */}
                {(() => {
                  const clientTotals = calculateClientTotals(client.id);
                  const clientBills = getClientMedicalBills(client.id);

                  return (
                    <div>
                      <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-red-600" />
                        Medical Bills Summary
                      </h4>
                      {clientBills.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                            <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Total Billed</p>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(clientTotals.totalBilled)}</p>
                              <p className="text-xs text-gray-500 mt-1">{clientTotals.billCount} bills</p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Total Paid</p>
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(clientTotals.totalPaid)}</p>
                              <p className="text-xs text-gray-500 mt-1">Paid</p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-100">
                              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Balance Due</p>
                              <p className={`text-lg font-bold ${clientTotals.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(clientTotals.balanceDue)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">Outstanding</p>
                            </div>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <p className="text-sm text-gray-600">
                              <strong>Adjustments:</strong> {formatCurrency(clientTotals.totalAdjusted)} | 
                              <strong> Reductions:</strong> {formatCurrency(clientTotals.totalReduced)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                          <p className="text-sm text-gray-500">No medical bills for this client yet.</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Grand Totals Across All Clients */}
      {grandTotals.billCount > 0 && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border-2 border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Grand Total - All Clients</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Total Billed</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(grandTotals.totalBilled)}</p>
              <p className="text-xs text-gray-500 mt-1">{grandTotals.billCount} bills</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Total Paid</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(grandTotals.totalPaid)}</p>
              <p className="text-xs text-gray-500 mt-1">All Payments</p>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-50 to-white rounded-lg border border-red-100">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Total Balance Due</p>
              <p className={`text-xl font-bold ${grandTotals.balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(grandTotals.balanceDue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Outstanding</p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={selectedClient}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />

      <EditClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        client={null}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />
      {ConfirmDialog}
    </div>
  );
}
