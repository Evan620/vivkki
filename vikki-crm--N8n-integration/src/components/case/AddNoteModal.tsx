import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../utils/database';

interface AddNoteModalProps {
  casefileId: number;
  onClose: () => void;
  onSuccess: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function AddNoteModal({ casefileId, onClose, onSuccess, onShowToast }: AddNoteModalProps) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim()) {
      onShowToast('Please enter a note', 'error');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: note.trim(),
        user_name: 'Admin'
      });

      if (error) throw error;

      // Auto-update case status to Active
      await supabase
        .from('casefiles')
        .update({ status: 'Active', updated_at: new Date().toISOString() })
        .eq('id', casefileId);

      onShowToast('Note added successfully', 'success');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error adding note:', error);
      onShowToast('Failed to add note', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Note</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={saving}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Enter your note..."
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={saving}
            autoFocus
          />

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
