import { ArrowLeft, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate, getClientFullName } from '../../utils/caseUtils';
import { generateCaseName } from '../../utils/calculations';
import { supabase } from '../../utils/database';
import { CASE_STAGES, getStatusesForStage } from '../../constants/caseStages';

interface CaseHeaderProps {
  casefile: any;
  client: any;
  clients?: any[]; // Add optional clients array
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function CaseHeader({ casefile, client, clients, onUpdate, onShowToast }: CaseHeaderProps) {
  const navigate = useNavigate();
  // Use generateCaseName if clients array is provided, otherwise fall back to single client
  const clientName = clients && clients.length > 0 
    ? generateCaseName(clients) 
    : getClientFullName(client);
  const [stage, setStage] = useState(casefile.stage || 'Intake');
  const [status, setStatus] = useState(casefile.status);
  const [updating, setUpdating] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  // Update available statuses when stage changes
  useEffect(() => {
    setAvailableStatuses(getStatusesForStage(stage));
  }, [stage]);

  // Initialize on mount
  useEffect(() => {
    setStage(casefile.stage || 'Intake');
    setAvailableStatuses(getStatusesForStage(casefile.stage || 'Intake'));
  }, [casefile.stage]);

  const handleStageChange = async (newStage: string) => {
    if (updating) return;
    setUpdating(true);

    try {
      const newStatuses = getStatusesForStage(newStage);
      const newStatus = newStatuses.includes(status) 
        ? status 
        : newStatuses[0] || 'New';

      const { error } = await supabase
        .from('casefiles')
        .update({ 
          stage: newStage,
          status: newStatus
        })
        .eq('id', casefile.id);

      if (error) throw error;

      setStage(newStage);
      setStatus(newStatus);
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
    if (updating) return;
    setUpdating(true);

    try {
      const { error } = await supabase
        .from('casefiles')
        .update({ status: newStatus })
        .eq('id', casefile.id);

      if (error) throw error;

      setStatus(newStatus);
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
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 lg:top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-3 lg:mb-4 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm lg:text-base">Back to Dashboard</span>
        </button>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
          <span className="block sm:inline">Case #{casefile.id}</span>
          <span className="hidden sm:inline"> - </span>
          <span className="block sm:inline mt-1 sm:mt-0">{clientName}</span>
        </h1>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-blue-900 font-medium text-xs sm:text-sm">
              {formatDate(casefile.date_of_loss)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium text-xs sm:text-sm whitespace-nowrap">Stage:</span>
            <select
              value={stage}
              onChange={(e) => handleStageChange(e.target.value)}
              disabled={updating}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border-2 border-blue-200 rounded-lg text-blue-700 font-semibold text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {CASE_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-medium text-xs sm:text-sm whitespace-nowrap">Status:</span>
            <select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating || availableStatuses.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-gray-700 font-semibold text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {availableStatuses.length === 0 ? (
                <option value="">Select stage first</option>
              ) : (
                availableStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
