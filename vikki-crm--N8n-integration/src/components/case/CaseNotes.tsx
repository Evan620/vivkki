import { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, X, Save } from 'lucide-react';
import { supabase } from '../../utils/database';
import { formatDateTime } from '../../utils/caseUtils';
import { useConfirmDialog } from '../../hooks/useConfirmDialog.tsx';

interface CaseNotesProps {
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

interface Note {
  id: number;
  note_text: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export default function CaseNotes({ casefileId, onUpdate, onShowToast }: CaseNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const { confirm: confirmDelete, Dialog: ConfirmDialog } = useConfirmDialog();

  useEffect(() => {
    loadNotes();
  }, [casefileId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      // Try to load from case_notes table, fallback to empty if table doesn't exist
      let { data, error } = await supabase
        .from('case_notes')
        .select('*')
        .eq('casefile_id', casefileId)
        .order('created_at', { ascending: false });

      // If table doesn't exist, return empty array (don't show error)
      if (error && (
        error.code === '42P01' || 
        error.code === 'PGRST116' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('relation') ||
        error.message?.includes('no such table')
      )) {
        console.warn('case_notes table not found, returning empty notes');
        setNotes([]);
        return;
      }

      // Check for RLS policy errors (but don't fail completely)
      if (error && (error.message?.includes('row-level security') || error.message?.includes('policy'))) {
        console.warn('RLS policy issue with case_notes table:', error.message);
        setNotes([]);
        return;
      }

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error('Error loading notes:', error);
      // Don't show error if table doesn't exist yet or RLS issue
      const isTableMissing = error?.code === '42P01' || 
        error?.code === 'PGRST116' ||
        error?.message?.includes('does not exist') ||
        error?.message?.includes('relation') ||
        error?.message?.includes('no such table');
      
      const isRLSIssue = error?.message?.includes('row-level security') || 
        error?.message?.includes('policy');

      if (!isTableMissing && !isRLSIssue) {
        onShowToast('Failed to load notes', 'error');
      }
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingId(note.id);
    setEditText(note.note_text);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editText.trim()) {
      onShowToast('Note cannot be empty', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('case_notes')
        .update({ 
          note_text: editText.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
          onShowToast('Case notes table not found. Please run the database migration.', 'error');
          return;
        }
        // Check for RLS policy errors
        if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
          onShowToast('Permission denied. Please check database policies.', 'error');
          return;
        }
        throw error;
      }

      // Log to work_logs
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userName = user?.email || 'Admin';
        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: `Case note updated: ${editText.trim().substring(0, 100)}${editText.trim().length > 100 ? '...' : ''}`,
          timestamp: new Date().toISOString(),
          user_name: userName
        });
      } catch (logError) {
        console.warn('Failed to create work log entry for case note update:', logError);
      }

      onShowToast('Note updated successfully', 'success');
      setEditingId(null);
      setEditText('');
      loadNotes();
      onUpdate();
    } catch (error: any) {
      console.error('Error updating note:', error);
      // Don't show error if it's a table missing error (already handled above)
      if (!error?.code === '42P01' && !error?.message?.includes('does not exist')) {
        onShowToast('Failed to update note', 'error');
      }
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirmDelete(
      'Are you sure you want to delete this note?',
      { title: 'Delete Note', variant: 'danger' }
    );
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('case_notes')
        .delete()
        .eq('id', id);

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === '42P01' || error.code === 'PGRST116' || error.message?.includes('does not exist') || error.message?.includes('relation')) {
          onShowToast('Case notes table not found. Please run the database migration.', 'error');
          return;
        }
        // Check for RLS policy errors
        if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
          onShowToast('Permission denied. Please check database policies.', 'error');
          return;
        }
        throw error;
      }

      // Log to work_logs
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userName = user?.email || 'Admin';
        // Get note text before deletion for logging
        const noteToDelete = notes.find(n => n.id === id);
        const notePreview = noteToDelete ? noteToDelete.note_text.substring(0, 100) : 'Case note';
        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: `Case note deleted: ${notePreview}${noteToDelete && noteToDelete.note_text.length > 100 ? '...' : ''}`,
          timestamp: new Date().toISOString(),
          user_name: userName
        });
      } catch (logError) {
        console.warn('Failed to create work log entry for case note deletion:', logError);
      }

      onShowToast('Note deleted successfully', 'success');
      loadNotes();
      onUpdate();
    } catch (error: any) {
      console.error('Error deleting note:', error);
      // Don't show error if it's a table missing error (already handled above)
      if (!error?.code === '42P01' && !error?.message?.includes('does not exist')) {
        onShowToast('Failed to delete note', 'error');
      }
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      onShowToast('Please enter a note', 'error');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'Admin';

      const { error } = await supabase.from('case_notes').insert({
        casefile_id: casefileId,
        note_text: newNote.trim(),
        created_by: userName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      if (error) {
        // If table doesn't exist, show helpful message
        if (error.code === '42P01' || error.message?.includes('does not exist') || error.message?.includes('relation') || error.code === 'PGRST116') {
          onShowToast('Case notes feature requires database setup. Please run the migration.', 'error');
          setSaving(false);
          return;
        }
        // Check for RLS policy errors
        if (error.message?.includes('row-level security') || error.message?.includes('policy')) {
          onShowToast('Permission denied. Please check database policies.', 'error');
          setSaving(false);
          return;
        }
        throw error;
      }

      // Log to work_logs
      try {
        await supabase.from('work_logs').insert({
          casefile_id: casefileId,
          description: `Case note added: ${newNote.trim().substring(0, 100)}${newNote.trim().length > 100 ? '...' : ''}`,
          timestamp: new Date().toISOString(),
          user_name: userName
        });
      } catch (logError) {
        console.warn('Failed to create work log entry for case note:', logError);
      }

      onShowToast('Note added successfully', 'success');
      setNewNote('');
      setShowAddModal(false);
      loadNotes();
      onUpdate();
    } catch (error: any) {
      console.error('Error adding note:', error);
      // Don't show error if it's a table missing error (already handled above)
      if (!error?.code === '42P01' && !error?.message?.includes('does not exist')) {
        onShowToast('Failed to add note', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Case Notes</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No notes yet. Add your first note to get started.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {notes.map((note) => (
            <div
              key={note.id}
              className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors bg-gray-50"
            >
              {editingId === note.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Enter your note here..."
                    rows={4}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditText('');
                      }}
                      className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                  <>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed mb-3">{note.note_text}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap pt-2 border-t border-gray-200">
                          <span className="font-medium">Created: {formatDateTime(note.created_at)}</span>
                          {note.updated_at !== note.created_at && (
                            <>
                              <span>•</span>
                              <span className="font-medium">Updated: {formatDateTime(note.updated_at)}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="font-medium">{note.created_by}</span>
                        </div>
                      </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(note)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit note"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Note</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewNote('');
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={saving}
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here... Add any important information, reminders, or updates about this case."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
                autoFocus
              />

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewNote('');
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {ConfirmDialog}
    </div>
  );
}

