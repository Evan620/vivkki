import { useState, useEffect } from 'react';
import { Plus, Users, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import DefendantFormSection from './DefendantFormSection';
import { fetchAutoInsurers } from '../../utils/database';
import type { IntakeFormData, FormErrors, DefendantFormData, AutoInsurance } from '../../types/intake';

interface Step5Props {
  data: IntakeFormData;
  errors: FormErrors;
  onChange: (field: keyof IntakeFormData, value: any) => void;
}

const createEmptyDefendant = (): DefendantFormData => ({
  firstName: '',
  lastName: '',
  isPolicyholder: true,
  policyholderFirstName: '',
  policyholderLastName: '',
  autoInsuranceId: 0,
  policyNumber: '',
  claimNumber: '', // Add claim number field
  liabilityPercentage: 100,
  notes: '',
  relatedToDefendantId: null,
  relationshipType: '',
  adjusterFirstName: '',
  adjusterLastName: '',
  adjusterEmail: '',
  adjusterPhone: '',
  adjusterMailingAddress: '',
  adjusterCity: '',
  adjusterState: '',
  adjusterZipCode: ''
});

export default function Step5Defendant({ data, errors, onChange }: Step5Props) {
  const [autoInsuranceCompanies, setAutoInsuranceCompanies] = useState<AutoInsurance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsuranceCompanies();
  }, []);

  const loadInsuranceCompanies = async () => {
    try {
      // Use database utility function to fetch auto insurance companies
      const companies = await fetchAutoInsurers();
      setAutoInsuranceCompanies(companies || []);
    } catch (error) {
      console.error('Error loading insurance companies:', error);
    } finally {
      setLoading(false);
    }
  };

  // Ensure we have at least one defendant
  const defendants = data.defendants.length > 0 ? data.defendants : [createEmptyDefendant()];

  const handleDefendantChange = (index: number, field: keyof DefendantFormData, value: any) => {
    const updatedDefendants = [...defendants];
    updatedDefendants[index] = { ...updatedDefendants[index], [field]: value };
    onChange('defendants', updatedDefendants);
  };

  const handleAddDefendant = () => {
    const newDefendant = createEmptyDefendant();
    onChange('defendants', [...defendants, newDefendant]);
  };

  const handleRemoveDefendant = (index: number) => {
    if (defendants.length <= 1) return; // Don't allow removing the last defendant
    
    const updatedDefendants = defendants.filter((_, i) => i !== index);
    onChange('defendants', updatedDefendants);
  };

  const getTotalLiability = () => {
    return defendants.reduce((sum, defendant) => sum + defendant.liabilityPercentage, 0);
  };

  const getDefendantSummary = () => {
    const totalDefendants = defendants.length;
    const totalLiability = getTotalLiability();
    
    if (totalDefendants === 1) {
      return defendants[0].firstName && defendants[0].lastName 
        ? `${defendants[0].firstName} ${defendants[0].lastName}`
        : '1 defendant';
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

  if (loading) {
    return <div className="text-center py-8">Loading insurance companies...</div>;
  }

  const liabilityStatus = getLiabilityStatus();
  const totalLiability = getTotalLiability();

  // Get validation errors for defendants
  const getValidationErrors = () => {
    const stepErrors = Object.keys(errors).filter(key => 
      key.startsWith('defendants.') || key === 'liability' || key === 'defendants'
    );
    return stepErrors;
  };

  const validationErrors = getValidationErrors();
  const hasErrors = validationErrors.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Defendant Information</h2>
            <p className="text-sm text-gray-600">{getDefendantSummary()}</p>
      </div>
        </div>
        
        <button
          type="button"
          onClick={handleAddDefendant}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Defendant
        </button>
      </div>

      {/* Validation Error Summary */}
      {hasErrors && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                Please fix the following errors to continue:
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((errorKey, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span>{errors[errorKey]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!hasErrors && defendants.some(d => d.firstName && d.lastName) && totalLiability === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">
              <strong>All required fields completed and liability totals 100%!</strong> You can proceed to the next step.
            </p>
              </div>
            </div>
          )}

      {/* Liability Warning */}
      {totalLiability !== 100 && (
        <div className={`${liabilityStatus.bg} ${liabilityStatus.border} border rounded-lg p-4`}>
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

      {/* Defendant Forms */}
        <div className="space-y-4">
        {defendants.map((defendant, index) => (
          <DefendantFormSection
            key={index}
            defendant={defendant}
            index={index}
            totalDefendants={defendants.length}
            allDefendants={defendants}
            onChange={handleDefendantChange}
            onRemove={handleRemoveDefendant}
            errors={errors}
            totalLiability={totalLiability}
            autoInsuranceCompanies={autoInsuranceCompanies}
            onRefreshInsurance={loadInsuranceCompanies}
          />
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

      {/* Liability Distribution Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Liability Distribution Examples:</h4>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Single Defendant:</strong> 100% (at-fault driver)</p>
          <p><strong>Shared Fault:</strong> 70% / 30% (both drivers partially at fault)</p>
          <p><strong>Multiple Parties:</strong> 60% / 30% / 10% (driver, employer, municipality)</p>
          <p><strong>Note:</strong> Total liability must equal 100% for proper settlement calculations</p>
        </div>
      </div>
    </div>
  );
}
