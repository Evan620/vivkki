import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { createApiKey, listApiKeys, setApiKeyActive, deleteApiKey, updateApiKeyRateLimit, ApiKeyRow } from '../utils/api/apiKeyManagement';
import { Clipboard, Plus, ToggleLeft, ToggleRight, Trash2, RefreshCw, Shield } from 'lucide-react';
import { useConfirmDialog } from '../hooks/useConfirmDialog.tsx';
import { useAlertDialog } from '../hooks/useAlertDialog.tsx';

interface ActionState {
  loading: boolean;
  message?: string;
  error?: string;
}

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<ActionState>({ loading: false });
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const { alert, Dialog: AlertDialog } = useAlertDialog();

  const loadKeys = async () => {
    setLoading(true);
    const result = await listApiKeys();
    if (result.success && result.keys) {
      setKeys(result.keys);
    } else {
      setAction({ loading: false, error: result.error || 'Failed to load API keys' });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleGenerate = async () => {
    setAction({ loading: true });
    const result = await createApiKey('My API Key', 100, null);
    if (result.success && result.apiKey) {
      setPlainKey(result.apiKey);
      setShowCopyConfirm(true);
      await loadKeys();
      setAction({ loading: false, message: 'API key created. Copy it now; it will not be shown again.' });
    } else {
      setAction({ loading: false, error: result.error || 'Failed to create API key' });
    }
  };

  const handleToggle = async (keyId: number, isActive: boolean) => {
    setAction({ loading: true });
    const result = await setApiKeyActive(keyId, !isActive);
    if (result.success) {
      await loadKeys();
      setAction({ loading: false });
    } else {
      setAction({ loading: false, error: result.error || 'Failed to update key status' });
    }
  };

  const handleDelete = async (keyId: number) => {
    const confirmed = await confirm('Delete this API key? This cannot be undone.', { title: 'Delete API Key', variant: 'danger' });
    if (!confirmed) return;
    setAction({ loading: true });
    const result = await deleteApiKey(keyId);
    if (result.success) {
      await loadKeys();
      setAction({ loading: false });
    } else {
      setAction({ loading: false, error: result.error || 'Failed to delete key' });
    }
  };

  const handleUpdateRateLimit = async (keyId: number, current: number) => {
    const input = prompt('Set hourly rate limit for this key:', String(current));
    if (!input) return;
    const value = parseInt(input, 10);
    if (Number.isNaN(value) || value <= 0) {
      await alert('Please enter a valid positive integer.', { title: 'Invalid Input', variant: 'error' });
      return;
    }
    setAction({ loading: true });
    const result = await updateApiKeyRateLimit(keyId, value);
    if (result.success) {
      await loadKeys();
      setAction({ loading: false, message: 'Rate limit updated' });
    } else {
      setAction({ loading: false, error: result.error || 'Failed to update rate limit' });
    }
  };

  const copyPlainKey = async () => {
    if (!plainKey) return;
    await navigator.clipboard.writeText(plainKey);
    setShowCopyConfirm(false);
    await alert('API key copied. Store it securely; it will not be shown again.', { title: 'API Key Copied', variant: 'success' });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
            <p className="text-sm text-gray-600">
              Generate and manage API keys. Keys are shown only once on creation.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadKeys}
              disabled={loading || action.loading}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={handleGenerate}
              disabled={action.loading}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Generate API Key
            </button>
          </div>
        </div>

        {plainKey && showCopyConfirm && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900">Your new API key (copy now)</p>
                <p className="mt-1 font-mono text-sm text-blue-800 break-all">{plainKey}</p>
              </div>
              <button
                onClick={copyPlainKey}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Clipboard className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>
        )}

        {action.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {action.error}
          </div>
        )}
        {action.message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {action.message}
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 bg-gray-50">
            <div className="col-span-3">Name</div>
            <div className="col-span-2">Created</div>
            <div className="col-span-2">Last Used</div>
            <div className="col-span-2">Rate Limit</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {loading ? (
            <div className="p-4 text-sm text-gray-600">Loading keys...</div>
          ) : keys.length === 0 ? (
            <div className="p-4 text-sm text-gray-600">No API keys yet. Generate one to get started.</div>
          ) : (
            keys.map((key) => (
              <div
                key={key.id}
                className="grid grid-cols-12 px-4 py-3 text-sm items-center border-t border-gray-100"
              >
                <div className="col-span-3">
                  <p className="font-medium text-gray-900">{key.name}</p>
                  <p className="text-xs text-gray-500">Expires: {key.expires_at || 'None'}</p>
                </div>
                <div className="col-span-2 text-gray-700">{new Date(key.created_at).toLocaleString()}</div>
                <div className="col-span-2 text-gray-700">
                  {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                </div>
                <div className="col-span-2 text-gray-700">
                  {key.rate_limit_per_hour} / hour{' '}
                  <button
                    onClick={() => handleUpdateRateLimit(key.id, key.rate_limit_per_hour)}
                    className="ml-2 text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      key.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {key.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleToggle(key.id, key.is_active)}
                    className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                    title={key.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {key.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-2 rounded-lg border border-gray-200 text-red-600 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-semibold mb-2">How to use your API key</p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              Add header: <code className="font-mono">Authorization: Bearer YOUR_API_KEY</code>
            </li>
            <li>
              Add header: <code className="font-mono">apikey: YOUR_SUPABASE_ANON_KEY</code>
            </li>
            <li>
              Endpoint: <code className="font-mono">/functions/v1/create-case</code>
            </li>
            <li>Keep the key secure; you can view it only at creation time.</li>
          </ul>
        </div>
      </div>
      <ConfirmDialog />
      <AlertDialog />
    </Layout>
  );
}

