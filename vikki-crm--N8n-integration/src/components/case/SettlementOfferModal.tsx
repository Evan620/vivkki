import { useState, useEffect } from 'react';
import { DollarSign, Calendar, User, FileText } from 'lucide-react';
import Modal from '../common/Modal';

interface SettlementOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (offerData: any) => void;
  editingOffer?: any;
}

export default function SettlementOfferModal({
  isOpen,
  onClose,
  onSubmit,
  editingOffer
}: SettlementOfferModalProps) {
  const [formData, setFormData] = useState({
    offer_date: '',
    offer_amount: '',
    offered_by: '',
    notes: ''
  });

  useEffect(() => {
    if (editingOffer) {
      setFormData({
        offer_date: editingOffer.offer_date || '',
        offer_amount: editingOffer.offer_amount?.toString() || '',
        offered_by: editingOffer.offered_by || '',
        notes: editingOffer.notes || ''
      });
    } else {
      setFormData({
        offer_date: new Date().toISOString().split('T')[0],
        offer_amount: '',
        offered_by: '',
        notes: ''
      });
    }
  }, [editingOffer, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.offer_date || !formData.offer_amount || !formData.offered_by) {
      return;
    }

    onSubmit({
      offer_date: formData.offer_date,
      offer_amount: parseFloat(formData.offer_amount),
      offered_by: formData.offered_by,
      notes: formData.notes
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingOffer ? 'Edit Settlement Offer' : 'Add Settlement Offer'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Offer Amount */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <DollarSign className="w-4 h-4" />
            Offer Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.offer_amount}
              onChange={(e) => handleChange('offer_amount', e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Offered By */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <User className="w-4 h-4" />
            Offered By
          </label>
          <input
            type="text"
            value={formData.offered_by}
            onChange={(e) => handleChange('offered_by', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Insurance adjuster name or company"
            required
          />
        </div>

        {/* Offer Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar className="w-4 h-4" />
            Offer Date
          </label>
          <input
            type="date"
            value={formData.offer_date}
            onChange={(e) => handleChange('offer_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <FileText className="w-4 h-4" />
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes about the offer..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            {editingOffer ? 'Update Offer' : 'Add Offer'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
