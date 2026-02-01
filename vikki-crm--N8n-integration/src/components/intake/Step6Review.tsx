import { useState, useEffect } from 'react';
import { CheckCircle, Download } from 'lucide-react';
import { supabase } from '../../utils/database';
import type { IntakeFormData, AutoInsurance, HealthInsurance, MedicalProvider } from '../../types/intake';

interface Step6Props {
  data: IntakeFormData;
  onEdit: (step: number) => void;
}

export default function Step6Review({ data, onEdit }: Step6Props) {
  const [autoInsuranceMap, setAutoInsuranceMap] = useState<Map<number, AutoInsurance>>(new Map());
  const [healthInsuranceMap, setHealthInsuranceMap] = useState<Map<number, HealthInsurance>>(new Map());
  const [defendantInsuranceMap, setDefendantInsuranceMap] = useState<Map<number, AutoInsurance>>(new Map());
  const [providersMap, setProvidersMap] = useState<Map<number, MedicalProvider>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const autoMap = new Map<number, AutoInsurance>();
    const healthMap = new Map<number, HealthInsurance>();
    const defMap = new Map<number, AutoInsurance>();
    const provMap = new Map<number, MedicalProvider>();

    // Load all auto insurance companies used by clients
    const clientAutoIds = data.clients
      .filter(c => c.hasAutoInsurance && c.autoInsuranceId)
      .map(c => c.autoInsuranceId);
    
    if (clientAutoIds.length > 0) {
      const { data: autoData } = await supabase
        .from('auto_insurance')
        .select('*')
        .in('id', clientAutoIds);
      if (autoData) {
        autoData.forEach(ins => autoMap.set(ins.id, ins));
      }
    }

    // Load all health insurance companies used by clients
    const clientHealthIds = data.clients
      .filter(c => c.hasHealthInsurance && c.healthInsuranceId)
      .map(c => c.healthInsuranceId);
    
    if (clientHealthIds.length > 0) {
      const { data: healthData } = await supabase
        .from('health_insurance')
        .select('*')
        .in('id', clientHealthIds);
      if (healthData) {
        healthData.forEach(ins => healthMap.set(ins.id, ins));
      }
    }

    // Load all auto insurance companies used by defendants
    const defendantAutoIds = data.defendants
      .filter(d => d.autoInsuranceId)
      .map(d => d.autoInsuranceId);
    
    if (defendantAutoIds.length > 0) {
      const { data: defData } = await supabase
        .from('auto_insurance')
        .select('*')
        .in('id', defendantAutoIds);
      if (defData) {
        defData.forEach(ins => defMap.set(ins.id, ins));
      }
    }

    // Load all medical providers
    const allProviderIds = new Set<number>();
    data.clients.forEach(client => {
      (client.selectedProviders || []).forEach(pid => allProviderIds.add(pid));
    });

    if (allProviderIds.size > 0) {
      const { data: provData } = await supabase
        .from('medical_providers')
        .select('*')
        .in('id', Array.from(allProviderIds));
      if (provData) {
        provData.forEach(prov => provMap.set(prov.id, prov));
      }
    }

    setAutoInsuranceMap(autoMap);
    setHealthInsuranceMap(healthMap);
    setDefendantInsuranceMap(defMap);
    setProvidersMap(provMap);
    setLoading(false);
  };

  const downloadPDF = () => {
    // Create a simple HTML representation for PDF
    const htmlContent = generatePDFContent();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const generatePDFContent = (): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Case Intake Form</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1f2937; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          h2 { color: #374151; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          h3 { color: #4b5563; margin-top: 20px; }
          .section { margin-bottom: 30px; }
          .field { margin: 8px 0; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #111827; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Case Intake Form</h1>
        ${generateCaseInfoSection()}
        ${generateClientsSection()}
        ${generateMedicalProvidersSection()}
        ${generateDefendantsSection()}
      </body>
      </html>
    `;
  };

  const generateCaseInfoSection = (): string => {
    return `
      <div class="section">
        <h2>Case Information</h2>
        <div class="field"><span class="label">Date of Loss:</span> <span class="value">${data.dateOfLoss || 'N/A'}</span></div>
        <div class="field"><span class="label">Time of Wreck:</span> <span class="value">${data.timeOfWreck || 'N/A'}</span></div>
        <div class="field"><span class="label">Accident Type:</span> <span class="value">${data.wreckType || 'N/A'}</span></div>
        <div class="field"><span class="label">Location:</span> <span class="value">${data.wreckStreet || ''}, ${data.wreckCity || ''}, ${data.wreckCounty || ''}, ${data.wreckState || ''}</span></div>
        <div class="field"><span class="label">Police Involved:</span> <span class="value">${data.isPoliceInvolved ? 'Yes' : 'No'}</span></div>
        ${data.isPoliceInvolved && data.policeReportNumber ? `<div class="field"><span class="label">Police Report Number:</span> <span class="value">${data.policeReportNumber}</span></div>` : ''}
      </div>
    `;
  };

  const generateClientsSection = (): string => {
    return `
      <div class="section">
        <h2>Client Information</h2>
        ${data.clients.map((client, index) => `
          <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px;">
            <h3>${client.isDriver ? 'Driver' : `Passenger ${index}`}</h3>
            <div class="field"><span class="label">Name:</span> <span class="value">${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}</span></div>
            <div class="field"><span class="label">Date of Birth:</span> <span class="value">${client.dateOfBirth || 'N/A'}</span></div>
            <div class="field"><span class="label">Phone:</span> <span class="value">${client.primaryPhone || 'N/A'}</span></div>
            <div class="field"><span class="label">Email:</span> <span class="value">${client.email || 'N/A'}</span></div>
            <div class="field"><span class="label">Address:</span> <span class="value">${client.streetAddress || ''}, ${client.city || ''}, ${client.state || ''} ${client.zipCode || ''}</span></div>
            ${client.hasAutoInsurance ? `
              <h4>Auto Insurance</h4>
              <div class="field"><span class="label">Company:</span> <span class="value">${autoInsuranceMap.get(client.autoInsuranceId)?.name || 'N/A'}</span></div>
              <div class="field"><span class="label">Policy Number:</span> <span class="value">${client.autoPolicyNumber || 'N/A'}</span></div>
              ${client.autoClaimNumber ? `<div class="field"><span class="label">Claim Number:</span> <span class="value">${client.autoClaimNumber}</span></div>` : ''}
              ${(client.autoAdjusterId || client.autoAdjusterInfo || client.autoAdjusterFirstName || client.autoAdjusterLastName) ? `
                <h5>Auto Insurance Adjuster</h5>
                ${client.autoAdjusterInfo ? `
                  <div class="field"><span class="label">Name:</span> <span class="value">${client.autoAdjusterInfo.first_name || ''} ${client.autoAdjusterInfo.last_name || ''}</span></div>
                  ${client.autoAdjusterInfo.email ? `<div class="field"><span class="label">Email:</span> <span class="value">${client.autoAdjusterInfo.email}</span></div>` : ''}
                  ${client.autoAdjusterInfo.phone ? `<div class="field"><span class="label">Phone:</span> <span class="value">${client.autoAdjusterInfo.phone}</span></div>` : ''}
                  ${client.autoAdjusterInfo.fax ? `<div class="field"><span class="label">Fax:</span> <span class="value">${client.autoAdjusterInfo.fax}</span></div>` : ''}
                  ${client.autoAdjusterInfo.street_address ? `<div class="field"><span class="label">Address:</span> <span class="value">${client.autoAdjusterInfo.street_address}, ${client.autoAdjusterInfo.city || ''}, ${client.autoAdjusterInfo.state || ''} ${client.autoAdjusterInfo.zip_code || ''}</span></div>` : ''}
                ` : (client.autoAdjusterFirstName || client.autoAdjusterLastName) ? `
                  <div class="field"><span class="label">Name:</span> <span class="value">${client.autoAdjusterFirstName || ''} ${client.autoAdjusterLastName || ''}</span></div>
                  ${client.autoAdjusterEmail ? `<div class="field"><span class="label">Email:</span> <span class="value">${client.autoAdjusterEmail}</span></div>` : ''}
                  ${client.autoAdjusterPhone ? `<div class="field"><span class="label">Phone:</span> <span class="value">${client.autoAdjusterPhone}</span></div>` : ''}
                ` : `<div class="field"><span class="label">Adjuster ID:</span> <span class="value">${client.autoAdjusterId}</span></div>`}
              ` : ''}
            ` : '<div class="field"><span class="label">Auto Insurance:</span> <span class="value">None</span></div>'}
            ${client.hasHealthInsurance ? `
              <h4>Health Insurance</h4>
              <div class="field"><span class="label">Company:</span> <span class="value">${healthInsuranceMap.get(client.healthInsuranceId)?.name || 'N/A'}</span></div>
              <div class="field"><span class="label">Member ID:</span> <span class="value">${client.healthMemberId || 'N/A'}</span></div>
              ${(client.healthAdjusterId || client.healthAdjusterInfo) ? `
                <h5>Health Adjuster</h5>
                ${client.healthAdjusterInfo ? `
                  <div class="field"><span class="label">Name:</span> <span class="value">${client.healthAdjusterInfo.first_name || ''} ${client.healthAdjusterInfo.last_name || ''}</span></div>
                  ${client.healthAdjusterInfo.email ? `<div class="field"><span class="label">Email:</span> <span class="value">${client.healthAdjusterInfo.email}</span></div>` : ''}
                  ${client.healthAdjusterInfo.phone ? `<div class="field"><span class="label">Phone:</span> <span class="value">${client.healthAdjusterInfo.phone}</span></div>` : ''}
                  ${client.healthAdjusterInfo.fax ? `<div class="field"><span class="label">Fax:</span> <span class="value">${client.healthAdjusterInfo.fax}</span></div>` : ''}
                ` : `<div class="field"><span class="label">Adjuster ID:</span> <span class="value">${client.healthAdjusterId}</span></div>`}
              ` : ''}
            ` : '<div class="field"><span class="label">Health Insurance:</span> <span class="value">None</span></div>'}
          </div>
        `).join('')}
      </div>
    `;
  };

  const generateMedicalProvidersSection = (): string => {
    const providerSections = data.clients.map((client, index) => {
      const clientProviders = (client.selectedProviders || [])
        .map(pid => providersMap.get(pid))
        .filter(Boolean) as MedicalProvider[];
      
      if (clientProviders.length === 0) return '';
      
      return `
        <div style="margin-bottom: 15px;">
          <h4>${client.firstName || ''} ${client.lastName || ''} (${client.isDriver ? 'Driver' : `Passenger ${index}`})</h4>
          <ul>
            ${clientProviders.map(prov => {
              return `<li>${prov.name} (${prov.city})</li>`;
            }).join('')}
          </ul>
        </div>
      `;
    }).join('');

    return `
      <div class="section">
        <h2>Medical Providers</h2>
        ${providerSections || '<p>No providers selected</p>'}
      </div>
    `;
  };

  const generateDefendantsSection = (): string => {
    return `
      <div class="section">
        <h2>Defendant Information</h2>
        ${data.defendants.map((defendant, index) => `
          <div style="margin-bottom: 20px; border: 1px solid #e5e7eb; padding: 15px; border-radius: 5px;">
            <h3>Defendant ${index + 1}</h3>
            <div class="field"><span class="label">Name:</span> <span class="value">${defendant.firstName || ''} ${defendant.lastName || ''}</span></div>
            <div class="field"><span class="label">Liability:</span> <span class="value">${defendant.liabilityPercentage || 0}%</span></div>
            <div class="field"><span class="label">Insurance Company:</span> <span class="value">${defendantInsuranceMap.get(defendant.autoInsuranceId)?.name || 'N/A'}</span></div>
            <div class="field"><span class="label">Policy Number:</span> <span class="value">${defendant.policyNumber || 'N/A'}</span></div>
            ${defendant.claimNumber ? `<div class="field"><span class="label">Claim Number:</span> <span class="value">${defendant.claimNumber}</span></div>` : ''}
            ${(defendant.adjusterFirstName || defendant.adjusterLastName) ? `
              <h4>Adjuster Information</h4>
              <div class="field"><span class="label">Adjuster Name:</span> <span class="value">${defendant.adjusterFirstName || ''} ${defendant.adjusterLastName || ''}</span></div>
              ${defendant.adjusterPhone ? `<div class="field"><span class="label">Phone:</span> <span class="value">${defendant.adjusterPhone}</span></div>` : ''}
              ${defendant.adjusterEmail ? `<div class="field"><span class="label">Email:</span> <span class="value">${defendant.adjusterEmail}</span></div>` : ''}
              ${defendant.adjusterMailingAddress ? `<div class="field"><span class="label">Address:</span> <span class="value">${defendant.adjusterMailingAddress}, ${defendant.adjusterCity || ''}, ${defendant.adjusterState || ''} ${defendant.adjusterZipCode || ''}</span></div>` : ''}
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  };

  const Section = ({ title, step, children }: { title: string; step: number; children: React.ReactNode }) => (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value: string | undefined }) => (
    <div className="py-2">
      <span className="text-sm font-medium text-gray-600">{label}:</span>
      <span className="ml-2 text-sm text-gray-900">{value || 'N/A'}</span>
    </div>
  );

  if (loading) {
    return <div className="text-center py-8">Loading review data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center">
        <CheckCircle className="text-green-600 mr-3" size={24} />
        <div>
          <h3 className="font-semibold text-gray-900">Ready to Submit</h3>
          <p className="text-sm text-gray-600">Review the information below before submitting the case</p>
        </div>
        </div>
        <button
          type="button"
          onClick={downloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      <Section title="Case Information" step={1}>
        <Field label="Date of Loss" value={data.dateOfLoss} />
        <Field label="Time of Wreck" value={data.timeOfWreck} />
        <Field label="Accident Type" value={data.wreckType} />
        <Field label="Location" value={`${data.wreckStreet}, ${data.wreckCity}, ${data.wreckCounty}, ${data.wreckState}`} />
        <Field label="Police Involved" value={data.isPoliceInvolved ? 'Yes' : 'No'} />
        {data.isPoliceInvolved && data.policeReportNumber && (
          <Field label="Police Report Number" value={data.policeReportNumber} />
        )}
      </Section>

      <Section title="Client Information" step={2}>
        {data.clients && data.clients.length > 0 ? (
          <div className="space-y-6">
            {data.clients.map((client, index) => {
              const clientAutoIns = client.hasAutoInsurance && client.autoInsuranceId 
                ? autoInsuranceMap.get(client.autoInsuranceId) : null;
              const clientHealthIns = client.hasHealthInsurance && client.healthInsuranceId
                ? healthInsuranceMap.get(client.healthInsuranceId) : null;
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">
                    {client.isDriver ? 'Driver' : `Passenger ${index}`}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Name" value={`${client.firstName || ''} ${client.middleName || ''} ${client.lastName || ''}`.trim()} />
                    <Field label="Date of Birth" value={client.dateOfBirth} />
                    <Field label="Phone" value={client.primaryPhone} />
                    <Field label="Email" value={client.email} />
                    <Field label="Address" value={`${client.streetAddress || ''}, ${client.city || ''}, ${client.state || ''} ${client.zipCode || ''}`.trim()} />
                  </div>
                  
                  {client.hasAutoInsurance && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Auto Insurance</h5>
                      <Field label="Company" value={clientAutoIns?.name} />
                      <Field label="Policy Number" value={client.autoPolicyNumber} />
                      {client.autoClaimNumber && <Field label="Claim Number" value={client.autoClaimNumber} />}
                      {client.hasMedpay && <Field label="Med Pay Amount" value={client.medpayAmount} />}
                      {client.hasUmCoverage && <Field label="UM/UIM Coverage" value={client.umAmount} />}
                      {(client.autoAdjusterId || client.autoAdjusterInfo || client.autoAdjusterFirstName || client.autoAdjusterLastName) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h6 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Auto Insurance Adjuster</h6>
                          {client.autoAdjusterInfo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <Field label="Name" value={`${client.autoAdjusterInfo.first_name || ''} ${client.autoAdjusterInfo.last_name || ''}`.trim()} />
                              {client.autoAdjusterInfo.email && <Field label="Email" value={client.autoAdjusterInfo.email} />}
                              {client.autoAdjusterInfo.phone && <Field label="Phone" value={client.autoAdjusterInfo.phone} />}
                              {client.autoAdjusterInfo.fax && <Field label="Fax" value={client.autoAdjusterInfo.fax} />}
                              {client.autoAdjusterInfo.street_address && (
                                <Field label="Address" value={`${client.autoAdjusterInfo.street_address}, ${client.autoAdjusterInfo.city || ''}, ${client.autoAdjusterInfo.state || ''} ${client.autoAdjusterInfo.zip_code || ''}`.trim()} />
                              )}
                            </div>
                          )}
                          {(client.autoAdjusterFirstName || client.autoAdjusterLastName) && !client.autoAdjusterInfo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <Field label="Name" value={`${client.autoAdjusterFirstName || ''} ${client.autoAdjusterLastName || ''}`.trim()} />
                              {client.autoAdjusterEmail && <Field label="Email" value={client.autoAdjusterEmail} />}
                              {client.autoAdjusterPhone && <Field label="Phone" value={client.autoAdjusterPhone} />}
                            </div>
                          )}
                          {client.autoAdjusterId && !client.autoAdjusterInfo && !client.autoAdjusterFirstName && (
                            <p className="text-xs text-gray-500">Adjuster ID: {client.autoAdjusterId}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {client.hasHealthInsurance && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Health Insurance</h5>
                      <Field label="Company" value={clientHealthIns?.name || (client.healthInsuranceId === 0 ? 'Unknown provider' : 'N/A')} />
                      <Field label="Member ID" value={client.healthMemberId} />
                      {(client.healthAdjusterId || client.healthAdjusterInfo) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h6 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Health Adjuster</h6>
                          {client.healthAdjusterInfo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <Field label="Name" value={`${client.healthAdjusterInfo.first_name || ''} ${client.healthAdjusterInfo.last_name || ''}`.trim()} />
                              {client.healthAdjusterInfo.email && <Field label="Email" value={client.healthAdjusterInfo.email} />}
                              {client.healthAdjusterInfo.phone && <Field label="Phone" value={client.healthAdjusterInfo.phone} />}
                              {client.healthAdjusterInfo.fax && <Field label="Fax" value={client.healthAdjusterInfo.fax} />}
                              {client.healthAdjusterInfo.street_address && (
                                <Field label="Address" value={`${client.healthAdjusterInfo.street_address}, ${client.healthAdjusterInfo.city || ''}, ${client.healthAdjusterInfo.state || ''} ${client.healthAdjusterInfo.zip_code || ''}`.trim()} />
                              )}
                            </div>
                          )}
                          {client.healthAdjusterId && !client.healthAdjusterInfo && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              <p className="text-xs text-gray-500">Adjuster ID: {client.healthAdjusterId}</p>
                              <p className="text-xs text-gray-400 italic">Adjuster details will be loaded from database</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No clients added</p>
        )}
      </Section>

      <Section title="Medical Providers" step={3}>
        {data.clients && data.clients.length > 0 ? (
          <div className="space-y-4">
            {data.clients.map((client, index) => {
              const clientProviders = (client.selectedProviders || [])
                .map(pid => providersMap.get(pid))
                .filter(Boolean) as MedicalProvider[];
              
              if (clientProviders.length === 0) return null;
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {client.firstName || ''} {client.lastName || ''} ({client.isDriver ? 'Driver' : `Passenger ${index}`})
                  </h4>
            <ul className="list-disc list-inside space-y-1">
                    {clientProviders.map(provider => {
                      return (
                        <li key={provider.id} className="text-sm text-gray-900 mb-2">
                          <div className="font-medium">{provider.name} ({provider.city})</div>
                        </li>
                      );
                    })}
            </ul>
                </div>
              );
            })}
            {data.clients.every(c => !c.selectedProviders || c.selectedProviders.length === 0) && (
              <p className="text-sm text-gray-500">No providers selected</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No providers selected</p>
        )}
      </Section>

      <Section title="Defendant Information" step={4}>
        {data.defendants && data.defendants.length > 0 ? (
        <div className="space-y-4">
            {data.defendants.map((defendant, index) => {
              const defIns = defendant.autoInsuranceId 
                ? defendantInsuranceMap.get(defendant.autoInsuranceId) : null;
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="text-base font-semibold text-gray-900 mb-3">
                    Defendant {index + 1} ({defendant.liabilityPercentage || 0}% Liability)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Name" value={`${defendant.firstName || ''} ${defendant.lastName || ''}`.trim()} />
                    <Field label="Liability Percentage" value={`${defendant.liabilityPercentage || 0}%`} />
                    <Field label="Is Policyholder" value={defendant.isPolicyholder ? 'Yes' : 'No'} />
                    {!defendant.isPolicyholder && (
                      <Field label="Policyholder" value={`${defendant.policyholderFirstName || ''} ${defendant.policyholderLastName || ''}`.trim()} />
                    )}
                    <Field label="Insurance Company" value={defIns?.name} />
                    <Field label="Policy Number" value={defendant.policyNumber} />
                    {defendant.claimNumber && <Field label="Claim Number" value={defendant.claimNumber} />}
                  </div>
                  
                  {(defendant.adjusterFirstName || defendant.adjusterLastName) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2">Adjuster Information</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field label="Adjuster Name" value={`${defendant.adjusterFirstName || ''} ${defendant.adjusterLastName || ''}`.trim()} />
                        {defendant.adjusterPhone && <Field label="Phone" value={defendant.adjusterPhone} />}
                        {defendant.adjusterEmail && <Field label="Email" value={defendant.adjusterEmail} />}
                        {defendant.adjusterMailingAddress && (
                          <Field label="Address" value={`${defendant.adjusterMailingAddress || ''}, ${defendant.adjusterCity || ''}, ${defendant.adjusterState || ''} ${defendant.adjusterZipCode || ''}`.trim()} />
                        )}
                      </div>
                    </div>
                  )}
                  
                  {defendant.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Field label="Notes" value={defendant.notes} />
                    </div>
            )}
          </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No defendants added</p>
        )}
      </Section>
    </div>
  );
}
