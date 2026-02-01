import { useState } from 'react';
import { X, FileText, Loader2, Download } from 'lucide-react';
import Modal from '../common/Modal';
import { generateHipaaRequest } from '../../utils/documentAutomation';

interface GenerateHipaaModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicalBills: any[];
  clientData: any;
  casefileId: number;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function GenerateHipaaModal({
  isOpen,
  onClose,
  medicalBills,
  clientData,
  casefileId,
  onShowToast
}: GenerateHipaaModalProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  const providers = medicalBills.map(bill => ({
    id: bill.medical_provider_id,
    name: bill.medical_provider?.name || 'Unknown Provider',
    type: bill.medical_provider?.type || '',
    city: bill.medical_provider?.city || ''
  }));

  const uniqueProviders = providers.filter((provider, index, self) =>
    index === self.findIndex((p) => p.id === provider.id)
  );

  const handleGenerate = async () => {
    if (!selectedProviderId) {
      onShowToast('Please select a medical provider', 'error');
      return;
    }

    const selectedProvider = uniqueProviders.find(p => p.id.toString() === selectedProviderId);
    if (!selectedProvider) {
      onShowToast('Provider not found', 'error');
      return;
    }

    setGenerating(true);

    try {
      const result = await generateHipaaRequest({
        casefileId,
        clientData,
        providerData: selectedProvider
      });

      if (result.success) {
        onShowToast('HIPAA request generated successfully!', 'success');
        onClose();
        setSelectedProviderId('');
      } else {
        onShowToast(result.error || 'Failed to generate HIPAA request', 'error');
      }
    } catch (error) {
      console.error('Error generating HIPAA request:', error);
      onShowToast('Failed to generate HIPAA request', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    if (!generating) {
      setSelectedProviderId('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="min-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Generate HIPAA Request</h2>
              <p className="text-sm text-gray-500">Create medical records authorization</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={generating}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto">

          {/* Patient Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Patient Information</h4>
                <p className="text-sm text-blue-800">
                  <strong>{clientData.first_name} {clientData.last_name}</strong>
                  <br />
                  DOB: {clientData.date_of_birth || 'Not provided'}
                  <br />
                  {clientData.street_address && `${clientData.street_address}, `}
                  {clientData.city && `${clientData.city}, `}
                  {clientData.state} {clientData.zip_code}
                </p>
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-900">
              Select Medical Provider *
            </label>
            <select
              value={selectedProviderId}
              onChange={(e) => setSelectedProviderId(e.target.value)}
              disabled={generating}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">-- Choose a provider --</option>
              {uniqueProviders.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name} - {provider.type} ({provider.city})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600">
              This will generate a HIPAA-compliant authorization form for requesting medical records
            </p>
          </div>

          {/* Info Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 text-sm mb-3">What will be generated:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold text-sm">✓</span>
                <span className="text-sm text-gray-700">HIPAA-compliant authorization form</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold text-sm">✓</span>
                <span className="text-sm text-gray-700">Patient demographic information</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold text-sm">✓</span>
                <span className="text-sm text-gray-700">Provider contact information</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 font-bold text-sm">✓</span>
                <span className="text-sm text-gray-700">Signature fields for patient authorization</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={generating}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedProviderId}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Generate Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
