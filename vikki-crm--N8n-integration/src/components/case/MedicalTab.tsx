import { useState, useMemo, useEffect } from 'react';
import { Plus, Heart, FileText, Users, DollarSign, Filter, Shield, TrendingDown } from 'lucide-react';
import MedicalTable from './MedicalTable';
import AddProviderModal from './AddProviderModal';
import GenerateHipaaModal from './GenerateHipaaModal';
import BulkGenerateHipaaModal from './BulkGenerateHipaaModal';
import EditHealthClaimModal from './EditHealthClaimModal';
import GeneralDamagesCard from './GeneralDamagesCard';
import { calculateMedicalBillBalanceDue } from '../../utils/calculations';
import { formatCurrency } from '../../utils/formatting';
import { supabase } from '../../utils/database';

interface MedicalTabProps {
  medicalBills: any[];
  clients: any[];
  selectedClientId?: number | null;
  casefileId: number;
  healthClaim: any;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function MedicalTab({
  medicalBills,
  clients,
  selectedClientId: propSelectedClientId,
  casefileId,
  healthClaim,
  onUpdate,
  onShowToast
}: MedicalTabProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isHipaaModalOpen, setIsHipaaModalOpen] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);
  const [showBulkGenerateModal, setShowBulkGenerateModal] = useState(false);
  const [localSelectedClientId, setLocalSelectedClientId] = useState<number | null>(null);
  const [isHealthEditModalOpen, setIsHealthEditModalOpen] = useState(false);
  
  // Always use local state for filter dropdown (independent of prop)
  // Prop can be used as initial value, but dropdown controls its own state
  const selectedClientId = localSelectedClientId;
  const setSelectedClientId = setLocalSelectedClientId;
  
  // Initialize from prop if provided (only on mount or when prop changes from undefined to defined)
  useEffect(() => {
    if (propSelectedClientId !== undefined && localSelectedClientId === null) {
      setLocalSelectedClientId(propSelectedClientId);
    }
  }, [propSelectedClientId]);

  // Only filter providers for the currently selected client, not all clients
  const existingProviderIds = useMemo(() => {
    if (!selectedClientId) return [];
    return medicalBills
      .filter(bill => bill.client_id === selectedClientId)
      .map(bill => bill.medical_provider_id)
      .filter(id => id != null);
  }, [medicalBills, selectedClientId]);

  // Filter bills by selected client
  const filteredBills = useMemo(() => {
    if (!selectedClientId) return medicalBills;
    return medicalBills.filter(bill => bill.client_id === selectedClientId);
  }, [medicalBills, selectedClientId]);

  // Calculate financial totals
  const financialTotals = useMemo(() => {
    return filteredBills.reduce(
      (totals, bill) => {
        const balanceDue = calculateMedicalBillBalanceDue(bill);
        return {
          totalBilled: totals.totalBilled + (bill.amountBilled || bill.total_billed || 0),
          insurancePaid: totals.insurancePaid + (bill.insurancePaid || bill.insurance_paid || 0),
          insuranceAdjusted: totals.insuranceAdjusted + (bill.insuranceAdjusted || bill.insurance_adjusted || 0),
          medpayPaid: totals.medpayPaid + (bill.medpayPaid || bill.medpay_paid || 0),
          patientPaid: totals.patientPaid + (bill.patientPaid || bill.patient_paid || 0),
          reductionAmount: totals.reductionAmount + (bill.reductionAmount || bill.reduction_amount || 0),
          piExpense: totals.piExpense + (bill.piExpense || bill.pi_expense || 0),
          balanceDue: totals.balanceDue + balanceDue
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
  }, [filteredBills]);

  const handleBulkGenerate = () => {
    if (selectedProviders.length === 0) {
      onShowToast('Please select at least one provider', 'error');
      return;
    }
    setShowBulkGenerateModal(true);
  };

  const handleClientFilterChange = (clientId: number | null) => {
    setSelectedClientId(clientId);
    setSelectedProviders([]); // Clear selection when changing filter
  };

  // Calculate client responsibility for health insurance
  const clientResponsibility = useMemo(() => {
    if (!healthClaim) return financialTotals.balanceDue;
    return financialTotals.totalBilled - (healthClaim.amount_paid || 0);
  }, [financialTotals.totalBilled, healthClaim]);


  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${selectedClientId ? '5' : '4'} gap-4`}>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-600">Total Billed</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(financialTotals.totalBilled)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-600">Total Paid</p>
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(financialTotals.insurancePaid + financialTotals.medpayPaid + financialTotals.patientPaid)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-600">Adjustments</p>
              <p className="text-2xl font-bold text-orange-900">{formatCurrency(financialTotals.insuranceAdjusted)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-600">Balance Due</p>
              <p className="text-2xl font-bold text-red-900">{formatCurrency(financialTotals.balanceDue)}</p>
            </div>
          </div>
        </div>

        {/* Case Total - Only show when a client is selected */}
        {selectedClientId && (() => {
          // Calculate totals for ALL clients
          const allBills = medicalBills;
          const caseTotals = allBills.reduce(
            (totals, bill) => {
              const balanceDue = calculateMedicalBillBalanceDue(bill);
              return {
                totalBilled: totals.totalBilled + (bill.amountBilled || bill.total_billed || 0),
                insurancePaid: totals.insurancePaid + (bill.insurancePaid || bill.insurance_paid || 0),
                insuranceAdjusted: totals.insuranceAdjusted + (bill.insuranceAdjusted || bill.insurance_adjusted || 0),
                medpayPaid: totals.medpayPaid + (bill.medpayPaid || bill.medpay_paid || 0),
                patientPaid: totals.patientPaid + (bill.patientPaid || bill.patient_paid || 0),
                reductionAmount: totals.reductionAmount + (bill.reductionAmount || bill.reduction_amount || 0),
                piExpense: totals.piExpense + (bill.piExpense || bill.pi_expense || 0),
                balanceDue: totals.balanceDue + balanceDue
              };
            },
            { totalBilled: 0, insurancePaid: 0, insuranceAdjusted: 0, medpayPaid: 0, patientPaid: 0, reductionAmount: 0, piExpense: 0, balanceDue: 0 }
          );

          return (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-300">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-purple-600">Case Total</p>
                  <p className="text-2xl font-bold text-purple-900">{formatCurrency(caseTotals.totalBilled)}</p>
                  <p className="text-xs text-purple-600 mt-1">All clients combined</p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Medical Providers Section - Moved to top */}
      {/* Client Filter and Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Medical Providers</h3>
                <p className="text-sm text-gray-600">
                  {selectedClientId 
                    ? (() => {
                        const client = clients.find(c => c.id === selectedClientId);
                        const firstName = client?.first_name || client?.firstName || '';
                        const lastName = client?.last_name || client?.lastName || '';
                        const clientName = `${firstName} ${lastName}`.trim() || 'Unknown Client';
                        return `Showing bills for ${clientName}`;
                      })()
                    : `Showing all bills (${filteredBills.length} total)`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
            {/* Client Filter */}
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <select
                value={selectedClientId || ''}
                onChange={(e) => handleClientFilterChange(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Clients</option>
                {clients.map(client => {
                  const firstName = client.first_name || client.firstName || '';
                  const lastName = client.last_name || client.lastName || '';
                  const clientName = `${firstName} ${lastName}`.trim() || 'Unknown Client';
                  return (
                    <option key={client.id} value={client.id}>
                      {clientName}
                    </option>
                  );
                })}
              </select>
            </div>

              {/* Bulk Actions */}
              {filteredBills.length > 0 && (
                <button
                  onClick={handleBulkGenerate}
                  disabled={selectedProviders.length === 0}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4" />
                  Generate HIPAA
                  {selectedProviders.length > 0 && (
                    <span className="px-2 py-0.5 bg-white text-green-700 rounded-md text-xs font-bold">
                      {selectedProviders.length}
                    </span>
                  )}
                </button>
              )}

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Provider
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">

          {filteredBills.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-white">
              <div className="text-6xl mb-4">🏥</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {selectedClientId ? 'No medical providers for this client' : 'No medical providers yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {selectedClientId 
                  ? 'This client doesn\'t have any medical providers added yet.'
                  : 'Add medical providers to track treatment and bills'
                }
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add First Provider
              </button>
            </div>
          ) : (
            <MedicalTable
            medicalBills={filteredBills}
              casefileId={casefileId}
              selectedProviders={selectedProviders}
              onSelectionChange={setSelectedProviders}
              onUpdate={onUpdate}
              onShowToast={onShowToast}
            financialTotals={financialTotals}
            />
          )}
        </div>
      </div>

      {/* Health Insurance Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Health Insurance</h3>
              <p className="text-sm text-gray-600">
                {healthClaim ? 'Health insurance claim information' : 'No health insurance claim added'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsHealthEditModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {healthClaim ? 'Edit' : 'Add'} Health Insurance
          </button>
        </div>


        {healthClaim ? (
          <div className="p-3 sm:p-4 space-y-4">
            {/* Insurance Provider Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" />
                Insurance Provider Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Insurance Provider</p>
                  <p className="text-sm font-medium text-gray-900">{healthClaim.health_insurance?.name || 'Not specified'}</p>
                </div>

                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Policy Number</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{healthClaim.policy_number || 'Not provided'}</p>
                </div>

                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Group Number</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{healthClaim.group_number || 'Not provided'}</p>
                </div>

                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Claim Number</p>
                  <p className="text-sm font-mono font-medium text-gray-900">{healthClaim.claim_number || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Health Insurance Company Details */}
            {healthClaim.health_insurance && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Insurance Company Details</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {healthClaim.health_insurance.phone && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{healthClaim.health_insurance.phone}</p>
                      </div>
                    )}
                    {healthClaim.health_insurance.email && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900">{healthClaim.health_insurance.email}</p>
                      </div>
                    )}
                    {(healthClaim.health_insurance.street_address || healthClaim.health_insurance.city) && (
                      <div className="sm:col-span-2">
                        <p className="text-xs text-gray-600 mb-1">Address</p>
                        <p className="text-sm font-medium text-gray-900">
                          {[healthClaim.health_insurance.street_address, healthClaim.health_insurance.city, healthClaim.health_insurance.state, healthClaim.health_insurance.zip_code].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Adjuster Information */}
            {healthClaim.health_adjuster && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Adjuster Contact Information</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {(healthClaim.health_adjuster.first_name || healthClaim.health_adjuster.last_name) && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {[healthClaim.health_adjuster.first_name, healthClaim.health_adjuster.last_name].filter(Boolean).join(' ') || 'N/A'}
                        </p>
                      </div>
                    )}
                    {healthClaim.health_adjuster.email && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900">{healthClaim.health_adjuster.email}</p>
                      </div>
                    )}
                    {healthClaim.health_adjuster.phone && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{healthClaim.health_adjuster.phone}</p>
                      </div>
                    )}
                    {healthClaim.health_adjuster.fax && (
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Fax</p>
                        <p className="text-sm font-medium text-gray-900">{healthClaim.health_adjuster.fax}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                Payment Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Amount Billed</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(healthClaim.amount_billed || 0)}</p>
                </div>

                <div className="p-2 sm:p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Amount Paid</p>
                  <p className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(healthClaim.amount_paid || 0)}</p>
                </div>
              </div>
            </div>

            {/* Financial Impact */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-orange-600" />
                Financial Impact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Medical Bills</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(financialTotals.totalBilled)}</p>
                </div>

                <div className="p-2 sm:p-3 bg-green-50 rounded-lg border border-green-100">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Health Insurance Paid</p>
                  <p className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(healthClaim.amount_paid || 0)}</p>
                </div>

                <div className={`p-2 sm:p-3 rounded-lg border ${
                  clientResponsibility > 0
                    ? 'bg-orange-50 border-orange-100'
                    : 'bg-green-50 border-green-100'
                }`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                    clientResponsibility > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>Client Responsibility</p>
                  <p className={`text-base sm:text-lg font-bold ${
                    clientResponsibility > 0 ? 'text-orange-600' : 'text-green-600'
                  }`}>{formatCurrency(clientResponsibility)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {healthClaim.notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Notes</h4>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {healthClaim.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 sm:p-8 text-center">
            <div className="text-6xl mb-4">🏥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Health Insurance Claim</h3>
            <p className="text-gray-600 mb-6">
              Add health insurance information to track payments and client responsibility
            </p>
            <button
              onClick={() => setIsHealthEditModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Health Insurance Claim
            </button>
          </div>
        )}
      </div>

      {/* General Damages Section */}
      <GeneralDamagesCard
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />

      {/* Modals */}
      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        clientId={selectedClientId || clients[0]?.id}
        casefileId={casefileId}
        existingProviderIds={existingProviderIds}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />

      <GenerateHipaaModal
        isOpen={isHipaaModalOpen}
        onClose={() => setIsHipaaModalOpen(false)}
        medicalBills={filteredBills}
        clientData={selectedClientId ? clients.find(c => c.id === selectedClientId) || clients[0] : clients[0]}
        casefileId={casefileId}
        onShowToast={onShowToast}
      />

      <EditHealthClaimModal
        isOpen={isHealthEditModalOpen}
        onClose={() => setIsHealthEditModalOpen(false)}
        healthClaim={healthClaim}
        clientId={selectedClientId || clients[0]?.id}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />

      {showBulkGenerateModal && (
        <BulkGenerateHipaaModal
          isOpen={showBulkGenerateModal}
          onClose={() => setShowBulkGenerateModal(false)}
          selectedProviders={selectedProviders}
          medicalBills={filteredBills}
          clientData={selectedClientId ? clients.find(c => c.id === selectedClientId) || clients[0] : clients[0]}
          casefileId={casefileId}
          onSuccess={() => {
            setSelectedProviders([]);
            setShowBulkGenerateModal(false);
            onUpdate();
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
