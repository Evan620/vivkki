import { useState, useEffect } from 'react';
import FormInput from '../forms/FormInput';
import FormSelect from '../forms/FormSelect';
import { supabase, fetchHealthInsurers, fetchAutoInsurers, fetchHealthAdjusters, fetchAutoAdjusters } from '../../utils/database';
import AddHealthInsuranceModal from '../forms/AddHealthInsuranceModal';
import AdjusterSelectionModal from './AdjusterSelectionModal';
import type { IntakeFormData, FormErrors, AutoInsurance, HealthInsurance } from '../../types/intake';

interface Step4Props {
  data: IntakeFormData;
  errors: FormErrors;
  onChange: (field: keyof IntakeFormData, value: any) => void;
}

const MEDPAY_AMOUNTS = [
  { value: '$1,000', label: '$1,000' },
  { value: '$2,500', label: '$2,500' },
  { value: '$5,000', label: '$5,000' },
  { value: '$10,000', label: '$10,000' },
  { value: '$15,000', label: '$15,000' },
  { value: 'Other', label: 'Other' }
];

const UM_AMOUNTS = [
  { value: '25/50', label: '25/50' },
  { value: '50/100', label: '50/100' },
  { value: '100/300', label: '100/300' },
  { value: '250/500', label: '250/500' },
  { value: '500/1000', label: '500/1000' }
];

