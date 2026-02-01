import { useState, useEffect } from 'react';
import Modal from './Modal';

interface AddInsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, savePermanently: boolean, phone?: string, city?: string, state?: string) => void;
  type: 'health' | 'auto';
  title: string;
}

export default function AddInsuranceModal({
  isOpen,
  onClose,
  onSave,
  type,
  title
}: AddInsuranceModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('OK');
  const [savePermanently, setSavePermanently] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setPhone('');
      setCity('');
      setState('OK');
      setSavePermanently(true);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter a company name');
      return;
    }
    if (type === 'health' && !phone.trim() && savePermanently) {
      setError('Phone number is required for health insurance');
      return;
    }
    onSave(name.trim(), savePermanently, phone.trim() || '', city.trim() || '', state.trim() || 'OK');
  };

  const handleCancel = () => {
    setName('');
    setPhone('');
    setCity('');
    setState('OK');
    setSavePermanently(true);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title}>
      <div className="p-6 sm:p-8">
        <div className="space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-md bg-red-50 text-red-700 text-sm border border-red-200 text-left">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base text-gray-900 placeholder-gray-400"
              placeholder={`Enter ${type === 'health' ? 'health' : 'auto'} insurance company name`}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {type === 'health' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Phone {savePermanently && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base text-gray-900 placeholder-gray-400"
                    placeholder="(405) 555-0000"
                    required={savePermanently}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base text-gray-900 placeholder-gray-400"
                    placeholder="Oklahoma City"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base text-gray-900 placeholder-gray-400"
                    placeholder="(405) 555-1111"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base text-gray-900 placeholder-gray-400"
                    placeholder="Oklahoma City"
                  />
                </div>
              </>
            )}
          </div>

          {type === 'health' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base text-gray-900 placeholder-gray-400"
                placeholder="OK"
              />
            </div>
          )}

          {type === 'auto' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
                State
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-base text-gray-900 placeholder-gray-400"
                placeholder="OK"
              />
            </div>
          )}

          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <input
              type="checkbox"
              id="savePermanently"
              checked={savePermanently}
              onChange={(e) => setSavePermanently(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="savePermanently" className="text-sm text-gray-700 cursor-pointer">
              Save permanently to database
            </label>
          </div>

          {!savePermanently && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-xs text-orange-800">
                <strong>Note:</strong> This will be added temporarily for this intake only. It will be saved to the database when you submit the form.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors text-base"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors text-base"
            >
              Add {type === 'health' ? 'Health' : 'Auto'} Insurance
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

