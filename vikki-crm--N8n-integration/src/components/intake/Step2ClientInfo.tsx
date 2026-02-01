import { useState } from 'react';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import ClientFormSection from './ClientFormSection';
import type { IntakeFormData, FormErrors, ClientFormData } from '../../types/intake';

interface Step2Props {
  data: IntakeFormData;
  errors: FormErrors;
  onChange: (field: keyof IntakeFormData, value: any) => void;
}

const createEmptyClient = (): ClientFormData => ({
  isDriver: false,
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
  hasHealthInsurance: false,
  healthInsuranceId: 0,
  healthMemberId: '',
  // Client relationship fields
  relationshipToPrimary: '',
  usesPrimaryAddress: false,
  usesPrimaryPhone: false
});

export default function Step2ClientInfo({ data, errors, onChange }: Step2Props) {
  const [expandedClient, setExpandedClient] = useState<number>(0);

  // Ensure we have at least one client, and mark first one as driver
  const clients = data.clients.length > 0 ? data.clients : [{ ...createEmptyClient(), isDriver: true }];

  // Handle "How many people" dropdown
  const handlePeopleCountChange = (count: number) => {
    const currentCount = clients.length;
    
    if (count > currentCount) {
      // Add more clients
      const newClients = [];
      for (let i = currentCount; i < count; i++) {
        const newClient = createEmptyClient();
        // First client is driver
        if (i === 0) {
          newClient.isDriver = true;
        }
        newClients.push(newClient);
      }
      onChange('clients', [...clients, ...newClients]);
    } else if (count < currentCount) {
      // Remove extra clients
      const updatedClients = clients.slice(0, count);
      onChange('clients', updatedClients);
      
      // Adjust expanded if needed
      if (expandedClient >= count) {
        setExpandedClient(count - 1);
      }
    }
  };

  const handleClientChange = (index: number, field: keyof ClientFormData | Partial<ClientFormData>, value?: any) => {
    const updatedClients = [...clients];
    
    // If field is an object, merge all fields at once
    if (typeof field === 'object' && field !== null) {
      updatedClients[index] = { ...updatedClients[index], ...field };
    } else {
      // Single field update
      updatedClients[index] = { ...updatedClients[index], [field as keyof ClientFormData]: value };
    }
    
    onChange('clients', updatedClients);
  };

  const handleRemoveClient = (index: number) => {
    if (clients.length <= 1) return; // Don't allow removing the last client
    
    const updatedClients = clients.filter((_, i) => i !== index);
    onChange('clients', updatedClients);
    
    // Adjust expanded client if needed
    if (expandedClient >= index) {
      setExpandedClient(Math.max(0, expandedClient - 1));
    }
  };

  const getDriverCount = () => {
    return clients.filter(client => client.isDriver).length;
  };

  const getClientSummary = () => {
    const driverCount = getDriverCount();
    const totalClients = clients.length;
    
    if (totalClients === 1) {
      return clients[0].firstName && clients[0].lastName 
        ? `${clients[0].firstName} ${clients[0].lastName}`
        : '1 client';
    }
    
    return `${totalClients} clients (${driverCount} driver${driverCount !== 1 ? 's' : ''})`;
  };

  // Get all validation errors for this step
  const getValidationErrors = () => {
    const stepErrors = Object.keys(errors).filter(key => 
      key.startsWith('clients.') || key === 'clients'
    );
    return stepErrors;
  };

  const validationErrors = getValidationErrors();
  const hasErrors = validationErrors.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with "How many people" dropdown */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Client Information</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many people are we representing? <span className="text-red-500">*</span>
              </label>
              <select
                value={clients.length}
                onChange={(e) => handlePeopleCountChange(parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
              >
                <option value="1">1 person</option>
                <option value="2">2 people</option>
                <option value="3">3 people</option>
                <option value="4">4 people</option>
                <option value="5">5 people</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select the total number of people injured in this case
              </p>
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Current Summary
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-900">{getClientSummary()}</p>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Validation Error Summary */}
      {hasErrors && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900 mb-2">
                Please fix the following errors to continue:
              </h3>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((errorKey, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span>{errors[errorKey]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {!hasErrors && clients.some(c => c.firstName && c.lastName) && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">
              <strong>All required fields completed!</strong> You can proceed to the next step.
            </p>
            </div>
            </div>
      )}

      {getDriverCount() > 1 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Multiple drivers detected. This may indicate a multi-vehicle accident or shared driving responsibility.
            </p>
          </div>
        </div>
      )}

      {/* Client Forms */}
        <div className="space-y-4">
        {clients.map((client, index) => (
          <ClientFormSection
            key={index}
            client={client}
            index={index}
            totalClients={clients.length}
            allClients={clients}
            onChange={handleClientChange}
            onRemove={handleRemoveClient}
            errors={errors}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Instructions:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Add all clients who were injured in the accident</li>
          <li>• Mark the driver(s) of the vehicle(s) involved</li>
          <li>• Each client can have different injuries and contact information</li>
          <li>• Health insurance information is collected per client</li>
          <li>• At least one client must be designated as a driver</li>
        </ul>
      </div>
    </div>
  );
}
