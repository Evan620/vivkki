import { useState } from 'react';
import { useConfirmDialog } from '../../hooks/useConfirmDialog.tsx';
import { Plus, Edit2, Trash2, Scale, Users, Percent, AlertTriangle, ChevronUp, ChevronDown, Mail, Phone, MapPin, Shield, FileCheck, Edit } from 'lucide-react';
import EditDefendantModal from './EditDefendantModal';
import { formatDate } from '../../utils/formatters';
import { supabase } from '../../utils/database';
import { updateThirdPartyClaim } from '../../services/update';
import AutoAdjusterForm from '../forms/AutoAdjusterForm';
import { 
  fetchAutoAdjusters, 
  createAutoAdjuster, 
  updateAutoAdjuster, 
  deleteAutoAdjuster 
} from '../../utils/database';
import type { Defendant } from '../../types';

interface DefendantsTabProps {
  defendants: Defendant[];
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function DefendantsTab({
  defendants,
  casefileId,
  onUpdate,
  onShowToast
}: DefendantsTabProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDefendant, setSelectedDefendant] = useState<Defendant | null>(null);
  const [expandedDefendant, setExpandedDefendant] = useState<number | null>(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingAdjuster, setEditingAdjuster] = useState<any | null>(null);
  const [isAdjusterFormOpen, setIsAdjusterFormOpen] = useState(false);
  const [adjusterDefendantId, setAdjusterDefendantId] = useState<number | null>(null);
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();

