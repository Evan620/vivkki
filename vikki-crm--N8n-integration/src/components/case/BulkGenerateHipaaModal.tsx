import { useState } from 'react';
import { X, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { supabase } from '../../utils/database';
import { getRecipientEmail } from '../../utils/documentRecipientEmail';

interface BulkGenerateHipaaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProviders: number[];
  medicalBills: any[];
  clientData: any;
  casefileId: number;
  onSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

interface GenerationStatus {
  providerId: number;
  providerName: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

export default function BulkGenerateHipaaModal({
  isOpen,
  onClose,
  selectedProviders,
  medicalBills,
  clientData,
  casefileId,
  onSuccess,
  onShowToast
}: BulkGenerateHipaaModalProps) {
  const [generating, setGenerating] = useState(false);
  const [generationStatuses, setGenerationStatuses] = useState<GenerationStatus[]>([]);

  const selectedBills = medicalBills.filter(bill =>
    selectedProviders.includes(bill.medical_provider_id)
  );

  const uniqueSelectedProviders = selectedBills.filter((bill, index, self) =>
    index === self.findIndex((b) => b.medical_provider_id === bill.medical_provider_id)
  );

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatSSN = (ssn: string | null | undefined): string => {
    if (!ssn) return 'N/A';
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
  };

  const prepareHIPAAPayload = async (bill: any) => {
    console.log('🔧 Preparing payload for bill:', bill);
    console.log('🔧 Provider data:', bill.medical_provider);
    console.log('🔧 Client data:', clientData);

    const provider = bill.medical_provider || {};

    // Fetch comprehensive case data similar to GenerateDocumentsModal
    const { data: casefile, error: caseError } = await supabase
      .from('casefiles')
      .select('*')
      .eq('id', casefileId)
      .maybeSingle();

    if (caseError) {
      console.error('❌ Error fetching case data:', caseError);
      throw caseError;
    }

    // Fetch client data for THIS specific bill's client
    const billClientId = bill.client_id;
    let client = {};
    
    if (billClientId) {
      // Fetch the client associated with this medical bill
      const { data: billClient, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', billClientId)
        .maybeSingle();
      
      if (clientError) {
        console.error('❌ Error fetching client for bill:', clientError);
        // Fallback to clientData prop if fetch fails
        client = clientData || {};
      } else {
        client = billClient || clientData || {};
      }
    } else {
      // Fallback to clientData prop if no client_id on bill
      client = clientData || {};
    }
    
    console.log('🔧 Using client for bill:', client.first_name || client.firstName, client.last_name || client.lastName);
    console.log('🔧 Bill client_id:', billClientId);
    
    // Fetch defendant data
    const { data: defendantsData } = await supabase
      .from('defendants')
      .select('*, auto_insurance(*)')
      .eq('casefile_id', casefileId)
      .limit(1);
    const defendant = defendantsData?.[0] || {};

    // Fetch first party claim
    const { data: firstPartyClaims } = await supabase
      .from('first_party_claims')
      .select('*, auto_insurance(*)')
      .eq('casefile_id', casefileId)
      .limit(1);
    const firstPartyClaim = firstPartyClaims?.[0];

    // Fetch third party claim
    const { data: thirdPartyClaims } = await supabase
      .from('third_party_claims')
      .select('*, auto_insurance(*)')
      .eq('casefile_id', casefileId)
      .limit(1);
    const thirdPartyClaim = thirdPartyClaims?.[0];

    const currentDate = new Date();
    const fullDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build comprehensive payload matching GenerateDocumentsModal structure
    const payload = {
      template_type: 'cotton_hipaa_request',
      case_id: casefileId,
      case_number: `Case #${casefileId}`,
      fullDate: fullDate,
      requestDate: fullDate,
      '$$fullDate': fullDate,
      '$$requestDate': fullDate,

      // Law Firm Info
      'LawFirm::name': 'The Cotton Law Firm, PLLC',
      'LawFirm::attorney': 'Eric D. Cotton',
      'LawFirm::processingCompany': 'PI Associates LLC',
      'LawFirm::mailingAddress': 'P.O. Box 890070',
      'LawFirm::city': 'Oklahoma City',
      'LawFirm::state': 'OK',
      'LawFirm::zip': '73189',
      'LawFirm::phone': '1-877-299-8393',
      'LawFirm::fax': '1-877-299-8393',
      'LawFirm::email': 'admin@injuryok.com',
      'LawFirm::logoUrl': 'https://via.placeholder.com/150x150.png?text=Logo',

      // Client Info - Handle both camelCase and snake_case
      'Client::fullName': `${client.firstName || client.first_name || ''} ${client.middleName || client.middle_name || ''} ${client.lastName || client.last_name || ''}`.trim(),
      'Client::firstName': client.firstName || client.first_name || 'N/A',
      'Client::middleName': client.middleName || client.middle_name || '',
      'Client::lastName': client.lastName || client.last_name || 'N/A',
      'Client::dateOfBirth': formatDate(client.dateOfBirth || client.date_of_birth),
      'Client::socialSecurityNumber': formatSSN(client.ssn),
      'Client::streetAddress': client.streetAddress || client.street_address || 'N/A',
      'Client::city': client.city || 'N/A',
      'Client::state': client.state || 'OK',
      'Client::zip': client.zipCode || client.zip_code || client.zip || 'N/A',
      'Client::phone': client.primaryPhone || client.primary_phone || client.phone || 'N/A',
      'Client::secondaryPhone': client.secondaryPhone || client.secondary_phone || 'N/A',
      'Client::email': client.email || 'N/A',
      'Client::isDriver': (client.isDriver || client.is_driver) ? 'Yes' : 'No',
      'Client::maritalStatus': client.maritalStatus || client.marital_status || 'N/A',
      'Client::injuryDescription': client.injuryDescription || client.injury_description || 'N/A',

      // Wreck Info
      'Wreck::date': formatDate(casefile?.date_of_loss),
      'Wreck::time': casefile?.time_of_wreck || 'N/A',
      'Wreck::type': casefile?.wreck_type || 'N/A',
      'Wreck::location': casefile?.wreck_street || 'N/A',
      'Wreck::city': casefile?.wreck_city || 'N/A',
      'Wreck::state': casefile?.wreck_state || 'OK',
      'Wreck::county': casefile?.wreck_county || 'N/A',
      'Wreck::policeReport': casefile?.police_report_number || 'N/A',
      'Wreck::description': casefile?.wreck_description || 'N/A',

      // Defendant Info
      'Defendant::fullName': `${defendant.firstName || defendant.first_name || ''} ${defendant.lastName || defendant.last_name || ''}`.trim() || 'N/A',
      'Defendant::firstName': defendant.firstName || defendant.first_name || 'N/A',
      'Defendant::lastName': defendant.lastName || defendant.last_name || 'N/A',
      'Defendant::isPolicyholder': (defendant.isPolicyholder || defendant.is_policyholder) ? 'Yes' : 'No',
      'Defendant::policyholderName': (defendant.isPolicyholder || defendant.is_policyholder)
        ? `${defendant.firstName || defendant.first_name || ''} ${defendant.lastName || defendant.last_name || ''}`.trim()
        : `${defendant.policyholderFirstName || defendant.policyholder_first_name || ''} ${defendant.policyholderLastName || defendant.policyholder_last_name || ''}`.trim() || 'N/A',

      // First Party Claim Info
      'ClientsAutoInsurer::name': firstPartyClaim?.auto_insurance?.name || 'N/A',
      'ClientsClaim::claimNumber': firstPartyClaim?.claim_number || 'N/A',
      'ClientsAdjuster::fullName': firstPartyClaim?.adjuster_name || 'N/A',
      'ClientsAdjuster::phone': firstPartyClaim?.adjuster_phone || 'N/A',
      'ClientsAdjuster::email': firstPartyClaim?.adjuster_email || 'N/A',
      'ClientsAdjuster::fax': firstPartyClaim?.adjuster_fax || 'N/A',
      'FirstParty::carrier': firstPartyClaim?.auto_insurance?.name || 'N/A',
      'FirstParty::claimNumber': firstPartyClaim?.claim_number || 'N/A',
      'FirstParty::adjuster': firstPartyClaim?.adjuster_name || 'N/A',
      'FirstParty::adjusterPhone': firstPartyClaim?.adjuster_phone || 'N/A',
      'FirstParty::adjusterEmail': firstPartyClaim?.adjuster_email || 'N/A',
      'FirstParty::adjusterFax': firstPartyClaim?.adjuster_fax || 'N/A',
      'FirstParty::policyNumber': firstPartyClaim?.policy_number || 'N/A',
      'FirstParty::policyLimits': firstPartyClaim?.policy_limits || 'N/A',

      // Third Party Claim Info
      'DefendantsAutoInsurer::name': thirdPartyClaim?.auto_insurance?.name || 'N/A',
      'DefendantsClaim::claimNumber': thirdPartyClaim?.claim_number || 'N/A',
      'DefendantsAdjuster::fullName': thirdPartyClaim?.adjuster_name || 'N/A',
      'DefendantsAdjuster::phone': thirdPartyClaim?.adjuster_phone || 'N/A',
      'DefendantsAdjuster::email': thirdPartyClaim?.adjuster_email || 'N/A',
      'DefendantsAdjuster::fax': thirdPartyClaim?.adjuster_fax || 'N/A',
      'ThirdParty::carrier': thirdPartyClaim?.auto_insurance?.name || 'N/A',
      'ThirdParty::claimNumber': thirdPartyClaim?.claim_number || 'N/A',
      'ThirdParty::adjuster': thirdPartyClaim?.adjuster_name || 'N/A',
      'ThirdParty::adjusterPhone': thirdPartyClaim?.adjuster_phone || 'N/A',
      'ThirdParty::adjusterEmail': thirdPartyClaim?.adjuster_email || 'N/A',
      'ThirdParty::adjusterFax': thirdPartyClaim?.adjuster_fax || 'N/A',
      'ThirdParty::policyNumber': thirdPartyClaim?.policy_number || 'N/A',
      'ThirdParty::policyLimits': thirdPartyClaim?.policy_limits || 'N/A',
      'adjuster_street_address': thirdPartyClaim?.adjuster_address || firstPartyClaim?.adjuster_address || 'N/A',
      'adjuster_city': thirdPartyClaim?.adjuster_city || firstPartyClaim?.adjuster_city || 'Oklahoma City',
      'adjuster_state': thirdPartyClaim?.adjuster_state || firstPartyClaim?.adjuster_state || 'OK',
      'adjuster_zip_code': thirdPartyClaim?.adjuster_zip || firstPartyClaim?.adjuster_zip || '73102',

      // Medical Provider Info (specific provider from bill)
      'MedicalProvider::name': provider.name || provider.provider_name || 'N/A',
      'MedicalProvider::streetAddress': provider.address || provider.street_address || 'N/A',
      'MedicalProvider::city': provider.city || 'Oklahoma City',
      'MedicalProvider::state': provider.state || 'OK',
      'MedicalProvider::zip': provider.zip || provider.zip_code || '73102',
      'MedicalProvider::phone': provider.phone || provider.phone_1 || 'N/A',
      'MedicalProvider::fax': provider.fax || provider.fax_1 || 'N/A',
      'MedicalProvider::type': provider.type || '',
      'MedicalProvider::requestMethod': provider.request_method || 'Email',

      // Date helpers
      'current_date': fullDate,
      'current_day': String(currentDate.getDate()),
      'current_month': currentDate.toLocaleDateString('en-US', { month: 'long' }),
      'current_year': String(currentDate.getFullYear()),
      'date_of_loss': formatDate(casefile?.date_of_loss),
      
      // Additional wreck fields
      'wreck_street': casefile?.wreck_street || '',
      'wreck_city': casefile?.wreck_city || '',
      'wreck_state': casefile?.wreck_state || '',
      'wreck_county': casefile?.wreck_county || '',
      'wreck_type': casefile?.wreck_type || '',
      'wreck_description': casefile?.wreck_description || '',
      'police_report_number': casefile?.police_report_number || '',
      'vehicle_description': casefile?.vehicle_description || '',
      'damage_level': casefile?.damage_level || '',
      'wreck_notes': casefile?.wreck_notes || '',
      
      // Client aliases
      'client.fullName': `${client.firstName || client.first_name || ''} ${client.middleName || client.middle_name || ''} ${client.lastName || client.last_name || ''}`.trim(),
      'client_full_name': `${client.firstName || client.first_name || ''} ${client.middleName || client.middle_name || ''} ${client.lastName || client.last_name || ''}`.trim(),
      'client.dob': formatDate(client.dateOfBirth || client.date_of_birth),
      'client_dob': formatDate(client.dateOfBirth || client.date_of_birth),
      
      // Defendant aliases
      'defendant.full_name': `${defendant.firstName || defendant.first_name || ''} ${defendant.lastName || defendant.last_name || ''}`.trim() || 'N/A',
      'defendant_full_name': `${defendant.firstName || defendant.first_name || ''} ${defendant.lastName || defendant.last_name || ''}`.trim() || 'N/A',
      
      // Medical Provider aliases
      'medical_provider.name': provider.name || provider.provider_name || 'N/A',
      'medical_provider_name': provider.name || provider.provider_name || 'N/A',
      'medical_provider_street_address': provider.address || provider.street_address || 'N/A',
      'medical_provider_city': provider.city || 'Oklahoma City',
      'medical_provider_state': provider.state || 'OK',
      'medical_provider_zip_code': provider.zip || provider.zip_code || '73102',
      
      // Other fields
      'statute_of_limitations_date': casefile?.statute_deadline ? formatDate(casefile.statute_deadline) : '',
      'county_name': casefile?.wreck_county || '',
    } as any;

    // Get recipient email (medical provider email for HIPAA)
    const recipientEmail = getRecipientEmail(
      'cotton_hipaa_request',
      {
        medicalProvider: provider
      }
    );

    // Add recipient_email to payload (static key, dynamic value)
    payload.recipient_email = recipientEmail;

    if (recipientEmail) {
      console.log('📧 Recipient email:', recipientEmail);
    } else {
      console.warn('⚠️ No recipient email found for medical provider:', provider.name);
    }

    console.log('✅ Payload prepared successfully');
    console.log('📋 HIPAA Payload for provider:', provider.name);
    console.log('📋 Template type: cotton_hipaa_request');
    console.log('📋 Payload size:', JSON.stringify(payload).length, 'bytes');

    return payload;
  };

  const savePDFToStorage = async (base64Data: string, filename: string, providerName: string) => {
    try {
      console.log('💾 Starting PDF save process...');
      console.log('💾 Filename:', filename);
      console.log('💾 Provider:', providerName);
      console.log('💾 Base64 length:', base64Data.length);

      const base64WithoutPrefix = base64Data.replace(/^data:.*?;base64,/, '');
      console.log('💾 Base64 without prefix length:', base64WithoutPrefix.length);

      const binaryString = atob(base64WithoutPrefix);
      console.log('💾 Binary string length:', binaryString.length);

      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      console.log('💾 Blob created, size:', blob.size, 'bytes');

      const timestamp = Date.now();
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `case-${casefileId}/${sanitizedFilename}_${timestamp}.pdf`;

      console.log('💾 Uploading to storage path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('case-documents')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf'
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ PDF uploaded to storage successfully:', uploadData);

      const { data: urlData } = supabase.storage
        .from('case-documents')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🔗 Public URL generated:', publicUrl);

      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'Admin';
      console.log('👤 Saving as user:', userName);

      const documentRecord = {
        casefile_id: casefileId,
        file_name: filename,
        file_type: 'application/pdf',
        file_size: blob.size,
        file_url: publicUrl,
        storage_path: filePath,
        category: 'Letters',
        uploaded_by: userName,
        notes: `HIPAA Records Request for ${providerName}`
      };

      console.log('💾 Inserting document record:', documentRecord);

      const { error: dbError } = await supabase
        .from('documents')
        .insert(documentRecord);

      if (dbError) {
        console.error('❌ Database insert error:', dbError);
        throw dbError;
      }

      console.log('✅ PDF saved to documents table');

      // Note: PDF is saved to storage and database, but NOT auto-downloaded
      // User can access it from the Documents tab

      return publicUrl;
    } catch (error) {
      console.error('Error saving/downloading PDF:', error);
      throw error;
    }
  };

  const createWorkLogEntry = async (providerName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'System';

      await supabase
        .from('work_logs')
        .insert({
          casefile_id: casefileId,
          description: `Generated HIPAA Records Request for ${providerName}`,
          user_name: userName
        });

      console.log('Work log entry created for:', providerName);
    } catch (error) {
      console.error('Error creating work log entry:', error);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);

    const statuses: GenerationStatus[] = uniqueSelectedProviders.map(bill => ({
      providerId: bill.medical_provider_id,
      providerName: bill.medical_provider?.name || 'Unknown Provider',
      status: 'pending' as const
    }));

    setGenerationStatuses(statuses);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uniqueSelectedProviders.length; i++) {
      const bill = uniqueSelectedProviders[i];
      const providerName = bill.medical_provider?.name || 'Unknown Provider';

      setGenerationStatuses(prev =>
        prev.map(s =>
          s.providerId === bill.medical_provider_id
            ? { ...s, status: 'generating' }
            : s
        )
      );

      try {
        const payload = await prepareHIPAAPayload(bill);

        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

        if (!webhookUrl) {
          throw new Error('Webhook URL not configured');
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🏥 Processing provider:', providerName);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 Sending payload to n8n:', payload);
        console.log('🔗 Webhook URL:', webhookUrl);

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/pdf, */*'
          },
          body: JSON.stringify(payload),
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response status text:', response.statusText);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

        const contentType = response.headers.get('content-type');
        console.log('📄 Content-Type:', contentType);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Error response:', errorText);
          
          // Parse error response
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.message) {
              errorMessage = errorJson.message;
              
              // Special handling for webhook not registered error
              if (errorJson.code === 404 && errorMessage.includes('not registered')) {
                errorMessage = 'Webhook not active. Please activate the n8n workflow and try again.';
              }
            }
          } catch (e) {
            // Use default error message
          }
          
          throw new Error(errorMessage);
        }

        let result;
        if (contentType?.includes('application/json')) {
          console.log('📦 Response is JSON');
          const responseText = await response.text();
          
          // Check if response is empty before parsing
          if (!responseText || responseText.trim() === '') {
            console.error('❌ Empty JSON response from n8n');
            throw new Error('Received empty response from webhook. The n8n workflow may not be active or configured correctly.');
          }
          
          try {
            result = JSON.parse(responseText);
          console.log('📥 JSON Response:', result);
          console.log('📥 Response keys:', Object.keys(result));
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError);
            console.error('📦 Response text:', responseText);
            throw new Error('Invalid JSON response from webhook. Please check n8n workflow configuration.');
          }
        } else if (contentType?.includes('application/pdf')) {
          console.log('📦 Response is direct PDF');
          const pdfBlob = await response.blob();
          console.log('📏 PDF Blob size:', pdfBlob.size);
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          const base64 = btoa(binary);
          result = { pdf_base64: base64, filename: `HIPAA_Request_${providerName.replace(/\s+/g, '_')}.pdf` };
          console.log('✅ Converted PDF blob to base64');
        } else {
          const text = await response.text();
          console.log('📦 Response is text/unknown:', text.substring(0, 200));
          
          if (!text || text.trim() === '') {
            console.error('❌ Empty text response from n8n');
            throw new Error('Received empty response from webhook. The n8n workflow may not be active or configured correctly.');
          }
          
          try {
            result = JSON.parse(text);
            console.log('✅ Parsed text as JSON:', result);
          } catch (e) {
            console.error('❌ Failed to parse as JSON:', e);
            throw new Error('Response is not JSON or PDF: ' + text.substring(0, 100));
          }
        }

        let pdfBase64 = null;
        let filename = `HIPAA_Request_${providerName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;

        if (result.pdf_base64) {
          console.log('✅ Found pdf_base64');
          pdfBase64 = result.pdf_base64;
          filename = result.filename || filename;
        } else if (result.pdf) {
          console.log('✅ Found pdf');
          pdfBase64 = result.pdf;
          filename = result.filename || filename;
        } else if (result.data) {
          console.log('✅ Found data');
          pdfBase64 = result.data;
          filename = result.filename || filename;
        } else if (result.pdf_url || result.url) {
          console.log('✅ Found URL:', result.pdf_url || result.url);
          const pdfUrl = result.pdf_url || result.url;
          const pdfResponse = await fetch(pdfUrl);
          const pdfBlob = await pdfResponse.blob();
          const arrayBuffer = await pdfBlob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
          }
          pdfBase64 = btoa(binary);
          console.log('✅ Downloaded and converted PDF from URL');
        } else if (result.file && result.file.data) {
          console.log('✅ Found file.data');
          pdfBase64 = result.file.data;
          filename = result.file.filename || filename;
        } else {
          console.error('❌ NO PDF FOUND IN RESPONSE');
          console.error('📦 Full response structure:', JSON.stringify(result, null, 2));
          throw new Error('PDF not found in n8n response. Check console for full response structure.');
        }

        if (pdfBase64) {
          console.log('📝 Using filename:', filename);
          await savePDFToStorage(pdfBase64, filename, providerName);
        }

        await createWorkLogEntry(providerName);

        setGenerationStatuses(prev =>
          prev.map(s =>
            s.providerId === bill.medical_provider_id
              ? { ...s, status: 'success' }
              : s
          )
        );

        successCount++;
      } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERROR generating HIPAA for', providerName);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Error object:', error);

        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        setGenerationStatuses(prev =>
          prev.map(s =>
            s.providerId === bill.medical_provider_id
              ? { ...s, status: 'error', error: errorMessage }
              : s
          )
        );

        errorCount++;
      }
    }

    // After all HIPAA documents are generated, update case stage to Processing - Treating
    if (successCount > 0) {
      try {
        const { data: currentCase } = await supabase
          .from('casefiles')
          .select('stage, status')
          .eq('id', casefileId)
          .single();

        if (currentCase) {
          const { error: updateError } = await supabase
            .from('casefiles')
            .update({
              stage: 'Processing',
              status: 'Treating',
              updated_at: new Date().toISOString()
            })
            .eq('id', casefileId);

          if (updateError) {
            console.error('Error updating case stage:', updateError);
          } else {
            const { data: { user } } = await supabase.auth.getUser();
            const userName = user?.email || 'System';

            await supabase.from('work_logs').insert({
              casefile_id: casefileId,
              description: `Stage/status automatically updated to "Processing - Treating" after generating ${successCount} HIPAA request(s)`,
              user_name: userName
            });

            console.log('✅ Case stage updated to Processing - Treating');
          }
        }
      } catch (stageError) {
        console.error('Error updating case stage:', stageError);
      }
    }

    setGenerating(false);

    if (successCount > 0) {
      onShowToast(
        `Successfully generated ${successCount} HIPAA request${successCount > 1 ? 's' : ''}`,
        'success'
      );
    }

    if (errorCount > 0) {
      onShowToast(
        `Failed to generate ${errorCount} request${errorCount > 1 ? 's' : ''}`,
        'error'
      );
    }
  };

  const canClose = !generating || generationStatuses.every(s => s.status !== 'generating');

  const handleClose = () => {
    if (canClose) {
      onClose();
      setTimeout(() => {
        setGenerationStatuses([]);
      }, 300);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="lg">
      <div className="min-h-[50vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
              <h2 className="text-xl font-semibold text-gray-900">Generate HIPAA Requests</h2>
              <p className="text-sm text-gray-500 mt-0.5">
              Create records authorization for {uniqueSelectedProviders.length} provider{uniqueSelectedProviders.length > 1 ? 's' : ''} for {clientData?.firstName || clientData?.first_name || 'Client'} {clientData?.lastName || clientData?.last_name || ''}
            </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
        {!generating && generationStatuses.length === 0 && (
          <>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <h4 className="font-semibold text-blue-900 text-base">Selected Providers</h4>
                </div>
                <div className="space-y-2">
                {uniqueSelectedProviders.map((bill) => (
                    <div key={bill.medical_provider_id} className="bg-white rounded-lg p-3 border border-blue-100 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">
                            {bill.medical_provider?.name}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                      {bill.medical_provider?.type}
                            {bill.medical_provider?.city && ` • ${bill.medical_provider.city}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>

              <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-5 shadow-sm">
                <h4 className="font-semibold text-gray-900 text-base mb-3 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                  What will happen
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-xs">1</span>
                    </div>
                    <p className="text-sm text-gray-700 pt-0.5">Generate HIPAA authorization form for each provider for {clientData?.firstName || clientData?.first_name || 'the selected client'}</p>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-xs">2</span>
                    </div>
                    <p className="text-sm text-gray-700 pt-0.5">Save documents to case files and create work log entries</p>
                  </div>
                  <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-gray-100">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-green-600 font-bold text-xs">3</span>
                    </div>
                    <p className="text-sm text-gray-700 pt-0.5">Documents will be available in the Documents tab (not auto-downloaded)</p>
                  </div>
                </div>
            </div>
          </>
        )}

        {generationStatuses.length > 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200 shadow-sm">
              <h4 className="font-semibold text-gray-900 text-base mb-4 flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                Generation Progress
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generationStatuses.map((status, index) => (
              <div
                key={status.providerId}
                    className={`flex items-center gap-3 p-4 bg-white rounded-lg border-2 transition-all shadow-sm ${
                      status.status === 'success' 
                        ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50' 
                        : status.status === 'error'
                        ? 'border-red-300 bg-gradient-to-r from-red-50 to-rose-50'
                        : status.status === 'generating'
                        ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-cyan-50'
                        : 'border-gray-200'
                    }`}
              >
                {status.status === 'pending' && (
                      <div className="w-8 h-8 rounded-full border-2 border-gray-400 bg-white flex-shrink-0 flex items-center justify-center shadow-sm">
                        <span className="text-xs text-gray-600 font-bold">{index + 1}</span>
                      </div>
                )}
                {status.status === 'generating' && (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      </div>
                )}
                {status.status === 'success' && (
                      <div className="w-8 h-8 rounded-full bg-green-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                )}
                {status.status === 'error' && (
                      <div className="w-8 h-8 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center shadow-sm">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                )}
                <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                    {status.providerName}
                  </p>
                  {status.error && (
                        <p className="text-xs text-red-700 mt-1.5 font-medium break-words leading-relaxed">{status.error}</p>
                  )}
                </div>
                {status.status === 'generating' && (
                      <span className="text-xs text-blue-700 font-semibold bg-blue-100 px-3 py-1.5 rounded-lg shadow-sm">Generating...</span>
                )}
                {status.status === 'success' && (
                      <span className="text-xs text-green-700 font-semibold bg-green-100 px-3 py-1.5 rounded-lg shadow-sm">Complete</span>
                )}
                {status.status === 'error' && (
                      <span className="text-xs text-red-700 font-semibold bg-red-100 px-3 py-1.5 rounded-lg shadow-sm">Failed</span>
                )}
              </div>
            ))}
              </div>
          </div>
        )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-200 bg-gray-50">
          {!generating && generationStatuses.length === 0 ? (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-5 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-white hover:border-gray-400 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                <FileText className="w-5 h-5" />
                <span>Generate All ({uniqueSelectedProviders.length})</span>
              </button>
            </>
          ) : generating ? (
            <button
              disabled
              className="flex-1 px-5 py-3 bg-gray-300 text-gray-600 rounded-xl font-semibold cursor-not-allowed shadow-sm"
            >
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating... Please Wait</span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                onSuccess();
                handleClose();
              }}
              className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
