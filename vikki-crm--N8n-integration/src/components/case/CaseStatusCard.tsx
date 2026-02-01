import { useState, useEffect } from 'react';
import { supabase } from '../../utils/database';
import { formatDate, formatDateTime } from '../../utils/caseUtils';
import { CASE_STAGES, getStatusesForStage } from '../../constants/caseStages';

interface CaseStatusCardProps {
  casefile: any;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function CaseStatusCard({ casefile, onUpdate, onShowToast }: CaseStatusCardProps) {
  const [updating, setUpdating] = useState(false);
  const [currentStage, setCurrentStage] = useState(casefile.stage || 'Intake');
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  // Initialize available statuses on mount and when casefile changes
  useEffect(() => {
    const initialStage = casefile.stage || 'Intake';
    setCurrentStage(initialStage);
    const statuses = getStatusesForStage(initialStage);
    setAvailableStatuses(statuses);
  }, [casefile.stage]);

  // Update available statuses when currentStage changes
  useEffect(() => {
    const statuses = getStatusesForStage(currentStage);
    setAvailableStatuses(statuses);
  }, [currentStage]);

  const handleStageChange = async (newStage: string) => {
    setUpdating(true);
    try {
      const newStatuses = getStatusesForStage(newStage);
      const newStatus = newStatuses.includes(casefile.status) 
        ? casefile.status 
        : newStatuses[0] || 'New';

      const { error } = await supabase
        .from('casefiles')
        .update({
          stage: newStage,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', casefile.id);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'Admin';
      await supabase.from('work_logs').insert({
        casefile_id: casefile.id,
        description: `Stage updated to ${newStage}${newStatus !== casefile.status ? `, status updated to ${newStatus}` : ''}`,
        timestamp: new Date().toISOString(),
        user_name: userName
      });

      setCurrentStage(newStage);
      setAvailableStatuses(newStatuses);
      onShowToast('Stage updated successfully', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error updating stage:', error);
      onShowToast('Failed to update stage', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('casefiles')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', casefile.id);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'Admin';
      await supabase.from('work_logs').insert({
        casefile_id: casefile.id,
        description: `Status updated to ${newStatus}`,
        timestamp: new Date().toISOString(),
        user_name: userName
      });

      onShowToast('Status updated successfully', 'success');
      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      onShowToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Stage</label>
          <select
            value={currentStage}
            onChange={(e) => handleStageChange(e.target.value)}
            disabled={updating}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CASE_STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">Status</label>
          <select
            value={casefile.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating || availableStatuses.length === 0}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableStatuses.length === 0 ? (
              <option value="">Select a stage first</option>
            ) : (
              availableStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
              ))
            )}
          </select>
        </div>

        <div className="pt-3 border-t border-gray-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Date of Loss:</span>
            <span className="text-gray-900 font-medium">{formatDate(casefile.date_of_loss)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Created:</span>
            <span className="text-gray-900 font-medium">{formatDateTime(casefile.created_at)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600">Updated:</span>
            <span className="text-gray-900 font-medium">{formatDateTime(casefile.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
