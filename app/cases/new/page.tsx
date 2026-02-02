'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import Step1CaseInfo from '@/components/intake/Step1CaseInfo';
import Step2ClientInfo from '@/components/intake/Step2ClientInfo';
import Step3MedicalProviders from '@/components/intake/Step3MedicalProviders';
import Step4Insurance from '@/components/intake/Step4Insurance';
import Step5Defendant from '@/components/intake/Step5Defendant';
import ProgressBar from '@/components/intake/ProgressBar';
import { submitCase } from '@/lib/caseSubmission';
import { validateIntakeForm } from '@/lib/intakeValidation';
import type { IntakeFormData, FormErrors } from '@/types/intake';
import { v4 as uuidv4 } from 'uuid';

const initialData: IntakeFormData = {
    dateOfLoss: '',
    timeOfWreck: '',
    wreckType: '',
    wreckStreet: '',
    wreckCity: '',
    wreckCounty: '',
    wreckState: 'Oklahoma',
    isPoliceInvolved: false,
    policeForce: '',
    isPoliceReport: false,
    policeReportNumber: '',
    vehicleDescription: '',
    damageLevel: '',
    wreckDescription: '',
    signUpDate: new Date().toISOString().split('T')[0],
    clients: [],
    medicalProviders: [],
    defendants: []
};

export default function NewCasePage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<IntakeFormData>(initialData);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleDataChange = (field: keyof IntakeFormData | Partial<IntakeFormData>, value?: any) => {
        if (typeof field === 'string') {
            setFormData(prev => ({ ...prev, [field]: value }));
        } else {
            setFormData(prev => ({ ...prev, ...field }));
        }
        // Clear errors for modified fields (simplified)
        setErrors({});
    };

    const handleNext = () => {
        const stepErrors = validateIntakeForm(currentStep, formData);
        if (Object.keys(stepErrors).length > 0) {
            setErrors(stepErrors);
            // Scroll to top or first error
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (currentStep < 5) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const caseId = await submitCase(formData);
            router.push(`/cases/${caseId}`);
        } catch (error: any) {
            console.error('Error submitting case:', error);
            setSubmitError(error.message || 'Failed to submit case. Please try again.');
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1CaseInfo data={formData} errors={errors} onChange={(field, value) => handleDataChange(field, value)} />;
            case 2:
                return (
                    <Step2ClientInfo
                        data={formData}
                        errors={errors}
                        onChange={(data) => handleDataChange(data)}
                    />
                );
            case 3:
                return <Step3MedicalProviders data={formData} errors={errors} onChange={handleDataChange} />;
            case 4:
                return <Step4Insurance data={formData} errors={errors} onChange={handleDataChange} />;
            case 5:
                return <Step5Defendant data={formData} errors={errors} onChange={handleDataChange} />;
            default:
                return <div>Unknown Step</div>;
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="bg-card border-b border-border sticky top-0 z-10 px-4 py-3 sm:px-6 lg:px-8 shadow-sm">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">

                        <button
                            onClick={() => router.back()}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-xl font-semibold text-foreground">New Case Intake</h1>
                    </div>
                </div>
            </header >

            <main className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <ProgressBar currentStep={currentStep} totalSteps={5} />

                <div className="mt-8 bg-card rounded-xl shadow-sm border border-border p-6 sm:p-8">
                    {submitError && (
                        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
                            <span className="font-semibold">Error:</span> {submitError}
                        </div>
                    )}

                    {renderStep()}

                    <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={currentStep === 1 || isSubmitting}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors
                                ${currentStep === 1
                                    ? 'text-muted-foreground/50 cursor-not-allowed'
                                    : 'text-foreground hover:bg-muted border border-border'}`}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={handleNext}
                            disabled={isSubmitting}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-lg text-sm font-medium text-primary-foreground shadow-sm transition-all
                                ${isSubmitting
                                    ? 'bg-primary/70 cursor-wait'
                                    : 'bg-primary hover:bg-primary/90 hover:shadow-md active:transform active:scale-95'}`}
                        >
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Processing...
                                </span>
                            ) : currentStep === 5 ? (
                                <span className="flex items-center gap-2">
                                    Submit Case
                                    <CheckCircle className="w-4 h-4" />
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Next Step
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div >
    );
}
