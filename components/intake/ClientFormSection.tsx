import { useState, useEffect } from 'react';
import { Trash2, User } from 'lucide-react';
import { fetchHealthInsurers, fetchAutoInsurers, fetchHealthAdjusters, fetchAutoAdjusters, createAutoInsurer } from '@/lib/database';
import type { ClientFormData, HealthInsurance, AutoInsurance } from '@/types/intake';
import { CLIENT_RELATIONSHIP_TYPES } from '@/types/intake';
import FormSelect from '../forms/FormSelect';
import FormInput from '../forms/FormInput';
import AddInsuranceModal from '../common/AddInsuranceModal';
import AddHealthInsuranceModal from '../forms/AddHealthInsuranceModal';
import AdjusterSelectionModal from './AdjusterSelectionModal';

interface ClientFormSectionProps {
    client: ClientFormData;
    index: number;
    totalClients: number;
    allClients: ClientFormData[];
    onChange: (index: number, field: keyof ClientFormData | Partial<ClientFormData>, value?: any) => void;
    onRemove: (index: number) => void;
    errors: Record<string, string>;
    mode?: 'full' | 'contact_only' | 'insurance_only';
}

export default function ClientFormSection({
    client,
    index,
    totalClients,
    allClients,
    onChange,
    onRemove,
    errors,
    mode = 'full'
}: ClientFormSectionProps) {
    const [isExpanded, setIsExpanded] = useState(index === 0);
    const [healthInsurers, setHealthInsurers] = useState<HealthInsurance[]>([]);
    const [autoInsurers, setAutoInsurers] = useState<AutoInsurance[]>([]);
    const [tempAutoInsurers, setTempAutoInsurers] = useState<Array<{ id: string, name: string }>>([]);
    const [showHealthInsuranceModal, setShowHealthInsuranceModal] = useState(false);
    const [showAutoInsuranceModal, setShowAutoInsuranceModal] = useState(false);
    const [healthAdjusters, setHealthAdjusters] = useState<any[]>([]);
    const [showAdjusterModal, setShowAdjusterModal] = useState(false);
    const [loadingAdjusters, setLoadingAdjusters] = useState(false);
    const [autoAdjusters, setAutoAdjusters] = useState<any[]>([]);
    const [showAutoAdjusterModal, setShowAutoAdjusterModal] = useState(false);
    const [loadingAutoAdjusters, setLoadingAutoAdjusters] = useState(false);

    const loadInsurance = async () => {
        try {
            // Use database utility functions to fetch insurance companies
            const [healthData, autoData] = await Promise.all([
                fetchHealthInsurers(),
                fetchAutoInsurers()
            ]);
            // Deduplicate by ID to prevent duplicate key warnings
            if (healthData) {
                const uniqueHealth = healthData.filter((h, index, self) =>
                    index === self.findIndex(item => item.id === h.id)
                );
                setHealthInsurers(uniqueHealth);
            }
            if (autoData) {
                const uniqueAuto = autoData.filter((a, index, self) =>
                    index === self.findIndex(item => item.id === a.id)
                );
                setAutoInsurers(uniqueAuto);
            }
        } catch (error) {
            console.error('Error loading insurance companies:', error);
        }
    };

    useEffect(() => {
        loadInsurance();
    }, []);

    // Refresh insurance lists when modals open to get latest data from dashboard
    useEffect(() => {
        if (showHealthInsuranceModal || showAutoInsuranceModal) {
            loadInsurance();
        }
    }, [showHealthInsuranceModal, showAutoInsuranceModal]);

    // Load health adjusters when health insurance is selected
    useEffect(() => {
        const loadHealthAdjusters = async () => {
            if (client.healthInsuranceId && typeof client.healthInsuranceId === 'number' && client.healthInsuranceId > 0) {
                setLoadingAdjusters(true);
                try {
                    const adjusters = await fetchHealthAdjusters();
                    console.log('Loading health adjusters for insurance ID:', client.healthInsuranceId);
                    console.log('Fetched adjusters:', adjusters);
                    // Filter adjusters for the selected health insurance with type-safe comparison
                    const filtered = adjusters.filter(adj =>
                        adj.health_insurance_id != null &&
                        Number(adj.health_insurance_id) === Number(client.healthInsuranceId)
                    );
                    console.log('Filtered adjusters:', filtered);
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
    }, [client.healthInsuranceId]);

    // Reload health adjusters when modal opens
    useEffect(() => {
        if (showAdjusterModal && client.healthInsuranceId && typeof client.healthInsuranceId === 'number' && client.healthInsuranceId > 0) {
            const reloadAdjusters = async () => {
                setLoadingAdjusters(true);
                try {
                    const adjusters = await fetchHealthAdjusters();
                    const filtered = adjusters.filter(adj =>
                        adj.health_insurance_id != null &&
                        Number(adj.health_insurance_id) === Number(client.healthInsuranceId)
                    );
                    setHealthAdjusters(filtered);
                } catch (error) {
                    console.error('Error reloading health adjusters:', error);
                    setHealthAdjusters([]);
                } finally {
                    setLoadingAdjusters(false);
                }
            };
            reloadAdjusters();
        }
    }, [showAdjusterModal, client.healthInsuranceId]);

    // Load auto adjusters when auto insurance is selected
    useEffect(() => {
        const loadAutoAdjusters = async () => {
            if (client.autoInsuranceId && typeof client.autoInsuranceId === 'number' && client.autoInsuranceId > 0) {
                setLoadingAutoAdjusters(true);
                try {
                    const adjusters = await fetchAutoAdjusters(false);
                    console.log('Loading auto adjusters for insurance ID:', client.autoInsuranceId);
                    console.log('Fetched adjusters:', adjusters);
                    // Filter adjusters for the selected auto insurance with type-safe comparison
                    const filtered = adjusters.filter(adj =>
                        adj.auto_insurance_id != null &&
                        Number(adj.auto_insurance_id) === Number(client.autoInsuranceId)
                    );
                    console.log('Filtered adjusters:', filtered);
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
    }, [client.autoInsuranceId]);

    // Reload auto adjusters when modal opens
    useEffect(() => {
        if (showAutoAdjusterModal && client.autoInsuranceId && typeof client.autoInsuranceId === 'number' && client.autoInsuranceId > 0) {
            const reloadAdjusters = async () => {
                setLoadingAutoAdjusters(true);
                try {
                    const adjusters = await fetchAutoAdjusters(false);
                    const filtered = adjusters.filter(adj =>
                        adj.auto_insurance_id != null &&
                        Number(adj.auto_insurance_id) === Number(client.autoInsuranceId)
                    );
                    setAutoAdjusters(filtered);
                } catch (error) {
                    console.error('Error reloading auto adjusters:', error);
                    setAutoAdjusters([]);
                } finally {
                    setLoadingAutoAdjusters(false);
                }
            };
            reloadAdjusters();
        }
    }, [showAutoAdjusterModal, client.autoInsuranceId]);


    const handleChange = (field: keyof ClientFormData, value: any) => {
        onChange(index, field, value);
    };

    const handleBatchChange = (fields: Partial<ClientFormData>) => {
        onChange(index, fields);
    };

    const getClientTitle = () => {
        if (index === 0) {
            return 'Driver Information';
        }
        return `Passenger ${index}`;
    };

    return (
        <div className="border border-border rounded-lg p-4 bg-card">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-medium text-foreground">
                            {getClientTitle()}
                        </h3>
                        {client.isDriver && (
                            <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                                Driver
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm text-primary hover:text-primary/90 font-medium"
                    >
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </button>

                    {totalClients > 1 && (
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="p-1 text-destructive hover:text-destructive/90 hover:bg-destructive/10 rounded"
                            title="Remove client"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Driver Toggle */}
            <div className="mb-4">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={client.isDriver}
                        onChange={(e) => handleChange('isDriver', e.target.checked)}
                        className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">
                        This client was the driver of the vehicle
                    </span>
                </label>
            </div>

            {/* Form Fields */}
            {isExpanded && (
                <div className="space-y-4">
                    {/* Relationship to Primary Client (for non-drivers) */}
                    {(mode === 'full' || mode === 'contact_only') && index > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Relationship to Primary Client
                            </label>
                            <select
                                value={client.relationshipToPrimary}
                                onChange={(e) => {
                                    const selectedRelationship = e.target.value;
                                    handleChange('relationshipToPrimary', selectedRelationship);

                                    // Auto-link relationship: if this client selects "Spouse", primary client should also show "Spouse"
                                    // If this client selects "Child", primary should show "Parent" or "Guardian"
                                    if (index > 0 && allClients[0]) {
                                        const primaryClient = allClients[0];
                                        let primaryRelationship = '';

                                        if (selectedRelationship === 'Spouse') {
                                            primaryRelationship = 'Spouse';
                                        } else if (selectedRelationship === 'Child' || selectedRelationship === 'Son' || selectedRelationship === 'Daughter') {
                                            primaryRelationship = 'Parent';
                                        } else if (selectedRelationship === 'Parent') {
                                            primaryRelationship = 'Child';
                                        } else if (selectedRelationship === 'Sibling' || selectedRelationship === 'Brother' || selectedRelationship === 'Sister') {
                                            primaryRelationship = 'Sibling';
                                        } else if (selectedRelationship === 'Friend') {
                                            primaryRelationship = 'Friend';
                                        }

                                        // Update primary client's relationship if it's empty or different
                                        if (primaryRelationship && (!primaryClient.relationshipToPrimary || primaryClient.relationshipToPrimary !== primaryRelationship)) {
                                            onChange(0, 'relationshipToPrimary', primaryRelationship);
                                        }
                                    }
                                }}
                                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                            >
                                {CLIENT_RELATIONSHIP_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                        </div>
                    )}



                    {/* Personal Information */}
                    {(mode === 'full' || mode === 'contact_only') && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={client.firstName}
                                        onChange={(e) => handleChange('firstName', e.target.value)}
                                        className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.firstName`] ? 'border-destructive' : 'border-input'
                                            }`}
                                        placeholder="First name"
                                    />
                                    {errors[`clients.${index}.firstName`] && (
                                        <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.firstName`]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Middle Name
                                    </label>
                                    <input
                                        type="text"
                                        value={client.middleName}
                                        onChange={(e) => handleChange('middleName', e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Middle name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={client.lastName}
                                        onChange={(e) => handleChange('lastName', e.target.value)}
                                        className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.lastName`] ? 'border-destructive' : 'border-input'
                                            }`}
                                        placeholder="Last name"
                                    />
                                    {errors[`clients.${index}.lastName`] && (
                                        <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.lastName`]}</p>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Date of Birth *
                                    </label>
                                    <input
                                        type="date"
                                        value={client.dateOfBirth}
                                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                                        className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.dateOfBirth`] ? 'border-destructive' : 'border-input'
                                            }`}
                                    />
                                    {errors[`clients.${index}.dateOfBirth`] && (
                                        <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.dateOfBirth`]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        SSN
                                    </label>
                                    <input
                                        type="text"
                                        value={client.ssn}
                                        onChange={(e) => handleChange('ssn', e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="XXX-XX-XXXX"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            {index > 0 && (
                                <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={client.usesPrimaryAddress || false}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                handleChange('usesPrimaryAddress', isChecked);

                                                if (isChecked && allClients && allClients[0]) {
                                                    const primaryClient = allClients[0];
                                                    console.log('🔍 Auto-filling address from primary client:', {
                                                        street: primaryClient.streetAddress,
                                                        city: primaryClient.city,
                                                        state: primaryClient.state,
                                                        zip: primaryClient.zipCode
                                                    });

                                                    // Update all address fields at once using batch update
                                                    const addressFields: Partial<ClientFormData> = {
                                                        streetAddress: primaryClient.streetAddress,
                                                        city: primaryClient.city,
                                                        state: primaryClient.state,
                                                        zipCode: primaryClient.zipCode
                                                    };

                                                    // Use batch change to update all fields at once
                                                    handleBatchChange(addressFields);
                                                }
                                            }}
                                            className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Same address as {allClients && allClients[0] ? `${allClients[0].firstName} ${allClients[0].lastName}` : 'primary client'}
                                        </span>
                                    </label>
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Street Address *
                                </label>
                                <input
                                    type="text"
                                    value={client.streetAddress}
                                    onChange={(e) => handleChange('streetAddress', e.target.value)}
                                    disabled={client.usesPrimaryAddress}
                                    className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.streetAddress`] ? 'border-destructive' : 'border-input'
                                        } ${client.usesPrimaryAddress ? 'bg-muted text-muted-foreground' : ''}`}
                                    placeholder="Street address"
                                />
                                {errors[`clients.${index}.streetAddress`] && (
                                    <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.streetAddress`]}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        City *
                                    </label>
                                    <input
                                        type="text"
                                        value={client.city}
                                        onChange={(e) => handleChange('city', e.target.value)}
                                        disabled={client.usesPrimaryAddress}
                                        className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.city`] ? 'border-destructive' : 'border-input'
                                            } ${client.usesPrimaryAddress ? 'bg-muted text-muted-foreground' : ''}`}
                                        placeholder="City"
                                    />
                                    {errors[`clients.${index}.city`] && (
                                        <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.city`]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        State *
                                    </label>
                                    <select
                                        value={client.state}
                                        onChange={(e) => handleChange('state', e.target.value)}
                                        disabled={client.usesPrimaryAddress}
                                        className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.state`] ? 'border-destructive' : 'border-input'
                                            } ${client.usesPrimaryAddress ? 'bg-muted text-muted-foreground' : ''}`}
                                    >
                                        <option value="">Select state</option>
                                        <option value="Oklahoma">Oklahoma</option>
                                        <option value="Texas">Texas</option>
                                        <option value="Kansas">Kansas</option>
                                        <option value="Missouri">Missouri</option>
                                        <option value="Arkansas">Arkansas</option>
                                    </select>
                                    {errors[`clients.${index}.state`] && (
                                        <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.state`]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        ZIP Code *
                                    </label>
                                    <input
                                        type="text"
                                        value={client.zipCode}
                                        onChange={(e) => handleChange('zipCode', e.target.value)}
                                        disabled={client.usesPrimaryAddress}
                                        className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.zipCode`] ? 'border-destructive' : 'border-input'
                                            } ${client.usesPrimaryAddress ? 'bg-muted text-muted-foreground' : ''}`}
                                        placeholder="ZIP code"
                                    />
                                    {errors[`clients.${index}.zipCode`] && (
                                        <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.zipCode`]}</p>
                                    )}
                                </div>
                            </div>

                            {/* Contact Information */}
                            {index > 0 && (
                                <div className="bg-muted/50 border border-border rounded-lg p-3 mb-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={client.usesPrimaryPhone || false}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                handleChange('usesPrimaryPhone', isChecked);
                                                if (isChecked && allClients && allClients[0]) {
                                                    const primaryClient = allClients[0];
                                                    console.log('🔍 Auto-filling phone from primary client:', primaryClient);
                                                    if (primaryClient.primaryPhone) {
                                                        handleBatchChange({ primaryPhone: primaryClient.primaryPhone });
                                                    }
                                                }
                                            }}
                                            className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                                        />
                                        <span className="text-sm font-medium text-muted-foreground">
                                            Same phone as {allClients && allClients[0] ? `${allClients[0].firstName} ${allClients[0].lastName}` : 'primary client'}
                                        </span>
                                    </label>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Primary Phone *
                                    </label>
                                    <input
                                        type="tel"
                                        value={client.primaryPhone}
                                        onChange={(e) => handleChange('primaryPhone', e.target.value)}
                                        disabled={client.usesPrimaryPhone}
                                        className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.primaryPhone`] ? 'border-destructive' : 'border-input'
                                            } ${client.usesPrimaryPhone ? 'bg-muted text-muted-foreground' : ''}`}
                                        placeholder="(555) 123-4567"
                                    />
                                    {errors[`clients.${index}.primaryPhone`] && (
                                        <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.primaryPhone`]}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                                        Secondary Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={client.secondaryPhone}
                                        onChange={(e) => handleChange('secondaryPhone', e.target.value)}
                                        className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="(555) 123-4567"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={client.email}
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    className={`w-full px-3 py-2 bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${errors[`clients.${index}.email`] ? 'border-destructive' : 'border-input'
                                        }`}
                                    placeholder="email@example.com"
                                />
                                {errors[`clients.${index}.email`] && (
                                    <p className="mt-1 text-sm text-destructive">{errors[`clients.${index}.email`]}</p>
                                )}
                            </div>

                            {/* Additional Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Marital Status
                                    </label>
                                    <select
                                        value={client.maritalStatus}
                                        onChange={(e) => handleChange('maritalStatus', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select status</option>
                                        <option value="Single">Single</option>
                                        <option value="Married">Married</option>
                                        <option value="Divorced">Divorced</option>
                                        <option value="Widowed">Widowed</option>
                                        <option value="Separated">Separated</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Referrer
                                    </label>
                                    <input
                                        type="text"
                                        value={client.referrer}
                                        onChange={(e) => handleChange('referrer', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="How did you hear about us?"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Relationship
                                    </label>
                                    <input
                                        type="text"
                                        value={client.referrerRelationship}
                                        onChange={(e) => handleChange('referrerRelationship', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Relationship to referrer"
                                    />
                                </div>
                            </div>

                            {/* Injury Information */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Injury Description
                                    </label>
                                    <textarea
                                        value={client.injuryDescription}
                                        onChange={(e) => handleChange('injuryDescription', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Describe the injuries sustained..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prior Accidents
                                    </label>
                                    <textarea
                                        value={client.priorAccidents}
                                        onChange={(e) => handleChange('priorAccidents', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="Describe any prior accidents..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prior Injuries
                                    </label>
                                    <textarea
                                        value={client.priorInjuries}
                                        onChange={(e) => handleChange('priorInjuries', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="Describe any prior injuries..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Work Impact
                                    </label>
                                    <textarea
                                        value={client.workImpact}
                                        onChange={(e) => handleChange('workImpact', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={2}
                                        placeholder="Describe how the accident impacted work..."
                                    />
                                </div>
                            </div>
                        </div>

                    )}

                    {/* Health Insurance */}
                    {(mode === 'full' || mode === 'insurance_only') && (
                        <div className="border-t pt-4">
                            <div className="mb-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={client.hasHealthInsurance}
                                        onChange={(e) => handleChange('hasHealthInsurance', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        This client has health insurance
                                    </span>
                                </label>
                            </div>

                            {client.hasHealthInsurance && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <FormSelect
                                                    key={`health-insurance-${healthInsurers.length}-${healthInsurers.map(h => h.id).join('-')}`}
                                                    name={`clients.${index}.healthInsuranceId`}
                                                    label="Health Insurance Carrier"
                                                    value={client.healthInsuranceId?.toString() || ''}
                                                    onChange={(value) => {
                                                        handleChange('healthInsuranceId', value ? parseInt(value) : 0);
                                                    }}
                                                    options={[
                                                        { value: '', label: 'Select carrier...' },
                                                        ...healthInsurers
                                                            .filter((h, index, self) => index === self.findIndex(item => item.id === h.id)) // Deduplicate by ID
                                                            .map(h => ({ value: String(h.id), label: h.name || 'Unnamed' })),
                                                        { value: '0', label: 'Unknown provider' }
                                                    ]}
                                                    error={errors[`clients.${index}.healthInsuranceId`]}
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
                                                            setHealthInsurers(uniqueList);
                                                            // Select the newly created insurer if provided
                                                            if (newInsurer && newInsurer.id) {
                                                                setTimeout(() => {
                                                                    handleChange('healthInsuranceId', newInsurer.id);
                                                                }, 100);
                                                            }
                                                        }
                                                    } catch (error) {
                                                        console.error('Error refreshing health insurance list:', error);
                                                    } finally {
                                                        // Close modal after a short delay to ensure state updates
                                                        setTimeout(() => {
                                                            setShowHealthInsuranceModal(false);
                                                        }, 200);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <FormInput
                                            name={`clients.${index}.healthMemberId`}
                                            label="Member ID (Optional)"
                                            value={client.healthMemberId}
                                            onChange={(value) => handleChange('healthMemberId', value)}
                                            placeholder="Health insurance member ID"
                                            error={errors[`clients.${index}.healthMemberId`]}
                                        />
                                    </div>

                                    {/* Health Adjuster Selection */}
                                    {client.healthInsuranceId && (
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
                                                    {client.healthAdjusterId ? 'Change Adjuster' : 'Select Adjuster'}
                                                </button>
                                            </div>
                                            {loadingAdjusters && (
                                                <p className="text-xs text-gray-500">Loading adjusters...</p>
                                            )}
                                            {client.healthAdjusterId && (
                                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                    <p className="text-sm text-gray-700">
                                                        Selected: {healthAdjusters.find(a => a.id === client.healthAdjusterId)?.first_name || ''} {healthAdjusters.find(a => a.id === client.healthAdjusterId)?.last_name || ''}
                                                    </p>
                                                    {healthAdjusters.find(a => a.id === client.healthAdjusterId)?.email && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Email: {healthAdjusters.find(a => a.id === client.healthAdjusterId)?.email}
                                                        </p>
                                                    )}
                                                    {healthAdjusters.find(a => a.id === client.healthAdjusterId)?.phone && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Phone: {healthAdjusters.find(a => a.id === client.healthAdjusterId)?.phone}
                                                        </p>
                                                    )}
                                                    {healthAdjusters.find(a => a.id === client.healthAdjusterId)?.fax && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Fax: {healthAdjusters.find(a => a.id === client.healthAdjusterId)?.fax}
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('healthAdjusterId', undefined)}
                                                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                                                    >
                                                        Clear Selection
                                                    </button>
                                                </div>
                                            )}
                                            {client.healthAdjusterInfo && (
                                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                                    <p className="text-sm text-gray-700">
                                                        New adjuster will be created: {client.healthAdjusterInfo.first_name} {client.healthAdjusterInfo.last_name}
                                                    </p>
                                                    {client.healthAdjusterInfo.email && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Email: {client.healthAdjusterInfo.email}
                                                        </p>
                                                    )}
                                                    {client.healthAdjusterInfo.phone && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Phone: {client.healthAdjusterInfo.phone}
                                                        </p>
                                                    )}
                                                    {client.healthAdjusterInfo.fax && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Fax: {client.healthAdjusterInfo.fax}
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('healthAdjusterInfo', undefined)}
                                                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* Auto Insurance (per client/passenger) */}
                    {(mode === 'full' || mode === 'insurance_only') && (
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Auto Insurance</h4>
                            <div className="mb-4">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={client.hasAutoInsurance}
                                        onChange={(e) => handleChange('hasAutoInsurance', e.target.checked)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        This client has auto insurance
                                    </span>
                                </label>
                            </div>

                            {client.hasAutoInsurance && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <FormSelect
                                                    name={`clients.${index}.autoInsuranceId`}
                                                    label="Auto Insurance Company"
                                                    value={client.autoInsuranceId?.toString() || ''}
                                                    onChange={(value) => {
                                                        // Handle both numeric and temporary string IDs
                                                        if (value && value.startsWith('temp-')) {
                                                            handleChange('autoInsuranceId', value as any);
                                                        } else {
                                                            handleChange('autoInsuranceId', value ? parseInt(value) : 0);
                                                        }
                                                    }}
                                                    options={[
                                                        { value: '', label: 'Select insurance company...' },
                                                        ...autoInsurers
                                                            .filter((a, index, self) => index === self.findIndex(item => item.id === a.id)) // Deduplicate by ID
                                                            .map(a => ({ value: String(a.id), label: a.name || 'Unnamed' })),
                                                        ...tempAutoInsurers.map(a => ({ value: a.id, label: `${a.name} (Not saved)` }))
                                                    ]}
                                                    error={errors[`clients.${index}.autoInsuranceId`]}
                                                />
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
                                                            const newInsurer = await createAutoInsurer({
                                                                name,
                                                                phone: phone || '',
                                                                city: city || '',
                                                                state: state || 'OK'
                                                            });

                                                            if (newInsurer) {
                                                                // Refresh the auto insurers list from database
                                                                const updatedList = await fetchAutoInsurers();
                                                                if (updatedList && updatedList.length > 0) {
                                                                    // Deduplicate before setting
                                                                    const uniqueList = updatedList.filter((a, index, self) =>
                                                                        index === self.findIndex(item => item.id === a.id)
                                                                    );
                                                                    setAutoInsurers(uniqueList);
                                                                    // Set the newly added insurance as selected
                                                                    handleChange('autoInsuranceId', newInsurer.id);
                                                                }
                                                            }
                                                        } catch (err) {
                                                            console.error('Error saving auto insurance:', err);
                                                            // Error will be shown via toast/error handling in parent
                                                            throw err;
                                                        }
                                                    } else {
                                                        // Add temporarily with unique ID
                                                        const tempId = `temp-auto-${Date.now()}`;
                                                        setTempAutoInsurers(prev => [...prev, { id: tempId, name }]);
                                                        handleChange('autoInsuranceId', tempId as any);
                                                    }
                                                    setShowAutoInsuranceModal(false);
                                                }}
                                                type="auto"
                                                title="Add Auto Insurance Company"
                                            />
                                        </div>
                                        <FormInput
                                            name={`clients.${index}.autoPolicyNumber`}
                                            label="Policy Number (Optional)"
                                            value={client.autoPolicyNumber}
                                            onChange={(value) => handleChange('autoPolicyNumber', value)}
                                            placeholder="Policy number"
                                            error={errors[`clients.${index}.autoPolicyNumber`]}
                                        />
                                    </div>
                                    <FormInput
                                        name={`clients.${index}.autoClaimNumber`}
                                        label="Claim Number (Optional)"
                                        value={client.autoClaimNumber}
                                        onChange={(value) => handleChange('autoClaimNumber', value)}
                                        placeholder="Enter claim number"
                                    />
                                    {/* Auto Adjuster Selection */}
                                    {client.hasAutoInsurance && client.autoInsuranceId && typeof client.autoInsuranceId === 'number' && client.autoInsuranceId > 0 && (
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
                                                    {client.autoAdjusterId ? 'Change Adjuster' : 'Select Adjuster'}
                                                </button>
                                            </div>
                                            {loadingAutoAdjusters && (
                                                <p className="text-xs text-gray-500">Loading adjusters...</p>
                                            )}
                                            {client.autoAdjusterId && (
                                                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                                    <p className="text-sm text-gray-700">
                                                        Selected: {autoAdjusters.find(a => a.id === client.autoAdjusterId)?.first_name || ''} {autoAdjusters.find(a => a.id === client.autoAdjusterId)?.last_name || ''}
                                                    </p>
                                                    {autoAdjusters.find(a => a.id === client.autoAdjusterId)?.email && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Email: {autoAdjusters.find(a => a.id === client.autoAdjusterId)?.email}
                                                        </p>
                                                    )}
                                                    {autoAdjusters.find(a => a.id === client.autoAdjusterId)?.phone && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Phone: {autoAdjusters.find(a => a.id === client.autoAdjusterId)?.phone}
                                                        </p>
                                                    )}
                                                    {autoAdjusters.find(a => a.id === client.autoAdjusterId)?.fax && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Fax: {autoAdjusters.find(a => a.id === client.autoAdjusterId)?.fax}
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('autoAdjusterId', undefined)}
                                                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                                                    >
                                                        Clear Selection
                                                    </button>
                                                </div>
                                            )}
                                            {client.autoAdjusterInfo && (
                                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                                    <p className="text-sm text-gray-700">
                                                        New adjuster will be created: {client.autoAdjusterInfo.first_name} {client.autoAdjusterInfo.last_name}
                                                    </p>
                                                    {client.autoAdjusterInfo.email && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Email: {client.autoAdjusterInfo.email}
                                                        </p>
                                                    )}
                                                    {client.autoAdjusterInfo.phone && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Phone: {client.autoAdjusterInfo.phone}
                                                        </p>
                                                    )}
                                                    {client.autoAdjusterInfo.fax && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Fax: {client.autoAdjusterInfo.fax}
                                                        </p>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleChange('autoAdjusterInfo', undefined)}
                                                        className="mt-2 text-xs text-red-600 hover:text-red-700"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={client.hasMedpay}
                                                    onChange={(e) => handleChange('hasMedpay', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Has Med Pay Coverage</span>
                                            </label>
                                            {client.hasMedpay && (
                                                <FormInput
                                                    name={`clients.${index}.medpayAmount`}
                                                    label="Med Pay Amount"
                                                    value={client.medpayAmount}
                                                    onChange={(value) => handleChange('medpayAmount', value)}
                                                    placeholder="$1,000, $2,500, etc."
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 mb-2">
                                                <input
                                                    type="checkbox"
                                                    checked={client.hasUmCoverage}
                                                    onChange={(e) => handleChange('hasUmCoverage', e.target.checked)}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Has UM/UIM Coverage</span>
                                            </label>
                                            {client.hasUmCoverage && (
                                                <FormInput
                                                    name={`clients.${index}.umAmount`}
                                                    label="UM/UIM Amount"
                                                    value={client.umAmount}
                                                    onChange={(value) => handleChange('umAmount', value)}
                                                    placeholder="25/50, 50/100, etc."
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )
            }

            {/* Adjuster Selection Modal */}
            {
                client.hasHealthInsurance && client.healthInsuranceId && typeof client.healthInsuranceId === 'number' && client.healthInsuranceId > 0 && (
                    <AdjusterSelectionModal
                        isOpen={showAdjusterModal}
                        onClose={() => setShowAdjusterModal(false)}
                        onSelect={(adjusterId) => {
                            if (adjusterId) {
                                const selectedAdjuster = healthAdjusters.find(a => a.id === adjusterId);
                                if (selectedAdjuster) {
                                    handleChange('healthAdjusterId', adjusterId);
                                    // Populate healthAdjusterInfo with selected adjuster details for display in review
                                    handleChange('healthAdjusterInfo', {
                                        first_name: selectedAdjuster.first_name || '',
                                        middle_name: selectedAdjuster.middle_name,
                                        last_name: selectedAdjuster.last_name || '',
                                        email: selectedAdjuster.email || '',
                                        phone: selectedAdjuster.phone || '',
                                        fax: selectedAdjuster.fax || '',
                                        street_address: selectedAdjuster.street_address || '',
                                        city: selectedAdjuster.city || '',
                                        state: selectedAdjuster.state || '',
                                        zip_code: selectedAdjuster.zip_code || ''
                                    });
                                }
                            }
                            setShowAdjusterModal(false);
                        }}
                        onCreate={(adjusterInfo) => {
                            handleChange('healthAdjusterInfo', adjusterInfo);
                            handleChange('healthAdjusterId', undefined); // Clear existing adjuster ID if creating new
                            setShowAdjusterModal(false);
                        }}
                        existingAdjusters={healthAdjusters}
                        insuranceOrProviderName={healthInsurers.find(h => h.id === client.healthInsuranceId)?.name || 'Health Insurance'}
                        type="health"
                        isLoading={loadingAdjusters}
                        insuranceId={client.healthInsuranceId}
                        onRefresh={async () => {
                            // Reload health adjusters after creation
                            if (client.hasHealthInsurance && client.healthInsuranceId) {
                                setLoadingAdjusters(true);
                                try {
                                    const adjusters = await fetchHealthAdjusters();
                                    const filtered = adjusters.filter(adj => Number(adj.health_insurance_id) === Number(client.healthInsuranceId));
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
                )
            }

            {/* Auto Adjuster Selection Modal */}
            {
                client.hasAutoInsurance && client.autoInsuranceId && typeof client.autoInsuranceId === 'number' && client.autoInsuranceId > 0 && (
                    <AdjusterSelectionModal
                        isOpen={showAutoAdjusterModal}
                        onClose={() => setShowAutoAdjusterModal(false)}
                        onSelect={(adjusterId) => {
                            if (adjusterId) {
                                const selectedAdjuster = autoAdjusters.find(a => a.id === adjusterId);
                                if (selectedAdjuster) {
                                    handleChange('autoAdjusterId', adjusterId);
                                    // Populate autoAdjusterInfo with selected adjuster details for display in review
                                    handleChange('autoAdjusterInfo', {
                                        first_name: selectedAdjuster.first_name || '',
                                        middle_name: selectedAdjuster.middle_name,
                                        last_name: selectedAdjuster.last_name || '',
                                        email: selectedAdjuster.email || '',
                                        phone: selectedAdjuster.phone || '',
                                        fax: selectedAdjuster.fax || '',
                                        street_address: selectedAdjuster.street_address || '',
                                        city: selectedAdjuster.city || '',
                                        state: selectedAdjuster.state || '',
                                        zip_code: selectedAdjuster.zip_code || ''
                                    });
                                }
                            }
                            setShowAutoAdjusterModal(false);
                        }}
                        onCreate={(adjusterInfo) => {
                            handleChange('autoAdjusterInfo', adjusterInfo);
                            handleChange('autoAdjusterId', undefined); // Clear existing adjuster ID if creating new
                        }}
                        existingAdjusters={autoAdjusters}
                        insuranceOrProviderName={autoInsurers.find(a => a.id === client.autoInsuranceId)?.name || 'Auto Insurance'}
                        type="auto"
                        isLoading={loadingAutoAdjusters}
                        insuranceId={client.autoInsuranceId}
                        onRefresh={async () => {
                            // Reload auto adjusters after creation
                            if (client.hasAutoInsurance && client.autoInsuranceId) {
                                setLoadingAutoAdjusters(true);
                                try {
                                    const adjusters = await fetchAutoAdjusters();
                                    const filtered = adjusters.filter(adj => Number(adj.auto_insurance_id) === Number(client.autoInsuranceId));
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
                )
            }
        </div >
    );
}
