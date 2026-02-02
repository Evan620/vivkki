import { useState, useEffect } from 'react';
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchAutoInsurers } from '@/lib/database';
import DefendantFormSection from './DefendantFormSection';
import type { IntakeFormData, FormErrors, AutoInsurance, DefendantFormData } from '@/types/intake';
import { v4 as uuidv4 } from 'uuid';

interface Step5Props {
    data: IntakeFormData;
    errors: FormErrors;
    onChange: (field: keyof IntakeFormData, value: any) => void;
}

const emptyDefendant: DefendantFormData = {
    id: '',
    firstName: '',
    lastName: '',
    liabilityPercentage: 0,
    isPolicyholder: true,
    policyholderFirstName: '',
    policyholderLastName: '',
    autoInsuranceId: 0,
    policyNumber: '',
    claimNumber: '',
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
};

export default function Step5Defendant({ data, errors, onChange }: Step5Props) {
    const [autoInsuranceCompanies, setAutoInsuranceCompanies] = useState<AutoInsurance[]>([]);
    const [loading, setLoading] = useState(true);

    const loadInsuranceCompanies = async () => {
        try {
            // Use database utility function to fetch auto insurance companies
            const companies = await fetchAutoInsurers();

            // Deduplicate by ID
            const uniqueCompanies = (companies || []).filter((c, index, self) =>
                index === self.findIndex(item => item.id === c.id)
            );

            setAutoInsuranceCompanies(uniqueCompanies);
        } catch (error) {
            console.error('Error loading insurance companies:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInsuranceCompanies();
    }, []);

    const addDefendant = () => {
        // If it's the first defendant, default liability to 100
        const liability = data.defendants.length === 0 ? 100 : 0;

        const newDefendant = {
            ...emptyDefendant,
            id: uuidv4(),
            liabilityPercentage: liability
        };

        onChange('defendants', [...data.defendants, newDefendant]);
    };

    const removeDefendant = (index: number) => {
        const updatedDefendants = data.defendants.filter((_, i) => i !== index);
        onChange('defendants', updatedDefendants);
    };

    const updateDefendant = (index: number, field: keyof DefendantFormData, value: any) => {
        const updatedDefendants = [...data.defendants];
        updatedDefendants[index] = {
            ...updatedDefendants[index],
            [field]: value
        };
        onChange('defendants', updatedDefendants);
    };

    // Calculate total liability
    const totalLiability = data.defendants.reduce((sum, def) => sum + (def.liabilityPercentage || 0), 0);
    const isLiabilityValid = totalLiability === 100;

    if (loading) {
        return <div className="text-center py-8">Loading insurance companies...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-foreground mb-1">Defendant Information</h3>
                <p className="text-sm text-muted-foreground">
                    Enter details for all defendants involved in this case. Total liability must equal 100%.
                </p>
            </div>

            <div className="space-y-6">
                {data.defendants.map((defendant, index) => (
                    <DefendantFormSection
                        key={defendant.id || index}
                        defendant={defendant}
                        index={index}
                        totalDefendants={data.defendants.length}
                        allDefendants={data.defendants}
                        onChange={updateDefendant}
                        onRemove={removeDefendant}
                        errors={errors}
                        totalLiability={totalLiability}
                        autoInsuranceCompanies={autoInsuranceCompanies}
                        onRefreshInsurance={loadInsuranceCompanies}
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={addDefendant}
                className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 font-medium"
            >
                <Plus className="w-5 h-5" />
                Add Another Defendant
            </button>

            {/* Liability Validation Message */}
            <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${isLiabilityValid
                ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/10 dark:text-green-300 dark:border-green-800'
                : 'bg-destructive/10 border border-destructive/20 text-destructive'
                }`}>
                {isLiabilityValid ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <div className="flex-1">
                    <p className="font-medium">
                        Total Liability: {totalLiability}%
                    </p>
                    {!isLiabilityValid && (
                        <p className="text-sm mt-1">
                            Total liability percentage across all defendants must equal 100%.
                        </p>
                    )}
                </div>
            </div>

            {errors.defendants && typeof errors.defendants === 'string' && (
                <p className="text-sm text-destructive mt-2">{errors.defendants}</p>
            )}
        </div>
    );
}
