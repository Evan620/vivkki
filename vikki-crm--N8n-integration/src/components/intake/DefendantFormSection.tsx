import { useState, useEffect } from 'react';
import { Trash2, User, Percent, Mail, Phone, MapPin, UserCircle, X, Plus } from 'lucide-react';
import { supabase, fetchAutoAdjusters } from '../../utils/database';
import type { DefendantFormData, AutoInsurance } from '../../types/intake';
import AddInsuranceModal from '../common/AddInsuranceModal';
import AdjusterSelectionModal from './AdjusterSelectionModal';

interface DefendantFormSectionProps {
  defendant: DefendantFormData;
  index: number;
  totalDefendants: number;
  allDefendants: DefendantFormData[];
  onChange: (index: number, field: keyof DefendantFormData, value: any) => void;
  onRemove: (index: number) => void;
  errors: Record<string, string>;
  totalLiability: number;
  autoInsuranceCompanies?: AutoInsurance[]; // Add insurance companies prop
  onRefreshInsurance?: () => void; // Callback to refresh insurance list
}

export default function DefendantFormSection({
  defendant,
  index,
  totalDefendants,
  allDefendants,
  onChange,
  onRemove,
  errors,
  totalLiability,
  autoInsuranceCompanies = [],
  onRefreshInsurance
}: DefendantFormSectionProps) {
  const [isExpanded, setIsExpanded] = useState(index === 0);
  const [tempAutoInsurers, setTempAutoInsurers] = useState<Array<{id: string, name: string}>>([]);
  const [showAutoInsuranceModal, setShowAutoInsuranceModal] = useState(false);
  const [autoAdjusters, setAutoAdjusters] = useState<any[]>([]);
  const [showAdjusterModal, setShowAdjusterModal] = useState(false);
  const [loadingAdjusters, setLoadingAdjusters] = useState(false);

  const handleChange = (field: keyof DefendantFormData, value: any) => {
    onChange(index, field, value);
  };

  // Load auto adjusters when auto insurance is selected
  useEffect(() => {
    const loadAutoAdjusters = async () => {
      if (defendant.autoInsuranceId && typeof defendant.autoInsuranceId === 'number' && defendant.autoInsuranceId > 0) {
        setLoadingAdjusters(true);
        try {
          const adjusters = await fetchAutoAdjusters(false);
          // Filter adjusters for the selected auto insurance with type-safe comparison
          const filtered = adjusters.filter(adj => 
            adj.auto_insurance_id != null && 
            Number(adj.auto_insurance_id) === Number(defendant.autoInsuranceId)
          );
          setAutoAdjusters(filtered);
        } catch (error) {
          console.error('Error loading auto adjusters:', error);
          setAutoAdjusters([]);
        } finally {
          setLoadingAdjusters(false);
        }
      } else {
        setAutoAdjusters([]);
      }
    };
    loadAutoAdjusters();
  }, [defendant.autoInsuranceId]);

  // Reload auto adjusters when modal opens
  useEffect(() => {
    if (showAdjusterModal && defendant.autoInsuranceId && typeof defendant.autoInsuranceId === 'number' && defendant.autoInsuranceId > 0) {
      const reloadAdjusters = async () => {
        setLoadingAdjusters(true);
        try {
          const adjusters = await fetchAutoAdjusters(false);
          const filtered = adjusters.filter(adj => 
            adj.auto_insurance_id != null && 
            Number(adj.auto_insurance_id) === Number(defendant.autoInsuranceId)
          );
          setAutoAdjusters(filtered);
        } catch (error) {
          console.error('Error reloading auto adjusters:', error);
          setAutoAdjusters([]);
        } finally {
          setLoadingAdjusters(false);
        }
      };
      reloadAdjusters();
    }
  }, [showAdjusterModal, defendant.autoInsuranceId]);

  const getDefendantTitle = () => {
    if (defendant.firstName && defendant.lastName) {
      return `${defendant.firstName} ${defendant.lastName}`;
    }
    return `Defendant ${index + 1}`;
  };

  const getLiabilityStatus = () => {
    if (totalLiability > 100) {
      return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
    } else if (totalLiability < 100) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    } else {
      return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    }
  };

  const liabilityStatus = getLiabilityStatus();

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-medium text-gray-900">
              {getDefendantTitle()}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${liabilityStatus.bg} ${liabilityStatus.color}`}>
              {defendant.liabilityPercentage}% Liability
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          
          {totalDefendants > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
              title="Remove defendant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Liability Warning */}
      {totalLiability !== 100 && (
        <div className={`${liabilityStatus.bg} ${liabilityStatus.border} border rounded-lg p-3 mb-4`}>
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            <p className={`text-sm font-medium ${liabilityStatus.color}`}>
              <strong>Liability Total:</strong> {totalLiability}% 
              {totalLiability > 100 ? ' (Over 100%)' : ' (Under 100%)'}
            </p>
          </div>
        </div>
      )}

      {/* Form Fields */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Defendant Information */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b pb-2">Defendant Information</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  value={defendant.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors[`defendants.${index}.firstName`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="First name"
                />
                {errors[`defendants.${index}.firstName`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`defendants.${index}.firstName`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={defendant.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors[`defendants.${index}.lastName`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Last name"
                />
                {errors[`defendants.${index}.lastName`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`defendants.${index}.lastName`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Liability Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={defendant.liabilityPercentage}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === '' ? 0 : parseInt(value);
                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
                        handleChange('liabilityPercentage', numValue);
                      }
                    }}
                    onBlur={(e) => {
                      // Ensure 0 stays as 0 and doesn't auto-change
                      const value = e.target.value;
                      if (value === '' || value === '0') {
                        handleChange('liabilityPercentage', 0);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors[`defendants.${index}.liabilityPercentage`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="100"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                {errors[`defendants.${index}.liabilityPercentage`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`defendants.${index}.liabilityPercentage`]}</p>
                )}
              </div>
            </div>

            {/* Defendant Relationship */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Relationship to Other Defendants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related to Another Defendant?
                  </label>
                  <select
                    value={defendant.relatedToDefendantId !== null && defendant.relatedToDefendantId !== undefined ? String(defendant.relatedToDefendantId) : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleChange('relatedToDefendantId', value ? parseInt(value) : null);
                      // Clear relationship type when no relationship selected
                      if (!value) {
                        handleChange('relationshipType', '');
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">No relationship</option>
                    {allDefendants.map((other, otherIndex) => 
                      otherIndex !== index && other.firstName && other.lastName ? (
                        <option key={otherIndex} value={otherIndex}>
                          {other.firstName} {other.lastName}
                        </option>
                      ) : null
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship Type
                  </label>
                  <select
                    value={defendant.relationshipType || ''}
                    onChange={(e) => {
                      console.log('Setting relationship type:', e.target.value);
                      handleChange('relationshipType', e.target.value);
                    }}
                    disabled={!defendant.relatedToDefendantId && defendant.relatedToDefendantId !== 0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">Select relationship</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Parent">Parent</option>
                    <option value="Child">Child</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Policyholder Information */}
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={defendant.isPolicyholder}
                  onChange={(e) => handleChange('isPolicyholder', e.target.checked)}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Defendant is the policyholder
                </span>
              </label>

              {!defendant.isPolicyholder && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policyholder First Name
                    </label>
                    <input
                      type="text"
                      value={defendant.policyholderFirstName}
                      onChange={(e) => handleChange('policyholderFirstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Policyholder first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policyholder Last Name
                    </label>
                    <input
                      type="text"
                      value={defendant.policyholderLastName}
                      onChange={(e) => handleChange('policyholderLastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Policyholder last name"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Insurance Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auto Insurance Company
                  </label>
                  <select
                    value={defendant.autoInsuranceId}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.startsWith('temp-')) {
                        handleChange('autoInsuranceId', value as any);
                      } else {
                        handleChange('autoInsuranceId', parseInt(value) || 0);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      errors[`defendants.${index}.autoInsuranceId`] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value={0}>Select insurance company</option>
                    {autoInsuranceCompanies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                    {tempAutoInsurers.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} (Not saved)
                      </option>
                    ))}
                  </select>
                  {errors[`defendants.${index}.autoInsuranceId`] && (
                    <p className="mt-1 text-sm text-red-600">{errors[`defendants.${index}.autoInsuranceId`]}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAutoInsuranceModal(true)}
                  className="mt-6 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  title="Add new auto insurance company"
                >
                  + Add
                </button>
                <AddInsuranceModal
                  isOpen={showAutoInsuranceModal}
                  onClose={() => setShowAutoInsuranceModal(false)}
                  onSave={async (name, savePermanently, phone, city, state) => {
                    if (savePermanently) {
                      try {
                        // Save permanently to database using utility function
                        const { createAutoInsurer } = await import('../../utils/database');
                        const newInsurer = await createAutoInsurer({ 
                          name, 
                          phone: phone || '', 
                          city: city || '', 
                          state: state || 'OK' 
                        });
                        
                        if (newInsurer) {
                          // Refresh the auto insurance list using utility function
                          if (onRefreshInsurance) {
                            await onRefreshInsurance();
                          }
                          // Set the newly added insurance as selected
                          handleChange('autoInsuranceId', newInsurer.id);
                        }
                      } catch (err) {
                        console.error('Error saving auto insurance:', err);
                        // Error handling will be done via parent component
                        console.error('Failed to save auto insurance');
                      }
                    } else {
                      // Add temporarily with unique ID
                      const tempId = `temp-def-auto-${Date.now()}`;
                      setTempAutoInsurers(prev => [...prev, { id: tempId, name }]);
                      handleChange('autoInsuranceId', tempId as any);
                    }
                    setShowAutoInsuranceModal(false);
                  }}
                  type="auto"
                  title="Add Auto Insurance Company"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy Number (Optional)
                </label>
                <input
                  type="text"
                  value={defendant.policyNumber}
                  onChange={(e) => handleChange('policyNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors[`defendants.${index}.policyNumber`] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Policy number"
                />
                {errors[`defendants.${index}.policyNumber`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`defendants.${index}.policyNumber`]}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Claim Number (Optional)
              </label>
              <input
                type="text"
                value={defendant.claimNumber || ''}
                onChange={(e) => handleChange('claimNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter claim number"
              />
            </div>

            {/* Auto Adjuster Selection */}
            {defendant.autoInsuranceId && typeof defendant.autoInsuranceId === 'number' && defendant.autoInsuranceId > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="text-sm font-semibold text-gray-700">Auto Insurance Adjuster</h5>
                  <button
                    type="button"
                    onClick={() => setShowAdjusterModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {defendant.adjusterFirstName || defendant.adjusterLastName ? 'Change' : 'Add'} Adjuster
                  </button>
                </div>
                {loadingAdjusters && (
                  <p className="text-xs text-gray-500">Loading adjusters...</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={defendant.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Additional notes about this defendant..."
              />
            </div>
          </div>

          {/* Adjuster Display */}
          {(defendant.autoAdjusterId || (defendant.adjusterFirstName || defendant.adjusterLastName || defendant.adjusterEmail || defendant.adjusterPhone)) && (
            <div className="border-t pt-4 mt-4">
              {defendant.autoAdjusterId ? (
                // Show selected existing adjuster
                (() => {
                  const selectedAdjuster = autoAdjusters.find(a => a.id === defendant.autoAdjusterId);
                  return selectedAdjuster ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-gray-700">
                        Selected: {[selectedAdjuster.first_name, selectedAdjuster.middle_name, selectedAdjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster'}
                      </p>
                      {selectedAdjuster.email && (
                        <p className="text-sm text-gray-600 mt-1">Email: {selectedAdjuster.email}</p>
                      )}
                      {selectedAdjuster.phone && (
                        <p className="text-sm text-gray-600 mt-1">Phone: {selectedAdjuster.phone}</p>
                      )}
                      {selectedAdjuster.fax && (
                        <p className="text-sm text-gray-600 mt-1">Fax: {selectedAdjuster.fax}</p>
                      )}
                      <button
                        type="button"
                        onClick={() => handleChange('autoAdjusterId', undefined)}
                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                      >
                        Clear
                      </button>
                    </div>
                  ) : null;
                })()
              ) : (
                // Show new adjuster that will be created
                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-gray-700">
                    New adjuster will be created: {[defendant.adjusterFirstName, defendant.adjusterLastName].filter(Boolean).join(' ') || 'Unnamed Adjuster'}
                  </p>
                  {defendant.adjusterEmail && (
                    <p className="text-sm text-gray-600 mt-1">Email: {defendant.adjusterEmail}</p>
                  )}
                  {defendant.adjusterPhone && (
                    <p className="text-sm text-gray-600 mt-1">Phone: {defendant.adjusterPhone}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      handleChange('adjusterFirstName', '');
                      handleChange('adjusterLastName', '');
                      handleChange('adjusterEmail', '');
                      handleChange('adjusterPhone', '');
                      handleChange('adjusterMailingAddress', '');
                      handleChange('adjusterCity', '');
                      handleChange('adjusterState', '');
                      handleChange('adjusterZipCode', '');
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-700"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Adjuster Selection Modal */}
      {defendant.autoInsuranceId && typeof defendant.autoInsuranceId === 'number' && defendant.autoInsuranceId > 0 && (
        <AdjusterSelectionModal
          isOpen={showAdjusterModal}
          onClose={() => setShowAdjusterModal(false)}
          onSelect={(adjusterId) => {
            if (adjusterId) {
              // Store the adjuster ID
              handleChange('autoAdjusterId', adjusterId);
              // Clear adjuster info fields when selecting existing adjuster
              handleChange('adjusterFirstName', '');
              handleChange('adjusterLastName', '');
              handleChange('adjusterEmail', '');
              handleChange('adjusterPhone', '');
              handleChange('adjusterMailingAddress', '');
              handleChange('adjusterCity', '');
              handleChange('adjusterState', '');
              handleChange('adjusterZipCode', '');
            }
            setShowAdjusterModal(false);
          }}
          onCreate={(adjusterInfo) => {
            // When creating new adjuster, clear adjuster ID (will be set via onSelect callback)
            handleChange('autoAdjusterId', undefined);
            handleChange('adjusterFirstName', adjusterInfo.first_name || '');
            handleChange('adjusterLastName', adjusterInfo.last_name || '');
            handleChange('adjusterEmail', adjusterInfo.email || '');
            handleChange('adjusterPhone', adjusterInfo.phone || '');
            handleChange('adjusterMailingAddress', adjusterInfo.street_address || '');
            handleChange('adjusterCity', adjusterInfo.city || '');
            handleChange('adjusterState', adjusterInfo.state || '');
            handleChange('adjusterZipCode', adjusterInfo.zip_code || '');
            setShowAdjusterModal(false);
          }}
          existingAdjusters={autoAdjusters}
          insuranceOrProviderName={autoInsuranceCompanies.find(ins => ins.id === defendant.autoInsuranceId)?.name || 'Auto Insurance'}
          type="auto"
          isLoading={loadingAdjusters}
          insuranceId={defendant.autoInsuranceId}
          onRefresh={async () => {
            // Reload auto adjusters after creation
            if (defendant.autoInsuranceId && typeof defendant.autoInsuranceId === 'number' && defendant.autoInsuranceId > 0) {
              setLoadingAdjusters(true);
              try {
                const adjusters = await fetchAutoAdjusters(false);
                const filtered = adjusters.filter(adj => 
                  adj.auto_insurance_id != null && 
                  Number(adj.auto_insurance_id) === Number(defendant.autoInsuranceId)
                );
                setAutoAdjusters(filtered);
              } catch (error) {
                console.error('Error reloading auto adjusters:', error);
                setAutoAdjusters([]);
              } finally {
                setLoadingAdjusters(false);
              }
            }
          }}
        />
      )}
    </div>
  );
}
