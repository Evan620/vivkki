import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import ProgressBar from '../components/intake/ProgressBar';
import Step1CaseInfo from '../components/intake/Step1CaseInfo';
import Step2ClientInfo from '../components/intake/Step2ClientInfo';
import Step3MedicalProviders from '../components/intake/Step3MedicalProviders';
import Step4Insurance from '../components/intake/Step4Insurance';
import Step5Defendant from '../components/intake/Step5Defendant';
import Step6Review from '../components/intake/Step6Review';
import { submitCase } from '../utils/caseSubmission';
import {
  validateRequired,
  validateDateNotFuture,
  validateEmail,
  validatePhone,
  validateZipCode,
  validateSSN
} from '../utils/validation';
import type { IntakeFormData, FormErrors } from '../types/intake';
import { useConfirmDialog } from '../hooks/useConfirmDialog.tsx';

const INITIAL_FORM_DATA: IntakeFormData = {
  // Case information
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
  signUpDate: new Date().toISOString().split('T')[0], // Today's date

  // Multiple clients - start with one empty client
  clients: [{
    isDriver: true,
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    ssn: '',
    maritalStatus: '',
    streetAddress: '',
    city: '',
    state: 'Oklahoma',
    zipCode: '',
    primaryPhone: '',
    secondaryPhone: '',
    email: '',
    referrer: '',
    referrerRelationship: '',
    injuryDescription: '',
    priorAccidents: '',
    priorInjuries: '',
    workImpact: '',
    // Health insurance (per client)
    hasHealthInsurance: false,
    healthInsuranceId: 0,
    healthMemberId: '',
    // Auto insurance (per client/passenger)
    hasAutoInsurance: false,
    autoInsuranceId: 0,
    autoPolicyNumber: '',
    autoClaimNumber: '',
    hasMedpay: false,
    medpayAmount: '',
    hasUmCoverage: false,
    umAmount: '',
    // Medical providers (per client)
    selectedProviders: [],
    // Client relationship fields
    relationshipToPrimary: '',
    usesPrimaryAddress: false,
    usesPrimaryPhone: false
  }],

  // Medical providers catalog (for selection)
  medicalProviders: [],

  // Multiple defendants - start with one empty defendant
  defendants: [{
    firstName: '',
    lastName: '',
    isPolicyholder: true,
    policyholderFirstName: '',
    policyholderLastName: '',
    autoInsuranceId: 0,
    policyNumber: '',
    claimNumber: '', // Add claim number field
    liabilityPercentage: 100,
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
  }]
};

