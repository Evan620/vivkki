import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import { supabase } from '../../utils/database';
import { handleError } from '../../utils/errorHandler';

interface AddProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: number;
  casefileId: number;
  existingProviderIds: number[];
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function AddProviderModal({
  isOpen,
  onClose,
  clientId,
  casefileId,
  existingProviderIds,
  onUpdate,
  onShowToast
}: AddProviderModalProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProviders();
      setSelectedProviderId('');
      setSearchTerm('');
    }
  }, [isOpen]);

  const fetchProviders = async () => {
    const { data, error } = await supabase
      .from('medical_providers')
      .select('*')
      .order('name');

    if (!error && data) {
      const available = data.filter(p => !existingProviderIds.includes(p.id));
      setProviders(available);
    }
  };

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = async () => {
    if (!selectedProviderId) {
      onShowToast('Please select a provider', 'error');
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from('medical_bills')
        .insert({
          client_id: clientId,
          medical_provider_id: parseInt(selectedProviderId),
          hipaa_sent: false,
          bill_received: false,
          records_received: false,
          lien_filed: false,
          in_collections: false,
          total_billed: 0,
          insurance_paid: 0,
          insurance_adjusted: 0
        });

      if (error) throw error;

      // Auto-update case status to Active
      await supabase
        .from('casefiles')
        .update({ status: 'Active', updated_at: new Date().toISOString() })
        .eq('id', casefileId);

      const provider = providers.find(p => p.id === parseInt(selectedProviderId));
      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: `Added ${provider?.name} to case`,
        timestamp: new Date().toISOString(),
        user_name: 'Admin'
      });

      onShowToast('Medical provider added successfully', 'success');
      onUpdate();
      onClose();
    } catch (error) {
      const errorMessage = handleError(error, 'Add Medical Provider');
      onShowToast(errorMessage, 'error');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Medical Provider to Case">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Providers
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, city, or type..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Provider <span className="text-red-500">*</span>
          </label>
          <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
            {filteredProviders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                {searchTerm ? 'No providers match your search' : 'No available providers to add'}
              </p>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredProviders.map((provider) => (
                  <label
                    key={provider.id}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="provider"
                      value={provider.id}
                      checked={selectedProviderId === provider.id.toString()}
                      onChange={(e) => setSelectedProviderId(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{provider.name}</p>
                      <p className="text-xs text-gray-500">
                        {provider.city ? `${provider.city} - ` : ''}{provider.type || 'Unknown Type'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={adding}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={adding || !selectedProviderId}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding && <Loader2 className="w-4 h-4 animate-spin" />}
            {adding ? 'Adding...' : 'Add Provider'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