  const handleEditDefendant = (defendant: Defendant) => {
    setSelectedDefendant(defendant);
    setIsEditModalOpen(true);
  };
  const handleToggleClaim = async (field: 'lor_sent' | 'loa_received', currentValue: boolean, claimId?: number) => {
    if (!claimId) return;
    setUpdating(field);
    const next = !currentValue;
    try {
      const result = await updateThirdPartyClaim(claimId, { [field]: next });
      if (!result.ok) throw new Error(result.message || 'Update failed');
      onShowToast('Claim status updated', 'success');
      onUpdate();
    } catch (e) {
      console.error('Error updating claim toggle:', e);
      onShowToast('Failed to update claim status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const handleEditAdjuster = (adjuster: any, defendantId: number) => {
    // Convert camelCase adjuster back to snake_case for form
    const adjusterData = {
      id: adjuster.id,
      first_name: adjuster.firstName || '',
      last_name: adjuster.lastName || '',
      middle_name: '',
      email: adjuster.email || '',
      phone: adjuster.phone || '',
      fax: adjuster.fax || '',
      street_address: adjuster.mailingAddress || '',
      city: adjuster.city || '',
      state: adjuster.state || '',
      zip_code: adjuster.zipCode || ''
    };
    setEditingAdjuster(adjusterData);
    setAdjusterDefendantId(defendantId);
    setIsAdjusterFormOpen(true);
  };

  const handleDeleteAdjuster = async (adjusterId: number) => {
    const adjuster = defendants
      .flatMap(d => d.autoAdjusters || [])
      .find(a => a.id === adjusterId);
    const adjusterName = adjuster 
      ? `${adjuster.firstName || ''} ${adjuster.lastName || ''}`.trim() || 'this adjuster'
      : 'this adjuster';
    
    const yes = await confirm(`Delete ${adjusterName}?`, { title: 'Delete Adjuster', variant: 'danger' });
    if (!yes) return;

    try {
      const success = await deleteAutoAdjuster(adjusterId);
      if (success) {
        onShowToast('Adjuster deleted successfully', 'success');
        onUpdate(); // Refresh the case data
      } else {
        onShowToast('Failed to delete adjuster', 'error');
      }
    } catch (error: any) {
      console.error('Error deleting adjuster:', error);
      onShowToast(`Failed to delete adjuster: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const handleAdjusterSubmit = async (adjusterData: any) => {
    try {
      const defendant = defendants.find(d => d.id === adjusterDefendantId);
      if (!defendant || !defendant.autoInsuranceId) {
        onShowToast('Defendant or insurance information not found', 'error');
        return;
      }

      // Find the third party claim for this defendant
      const { data: thirdPartyClaim } = await supabase
        .from('third_party_claims')
        .select('id')
        .eq('defendant_id', defendant.id)
        .maybeSingle();

      if (editingAdjuster) {
        // Update existing adjuster - fetch current adjuster to check for third_party_claim_id
        const { data: currentAdjuster } = await supabase
          .from('auto_adjusters')
          .select('third_party_claim_id')
          .eq('id', editingAdjuster.id)
          .single();
        
        const updateData: any = { ...adjusterData };
        // Preserve third_party_claim_id if it exists, or add it if claim exists and adjuster doesn't have one
        if (currentAdjuster?.third_party_claim_id) {
          updateData.third_party_claim_id = currentAdjuster.third_party_claim_id;
        } else if (thirdPartyClaim) {
          updateData.third_party_claim_id = thirdPartyClaim.id;
        }
        await updateAutoAdjuster(editingAdjuster.id, updateData);
        onShowToast('Adjuster updated successfully', 'success');
      } else {
        // Create new adjuster - link to both insurance and third party claim
        const adjusterPayload: any = {
          ...adjusterData,
          auto_insurance_id: defendant.autoInsuranceId
        };
        if (thirdPartyClaim) {
          adjusterPayload.third_party_claim_id = thirdPartyClaim.id;
        }
        await createAutoAdjuster(adjusterPayload);
        onShowToast('Adjuster added successfully', 'success');
      }
      onUpdate(); // Refresh the case data
      setIsAdjusterFormOpen(false);
      setEditingAdjuster(null);
      setAdjusterDefendantId(null);
    } catch (error: any) {
      console.error('Error saving adjuster:', error);
      onShowToast(`Failed to save adjuster: ${error.message || 'Unknown error'}`, 'error');
      throw error; // Let the form handle the error display
    }
  };

  const handleAddDefendant = () => {
    setSelectedDefendant(null);
    setIsAddModalOpen(true);
  };

  const handleDeleteDefendant = async (defendantId: number) => {
    const confirmed = await confirm(
      'Are you sure you want to delete this defendant? This action cannot be undone.',
      { title: 'Delete Defendant', variant: 'danger' }
    );
    if (!confirmed) {
      return;
    }

    try {
      const { error } = await supabase
        .from('defendants')
        .delete()
        .eq('id', defendantId);

      if (error) throw error;

      onShowToast('Defendant deleted successfully', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error deleting defendant:', error);
      onShowToast('Failed to delete defendant', 'error');
    }
  };

  const handleReorderDefendant = async (defendantId: number, direction: 'up' | 'down') => {
    const defendant = defendants.find(d => d.id === defendantId);
    if (!defendant) return;

    const currentOrder = defendant.defendantNumber || 1;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

    // Find the defendant that would be swapped
    const swapDefendant = defendants.find(d => (d.defendantNumber || 1) === newOrder);
    if (!swapDefendant) return;

    try {
      // Update both defendants' order
      const { error: error1 } = await supabase
        .from('defendants')
        .update({ defendant_number: newOrder })
        .eq('id', defendantId);

      const { error: error2 } = await supabase
        .from('defendants')
        .update({ defendant_number: currentOrder })
        .eq('id', swapDefendant.id);

      if (error1 || error2) throw error1 || error2;

      onShowToast('Defendant order updated', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error reordering defendant:', error);
      onShowToast('Failed to reorder defendant', 'error');
    }
  };

  const getTotalLiability = () => {
    return defendants.reduce((sum, defendant) => sum + ((defendant.liabilityPercentage !== null && defendant.liabilityPercentage !== undefined) ? defendant.liabilityPercentage : 100), 0);
  };

  const getDefendantSummary = () => {
    const totalDefendants = defendants.length;
    const totalLiability = getTotalLiability();
    
    if (totalDefendants === 1) {
      const defendant = defendants[0];
      const firstName = defendant.first_name || defendant.firstName || '';
      const lastName = defendant.last_name || defendant.lastName || '';
      const defendantName = `${firstName} ${lastName}`.trim();
      return defendantName || '1 defendant';
    }
    
    return `${totalDefendants} defendants (${totalLiability}% total liability)`;
  };

  const getLiabilityStatus = () => {
    const totalLiability = getTotalLiability();
    if (totalLiability > 100) {
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle };
    } else if (totalLiability < 100) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertTriangle };
    } else {
      return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: null };
    }
  };

  if (!defendants || defendants.length === 0) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Defendants Found</h3>
          <p className="text-gray-500 mb-6">This case doesn't have any defendants yet.</p>
          <button
            onClick={handleAddDefendant}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Defendant
          </button>
        </div>
      </div>
    );
  }

  const liabilityStatus = getLiabilityStatus();
  const totalLiability = getTotalLiability();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Defendants</h2>
                <p className="text-sm text-gray-600">{getDefendantSummary()}</p>
              </div>
            </div>
            
            <button
              onClick={handleAddDefendant}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Defendant
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">

          {/* Liability Warning */}
          {totalLiability !== 100 && (
            <div className={`mt-4 ${liabilityStatus.bg} ${liabilityStatus.border} border rounded-lg p-4`}>
              <div className="flex items-center gap-2">
                {liabilityStatus.icon && <liabilityStatus.icon className="w-5 h-5" />}
                <p className={`text-sm font-medium ${liabilityStatus.color}`}>
                  <strong>Liability Distribution:</strong> Total liability is {totalLiability}%
                  {totalLiability > 100 ? ' (exceeds 100%)' : ' (under 100%)'}
                  {totalLiability > 100 ? ' - Please adjust percentages to total 100%' : ' - Consider adding more defendants or adjusting percentages'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Defendant Cards */}
      <div className="space-y-4">
        {defendants
          .sort((a, b) => (a.defendantNumber || 1) - (b.defendantNumber || 1))
          .map((defendant, index) => (
          <div key={defendant.id} className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Defendant Header */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Scale className="w-5 h-5 text-orange-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {(() => {
                        const firstName = defendant.first_name || defendant.firstName || '';
                        const lastName = defendant.last_name || defendant.lastName || '';
                        return `${firstName} ${lastName}`.trim() || 'Unknown Defendant';
                      })()}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Defendant #{defendant.defendantNumber || index + 1}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${liabilityStatus.bg} ${liabilityStatus.color}`}>
                        {(defendant.liabilityPercentage !== null && defendant.liabilityPercentage !== undefined) ? defendant.liabilityPercentage : 100}% Liability
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleReorderDefendant(defendant.id, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorderDefendant(defendant.id, 'down')}
                      disabled={index === defendants.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedDefendant(expandedDefendant === defendant.id ? null : defendant.id)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                      {expandedDefendant === defendant.id ? 'Collapse' : 'Expand'}
                    </button>
                    
                    <button
                      onClick={() => handleEditDefendant(defendant)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </button>
                    
                    {defendants.length > 1 && (
                      <button
                        onClick={() => handleDeleteDefendant(defendant.id)}
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

            {/* Defendant Details */}
            {expandedDefendant === defendant.id && (
              <div className="p-4 sm:p-6 space-y-6">
                {/* Defendant Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-orange-600" />
                    Defendant Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Full Name</p>
                      <p className="text-sm font-bold text-gray-900">
                        {(() => {
                          const firstName = defendant.first_name || defendant.firstName || '';
                          const lastName = defendant.last_name || defendant.lastName || '';
                          return `${firstName} ${lastName}`.trim() || 'Unknown Defendant';
                        })()}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Is Policyholder</p>
                      <p className="text-sm font-medium text-gray-900">{defendant.isPolicyholder ? 'Yes' : 'No'}</p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Liability Percentage</p>
                      <p className="text-sm font-bold text-gray-900">{(defendant.liabilityPercentage !== null && defendant.liabilityPercentage !== undefined) ? defendant.liabilityPercentage : 100}%</p>
                    </div>

                    {defendant.relationshipType && (
                      <div className="p-4 bg-gradient-to-br from-pink-50 to-white rounded-lg border border-pink-100">
                        <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide mb-2">Relationship</p>
                        <p className="text-sm font-medium text-gray-900">
                          {defendant.relationshipType}
                          {defendant.relatedToDefendantId && (
                            <span className="text-xs text-gray-500 ml-2">
                              (Related to Defendant #{defendant.relatedToDefendantId})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {!defendant.isPolicyholder && defendant.policyholderFirstName && (
                      <div className="sm:col-span-2 lg:col-span-3 p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-100">
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Policyholder Name</p>
                        <p className="text-sm font-medium text-gray-900">
                          {defendant.policyholderFirstName} {defendant.policyholderLastName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Insurance Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    Insurance Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Insurance Company</p>
                      <p className="text-sm font-medium text-gray-900">
                        {defendant.autoInsurance?.name || defendant.auto_insurance?.name || 'Not provided'}
                      </p>
                    </div>

                    <div className="p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100">
                      <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-2">Policy Number</p>
                      <p className="text-sm font-mono font-medium text-gray-900">
                        {defendant.policyNumber || defendant.policy_number || 'Not provided'}
                      </p>
                    </div>

                    {defendant.notes && (
                      <div className="sm:col-span-2 p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-100">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Notes</p>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {defendant.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Adjuster Information */}
                {defendant.autoAdjusters && defendant.autoAdjusters.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      Adjuster Information
                    </h4>
                    <div className="space-y-4">
                      {defendant.autoAdjusters.map((adjuster, adjusterIndex) => (
                        <div key={adjusterIndex || adjuster.id} className="p-4 bg-gradient-to-br from-green-50 to-white rounded-lg border border-green-100">
                          <div className="flex items-start justify-between mb-3">
                            <h5 className="text-sm font-semibold text-gray-900">
                              {adjuster.firstName} {adjuster.lastName}
                            </h5>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditAdjuster(adjuster, defendant.id)}
                                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit Adjuster"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAdjuster(adjuster.id)}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Adjuster"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {adjuster.email && (
                              <div>
                                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Email</p>
                                <p className="text-sm font-medium text-gray-900">{adjuster.email}</p>
                              </div>
                            )}

                            {adjuster.phone && (
                              <div>
                                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Phone</p>
                                <p className="text-sm font-medium text-gray-900">{adjuster.phone}</p>
                              </div>
                            )}

                            {adjuster.fax && (
                              <div>
                                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Fax</p>
                                <p className="text-sm font-medium text-gray-900">{adjuster.fax}</p>
                              </div>
                            )}

                            {(adjuster.mailingAddress || adjuster.city || adjuster.state) && (
                              <div>
                                <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-2">Mailing Address</p>
                                <p className="text-sm font-medium text-gray-900">
                                  {[adjuster.mailingAddress, adjuster.city, adjuster.state, adjuster.zipCode]
                                    .filter(Boolean)
                                    .join(', ') || 'Not provided'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Third Party Claim Status */}
                {defendant.thirdPartyClaim && (
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-green-600" />
                      Third Party Claim Status
                    </h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">LOR Sent</p>
                          <p className="text-xs text-gray-500 mt-0.5">Letter of Representation</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={defendant.thirdPartyClaim.lorSent || false}
                            onChange={() => handleToggleClaim('lor_sent', defendant.thirdPartyClaim.lorSent, defendant.thirdPartyClaim.id)}
                            disabled={updating === 'lor_sent'}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg border border-purple-100">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">LOA Received</p>
                          <p className="text-xs text-gray-500 mt-0.5">Letter of Authorization</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={defendant.thirdPartyClaim.loaReceived || false}
                            onChange={() => handleToggleClaim('loa_received', defendant.thirdPartyClaim.loaReceived, defendant.thirdPartyClaim.id)}
                            disabled={updating === 'loa_received'}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
                        </label>
                      </div>

                      {defendant.thirdPartyClaim.lastRequestDate && (
                        <div className="p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-100">
                          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-2">Last Request Date</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(defendant.thirdPartyClaim.lastRequestDate)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Add all parties who may be at fault for the accident</li>
          <li>• Assign liability percentages that total 100%</li>
          <li>• Include adjuster contact information for each defendant</li>
          <li>• Policyholder information is required if defendant is not the policyholder</li>
          <li>• Liability percentages help determine settlement distribution</li>
        </ul>
      </div>

      {/* Modals */}
      <EditDefendantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        defendant={selectedDefendant}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />

      <EditDefendantModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defendant={null}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />

      {/* Adjuster Form Modal */}
      {adjusterDefendantId !== null && (() => {
        const defendant = defendants.find(d => d.id === adjusterDefendantId);
        const insuranceId = defendant?.autoInsuranceId;
        if (!insuranceId) return null;
        
        return (
          <AutoAdjusterForm
            isOpen={isAdjusterFormOpen}
            onClose={() => {
              setIsAdjusterFormOpen(false);
              setEditingAdjuster(null);
              setAdjusterDefendantId(null);
            }}
            onSubmit={handleAdjusterSubmit}
            initialData={editingAdjuster}
            autoInsuranceId={insuranceId}
          />
        );
      })()}

      {ConfirmDialog}
    </div>
  );
}
