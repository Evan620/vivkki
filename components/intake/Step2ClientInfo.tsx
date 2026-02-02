import { Plus } from 'lucide-react';
import type { IntakeFormData, ClientFormData } from '@/types/intake';
import ClientFormSection from './ClientFormSection';
import { v4 as uuidv4 } from 'uuid';

interface Step2Props {
    data: IntakeFormData;
    errors: Record<string, string>;
    onChange: (data: Partial<IntakeFormData>) => void;
}

export default function Step2ClientInfo({ data, errors, onChange }: Step2Props) {
    const handleClientChange = (index: number, field: keyof ClientFormData | Partial<ClientFormData>, value?: any) => {
        const updatedClients = [...data.clients];

        if (typeof field === 'string') {
            updatedClients[index] = { ...updatedClients[index], [field]: value };
        } else {
            updatedClients[index] = { ...updatedClients[index], ...field };
        }

        onChange({ clients: updatedClients });
    };

    const addClient = () => {
        const newClient: ClientFormData = {
            id: uuidv4(), // Use UUID for temporary unique ID
            isDriver: false, // Default to false, handled by logic to ensure one driver
            relationshipToPrimary: '',
            firstName: '',
            middleName: '',
            lastName: '',
            dateOfBirth: '',
            ssn: '', // Optional
            streetAddress: '',
            city: '',
            state: 'Oklahoma',
            zipCode: '',
            primaryPhone: '',
            secondaryPhone: '',
            email: '',
            maritalStatus: '', // Optional
            referrer: '', // Optional
            referrerRelationship: '', // Optional
            injuryDescription: '', // Optional
            priorAccidents: '', // Optional
            priorInjuries: '', // Optional
            workImpact: '', // Optional
            hasHealthInsurance: false,
            healthInsuranceId: 0,
            healthMemberId: '',
            healthAdjusterId: undefined, // Add property
            healthAdjusterInfo: undefined, // Add property
            hasAutoInsurance: false,
            autoInsuranceId: 0,
            autoPolicyNumber: '',
            autoClaimNumber: '', // Add property
            autoAdjusterId: undefined, // Add property
            autoAdjusterInfo: undefined, // Add property
            hasMedpay: false,
            medpayAmount: '',
            hasUmCoverage: false,
            umAmount: '',
            usesPrimaryAddress: false, // Default to false
            usesPrimaryPhone: false, // Default to false
            selectedProviders: [] // Initialize empty array
        };

        // If this is the first client being added, make them the driver
        if (data.clients.length === 0) {
            newClient.isDriver = true;
        }

        onChange({ clients: [...data.clients, newClient] });
    };

    const removeClient = (index: number) => {
        const updatedClients = data.clients.filter((_, i) => i !== index);

        // If we removed the driver, default the first remaining client to be the driver
        if (updatedClients.length > 0) {
            const hasDriver = updatedClients.some(c => c.isDriver);
            if (!hasDriver) {
                updatedClients[0] = { ...updatedClients[0], isDriver: true };
            }
        }

        onChange({ clients: updatedClients });
    };

    return (
        <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-semibold text-primary mb-1">Instructions</h3>
                <p className="text-sm text-foreground/80">
                    Please add all clients involved in this case. The first client is typically the driver or primary contact.
                    You can add passengers or other involved parties by clicking "Add Another Client".
                </p>
            </div>

            <div className="space-y-6">
                {data.clients.map((client, index) => (
                    <ClientFormSection
                        key={client.id || index}
                        client={client}
                        index={index}
                        totalClients={data.clients.length}
                        allClients={data.clients}
                        onChange={handleClientChange}
                        onRemove={removeClient}
                        errors={errors}
                        mode="contact_only"
                    />
                ))}
            </div>

            <button
                type="button"
                onClick={addClient}
                className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground font-medium hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
            >
                <Plus className="w-5 h-5" />
                Add Another Client
            </button>
        </div>
    );
}
