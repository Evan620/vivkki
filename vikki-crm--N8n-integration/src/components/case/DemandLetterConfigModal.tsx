import { useState, useEffect } from 'react';
import { Calculator, DollarSign, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { supabase } from '../../utils/database';

interface DemandLetterConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  casefileId: number;
  medicalBills: any[];
  onGenerate: (config: DemandConfig) => void;
}

interface DemandConfig {
  accidentType: 'rear-end' | 'lane-change' | 't-bone';
  includeGeneralDamages: boolean;
  generalDamages?: {
    emotional_distress: number;
    duties_under_duress: number;
    pain_and_suffering: number;
    loss_of_enjoyment: number;
    loss_of_consortium: number;
  };
  medicalBillsTotal: number;
  mileageTotal: number;
}

export default function DemandLetterConfigModal({
  isOpen,
  onClose,
  casefileId,
  medicalBills,
  onGenerate
}: DemandLetterConfigModalProps) {
  const [accidentType, setAccidentType] = useState<'rear-end' | 'lane-change' | 't-bone'>('rear-end');
  const [includeGeneralDamages, setIncludeGeneralDamages] = useState(false);
  const [generalDamages, setGeneralDamages] = useState({
    emotional_distress: 10000,
    duties_under_duress: 5000,
    pain_and_suffering: 25000,
    loss_of_enjoyment: 8000,
    loss_of_consortium: 7000
  });
  const [mileageLogs, setMileageLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Calculate totals
  const medicalBillsTotal = medicalBills.reduce((sum, bill) => sum + (bill.total_billed || 0), 0);
  const mileageTotal = mileageLogs.reduce((sum, log) => sum + (log.total || 0), 0);
  const generalDamagesTotal = includeGeneralDamages ? 
    Object.values(generalDamages).reduce((sum, val) => sum + val, 0) : 0;
  const specialDamagesTotal = medicalBillsTotal + mileageTotal;
  const totalDemand = specialDamagesTotal + generalDamagesTotal;

  useEffect(() => {
    if (isOpen) {
      fetchMileageLogs();
    }
  }, [isOpen, casefileId]);

  const fetchMileageLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('mileage_log')
        .select('*')
        .eq('casefile_id', casefileId);

      if (error) throw error;
      setMileageLogs(data || []);
    } catch (error) {
      console.error('Error fetching mileage logs:', error);
    }
  };

  const handleGenerate = () => {
    const config: DemandConfig = {
      accidentType,
      includeGeneralDamages,
      generalDamages: includeGeneralDamages ? generalDamages : undefined,
      medicalBillsTotal,
      mileageTotal
    };
    onGenerate(config);
  };

  const handleGeneralDamageChange = (field: keyof typeof generalDamages, value: number) => {
    setGeneralDamages(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Settlement Demand">
      <div className="space-y-6">
        {/* Medical Bills Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Medical Bills Summary</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-800">Providers:</span>
              <span className="font-medium text-blue-900">{medicalBills.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Total Billed:</span>
              <span className="font-medium text-blue-900">${medicalBillsTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-800">Mileage:</span>
              <span className="font-medium text-blue-900">${mileageTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-blue-300 pt-2">
              <span className="text-blue-800 font-medium">Special Damages:</span>
              <span className="font-bold text-blue-900">${specialDamagesTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Accident Type Selection */}
        <div className="space-y-3">
          <h3 className="font-medium text-gray-900">Accident Type</h3>
          <div className="space-y-2">
            {[
              { value: 'rear-end', label: 'Rear End Collision', description: 'Vehicle struck from behind' },
              { value: 'lane-change', label: 'Side Swipe / Lane Change', description: 'Improper lane change or side swipe' },
              { value: 't-bone', label: 'T-Bone / Failure to Yield', description: 'Side impact collision' }
            ].map(type => (
              <label key={type.value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="accidentType"
                  value={type.value}
                  checked={accidentType === type.value}
                  onChange={(e) => setAccidentType(e.target.value as any)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{type.label}</div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* General Damages Toggle */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="includeGeneralDamages"
              checked={includeGeneralDamages}
              onChange={(e) => setIncludeGeneralDamages(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="includeGeneralDamages" className="font-medium text-gray-900 cursor-pointer">
              Include General Damages
            </label>
          </div>

          {includeGeneralDamages && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-4 h-4 text-gray-600" />
                <h4 className="font-medium text-gray-900">General Damages Breakdown</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { key: 'emotional_distress', label: 'Emotional Distress' },
                  { key: 'duties_under_duress', label: 'Duties Under Duress' },
                  { key: 'pain_and_suffering', label: 'Pain and Suffering' },
                  { key: 'loss_of_enjoyment', label: 'Loss of Enjoyment' },
                  { key: 'loss_of_consortium', label: 'Loss of Consortium' }
                ].map(damage => (
                  <div key={damage.key} className="flex items-center gap-3">
                    <label className="w-32 text-sm text-gray-700">{damage.label}:</label>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-gray-500">$</span>
                      <input
                        type="number"
                        value={generalDamages[damage.key as keyof typeof generalDamages]}
                        onChange={(e) => handleGeneralDamageChange(
                          damage.key as keyof typeof generalDamages, 
                          parseFloat(e.target.value) || 0
                        )}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between font-medium text-gray-900">
                  <span>Total General Damages:</span>
                  <span>${generalDamagesTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Total Demand Calculation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-green-900">Total Demand Calculation</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-800">Special Damages:</span>
              <span className="text-green-900">${specialDamagesTotal.toLocaleString()}</span>
            </div>
            {includeGeneralDamages && (
              <div className="flex justify-between">
                <span className="text-green-800">General Damages:</span>
                <span className="text-green-900">${generalDamagesTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-green-300 pt-2 font-bold">
              <span className="text-green-800">Total Demand:</span>
              <span className="text-green-900 text-lg">${totalDemand.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Generate Demand Letter
          </button>
        </div>
      </div>
    </Modal>
  );
}