export default function Step4Insurance({ data, errors, onChange }: Step4Props) {
  const [autoInsuranceCompanies, setAutoInsuranceCompanies] = useState<AutoInsurance[]>([]);
  const [healthInsuranceCompanies, setHealthInsuranceCompanies] = useState<HealthInsurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHealthInsuranceModal, setShowHealthInsuranceModal] = useState(false);
  const [healthAdjusters, setHealthAdjusters] = useState<any[]>([]);
  const [showAdjusterModal, setShowAdjusterModal] = useState(false);
  const [loadingAdjusters, setLoadingAdjusters] = useState(false);
  const [autoAdjusters, setAutoAdjusters] = useState<any[]>([]);
  const [showAutoAdjusterModal, setShowAutoAdjusterModal] = useState(false);
  const [loadingAutoAdjusters, setLoadingAutoAdjusters] = useState(false);

  const loadInsuranceCompanies = async () => {
    try {
      // Use database utility functions to fetch insurance companies
      const [autoData, healthData] = await Promise.all([
        fetchAutoInsurers(),
        fetchHealthInsurers()
      ]);

      // Deduplicate by ID to prevent duplicate key warnings
      const uniqueAuto = (autoData || []).filter((a, index, self) => 
        index === self.findIndex(item => item.id === a.id)
      );
      const uniqueHealth = (healthData || []).filter((h, index, self) => 
        index === self.findIndex(item => item.id === h.id)
      );

      setAutoInsuranceCompanies(uniqueAuto);
      setHealthInsuranceCompanies(uniqueHealth);
    } catch (error) {
      console.error('Error loading insurance companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsuranceCompanies();
  }, []);

  // Refresh insurance lists when modal opens to get latest data from dashboard
  useEffect(() => {
    if (showHealthInsuranceModal) {
      loadInsuranceCompanies();
    }
  }, [showHealthInsuranceModal]);

  // Load health adjusters when health insurance is selected
  useEffect(() => {
    const loadHealthAdjusters = async () => {
      if (data.hasHealthInsurance && data.healthInsuranceId) {
        setLoadingAdjusters(true);
        try {
          const adjusters = await fetchHealthAdjusters();
          // Filter adjusters for the selected health insurance
          const filtered = adjusters.filter(adj => adj.health_insurance_id === data.healthInsuranceId);
          setHealthAdjusters(filtered);
        } catch (error) {
          console.error('Error loading health adjusters:', error);
          setHealthAdjusters([]);
        } finally {
          setLoadingAdjusters(false);
        }
      } else {
        setHealthAdjusters([]);
      }
    };
    loadHealthAdjusters();
  }, [data.hasHealthInsurance, data.healthInsuranceId]);

  // Load auto adjusters when auto insurance is selected
  useEffect(() => {
    const loadAutoAdjusters = async () => {
      if (data.hasAutoInsurance && data.autoInsuranceId) {
        setLoadingAutoAdjusters(true);
        try {
          const adjusters = await fetchAutoAdjusters();
          // Filter adjusters for the selected auto insurance
          const filtered = adjusters.filter(adj => Number(adj.auto_insurance_id) === Number(data.autoInsuranceId));
          setAutoAdjusters(filtered);
        } catch (error) {
          console.error('Error loading auto adjusters:', error);
          setAutoAdjusters([]);
        } finally {
          setLoadingAutoAdjusters(false);
        }
      } else {
        setAutoAdjusters([]);
      }
    };
    loadAutoAdjusters();
  }, [data.hasAutoInsurance, data.autoInsuranceId]);

  if (loading) {
    return <div className="text-center py-8">Loading insurance companies...</div>;
  }

  const autoInsuranceOptions = autoInsuranceCompanies
    .filter((company, index, self) => index === self.findIndex(item => item.id === company.id)) // Deduplicate by ID
    .map(company => ({
      value: company.id.toString(),
      label: company.name || 'Unnamed'
    }));

  const healthInsuranceOptions = healthInsuranceCompanies
    .filter((company, index, self) => index === self.findIndex(item => item.id === company.id)) // Deduplicate by ID
    .map(company => ({
      value: company.id.toString(),
      label: company.name || 'Unnamed'
    }));

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-1">Client's Insurance (First Party)</h3>
        <p className="text-sm text-gray-600">Information about your client's own insurance coverage</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Does client have auto insurance?
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              checked={data.hasAutoInsurance === true}
              onChange={() => onChange('hasAutoInsurance', true)}
              className="mr-2"
            />
            Yes
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={data.hasAutoInsurance === false}
              onChange={() => onChange('hasAutoInsurance', false)}
              className="mr-2"
            />
            No
          </label>
        </div>
        {errors.hasAutoInsurance && <p className="mt-1 text-sm text-red-500">{errors.hasAutoInsurance}</p>}
      </div>

      {data.hasAutoInsurance && (
        <>
          <div className="border-t pt-6">
            <div className="space-y-4">
              <FormSelect
                label="Auto Insurance Company"
                name="autoInsuranceId"
                value={data.autoInsuranceId?.toString() || ''}
                onChange={(value) => onChange('autoInsuranceId', parseInt(value))}
                options={autoInsuranceOptions}
                required
                error={errors.autoInsuranceId}
              />
              <FormInput
                label="Policy Number (or Claim Number)"
                name="policyNumber"
                value={data.policyNumber}
                onChange={(value) => onChange('policyNumber', value)}
                placeholder="Enter policy number or claim number"
                error={errors.policyNumber}
              />
              <FormInput
                label="Claim Number (if different from policy number)"
                name="claimNumber"
                value={data.claimNumber}
                onChange={(value) => onChange('claimNumber', value)}
                placeholder="Enter claim number if different"
              />

              {/* Auto Adjuster Selection */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Adjuster (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAutoAdjusterModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {data.autoAdjusterId ? 'Change Adjuster' : 'Select Adjuster'}
                  </button>
                </div>
                {data.autoAdjusterId && (() => {
                  const selectedAdjuster = autoAdjusters.find(a => a.id === data.autoAdjusterId);
                  return selectedAdjuster ? (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm font-semibold text-gray-900 mb-2">
                        {[selectedAdjuster.first_name, selectedAdjuster.middle_name, selectedAdjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster'}
                      </p>
                      {selectedAdjuster.email && (
                        <p className="text-sm text-gray-700">
                          <strong>Email:</strong> {selectedAdjuster.email}
                        </p>
                      )}
                      {selectedAdjuster.phone && (
                        <p className="text-sm text-gray-700">
                          <strong>Phone:</strong> {selectedAdjuster.phone}
                        </p>
                      )}
                      {selectedAdjuster.fax && (
                        <p className="text-sm text-gray-700">
                          <strong>Fax:</strong> {selectedAdjuster.fax}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => onChange('autoAdjusterId', undefined)}
                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                      >
                        Clear Selection
                      </button>
                    </div>
                  ) : null;
                })()}
                {data.autoAdjusterInfo && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      New adjuster will be created: {[data.autoAdjusterInfo.first_name, data.autoAdjusterInfo.middle_name, data.autoAdjusterInfo.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster'}
                    </p>
                    {data.autoAdjusterInfo.email && (
                      <p className="text-sm text-gray-700">
                        <strong>Email:</strong> {data.autoAdjusterInfo.email}
                      </p>
                    )}
                    {data.autoAdjusterInfo.phone && (
                      <p className="text-sm text-gray-700">
                        <strong>Phone:</strong> {data.autoAdjusterInfo.phone}
                      </p>
                    )}
                    {data.autoAdjusterInfo.fax && (
                      <p className="text-sm text-gray-700">
                        <strong>Fax:</strong> {data.autoAdjusterInfo.fax}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => onChange('autoAdjusterInfo', undefined)}
                      className="mt-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Does the policy have Med Pay coverage?
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={data.hasMedpay === true}
                      onChange={() => onChange('hasMedpay', true)}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={data.hasMedpay === false}
                      onChange={() => onChange('hasMedpay', false)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              {data.hasMedpay && (
                <FormSelect
                  label="Med Pay Amount"
                  name="medpayAmount"
                  value={data.medpayAmount}
                  onChange={(value) => onChange('medpayAmount', value)}
                  options={MEDPAY_AMOUNTS}
                  required
                  error={errors.medpayAmount}
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Does the policy have Uninsured/Underinsured Motorist coverage?
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={data.hasUmCoverage === true}
                      onChange={() => onChange('hasUmCoverage', true)}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={data.hasUmCoverage === false}
                      onChange={() => onChange('hasUmCoverage', false)}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              {data.hasUmCoverage && (
                <>
                  <FormSelect
                    label="UM Amount"
                    name="umAmount"
                    value={data.umAmount}
                    onChange={(value) => onChange('umAmount', value)}
                    options={UM_AMOUNTS}
                    required
                    error={errors.umAmount}
                  />
                  <p className="text-xs text-gray-500">Format: Per Person / Per Accident (in thousands)</p>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Insurance</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Does client have health insurance?
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={data.hasHealthInsurance === true}
                  onChange={() => onChange('hasHealthInsurance', true)}
                  className="mr-2"
                />
                Yes
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  checked={data.hasHealthInsurance === false}
                  onChange={() => onChange('hasHealthInsurance', false)}
                  className="mr-2"
                />
                No
              </label>
            </div>
          </div>

          {data.hasHealthInsurance && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <FormSelect
                    key={`health-insurance-step4-${healthInsuranceCompanies.length}-${healthInsuranceCompanies.map(h => h.id).join('-')}`}
                    label="Health Insurance Company"
                    name="healthInsuranceId"
                    value={data.healthInsuranceId?.toString() || ''}
                    onChange={(value) => onChange('healthInsuranceId', parseInt(value))}
                    options={[
                      { value: '', label: 'Select carrier...' },
                      ...healthInsuranceOptions,
                      { value: '0', label: 'Unknown provider' }
                    ]}
                    required
                    error={errors.healthInsuranceId}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowHealthInsuranceModal(true)}
                  className="mt-6 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  title="Add new health insurance company"
                >
                  + Add
                </button>
              </div>
              <AddHealthInsuranceModal
                isOpen={showHealthInsuranceModal}
                onClose={() => setShowHealthInsuranceModal(false)}
                onSuccess={async (newInsurer) => {
                  try {
                    // Always refresh from database to get the latest data (including items added from dashboard)
                    const updatedList = await fetchHealthInsurers();
                    if (updatedList && updatedList.length > 0) {
                      // Deduplicate before setting
                      const uniqueList = updatedList.filter((h, index, self) => 
                        index === self.findIndex(item => item.id === h.id)
                      );
                      setHealthInsuranceCompanies(uniqueList);
                      // Select the newly created insurer if provided
                      if (newInsurer && newInsurer.id) {
                        setTimeout(() => {
                          onChange('healthInsuranceId', newInsurer.id);
                        }, 100);
                      }
                    }
                  } catch (error) {
                    console.error('Error refreshing health insurance list:', error);
                  } finally {
                    setShowHealthInsuranceModal(false);
                  }
                }}
              />
              <FormInput
                label="Member ID"
                name="healthMemberId"
                value={data.healthMemberId}
                onChange={(value) => onChange('healthMemberId', value)}
                required
                error={errors.healthMemberId}
              />

              {/* Health Adjuster Selection */}
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Adjuster (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAdjusterModal(true)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {data.healthAdjusterId ? 'Change Adjuster' : 'Select Adjuster'}
                  </button>
                </div>
                {data.healthAdjusterId && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-gray-700">
                      Selected: {healthAdjusters.find(a => a.id === data.healthAdjusterId)?.first_name || ''} {healthAdjusters.find(a => a.id === data.healthAdjusterId)?.last_name || ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => onChange('healthAdjusterId', undefined)}
                      className="mt-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
                {data.healthAdjusterInfo && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-gray-700">
                      New adjuster will be created: {data.healthAdjusterInfo.first_name} {data.healthAdjusterInfo.last_name}
                    </p>
                    <button
                      type="button"
                      onClick={() => onChange('healthAdjusterInfo', undefined)}
                      className="mt-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Health Adjuster Selection Modal */}
      {data.hasHealthInsurance && data.healthInsuranceId && (
        <AdjusterSelectionModal
          isOpen={showAdjusterModal}
          onClose={() => setShowAdjusterModal(false)}
          onSelect={(adjusterId) => {
            onChange('healthAdjusterId', adjusterId || undefined);
            onChange('healthAdjusterInfo', undefined); // Clear new adjuster info if selecting existing
          }}
          onCreate={(adjusterInfo) => {
            onChange('healthAdjusterInfo', adjusterInfo);
            onChange('healthAdjusterId', undefined); // Clear existing adjuster ID if creating new
          }}
          existingAdjusters={healthAdjusters}
          insuranceOrProviderName={healthInsuranceCompanies.find(h => h.id === data.healthInsuranceId)?.name || 'Health Insurance'}
          type="health"
          isLoading={loadingAdjusters}
          insuranceId={data.healthInsuranceId}
          onRefresh={async () => {
            // Reload health adjusters after creation
            if (data.hasHealthInsurance && data.healthInsuranceId) {
              setLoadingAdjusters(true);
              try {
                const adjusters = await fetchHealthAdjusters();
                const filtered = adjusters.filter(adj => adj.health_insurance_id === data.healthInsuranceId);
                setHealthAdjusters(filtered);
              } catch (error) {
                console.error('Error reloading health adjusters:', error);
                setHealthAdjusters([]);
              } finally {
                setLoadingAdjusters(false);
              }
            }
          }}
        />
      )}

      {/* Auto Adjuster Selection Modal */}
      {data.hasAutoInsurance && data.autoInsuranceId && (
        <AdjusterSelectionModal
          isOpen={showAutoAdjusterModal}
          onClose={() => setShowAutoAdjusterModal(false)}
          onSelect={(adjusterId) => {
            onChange('autoAdjusterId', adjusterId || undefined);
            onChange('autoAdjusterInfo', undefined); // Clear new adjuster info if selecting existing
          }}
          onCreate={(adjusterInfo) => {
            onChange('autoAdjusterInfo', adjusterInfo);
            onChange('autoAdjusterId', undefined); // Clear existing adjuster ID if creating new
          }}
          existingAdjusters={autoAdjusters}
          insuranceOrProviderName={autoInsuranceCompanies.find(a => a.id === data.autoInsuranceId)?.name || 'Auto Insurance'}
          type="auto"
          isLoading={loadingAutoAdjusters}
          insuranceId={data.autoInsuranceId}
          onRefresh={async () => {
            // Reload auto adjusters after creation
            if (data.hasAutoInsurance && data.autoInsuranceId) {
              setLoadingAutoAdjusters(true);
              try {
                const adjusters = await fetchAutoAdjusters();
                const filtered = adjusters.filter(adj => Number(adj.auto_insurance_id) === Number(data.autoInsuranceId));
                setAutoAdjusters(filtered);
              } catch (error) {
                console.error('Error reloading auto adjusters:', error);
                setAutoAdjusters([]);
              } finally {
                setLoadingAutoAdjusters(false);
              }
            }
          }}
        />
      )}
    </div>
  );
}