export default function Intake() {
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  // Load saved form data from localStorage
  const loadSavedData = (): IntakeFormData | null => {
    try {
      const saved = localStorage.getItem('intake_form_data');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load saved intake data:', e);
    }
    return null;
  };

  const savedData = loadSavedData();
  const [currentStep, setCurrentStep] = useState(savedData ? (parseInt(localStorage.getItem('intake_form_step') || '1')) : 1);
  const [formData, setFormData] = useState<IntakeFormData>(savedData || INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Auto-save form data to localStorage
  useEffect(() => {
    localStorage.setItem('intake_form_data', JSON.stringify(formData));
    localStorage.setItem('intake_form_step', currentStep.toString());
  }, [formData, currentStep]);

  // Clear saved data on successful submission
  useEffect(() => {
    if (submitSuccess) {
      localStorage.removeItem('intake_form_data');
      localStorage.removeItem('intake_form_step');
    }
  }, [submitSuccess]);
  const navigate = useNavigate();

  const handleChange = (field: keyof IntakeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    const dateError = validateDateNotFuture(formData.dateOfLoss);
    if (dateError) newErrors.dateOfLoss = dateError;

    const wreckTypeError = validateRequired(formData.wreckType, 'Accident type');
    if (wreckTypeError) newErrors.wreckType = wreckTypeError;

    const streetError = validateRequired(formData.wreckStreet, 'Wreck street');
    if (streetError) newErrors.wreckStreet = streetError;

    const cityError = validateRequired(formData.wreckCity, 'City');
    if (cityError) newErrors.wreckCity = cityError;

    const countyError = validateRequired(formData.wreckCounty, 'County');
    if (countyError) newErrors.wreckCounty = countyError;

    const stateError = validateRequired(formData.wreckState, 'State');
    if (stateError) newErrors.wreckState = stateError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {};

    console.log('🔍 validateStep2 called');
    console.log('📊 formData.clients:', formData.clients);

    // Validate that we have at least one client
    if (!formData.clients || formData.clients.length === 0) {
      newErrors.clients = 'At least one client is required';
      setErrors(newErrors);
      return false;
    }

    // Validate each client
    formData.clients.forEach((client, index) => {
      console.log(`🔍 Validating client ${index}:`, {
        firstName: client.firstName,
        lastName: client.lastName,
        isDriver: client.isDriver
      });

      const firstNameError = validateRequired(client.firstName, 'First name');
      if (firstNameError) newErrors[`clients.${index}.firstName`] = firstNameError;

      const lastNameError = validateRequired(client.lastName, 'Last name');
      if (lastNameError) newErrors[`clients.${index}.lastName`] = lastNameError;

      const dobError = validateRequired(client.dateOfBirth, 'Date of birth');
      if (dobError) newErrors[`clients.${index}.dateOfBirth`] = dobError;

      if (client.ssn) {
        const ssnError = validateSSN(client.ssn);
        if (ssnError) newErrors[`clients.${index}.ssn`] = ssnError;
      }

      const addressError = validateRequired(client.streetAddress, 'Street address');
      if (addressError) newErrors[`clients.${index}.streetAddress`] = addressError;

      const cityError = validateRequired(client.city, 'City');
      if (cityError) newErrors[`clients.${index}.city`] = cityError;

      const stateError = validateRequired(client.state, 'State');
      if (stateError) newErrors[`clients.${index}.state`] = stateError;

      const zipError = validateZipCode(client.zipCode);
      if (zipError) newErrors[`clients.${index}.zipCode`] = zipError;

      const phoneError = validatePhone(client.primaryPhone);
      if (phoneError) newErrors[`clients.${index}.primaryPhone`] = phoneError;

      const emailError = validateEmail(client.email);
      if (emailError) newErrors[`clients.${index}.email`] = emailError;

      // Health insurance and member ID are optional even if hasHealthInsurance is checked
      // No validation needed - both are optional

      // Auto insurance is optional - if hasAutoInsurance is checked, insurance company is optional
      // Policy number and claim number are both optional
    });

    console.log('❌ Validation errors:', newErrors);
    console.log('✅ Is valid?', Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: FormErrors = {};

    console.log('🔍 validateStep3 called');
    console.log('📊 clients:', formData.clients);

    // Medical providers are optional - no validation required
    const totalProviders = formData.clients.reduce((sum, client) => sum + (client.selectedProviders?.length || 0), 0);
    console.log('✅ Total providers selected:', totalProviders);

    console.log('❌ Validation errors:', newErrors);
    console.log('✅ Is valid?', Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    // Step 4 is now Defendants (was Step 5)
    return validateStep5();
  };

  const validateStep5 = (): boolean => {
    const newErrors: FormErrors = {};

    console.log('🔍 validateStep5 called');
    console.log('📊 formData.defendants:', formData.defendants);

    // Validate that we have at least one defendant
    if (!formData.defendants || formData.defendants.length === 0) {
      newErrors.defendants = 'At least one defendant is required';
      console.log('❌ No defendants');
      setErrors(newErrors);
      return false;
    }

    // Validate liability percentages add up to 100%
    const totalLiability = formData.defendants.reduce((sum, defendant) => sum + (defendant.liabilityPercentage || 0), 0);
    console.log('📊 Total liability:', totalLiability);
    
    if (totalLiability !== 100) {
      newErrors.liability = 'Defendant liability percentages must total exactly 100%';
      console.log('❌ Liability does not total 100%');
    }

    // Validate each defendant
    formData.defendants.forEach((defendant, index) => {
      console.log(`🔍 Validating defendant ${index}:`, {
        firstName: defendant.firstName,
        lastName: defendant.lastName,
        autoInsuranceId: defendant.autoInsuranceId,
        policyNumber: defendant.policyNumber
      });

      const firstNameError = validateRequired(defendant.firstName, 'Defendant first name');
      if (firstNameError) newErrors[`defendants.${index}.firstName`] = firstNameError;

      const lastNameError = validateRequired(defendant.lastName, 'Defendant last name');
      if (lastNameError) newErrors[`defendants.${index}.lastName`] = lastNameError;

      if (!defendant.isPolicyholder) {
        const policyholderFirstNameError = validateRequired(defendant.policyholderFirstName, 'Policyholder first name');
        if (policyholderFirstNameError) newErrors[`defendants.${index}.policyholderFirstName`] = policyholderFirstNameError;

        const policyholderLastNameError = validateRequired(defendant.policyholderLastName, 'Policyholder last name');
        if (policyholderLastNameError) newErrors[`defendants.${index}.policyholderLastName`] = policyholderLastNameError;
      }

      // Auto insurance, policy number, and claim number are all optional
      // No validation required

      // Adjuster information is optional - no validation required
    });

    console.log('❌ Validation errors:', newErrors);
    console.log('✅ Is valid?', Object.keys(newErrors).length === 0);

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    let isValid = false;

    console.log('🚀 handleNext called for step:', currentStep);
    console.log('📋 Current formData:', JSON.stringify(formData, null, 2));

    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    } else if (currentStep === 4) {
      isValid = validateStep4();
    } else if (currentStep === 5) {
      isValid = validateStep5();
    } else {
      isValid = true;
    }

    console.log('✅ Validation result:', isValid);

    if (isValid) {
      if (currentStep < 5) {
        console.log('➡️ Moving to step:', currentStep + 1);
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      }
    } else {
      console.log('❌ Validation failed, staying on step:', currentStep);
    }
  };

  const generateIntakeJSON = (formData: IntakeFormData, casefileId: number) => {
    const payload = {
      casefile_id: casefileId,
      ...formData,
      submitted_at: new Date().toISOString()
    };
    
    const jsonString = JSON.stringify(payload, null, 2);
    
    // Log to console for debugging
    console.log('📋 Complete Intake Form JSON:', jsonString);
    
    return payload;
  };

  const sendToWebhook = async (payload: any) => {
    try {
      const webhookUrl = import.meta.env.VITE_INTAKE_WEBHOOK_URL;
      
      if (!webhookUrl) {
        console.warn('⚠️ Intake webhook URL not configured. Skipping webhook call.');
        return { success: false, message: 'Webhook URL not configured' };
      }
      
      console.log('📤 Sending intake form data to webhook...');
      console.log('🔗 Webhook URL:', webhookUrl);
      console.log('📦 Payload being sent:', JSON.stringify(payload, null, 2));
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response status text:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Webhook error response:', errorText);
        throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json().catch(() => ({ success: true }));
      console.log('✅ Webhook data sent successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('⚠️ Webhook error (non-blocking):', error);
      // Don't block form submission if webhook fails
      throw error; // Re-throw so we can show it to user but not block
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Step 1: Store data in database
      console.log('💾 Storing intake form data in database...');
      const casefileId = await submitCase(formData);
      console.log('✅ Data stored successfully. Casefile ID:', casefileId);
      
      // Step 2: Generate complete JSON for webhook
      console.log('📋 Generating complete intake form JSON...');
      const payload = generateIntakeJSON(formData, casefileId);
      console.log('✅ JSON generated');
      
      // Step 3: Send to webhook (non-blocking)
      try {
        await sendToWebhook(payload);
        console.log('✅ Webhook data sent successfully');
      } catch (webhookError) {
        console.warn('⚠️ Webhook failed but data was saved:', webhookError);
        // Show warning but don't block success
        setSubmitError('Data saved successfully, but webhook failed. JSON has been downloaded.');
      }
      
      setSubmitSuccess(true);

      setTimeout(() => {
        navigate(`/case/${casefileId}`);
      }, 3000); // Give user time to see success message and download
    } catch (error) {
      console.error('❌ Error submitting case:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create case');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirm(
      'Are you sure you want to cancel? All progress will be lost.',
      { title: 'Cancel Intake', variant: 'warning' }
    );
    if (confirmed) {
      navigate('/dashboard');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Case Intake</h1>
          <p className="text-gray-600 mb-6">
            Complete all required fields to create a new case file
          </p>

          <ProgressBar currentStep={currentStep} totalSteps={5} />

          {submitSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <CheckCircle className="text-green-600 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-gray-900">Case Created Successfully!</h3>
                <p className="text-sm text-gray-600">Redirecting to case details...</p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleNext();
            }}
          >
            {currentStep === 1 && (
              <Step1CaseInfo data={formData} errors={errors} onChange={handleChange} />
            )}

            {currentStep === 2 && (
              <Step2ClientInfo data={formData} errors={errors} onChange={handleChange} />
            )}

            {currentStep === 3 && (
              <Step3MedicalProviders data={formData} errors={errors} onChange={handleChange} />
            )}

            {currentStep === 4 && (
              <Step5Defendant data={formData} errors={errors} onChange={handleChange} />
            )}

            {currentStep === 5 && (
              <Step6Review data={formData} onEdit={setCurrentStep} />
            )}

            <div className="mt-8 flex justify-between border-t pt-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft size={20} className="mr-2" />
                    Back
                  </button>
                )}
              </div>

              {currentStep < 5 && (
                <button
                  type="submit"
                  className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Next
                  <ArrowRight size={20} className="ml-2" />
                </button>
              )}

              {currentStep === 5 && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Case'}
                  {!isSubmitting && <CheckCircle size={20} className="ml-2" />}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      {ConfirmDialog}
    </Layout>
  );
}
