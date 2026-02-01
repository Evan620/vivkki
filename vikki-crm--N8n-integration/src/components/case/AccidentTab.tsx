import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { supabase } from '../../utils/database';
import { formatDate, formatTime } from '../../utils/caseUtils';
import Step1CaseInfo from '../intake/Step1CaseInfo';
import type { IntakeFormData, FormErrors } from '../../types/intake';

interface AccidentTabProps {
  casefile: any;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function AccidentTab({ casefile, onUpdate, onShowToast }: AccidentTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<IntakeFormData>>({
    dateOfLoss: casefile.date_of_loss || '',
    timeOfWreck: casefile.time_of_wreck || '',
    wreckType: casefile.wreck_type || '',
    wreckStreet: casefile.wreck_street || '',
    wreckCity: casefile.wreck_city || '',
    wreckCounty: casefile.wreck_county || '',
    wreckState: casefile.wreck_state || 'Oklahoma',
    isPoliceInvolved: casefile.is_police_involved || false,
    policeForce: casefile.police_force || '',
    isPoliceReport: casefile.is_police_report || false,
    policeReportNumber: casefile.police_report_number || '',
    vehicleDescription: casefile.vehicle_description || '',
    damageLevel: casefile.damage_level || '',
    wreckDescription: casefile.wreck_description || ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleChange = (field: keyof IntakeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('casefiles')
        .update({
          date_of_loss: formData.dateOfLoss,
          time_of_wreck: formData.timeOfWreck,
          wreck_type: formData.wreckType,
          wreck_street: formData.wreckStreet,
          wreck_city: formData.wreckCity,
          wreck_county: formData.wreckCounty,
          wreck_state: formData.wreckState,
          is_police_involved: formData.isPoliceInvolved,
          police_force: formData.policeForce,
          is_police_report: formData.isPoliceReport,
          police_report_number: formData.policeReportNumber,
          vehicle_description: formData.vehicleDescription,
          damage_level: formData.damageLevel,
          wreck_description: formData.wreckDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', casefile.id);

      if (error) throw error;

      await supabase.from('work_logs').insert({
        casefile_id: casefile.id,
        description: 'Accident details updated',
        user_name: 'Admin'
      });

      onShowToast('Accident details updated successfully', 'success');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating accident details:', error);
      onShowToast('Failed to update accident details', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      dateOfLoss: casefile.date_of_loss || '',
      timeOfWreck: casefile.time_of_wreck || '',
      wreckType: casefile.wreck_type || '',
      wreckStreet: casefile.wreck_street || '',
      wreckCity: casefile.wreck_city || '',
      wreckCounty: casefile.wreck_county || '',
      wreckState: casefile.wreck_state || 'Oklahoma',
      isPoliceInvolved: casefile.is_police_involved || false,
      policeForce: casefile.police_force || '',
      isPoliceReport: casefile.is_police_report || false,
      policeReportNumber: casefile.police_report_number || '',
      vehicleDescription: casefile.vehicle_description || '',
      damageLevel: casefile.damage_level || '',
      wreckDescription: casefile.wreck_description || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Edit Accident Details</h2>
        </div>

        <Step1CaseInfo
          data={formData as IntakeFormData}
          errors={errors}
          onChange={handleChange}
        />

        <div className="mt-6 flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-50 to-orange-50 border-b border-orange-100 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <span className="text-xl sm:text-2xl">🚗</span>
            <span>Accident Details</span>
          </h3>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2">Date of Loss</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{formatDate(casefile.date_of_loss)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 sm:mb-2">Time</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{formatTime(casefile.time_of_wreck)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-white rounded-lg sm:rounded-xl border border-green-100">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 sm:mb-2">Accident Type</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{casefile.wreck_type || 'N/A'}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg sm:rounded-xl border border-orange-100">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 sm:mb-2">Police Report</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{casefile.police_report_number || 'Not available'}</p>
          </div>

          <div className="sm:col-span-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl border border-gray-100">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">Location</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">
              {[casefile.wreck_street, casefile.wreck_city, casefile.wreck_county, casefile.wreck_state].filter(Boolean).join(', ') || 'Not specified'}
            </p>
          </div>

          {casefile.vehicle_description && (
            <div className="sm:col-span-2 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2">Vehicle & Damage</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">
                {casefile.vehicle_description}{casefile.damage_level && ` - ${casefile.damage_level} damage`}
              </p>
            </div>
          )}

          {casefile.wreck_description && (
            <div className="sm:col-span-2 p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">Description</p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                {casefile.wreck_description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
