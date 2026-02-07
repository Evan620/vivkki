"use client";

import { useState, useEffect } from "react";
import { X, Save, Car, MapPin, Shield, FileText } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface AccidentDetails {
    timeOfWreck: string | null;
    wreckType: string | null;
    wreckStreet: string | null;
    wreckCity: string | null;
    wreckCounty: string | null;
    wreckState: string | null;
    isPoliceInvolved: boolean | null;
    policeForce: string | null;
    isPoliceReport: boolean | null;
    policeReportNumber: string | null;
    vehicleDescription: string | null;
    damageLevel: string | null;
    wreckDescription: string | null;
}

interface EditAccidentModalProps {
    isOpen: boolean;
    onClose: () => void;
    accidentDetails: AccidentDetails | null;
    casefileId: string;
    onUpdate: () => void;
    onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function EditAccidentModal({
    isOpen,
    onClose,
    accidentDetails,
    casefileId,
    onUpdate,
    onShowToast
}: EditAccidentModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        time_of_wreck: "",
        wreck_type: "",
        wreck_street: "",
        wreck_city: "",
        wreck_county: "",
        wreck_state: "",
        is_police_involved: false,
        police_force: "",
        is_police_report: false,
        police_report_number: "",
        vehicle_description: "",
        damage_level: "",
        wreck_description: ""
    });

    useEffect(() => {
        if (isOpen && accidentDetails) {
            setFormData({
                time_of_wreck: accidentDetails.timeOfWreck || "",
                wreck_type: accidentDetails.wreckType || "",
                wreck_street: accidentDetails.wreckStreet || "",
                wreck_city: accidentDetails.wreckCity || "",
                wreck_county: accidentDetails.wreckCounty || "",
                wreck_state: accidentDetails.wreckState || "",
                is_police_involved: accidentDetails.isPoliceInvolved || false,
                police_force: accidentDetails.policeForce || "",
                is_police_report: accidentDetails.isPoliceReport || false,
                police_report_number: accidentDetails.policeReportNumber || "",
                vehicle_description: accidentDetails.vehicleDescription || "",
                damage_level: accidentDetails.damageLevel || "",
                wreck_description: accidentDetails.wreckDescription || ""
            });
        }
    }, [isOpen, accidentDetails]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                time_of_wreck: formData.time_of_wreck || null,
                wreck_type: formData.wreck_type || null,
                wreck_street: formData.wreck_street || null,
                wreck_city: formData.wreck_city || null,
                wreck_county: formData.wreck_county || null,
                wreck_state: formData.wreck_state || null,
                is_police_involved: formData.is_police_involved,
                police_force: formData.police_force || null,
                is_police_report: formData.is_police_report,
                police_report_number: formData.police_report_number || null,
                vehicle_description: formData.vehicle_description || null,
                damage_level: formData.damage_level || null,
                wreck_description: formData.wreck_description || null
            };

            const { error } = await supabase
                .from('casefiles')
                .update(payload)
                .eq('id', casefileId);

            if (error) throw error;

            if (onShowToast) onShowToast('Accident details updated', 'success');
            onUpdate();
            onClose();
        } catch (error: any) {
            console.error('Error saving accident details:', error);
            if (onShowToast) onShowToast(error.message || 'Failed to save', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-border">
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Car className="w-6 h-6" />
                        Edit Accident Details
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Time & Location */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            Time & Location
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Time of Wreck</label>
                                <input
                                    type="time"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.time_of_wreck}
                                    onChange={e => setFormData({ ...formData, time_of_wreck: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Wreck Type</label>
                                <select
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.wreck_type}
                                    onChange={e => setFormData({ ...formData, wreck_type: e.target.value })}
                                >
                                    <option value="">Select Type</option>
                                    <option value="Rear-end">Rear-end</option>
                                    <option value="Head-on">Head-on</option>
                                    <option value="Side-impact">Side-impact</option>
                                    <option value="Rollover">Rollover</option>
                                    <option value="T-bone">T-bone</option>
                                    <option value="Sideswipe">Sideswipe</option>
                                    <option value="Hit and run">Hit and run</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">Damage Level</label>
                                <select
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.damage_level}
                                    onChange={e => setFormData({ ...formData, damage_level: e.target.value })}
                                >
                                    <option value="">Select Level</option>
                                    <option value="Minor">Minor</option>
                                    <option value="Moderate">Moderate</option>
                                    <option value="Severe">Severe</option>
                                    <option value="Total">Total Loss</option>
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-2">Street Address</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="123 Main St"
                                    value={formData.wreck_street}
                                    onChange={e => setFormData({ ...formData, wreck_street: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={formData.wreck_city}
                                    onChange={e => setFormData({ ...formData, wreck_city: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">State</label>
                                <input
                                    type="text"
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="ST"
                                    maxLength={2}
                                    value={formData.wreck_state}
                                    onChange={e => setFormData({ ...formData, wreck_state: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">County</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                value={formData.wreck_county}
                                onChange={e => setFormData({ ...formData, wreck_county: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Vehicle & Description */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                            <Car className="w-5 h-5 text-green-600" />
                            Vehicle & Description
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Vehicle Description</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g., 2020 Toyota Camry, Silver"
                                value={formData.vehicle_description}
                                onChange={e => setFormData({ ...formData, vehicle_description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Wreck Description</label>
                            <textarea
                                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
                                placeholder="Describe what happened..."
                                value={formData.wreck_description}
                                onChange={e => setFormData({ ...formData, wreck_description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Police Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2 text-foreground">
                            <Shield className="w-5 h-5 text-purple-600" />
                            Police Information
                        </h3>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_police_involved}
                                    onChange={e => setFormData({ ...formData, is_police_involved: e.target.checked })}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-foreground">Police Involved</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_police_report}
                                    onChange={e => setFormData({ ...formData, is_police_report: e.target.checked })}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-foreground">Police Report Filed</span>
                            </label>
                        </div>
                        {formData.is_police_involved && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Police Force</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="e.g., Texas State Police"
                                        value={formData.police_force}
                                        onChange={e => setFormData({ ...formData, police_force: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">Report Number</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Report #"
                                        value={formData.police_report_number}
                                        onChange={e => setFormData({ ...formData, police_report_number: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
