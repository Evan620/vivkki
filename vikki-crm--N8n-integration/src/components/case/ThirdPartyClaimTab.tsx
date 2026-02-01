import { useState } from 'react';
import { Edit2, Scale, DollarSign, FileCheck, AlertCircle, User, Shield } from 'lucide-react';
import EditThirdPartyModal from './EditThirdPartyModal';
import { formatCurrency } from '../../utils/formatting';
import { formatDate } from '../../utils/formatters';

interface ThirdPartyClaimTabProps {
  thirdPartyClaim: any;
  defendants: any[];
  thirdPartyClaimsByDefendant?: Record<number, any>;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function ThirdPartyClaimTab({
  thirdPartyClaim,
  defendants,
  thirdPartyClaimsByDefendant = {},
  casefileId,
  onUpdate,
  onShowToast
}: ThirdPartyClaimTabProps) {
  const [editingDefendantId, setEditingDefendantId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEdit = (defendantId: number) => {
    setEditingDefendantId(defendantId);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingDefendantId(null);
  };

  const getCurrentDefendant = () => {
    if (editingDefendantId) {
      return defendants.find(d => d.id === editingDefendantId) || null;
    }
    return defendants[0] || null;
  };

  const getCurrentClaim = () => {
    if (editingDefendantId) {
      return thirdPartyClaimsByDefendant[editingDefendantId] || null;
    }
    return thirdPartyClaim;
  };

  // If no defendants, show empty state
  if (!defendants || defendants.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <p className="text-gray-500 mb-4">No defendants found. Please add defendants first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Show per-defendant third party insurance */}
      {defendants.map((defendant) => {
        const claim = thirdPartyClaimsByDefendant[defendant.id] || null;
        // Handle both snake_case and camelCase field names
        const firstName = defendant.first_name || defendant.firstName || '';
        const lastName = defendant.last_name || defendant.lastName || '';
        const defendantName = `${firstName} ${lastName}`.trim() || 'Unknown Defendant';
        const liabilityPercentage = (defendant.liability_percentage !== null && defendant.liability_percentage !== undefined) 
          ? defendant.liability_percentage 
          : 100;

        return (
          <div key={defendant.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Defendant Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold text-gray-900">{defendantName}</h3>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  liabilityPercentage === 100 
                    ? 'bg-red-100 text-red-700' 
                    : liabilityPercentage > 0 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {liabilityPercentage}% Liability
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!claim && (
                  <button
                    onClick={() => handleEdit(defendant.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-xs hover:bg-blue-700 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Add Insurance</span>
                  </button>
                )}
                <button
                  onClick={() => handleEdit(defendant.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-xs hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
            </div>

            {!claim ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">No third party claim information available for this defendant</p>
                <button
                  onClick={() => handleEdit(defendant.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                >
                  Add Third Party Claim
                </button>
              </div>
            ) : (
              <>
                {/* Defendant Information */}
                <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Insurance Company</p>
                    <p className="text-sm font-medium text-gray-900">
                      {claim.auto_insurance?.name || defendant?.auto_insurance?.name || 'Not specified'}
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Policy Number</p>
                    <p className="text-sm font-mono font-medium text-gray-900">
                      {claim.policy_number || defendant?.policy_number || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Claim Number</p>
                    <p className="text-sm font-mono font-medium text-gray-900">
                      {claim.claim_number || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Adjuster Contact Details */}
                {(claim.adjuster_first_name || claim.adjuster_last_name || claim.adjuster_name || claim.adjuster_email || claim.adjuster_phone || claim.adjuster_fax) && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Adjuster Contact Information</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(claim.adjuster_first_name || claim.adjuster_last_name || claim.adjuster_name) && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Name</p>
                            <p className="text-sm font-medium text-gray-900">
                              {claim.adjuster_first_name || claim.adjuster_last_name
                                ? `${claim.adjuster_first_name || ''} ${claim.adjuster_last_name || ''}`.trim()
                                : claim.adjuster_name || 'N/A'}
                            </p>
                          </div>
                        )}
                        {claim.adjuster_email && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Email</p>
                            <p className="text-sm font-medium text-gray-900">{claim.adjuster_email}</p>
                          </div>
                        )}
                        {claim.adjuster_phone && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Phone</p>
                            <p className="text-sm font-medium text-gray-900">{claim.adjuster_phone}</p>
                          </div>
                        )}
                        {claim.adjuster_fax && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">Fax</p>
                            <p className="text-sm font-medium text-gray-900">{claim.adjuster_fax}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Liability Coverage */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-gray-900">Liability Coverage</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Policy Limits</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          {formatCurrency(claim.policy_limits || 0)}
                        </p>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Liability Percentage</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          {liabilityPercentage}%
                        </p>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-orange-100">
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Liability Disputed</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">
                          {claim.liability_disputed ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settlement Information */}
                {(claim.demand_amount || claim.offer_amount || claim.settlement_amount) && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <FileCheck className="w-4 h-4 text-green-600" />
                        <h4 className="text-sm font-bold text-gray-900">Settlement Information</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {claim.demand_amount && (
                          <div className="p-2 bg-white rounded-lg border border-orange-100">
                            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Demand Amount</p>
                            <p className="text-base sm:text-lg font-bold text-gray-900">
                              {formatCurrency(claim.demand_amount)}
                            </p>
                            {claim.demand_date && (
                              <p className="text-xs text-gray-500 mt-1">{formatDate(claim.demand_date)}</p>
                            )}
                          </div>
                        )}

                        {claim.offer_amount && (
                          <div className="p-2 bg-white rounded-lg border border-blue-100">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Offer Amount</p>
                            <p className="text-base sm:text-lg font-bold text-gray-900">
                              {formatCurrency(claim.offer_amount)}
                            </p>
                            {claim.offer_date && (
                              <p className="text-xs text-gray-500 mt-1">{formatDate(claim.offer_date)}</p>
                            )}
                          </div>
                        )}

                        {claim.settlement_amount && (
                          <div className="p-2 bg-white rounded-lg border border-green-100">
                            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Settlement Amount</p>
                            <p className="text-base sm:text-lg font-bold text-green-600">
                              {formatCurrency(claim.settlement_amount)}
                            </p>
                            {claim.settlement_date && (
                              <p className="text-xs text-gray-500 mt-1">{formatDate(claim.settlement_date)}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {claim.notes && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-gray-600" />
                        <h4 className="text-sm font-bold text-gray-900">Notes</h4>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {claim.notes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {/* Edit Modal */}
      <EditThirdPartyModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        thirdPartyClaim={getCurrentClaim()}
        defendant={getCurrentDefendant()}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />
    </div>
  );
}
