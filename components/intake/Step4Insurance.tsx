import { useState } from 'react';
import { Plus } from 'lucide-react';
import ClientFormSection from './ClientFormSection';
import type { IntakeFormData, FormErrors, ClientFormData } from '@/types/intake';

interface Step4Props {
    data: IntakeFormData;
    errors: FormErrors;
    onChange: (field: keyof IntakeFormData, value: any) => void;
}

export default function Step4Insurance({ data, errors, onChange }: Step4Props) {
    // We reuse ClientFormSection in 'insurance_only' mode to display insurance fields for each client.

    const updateClient = (index: number, field: keyof ClientFormData | Partial<ClientFormData>, value?: any) => {
        const updatedClients = [...data.clients];
        if (typeof field === 'object') {
            updatedClients[index] = { ...updatedClients[index], ...field };
        } else {
            updatedClients[index] = { ...updatedClients[index], [field as string]: value };
        }
        onChange('clients', updatedClients);
    };

    const removeClient = (index: number) => {
        // We probably shouldn't allow removing clients in this step, as they were defined in Step 2.
        // But for completeness we can support it or just disable the remove button.
        // For now, we'll pass the handler but maybe Step 2 is where structure changes happen.
        const updatedClients = data.clients.filter((_, i) => i !== index);
        onChange('clients', updatedClients);
    };

    return (
        <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-foreground mb-1">Insurance Information</h3>
                <p className="text-sm text-muted-foreground">
                    Enter health and auto insurance details for each client.
                </p>
            </div>

            <div className="space-y-6">
                {data.clients.length === 0 ? (
                    <div className="text-center py-8 bg-muted/50 rounded-lg border border-border">
                        <p className="text-muted-foreground">No clients added. Please go back to Client Info step to add clients.</p>
                    </div>
                ) : (
                    data.clients.map((client, index) => (
                        <ClientFormSection
                            key={index}
                            client={client}
                            index={index}
                            totalClients={data.clients.length}
                            allClients={data.clients}
                            onChange={updateClient}
                            onRemove={removeClient}
                            errors={errors}
                            mode="insurance_only"
                        />
                    ))
                )}
            </div>

            {/* Note: We typically don't add new clients here, that's done in Step 2 */}
        </div>
    );
}
