import { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle2, User } from 'lucide-react';
import { fetchMedicalProviders } from '@/lib/database';
import type { IntakeFormData, MedicalProvider, FormErrors } from '@/types/intake';
import AddProviderModal from '../forms/AddProviderModal';

interface Step3Props {
    data: IntakeFormData;
    errors: FormErrors;
    onChange: (field: keyof IntakeFormData, value: any) => void;
}

interface GroupedProviders {
    [key: string]: MedicalProvider[];
}

export default function Step3MedicalProviders({ data, errors, onChange }: Step3Props) {
    const [providers, setProviders] = useState<MedicalProvider[]>([]);
    const [tempProviders, setTempProviders] = useState<Array<{ id: string, name: string, type: string, city: string }>>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [selectedClientIndex, setSelectedClientIndex] = useState<number>(0);
    const [showAddProviderModal, setShowAddProviderModal] = useState(false);

    const loadProviders = async () => {
        try {
            // Use the database utility function to fetch providers
            const providersData = await fetchMedicalProviders();
            // Deduplicate by ID to prevent duplicate key warnings
            const uniqueProviders = (providersData || []).filter((p, index, self) =>
                index === self.findIndex(item => item.id === p.id)
            );
            setProviders(uniqueProviders);
            const categories = new Set(uniqueProviders.map(p => p.type));
            setExpandedCategories(categories);
        } catch (error) {
            console.error('Error loading providers:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProviders();
    }, []);

    // Refresh providers list when modal opens to get latest data from dashboard
    useEffect(() => {
        if (showAddProviderModal) {
            loadProviders();
        }
    }, [showAddProviderModal]);

    // Get selected providers for the currently selected client
    const currentClient = data.clients[selectedClientIndex];
    const selectedProviders = currentClient?.selectedProviders || [];
    const selectedCount = selectedProviders.length;

    const hasError = errors.medicalProviders !== undefined;
    const hasSelection = selectedCount > 0;

    // Calculate total providers selected across all clients
    const totalProvidersSelected = data.clients.reduce((sum, client) => {
        return sum + (client.selectedProviders?.length || 0);
    }, 0);

    // Combine permanent and temporary providers, deduplicating by ID
    const allProvidersMap = new Map();
    // Add permanent providers first
    providers.forEach(p => {
        if (!allProvidersMap.has(p.id)) {
            allProvidersMap.set(p.id, p);
        }
    });
    // Add temporary providers (they have string IDs, so won't conflict with numeric IDs)
    tempProviders.forEach(tp => {
        allProvidersMap.set(tp.id, {
            id: tp.id as any,
            name: tp.name,
            type: tp.type,
            city: tp.city,
            request_method: 'Email',
            phone: '',
            fax: '',
            email: '',
            street_address: '',
            state: '',
            zip_code: '',
            notes: '',
            created_at: new Date().toISOString(),
            temporary: true
        });
    });
    const allProviders = Array.from(allProvidersMap.values());

    const groupedProviders = allProviders.reduce((acc: GroupedProviders, provider: any) => {
        if (!acc[provider.type]) {
            acc[provider.type] = [];
        }
        acc[provider.type].push(provider);
        return acc;
    }, {});

    // Sort each group alphabetically by name
    Object.keys(groupedProviders).forEach(type => {
        groupedProviders[type].sort((a, b) => {
            const nameA = (a.name || '').toLowerCase();
            const nameB = (b.name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
    });

    const filteredGroupedProviders = Object.entries(groupedProviders).reduce(
        (acc: GroupedProviders, [type, providerList]) => {
            if (!searchQuery.trim()) {
                acc[type] = providerList;
                return acc;
            }
            const query = searchQuery.toLowerCase();
            const filtered = providerList.filter(
                (provider) => {
                    const name = (provider.name || '').toLowerCase();
                    const city = (provider.city || '').toLowerCase();
                    const typeName = (provider.type || '').toLowerCase();
                    const requestMethod = (provider.request_method || '').toLowerCase();

                    // Flexible search: check if query matches any part of any field
                    return name.includes(query) ||
                        city.includes(query) ||
                        typeName.includes(query) ||
                        requestMethod.includes(query) ||
                        name.split(' ').some(word => word.startsWith(query)) ||
                        city.split(' ').some(word => word.startsWith(query));
                }
            );
            if (filtered.length > 0) {
                acc[type] = filtered;
            }
            return acc;
        },
        {}
    );

    const toggleProvider = (providerId: number) => {
        const currentSelected = selectedProviders;
        const newSelected = currentSelected.includes(providerId)
            ? currentSelected.filter((id) => id !== providerId)
            : [...currentSelected, providerId];

        // Update the specific client's selectedProviders
        const updatedClients = [...data.clients];
        updatedClients[selectedClientIndex] = {
            ...updatedClients[selectedClientIndex],
            selectedProviders: newSelected
        };
        onChange('clients', updatedClients);
    };

    const toggleCategory = (category: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(category)) {
            newExpanded.delete(category);
        } else {
            newExpanded.add(category);
        }
        setExpandedCategories(newExpanded);
    };

    const selectAllInCategory = (category: string) => {
        const categoryProviders = groupedProviders[category] || [];
        const categoryIds = categoryProviders.map((p) => p.id);
        const currentSelected = selectedProviders;
        const newSelected = Array.from(new Set([...currentSelected, ...categoryIds]));

        const updatedClients = [...data.clients];
        updatedClients[selectedClientIndex] = {
            ...updatedClients[selectedClientIndex],
            selectedProviders: newSelected
        };
        onChange('clients', updatedClients);
    };

    const deselectAllInCategory = (category: string) => {
        const categoryProviders = groupedProviders[category] || [];
        const categoryIds = new Set(categoryProviders.map((p) => p.id));
        const currentSelected = selectedProviders;
        const newSelected = currentSelected.filter((id) => !categoryIds.has(id));

        const updatedClients = [...data.clients];
        updatedClients[selectedClientIndex] = {
            ...updatedClients[selectedClientIndex],
            selectedProviders: newSelected
        };
        onChange('clients', updatedClients);
    };

    if (loading) {
        return <div className="text-center py-8">Loading providers...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Client Selection */}
            {data.clients.length > 1 && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-foreground mb-3">
                        Select which client saw these providers:
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {data.clients.map((client, idx) => {
                            const clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || `Client ${idx + 1}`;
                            const isSelected = selectedClientIndex === idx;
                            const clientProviderCount = client.selectedProviders?.length || 0;

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedClientIndex(idx)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background text-muted-foreground border border-border hover:border-primary/50 hover:text-foreground'
                                        }`}
                                >
                                    <User className="w-4 h-4" />
                                    <span>{clientName}</span>
                                    {client.isDriver && (
                                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                                            Driver
                                        </span>
                                    )}
                                    {clientProviderCount > 0 && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                            {clientProviderCount} providers
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Current Client Info */}
            <div className="bg-muted/30 border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                        {currentClient?.firstName && currentClient?.lastName
                            ? `${currentClient.firstName} ${currentClient.lastName}`
                            : `Client ${selectedClientIndex + 1}`}
                        {currentClient?.isDriver && (
                            <span className="ml-2 text-sm px-2 py-1 bg-primary/10 text-primary rounded-full">
                                Driver
                            </span>
                        )}
                    </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                    Select the medical providers that {currentClient?.firstName || 'this client'} saw for treatment.
                </p>
            </div>

            {/* Error Message */}
            {hasError && (
                <div className="bg-destructive/10 border-2 border-destructive/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-destructive mb-1">
                                Please select at least one medical provider for each client
                            </h3>
                            <p className="text-sm text-destructive/90">{errors.medicalProviders}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {!hasError && hasSelection && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/10 dark:border-green-800">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-500" />
                        <p className="text-sm text-green-800 dark:text-green-300">
                            <strong>{selectedCount} provider(s) selected for {currentClient?.firstName || 'this client'}!</strong>
                            {totalProvidersSelected > selectedCount && (
                                <span className="ml-2">({totalProvidersSelected} total across all clients)</span>
                            )}
                        </p>
                    </div>
                </div>
            )}

            <div className="relative flex gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
                    <input
                        type="text"
                        placeholder="Search providers by name, city, type, or request method..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddProviderModal(true)}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-medium text-sm transition-colors whitespace-nowrap"
                    title="Add new medical provider"
                >
                    + Add Provider
                </button>
                <AddProviderModal
                    isOpen={showAddProviderModal}
                    onClose={() => setShowAddProviderModal(false)}
                    onSave={async (name, type, city, savePermanently, additionalData) => {
                        if (savePermanently) {
                            try {
                                // Save permanently to database using utility function
                                const { createMedicalProvider } = await import('@/lib/database');
                                const newProvider = await createMedicalProvider({
                                    name,
                                    type: type || 'Other',
                                    city: city || '',
                                    state: additionalData?.state || 'OK',
                                    street_address: additionalData?.streetAddress || null,
                                    street_address_2: additionalData?.streetAddress2 || null,
                                    zip_code: additionalData?.zipCode || null,
                                    phone_1_type: additionalData?.phones?.[0]?.type || null,
                                    phone_1: additionalData?.phones?.[0]?.number || null,
                                    phone_2_type: additionalData?.phones?.[1]?.type || null,
                                    phone_2: additionalData?.phones?.[1]?.number || null,
                                    phone_3_type: additionalData?.phones?.[2]?.type || null,
                                    phone_3: additionalData?.phones?.[2]?.number || null,
                                    fax_1_type: additionalData?.faxes?.[0]?.type || null,
                                    fax_1: additionalData?.faxes?.[0]?.number || null,
                                    fax_2_type: additionalData?.faxes?.[1]?.type || null,
                                    fax_2: additionalData?.faxes?.[1]?.number || null,
                                    fax_3_type: additionalData?.faxes?.[2]?.type || null,
                                    fax_3: additionalData?.faxes?.[2]?.number || null,
                                    email_1_type: additionalData?.emails?.[0]?.type || null,
                                    email_1: additionalData?.emails?.[0]?.address || null,
                                    email_2_type: additionalData?.emails?.[1]?.type || null,
                                    email_2: additionalData?.emails?.[1]?.address || null,
                                    notes: additionalData?.notes || null,
                                    request_method: 'Email'
                                });

                                if (newProvider) {
                                    // Refresh the entire providers list from database
                                    await loadProviders();
                                    // Auto-select for current client
                                    const updatedClients = [...data.clients];
                                    const currentSelected = currentClient?.selectedProviders || [];
                                    updatedClients[selectedClientIndex] = {
                                        ...updatedClients[selectedClientIndex],
                                        selectedProviders: [...currentSelected, newProvider.id]
                                    };
                                    onChange('clients', updatedClients);
                                }
                            } catch (err) {
                                console.error('Error adding provider:', err);
                                // Error handling will be done via parent component
                                console.error('Failed to add provider');
                            }
                        } else {
                            // Add temporarily with unique ID
                            const tempId = `temp-provider-${Date.now()}`;
                            const tempProvider = { id: tempId, name, type, city };
                            setTempProviders(prev => [...prev, tempProvider as any]);
                            // Auto-select for current client
                            const updatedClients = [...data.clients];
                            const currentSelected = currentClient?.selectedProviders || [];
                            updatedClients[selectedClientIndex] = {
                                ...updatedClients[selectedClientIndex],
                                selectedProviders: [...currentSelected, tempId as any]
                            };
                            onChange('clients', updatedClients);
                        }
                        setShowAddProviderModal(false);
                    }}
                />
            </div>

            <div className="text-sm text-muted-foreground">
                {selectedCount} provider(s) selected for {currentClient?.firstName || 'this client'} ({totalProvidersSelected} total across all clients)
            </div>

            <div className="space-y-4">
                {Object.entries(filteredGroupedProviders).map(([category, providerList]) => {
                    const isExpanded = expandedCategories.has(category);
                    const categorySelectedCount = providerList.filter((p) =>
                        selectedProviders.includes(p.id)
                    ).length;

                    return (
                        <div key={category} className="border border-border rounded-lg overflow-hidden">
                            <div className="bg-muted px-4 py-3 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className="flex-1 flex items-center justify-between text-left"
                                >
                                    <span className="font-semibold text-foreground">
                                        {category} ({providerList.length})
                                        {categorySelectedCount > 0 && (
                                            <span className="ml-2 text-sm text-primary">
                                                {categorySelectedCount} selected
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-muted-foreground">{isExpanded ? '▼' : '▶'}</span>
                                </button>
                                <div className="ml-4 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectAllInCategory(category)}
                                        className="text-xs text-primary hover:text-primary/80 px-2 py-1"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => deselectAllInCategory(category)}
                                        className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                                    >
                                        Deselect All
                                    </button>
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="p-4 space-y-2">
                                    {providerList.map((provider, idx) => (
                                        <label
                                            key={`provider-${provider.id}-${idx}`}
                                            className="flex items-center p-2 hover:bg-muted/50 rounded cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedProviders.includes(provider.id)}
                                                onChange={() => toggleProvider(provider.id)}
                                                className="mr-3 h-4 w-4 accent-primary border-input rounded"
                                            />
                                            <span className="flex-1 text-foreground">
                                                {provider.name} ({provider.city})
                                            </span>
                                            <span className="text-xs text-muted-foreground">{provider.request_method}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {Object.keys(filteredGroupedProviders).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No providers found matching your search.
                </div>
            )}

        </div>
    );
}
