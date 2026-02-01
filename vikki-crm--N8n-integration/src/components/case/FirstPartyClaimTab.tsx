import { useState, useMemo } from 'react';
import { Edit2, Shield, DollarSign, TrendingUp, User } from 'lucide-react';
import EditFirstPartyModal from './EditFirstPartyModal';
import { formatCurrency } from '../../utils/formatting';

interface FirstPartyClaimTabProps {
  firstPartyClaim: any;
  clients: any[];
  firstPartyClaimsByClient: Record<number, any[]>;
  healthClaimsByClient: Record<number, any[]>;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function FirstPartyClaimTab({
  firstPartyClaim,
  clients,
  firstPartyClaimsByClient,
  healthClaimsByClient,
  casefileId,
  onUpdate,
  onShowToast
}: FirstPartyClaimTabProps) {
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get all clients with their first party claims
  const clientsWithClaims = useMemo(() => {
    return clients.map(client => {
      const claims = firstPartyClaimsByClient[client.id] || [];
      return {
        client,
        claim: claims[0] || null, // Take first claim if multiple exist
        claims
      };
    });
  }, [clients, firstPartyClaimsByClient]);

  const handleEdit = (clientId: number) => {
    setEditingClientId(clientId);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingClientId(null);
  };

  const getCurrentClaim = () => {
    if (editingClientId) {
      const claims = firstPartyClaimsByClient[editingClientId] || [];
      return claims[0] || null;
    }
    return firstPartyClaim;
  };

  // If no clients, show empty state
  if (!clients || clients.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🛡️</div>
          <p className="text-gray-500 mb-4">No clients found. Please add clients first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Show per-client first party insurance */}
      {clientsWithClaims.map(({ client, claim }) => {
        // Handle both snake_case and camelCase field names from database
        const firstName = client.first_name || client.firstName || '';
        const lastName = client.last_name || client.lastName || '';
        const clientName = `${firstName} ${lastName}`.trim() || 'Unknown Client';
        
        const pipAvailable = claim ? (parseFloat(claim.pip_available || claim.pipAvailable || '0') || 0) : 0;
        const pipUsed = claim ? (parseFloat(claim.pip_used || claim.pipUsed || '0') || 0) : 0;
        const pipRemaining = pipAvailable - pipUsed;
        
        const medPayAvailable = claim ? (parseFloat(claim.med_pay_available || claim.medPayAvailable || '0') || 0) : 0;
        const medPayUsed = claim ? (parseFloat(claim.med_pay_used || claim.medPayUsed || '0') || 0) : 0;
        const medPayRemaining = medPayAvailable - medPayUsed;

        return (
          <div key={client.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Client Header */}
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-bold text-gray-900">{clientName}</h3>
                {client.isDriver && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Driver</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!claim && (
                  <button
                    onClick={() => handleEdit(client.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-xs hover:bg-blue-700 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Add Insurance</span>
                  </button>
                )}
                <button
                  onClick={() => handleEdit(client.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-xs hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              </div>
            </div>

            {!claim ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 mb-4">No auto insurance information available for this client</p>
                <button
                  onClick={() => handleEdit(client.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors"
                >
                  Add Auto Insurance
                </button>
              </div>
            ) : (
              <>
                {/* Insurance Information */}
                <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Insurance Company</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(claim.auto_insurance?.name || claim.autoInsurance?.name) || 'Not specified'}
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Policy Number</p>
                    <p className="text-sm font-mono font-medium text-gray-900">
                      {(claim.policy_number || claim.policyNumber) || 'Not provided'}
                    </p>
                  </div>

                  <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Claim Number</p>
                    <p className="text-sm font-mono font-medium text-gray-900">
                      {(claim.claim_number || claim.claimNumber) || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Adjuster Information */}
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

                {/* PIP Coverage */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-gray-900">PIP (Personal Injury Protection)</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-blue-100">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">PIP Available</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(pipAvailable)}</p>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-orange-100">
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">PIP Used</p>
                        <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(pipUsed)}</p>
                      </div>

                      <div className={`p-2 bg-white rounded-lg border ${
                        pipRemaining > 0 ? 'border-green-100' : 'border-red-100'
                      }`}>
                        <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                          pipRemaining > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>PIP Remaining</p>
                        <p className={`text-base sm:text-lg font-bold ${
                          pipRemaining > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>{formatCurrency(pipRemaining)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Coverage */}
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-gray-900">Additional Coverage</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="p-2 bg-white rounded-lg border border-blue-100">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Med Pay Available</p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(medPayAvailable)}</p>
                        </div>

                        <div className="p-2 bg-white rounded-lg border border-orange-100">
                          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Med Pay Used</p>
                          <p className="text-base sm:text-lg font-bold text-gray-900">{formatCurrency(medPayUsed)}</p>
                        </div>

                        <div className={`p-2 bg-white rounded-lg border ${
                          medPayRemaining > 0 ? 'border-green-100' : 'border-red-100'
                        }`}>
                          <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${
                            medPayRemaining > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>Med Pay Remaining</p>
                          <p className={`text-base sm:text-lg font-bold ${
                            medPayRemaining > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>{formatCurrency(medPayRemaining)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 bg-white rounded-lg border border-blue-100">
                          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">UM/UIM Coverage</p>
                          <p className="text-sm font-bold text-gray-900">
                            {(() => {
                              const umUimValue = claim.um_uim_coverage || claim.umUimCoverage || claim.um_amount || '0';
                              // If it contains a slash, display as-is (e.g., "25/50")
                              if (typeof umUimValue === 'string' && umUimValue.includes('/')) {
                                return umUimValue;
                              }
                              // Otherwise, try to format as currency
                              const numValue = parseFloat(umUimValue);
                              return isNaN(numValue) ? '0' : formatCurrency(numValue);
                            })()}
                          </p>
                        </div>

                        <div className="p-2 bg-white rounded-lg border border-green-100">
                          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Property Damage</p>
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(claim.property_damage || claim.propertyDamage || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Edit Modal */}
      <EditFirstPartyModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        firstPartyClaim={getCurrentClaim()}
        clientId={editingClientId}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />
    </div>
  );
}
