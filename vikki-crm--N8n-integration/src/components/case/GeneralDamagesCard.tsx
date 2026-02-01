import { useState, useEffect } from 'react';
import { DollarSign, Edit2, Save, X, Calculator } from 'lucide-react';
import { supabase } from '../../utils/database';
import { formatCurrency } from '../../utils/formatting';

interface GeneralDamagesCardProps {
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function GeneralDamagesCard({
  casefileId,
  onUpdate,
  onShowToast
}: GeneralDamagesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generalDamages, setGeneralDamages] = useState({
    emotional_distress: 0,
    duties_under_duress: 0,
    pain_and_suffering: 0,
    loss_of_enjoyment: 0,
    loss_of_consortium: 0
  });
  const [originalValues, setOriginalValues] = useState(generalDamages);

  useEffect(() => {
    fetchGeneralDamages();
  }, [casefileId]);

  const fetchGeneralDamages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('general_damages')
        .select('*')
        .eq('casefile_id', casefileId)
        .maybeSingle();

      if (error && !error.message.includes('does not exist')) {
        console.error('Error fetching general damages:', error);
      }

      if (data) {
        const values = {
          emotional_distress: data.emotional_distress || 0,
          duties_under_duress: data.duties_under_duress || 0,
          pain_and_suffering: data.pain_and_suffering || 0,
          loss_of_enjoyment: data.loss_of_enjoyment || 0,
          loss_of_consortium: data.loss_of_consortium || 0
        };
        setGeneralDamages(values);
        setOriginalValues(values);
      } else {
        // No record exists, use defaults
        const defaults = {
          emotional_distress: 0,
          duties_under_duress: 0,
          pain_and_suffering: 0,
          loss_of_enjoyment: 0,
          loss_of_consortium: 0
        };
        setGeneralDamages(defaults);
        setOriginalValues(defaults);
      }
    } catch (error) {
      console.error('Error fetching general damages:', error);
      onShowToast('Failed to load general damages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof generalDamages, value: string) => {
    const numValue = parseFloat(value) || 0;
    setGeneralDamages(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('general_damages')
        .select('id')
        .eq('casefile_id', casefileId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('general_damages')
          .update({
            emotional_distress: generalDamages.emotional_distress,
            duties_under_duress: generalDamages.duties_under_duress,
            pain_and_suffering: generalDamages.pain_and_suffering,
            loss_of_enjoyment: generalDamages.loss_of_enjoyment,
            loss_of_consortium: generalDamages.loss_of_consortium,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('general_damages')
          .insert({
            casefile_id: casefileId,
            emotional_distress: generalDamages.emotional_distress,
            duties_under_duress: generalDamages.duties_under_duress,
            pain_and_suffering: generalDamages.pain_and_suffering,
            loss_of_enjoyment: generalDamages.loss_of_enjoyment,
            loss_of_consortium: generalDamages.loss_of_consortium
          });

        if (error) throw error;
      }

      setOriginalValues(generalDamages);
      setIsEditing(false);
      onShowToast('General damages saved successfully', 'success');
      onUpdate();

      // Create work log entry
      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: 'General damages updated',
        timestamp: new Date().toISOString(),
        user_name: 'Admin'
      });
    } catch (error: any) {
      console.error('Error saving general damages:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      
      // Check if it's an RLS policy error
      if (errorMessage.includes('row-level security') || errorMessage.includes('policy')) {
        onShowToast('Permission denied. Please run the SQL migration to add general_damages RLS policies.', 'error');
      } else {
        onShowToast(`Failed to save general damages: ${errorMessage}`, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setGeneralDamages(originalValues);
    setIsEditing(false);
  };

  const total = Object.values(generalDamages).reduce((sum, val) => sum + val, 0);
  const hasChanges = JSON.stringify(generalDamages) !== JSON.stringify(originalValues);

  const damageFields = [
    { key: 'emotional_distress' as const, label: 'Emotional Distress' },
    { key: 'duties_under_duress' as const, label: 'Duties Under Duress' },
    { key: 'pain_and_suffering' as const, label: 'Pain and Suffering' },
    { key: 'loss_of_enjoyment' as const, label: 'Loss of Enjoyment' },
    { key: 'loss_of_consortium' as const, label: 'Loss of Consortium' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">General Damages</h3>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit General Damages"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          {damageFields.map((field) => (
            <div key={field.key} className="flex items-center gap-3">
              <label className="w-40 text-sm font-medium text-gray-700">
                {field.label}:
              </label>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={generalDamages[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Total General Damages:</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
          {hasChanges && (
            <div className="text-xs text-blue-600 mt-2">
              * You have unsaved changes
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {damageFields.map((field) => {
            const value = generalDamages[field.key];
            return (
              <div key={field.key} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{field.label}:</span>
                <span className="text-sm font-medium text-gray-900">
                  {formatCurrency(value)}
                </span>
              </div>
            );
          })}
          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">Total:</span>
              <span className="text-lg font-bold text-purple-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
          {total === 0 && (
            <p className="text-xs text-gray-500 mt-2">
              Click the edit button to add general damages amounts
            </p>
          )}
        </div>
      )}
    </div>
  );
}

