import { useState, useMemo } from 'react';
import { Edit2, Heart, DollarSign, TrendingDown } from 'lucide-react';
import EditHealthClaimModal from './EditHealthClaimModal';
import { formatCurrency } from '../../utils/formatting';

interface HealthInsuranceTabProps {
  healthClaim: any;
  clientId: number;
  casefileId: number;
  totalMedicalBills: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function HealthInsuranceTab({
  healthClaim,
  clientId,
  casefileId,
  totalMedicalBills,
  onUpdate,
  onShowToast
}: HealthInsuranceTabProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const clientResponsibility = useMemo(() =>
    totalMedicalBills - (healthClaim?.amount_paid || 0),
    [totalMedicalBills, healthClaim]
  );

  if (!healthClaim) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🏥</div>
          <p className="text-gray-500 mb-4">No health insurance claim information available</p>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 font-medium text-sm sm:text-base transition-colors"
          >
            Add Health Insurance Claim
          </button>
        </div>
        <EditHealthClaimModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          healthClaim={null}
          clientId={clientId}
          casefileId={casefileId}
          onUpdate={onUpdate}
          onShowToast={onShowToast}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-blue-600" />
            <span>Health Insurance</span>
          </h3>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-xs hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
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

        {/* Health Insurance Company Details */}
        {healthClaim.health_insurance && (
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Insurance Company Details</h4>
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
          <div className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Adjuster Contact Information</h4>
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
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm sm:text-base font-bold text-gray-900">Payment Information</h3>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Amount Billed</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(healthClaim.amount_billed)}</p>
          </div>

          <div className="p-2 sm:p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Amount Paid</p>
            <p className="text-base sm:text-lg font-bold text-green-600">{formatCurrency(healthClaim.amount_paid)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm sm:text-base font-bold text-gray-900">Financial Summary</h3>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Total Medical Bills</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(totalMedicalBills)}</p>
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

      {healthClaim.notes && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm sm:text-base font-bold text-gray-900">Notes</h3>
          </div>
          <div className="p-3 sm:p-4">
            <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {healthClaim.notes}
              </p>
            </div>
          </div>
        </div>
      )}

      <EditHealthClaimModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        healthClaim={healthClaim}
        clientId={clientId}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />
    </div>
  );
}
