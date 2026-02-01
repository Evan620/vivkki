import { useState } from 'react';
import { Edit2, Scale, Shield, FileCheck } from 'lucide-react';
import EditDefendantModal from './EditDefendantModal';
import { formatDate } from '../../utils/formatters';
import { supabase } from '../../utils/database';

interface DefendantTabProps {
  defendant: any;
  thirdPartyClaim: any;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function DefendantTab({
  defendant,
  thirdPartyClaim,
  casefileId,
  onUpdate,
  onShowToast
}: DefendantTabProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  if (!defendant) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚖️</div>
          <p className="text-gray-500">No defendant information found</p>
        </div>
      </div>
    );
  }

  const handleToggleClaim = async (field: string, currentValue: boolean) => {
    setUpdating(field);
    try {
      if (thirdPartyClaim) {
        const { error } = await supabase
          .from('third_party_claims')
          .update({ [field]: !currentValue })
          .eq('id', thirdPartyClaim.id);

        if (error) throw error;
      }

      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: `Third party claim ${field} updated`,
        timestamp: new Date().toISOString(),
        user_name: 'Admin'
      });

      onShowToast('Claim status updated successfully', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error updating claim:', error);
      onShowToast('Failed to update claim status', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const insuranceName = defendant.auto_insurance?.name || 'Not provided';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-orange-100 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            <span>Defendant Information</span>
          </h3>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2">Full Name</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">
              {defendant.first_name} {defendant.last_name}
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 sm:mb-2">Is Policyholder</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{defendant.is_policyholder ? 'Yes' : 'No'}</p>
          </div>

          {!defendant.is_policyholder && defendant.policyholder_first_name && (
            <div className="sm:col-span-2 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-white rounded-lg sm:rounded-xl border border-green-100">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 sm:mb-2">Policyholder Name</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">
                {defendant.policyholder_first_name} {defendant.policyholder_last_name}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 flex items-center gap-2">
          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Defendant's Insurance</h3>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2">Insurance Company</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{insuranceName}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 sm:mb-2">Policy Number</p>
            <p className="text-sm sm:text-base font-mono font-medium text-gray-900">{defendant.policy_number || 'Not provided'}</p>
          </div>

          {defendant.notes && (
            <div className="sm:col-span-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">Notes</p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                {defendant.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {thirdPartyClaim && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100 flex items-center gap-2">
            <FileCheck className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Third Party Claim Status</h3>
          </div>
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">LOR Sent</p>
                <p className="text-xs text-gray-500 mt-0.5">Letter of Representation</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={thirdPartyClaim.lor_sent || false}
                  onChange={() => handleToggleClaim('lor_sent', thirdPartyClaim.lor_sent)}
                  disabled={updating === 'lor_sent'}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-100">
              <div>
                <p className="text-sm sm:text-base font-semibold text-gray-900">LOA Received</p>
                <p className="text-xs text-gray-500 mt-0.5">Letter of Authorization</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={thirdPartyClaim.loa_received || false}
                  onChange={() => handleToggleClaim('loa_received', thirdPartyClaim.loa_received)}
                  disabled={updating === 'loa_received'}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
              </label>
            </div>

            {thirdPartyClaim.last_request_date && (
              <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg sm:rounded-xl border border-orange-100">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 sm:mb-2">Last Request Date</p>
                <p className="text-sm sm:text-base font-medium text-gray-900">
                  {formatDate(thirdPartyClaim.last_request_date)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <EditDefendantModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        defendant={defendant}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />
    </div>
  );
}
