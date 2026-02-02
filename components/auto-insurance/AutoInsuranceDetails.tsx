"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Save, X, Plus, Trash2, Users, MapPin, Phone, Mail, Printer } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import FormInput from "@/components/forms/FormInput";
import FormSelect from "@/components/forms/FormSelect";
import FormTextArea from "@/components/forms/FormTextArea";
import AdjusterModal from "@/components/forms/AdjusterModal";

interface AutoInsuranceDetailsProps {
    initialData: any;
    initialAdjusters: any[];
}

export default function AutoInsuranceDetails({ initialData, initialAdjusters }: AutoInsuranceDetailsProps) {
    const router = useRouter();
    const [insurance, setInsurance] = useState(initialData);
    const [adjusters, setAdjusters] = useState(initialAdjusters);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Filter logic states
    const [isAdjusterModalOpen, setIsAdjusterModalOpen] = useState(false);
    const [editingAdjuster, setEditingAdjuster] = useState<any | null>(null);

    const [formData, setFormData] = useState({
        name: insurance.name || '',
        request_method: insurance.request_method || 'Email',
        street_address: insurance.street_address || '',
        street_address_2: insurance.street_address_2 || '',
        city: insurance.city || '',
        state: insurance.state || 'OK',
        zip_code: insurance.zip_code || '',
        phone_1_type: insurance.phone_1_type || '',
        phone_1: insurance.phone_1 || insurance.phone || '',
        phone_2_type: insurance.phone_2_type || '',
        phone_2: insurance.phone_2 || '',
        fax_1_type: insurance.fax_1_type || '',
        fax_1: insurance.fax_1 || '',
        fax_2_type: insurance.fax_2_type || '',
        fax_2: insurance.fax_2 || '',
        email_1_type: insurance.email_1_type || '',
        email_1: insurance.email_1 || '',
        email_2_type: insurance.email_2_type || '',
        email_2: insurance.email_2 || '',
        notes: insurance.notes || ''
    });

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Provider name is required');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('auto_insurance')
                .update({
                    name: formData.name.trim(),
                    request_method: formData.request_method,
                    street_address: formData.street_address?.trim() || null,
                    street_address_2: formData.street_address_2?.trim() || null,
                    city: formData.city?.trim() || null,
                    state: formData.state?.trim() || null,
                    zip_code: formData.zip_code?.trim() || null,
                    phone_1_type: formData.phone_1_type || null,
                    phone_1: formData.phone_1?.trim() || null,
                    phone_2_type: formData.phone_2_type || null,
                    phone_2: formData.phone_2?.trim() || null,
                    fax_1_type: formData.fax_1_type || null,
                    fax_1: formData.fax_1?.trim() || null,
                    fax_2_type: formData.fax_2_type || null,
                    fax_2: formData.fax_2?.trim() || null,
                    email_1_type: formData.email_1_type || null,
                    email_1: formData.email_1?.trim() || null,
                    email_2_type: formData.email_2_type || null,
                    email_2: formData.email_2?.trim() || null,
                    notes: formData.notes?.trim() || null
                })
                .eq('id', insurance.id);

            if (error) throw error;

            setInsurance({ ...insurance, ...formData });
            setIsEditing(false);
            router.refresh();
        } catch (error: any) {
            console.error('Error updating auto insurance:', error);
            alert(`Failed to update: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            name: insurance.name || '',
            request_method: insurance.request_method || 'Email',
            street_address: insurance.street_address || '',
            street_address_2: insurance.street_address_2 || '',
            city: insurance.city || '',
            state: insurance.state || 'OK',
            zip_code: insurance.zip_code || '',
            phone_1_type: insurance.phone_1_type || '',
            phone_1: insurance.phone_1 || insurance.phone || '',
            phone_2_type: insurance.phone_2_type || '',
            phone_2: insurance.phone_2 || '',
            fax_1_type: insurance.fax_1_type || '',
            fax_1: insurance.fax_1 || '',
            fax_2_type: insurance.fax_2_type || '',
            fax_2: insurance.fax_2 || '',
            email_1_type: insurance.email_1_type || '',
            email_1: insurance.email_1 || '',
            email_2_type: insurance.email_2_type || '',
            email_2: insurance.email_2 || '',
            notes: insurance.notes || ''
        });
        setIsEditing(false);
    };

    // Adjuster Handlers

    const fetchAdjusters = async () => {
        const { data, error } = await supabase
            .from('auto_adjusters')
            .select('*')
            .eq('auto_insurance_id', insurance.id)
            .order('last_name', { ascending: true });

        if (!error && data) {
            setAdjusters(data);
        }
    };

    const handleAddAdjuster = () => {
        setEditingAdjuster(null);
        setIsAdjusterModalOpen(true);
    };

    const handleEditAdjuster = (adjuster: any) => {
        setEditingAdjuster(adjuster);
        setIsAdjusterModalOpen(true);
    };

    const handleDeleteAdjuster = async (adjusterId: number) => {
        if (!confirm('Are you sure you want to delete this adjuster?')) return;

        try {
            const { error } = await supabase
                .from('auto_adjusters')
                .delete()
                .eq('id', adjusterId);

            if (error) throw error;

            setAdjusters(prev => prev.filter(a => a.id !== adjusterId));
        } catch (error: any) {
            console.error('Error deleting adjuster:', error);
            alert('Failed to delete adjuster');
        }
    };

    const handleAdjusterSubmit = async (adjusterData: any) => {
        try {
            if (editingAdjuster) {
                const { error } = await supabase
                    .from('auto_adjusters')
                    .update(adjusterData)
                    .eq('id', editingAdjuster.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('auto_adjusters')
                    .insert([{ ...adjusterData, auto_insurance_id: insurance.id }]);
                if (error) throw error;
            }
            await fetchAdjusters();
        } catch (error: any) {
            console.error('Error saving adjuster:', error);
            throw error;
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <button
                        onClick={() => router.push('/auto-insurance')}
                        className="px-4 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to List
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className="px-4 py-2 border border-border hover:bg-muted rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {saving ? 'Saving...' : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Details
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Column - Details */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold text-lg">Provider Information</h3>
                        </div>
                        <div className="p-6">
                            {isEditing ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Company Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={(val) => handleChange('name', val)}
                                        required
                                    />
                                    <FormSelect
                                        label="Request Method"
                                        name="request_method"
                                        value={formData.request_method}
                                        onChange={(val) => handleChange('request_method', val)}
                                        options={[
                                            { label: 'Email', value: 'Email' },
                                            { label: 'Fax', value: 'Fax' }
                                        ]}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Company Name</label>
                                        <p className="text-lg font-medium text-foreground mt-1">{insurance.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Request Method</label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                ${insurance.request_method === 'Email' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                                                {insurance.request_method || 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold text-lg">Address Information</h3>
                        </div>
                        <div className="p-6">
                            {isEditing ? (
                                <div className="space-y-4">
                                    <FormInput
                                        label="Street Address"
                                        name="street_address"
                                        value={formData.street_address}
                                        onChange={(val) => handleChange('street_address', val)}
                                    />
                                    <FormInput
                                        label="Street Address 2"
                                        name="street_address_2"
                                        value={formData.street_address_2}
                                        onChange={(val) => handleChange('street_address_2', val)}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormInput
                                            label="City"
                                            name="city"
                                            value={formData.city}
                                            onChange={(val) => handleChange('city', val)}
                                        />
                                        <FormInput
                                            label="State"
                                            name="state"
                                            value={formData.state}
                                            onChange={(val) => handleChange('state', val)}
                                        />
                                        <FormInput
                                            label="Zip Code"
                                            name="zip_code"
                                            value={formData.zip_code}
                                            onChange={(val) => handleChange('zip_code', val)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-muted rounded-lg">
                                        <MapPin className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-foreground">
                                            {[insurance.street_address, insurance.street_address_2].filter(Boolean).join(', ')}
                                        </p>
                                        <p className="text-muted-foreground">
                                            {[insurance.city, insurance.state, insurance.zip_code].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold text-lg">Contact Information</h3>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Phones */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-2">Phone Numbers</h3>
                                {isEditing ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormSelect
                                                label="Phone 1 Type"
                                                name="phone_1_type"
                                                value={formData.phone_1_type}
                                                onChange={(val) => handleChange('phone_1_type', val)}
                                                options={[
                                                    { label: 'General', value: 'General' },
                                                    { label: 'Claims', value: 'Claims' }
                                                ]}
                                            />
                                            <FormInput
                                                label="Phone 1 Number"
                                                name="phone_1"
                                                value={formData.phone_1}
                                                onChange={(val) => handleChange('phone_1', val)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormSelect
                                                label="Phone 2 Type"
                                                name="phone_2_type"
                                                value={formData.phone_2_type}
                                                onChange={(val) => handleChange('phone_2_type', val)}
                                                options={[
                                                    { label: 'General', value: 'General' },
                                                    { label: 'Claims', value: 'Claims' }
                                                ]}
                                            />
                                            <FormInput
                                                label="Phone 2 Number"
                                                name="phone_2"
                                                value={formData.phone_2}
                                                onChange={(val) => handleChange('phone_2', val)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        {(insurance.phone_1 || insurance.phone) && (
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-foreground font-medium">{insurance.phone_1 || insurance.phone}</span>
                                                    {insurance.phone_1_type && (
                                                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{insurance.phone_1_type}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {insurance.phone_2 && (
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-foreground font-medium">{insurance.phone_2}</span>
                                                    {insurance.phone_2_type && (
                                                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{insurance.phone_2_type}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Faxes */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-2">Fax Numbers</h3>
                                {isEditing ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormSelect
                                                label="Fax 1 Type"
                                                name="fax_1_type"
                                                value={formData.fax_1_type}
                                                onChange={(val) => handleChange('fax_1_type', val)}
                                                options={[
                                                    { label: 'General', value: 'General' },
                                                    { label: 'Claims', value: 'Claims' }
                                                ]}
                                            />
                                            <FormInput
                                                label="Fax 1 Number"
                                                name="fax_1"
                                                value={formData.fax_1}
                                                onChange={(val) => handleChange('fax_1', val)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormSelect
                                                label="Fax 2 Type"
                                                name="fax_2_type"
                                                value={formData.fax_2_type}
                                                onChange={(val) => handleChange('fax_2_type', val)}
                                                options={[
                                                    { label: 'General', value: 'General' },
                                                    { label: 'Claims', value: 'Claims' }
                                                ]}
                                            />
                                            <FormInput
                                                label="Fax 2 Number"
                                                name="fax_2"
                                                value={formData.fax_2}
                                                onChange={(val) => handleChange('fax_2', val)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        {insurance.fax_1 && (
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Printer className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-foreground font-medium">{insurance.fax_1}</span>
                                                    {insurance.fax_1_type && (
                                                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{insurance.fax_1_type}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {insurance.fax_2 && (
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Printer className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-foreground font-medium">{insurance.fax_2}</span>
                                                    {insurance.fax_2_type && (
                                                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{insurance.fax_2_type}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Emails */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-muted-foreground border-b border-border pb-2">Email Addresses</h3>
                                {isEditing ? (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormSelect
                                                label="Email 1 Type"
                                                name="email_1_type"
                                                value={formData.email_1_type}
                                                onChange={(val) => handleChange('email_1_type', val)}
                                                options={[
                                                    { label: 'General', value: 'General' },
                                                    { label: 'Claims', value: 'Claims' }
                                                ]}
                                            />
                                            <FormInput
                                                label="Email 1 Address"
                                                name="email_1"
                                                value={formData.email_1}
                                                onChange={(val) => handleChange('email_1', val)}
                                                type="email"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormSelect
                                                label="Email 2 Type"
                                                name="email_2_type"
                                                value={formData.email_2_type}
                                                onChange={(val) => handleChange('email_2_type', val)}
                                                options={[
                                                    { label: 'General', value: 'General' },
                                                    { label: 'Claims', value: 'Claims' }
                                                ]}
                                            />
                                            <FormInput
                                                label="Email 2 Address"
                                                name="email_2"
                                                value={formData.email_2}
                                                onChange={(val) => handleChange('email_2', val)}
                                                type="email"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        {insurance.email_1 && (
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-foreground font-medium">{insurance.email_1}</span>
                                                    {insurance.email_1_type && (
                                                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{insurance.email_1_type}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {insurance.email_2 && (
                                            <div className="flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-foreground font-medium">{insurance.email_2}</span>
                                                    {insurance.email_2_type && (
                                                        <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{insurance.email_2_type}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="font-semibold text-lg">Notes</h3>
                        </div>
                        <div className="p-6">
                            {isEditing ? (
                                <FormTextArea
                                    label="Internal Notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={(val) => handleChange('notes', val)}
                                    rows={4}
                                />
                            ) : (
                                <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                                    {insurance.notes || 'No notes available.'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Adjusters */}
                <div className="space-y-6">
                    <div className="h-full rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-border flex flex-row items-center justify-between">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Adjusters <span className="text-sm font-normal text-muted-foreground">({adjusters.length})</span>
                            </h3>
                            <button
                                onClick={handleAddAdjuster}
                                className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add
                            </button>
                        </div>
                        <div className="p-6 flex-1">
                            {adjusters.length > 0 ? (
                                <div className="space-y-4">
                                    {adjusters.map((adjuster) => (
                                        <div
                                            key={adjuster.id}
                                            className="group relative border border-border rounded-lg p-4 bg-muted/20 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditAdjuster(adjuster)}
                                                    className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-blue-500 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAdjuster(adjuster.id)}
                                                    className="p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <h4 className="font-semibold text-foreground mb-1">
                                                {[adjuster.first_name, adjuster.month, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster'}
                                            </h4>

                                            <div className="space-y-1.5 mt-2">
                                                {adjuster.email && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {adjuster.email}
                                                    </div>
                                                )}
                                                {adjuster.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone className="w-3.5 h-3.5" />
                                                        {adjuster.phone}
                                                    </div>
                                                )}
                                                {/* Fallback for address display */}
                                                {(adjuster.street_address || adjuster.city || adjuster.state) && (
                                                    <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2 pt-2 border-t border-border/50">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                        <span>
                                                            {[adjuster.street_address, adjuster.city, adjuster.state, adjuster.zip_code]
                                                                .filter(Boolean)
                                                                .join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed border-border/50">
                                    <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                    <p className="font-medium">No adjusters yet</p>
                                    <p className="text-sm opacity-70 mb-4">Add adjusters to this insurance provider</p>
                                    <button
                                        onClick={handleAddAdjuster}
                                        className="px-4 py-2 bg-background border border-border hover:bg-muted rounded-md text-sm font-medium transition-colors"
                                    >
                                        Add First Adjuster
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AdjusterModal
                isOpen={isAdjusterModalOpen}
                onClose={() => setIsAdjusterModalOpen(false)}
                onSubmit={handleAdjusterSubmit}
                initialData={editingAdjuster}
            />
        </div>
    );
}
