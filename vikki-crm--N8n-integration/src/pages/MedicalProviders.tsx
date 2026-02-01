import { useState, useEffect } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/layout/PageHeader';
import BreadcrumbNav from '../components/layout/BreadcrumbNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Search, Trash2, Eye, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchMedicalProviders } from '../utils/database';
import AddProviderModal from '../components/forms/AddProviderModal';
import Toast from '../components/common/Toast';
import { useConfirmDialog } from '../hooks/useConfirmDialog.tsx';

// Placeholder for provider components
// These will be implemented in Phase 3

export default function MedicalProviders() {
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [filteredProviders, setFilteredProviders] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      setIsLoading(true);
      try {
        const data = await fetchMedicalProviders();
        setProviders(data || []);
      } catch (error) {
        console.error('Error fetching providers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProviders();
    }, []);

  useEffect(() => {
    let filtered = providers;
    if (searchQuery) {
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.phone || '').includes(searchQuery)
      );
    }
    if (typeFilter) {
      filtered = filtered.filter(p => (p.type || '').toLowerCase() === typeFilter.toLowerCase());
    }
    if (stateFilter) {
      filtered = filtered.filter(p => (p.state || '').toLowerCase() === stateFilter.toLowerCase());
    }
    // Sort alphabetically by name (case-insensitive)
    filtered.sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    setFilteredProviders(filtered);
  }, [providers, searchQuery, typeFilter, stateFilter]);

  return (
    <DashboardLayout>
      <BreadcrumbNav 
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Medical Providers' }
        ]} 
        className="mb-4" 
      />
      
      <PageHeader 
        title="Medical Providers" 
        description="Manage your medical provider network"
      >
        <Button size="sm" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Provider
        </Button>
      </PageHeader>

        <Card className="mb-6 shadow-sm">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              <div className="flex items-center border-2 border-gray-200 rounded-lg px-4 py-3 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
                <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, city, or phone..."
                  className="flex-1 ml-3 bg-transparent border-0 focus:outline-none text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all"
                  >
                    <option value="">All Types</option>
                    <option value="chiropractic">Chiropractic</option>
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                    <option value="physical therapy">Physical Therapy</option>
                    <option value="imaging">Imaging</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all"
                  >
                    <option value="">All States</option>
                    <option value="OK">Oklahoma</option>
                    <option value="IA">Iowa</option>
                    <option value="MO">Missouri</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => { setSearchQuery(''); setTypeFilter(''); setStateFilter(''); }}
                    className="w-full"
                    disabled={!searchQuery && !typeFilter && !stateFilter}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Provider List</CardTitle>
            {!isLoading && filteredProviders.length > 0 && (
              <span className="text-sm text-gray-500 font-medium">
                {filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        ) : filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProviders.map((provider) => (
              <Card 
                key={provider.id} 
                  className="transition-all duration-200 hover:shadow-lg hover:border-blue-300 cursor-pointer group border-2 border-transparent"
                onClick={() => navigate(`/medical-providers/${provider.id}`)}
              >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-1">
                      {provider.name}
                    </CardTitle>
                </CardHeader>
                  <CardContent className="space-y-2">
                    {provider.type && (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {provider.type}
                        </span>
                      </div>
                    )}
                    <div className="space-y-1 text-sm text-gray-600">
                      {(provider.city || provider.state) && (
                        <p className="flex items-center gap-1">
                          <span className="text-gray-400">📍</span>
                          <span>{[provider.city, provider.state || 'OK'].filter(Boolean).join(', ')}</span>
                        </p>
                      )}
                      {(provider.phone_1 || provider.phone) && (
                        <p className="flex items-center gap-1">
                          <span className="text-gray-400">📞</span>
                          <span>{provider.phone_1 || provider.phone}</span>
                        </p>
                      )}
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/medical-providers/${provider.id}`);
                      }}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                        title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Delete Provider"
                      onClick={async (e) => {
                        e.stopPropagation();
                          const yes = await confirm(`Delete "${provider.name}"?`, { title: 'Delete Provider', variant: 'danger' });
                        if (!yes) return;
                        try {
                          const { deleteMedicalProvider } = await import('../utils/database');
                          const ok = await deleteMedicalProvider(provider.id);
                          if (ok) {
                            setProviders(prev => prev.filter(p => p.id !== provider.id));
                            setToast({ message: 'Medical provider deleted successfully', type: 'success' });
                          } else {
                            setToast({ message: 'Failed to delete. Please try again or check console for details.', type: 'error' });
                          }
                        } catch (e) {
                          console.error('Delete provider failed', e);
                          setToast({ 
                            message: `Delete failed: ${e instanceof Error ? e.message : 'Unknown error'}`, 
                            type: 'error' 
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No providers found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || typeFilter || stateFilter 
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by adding your first medical provider.'}
              </p>
              {providers.length === 0 ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4" 
                  onClick={() => setIsAddModalOpen(true)}
                >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Provider
            </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4" 
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Provider
                </Button>
              )}
          </div>
        )}
        </CardContent>
      </Card>

      <AddProviderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async () => {
          setIsAddModalOpen(false);
          setToast({ message: 'Medical provider added successfully', type: 'success' });
          setIsLoading(true);
          const data = await fetchMedicalProviders();
          setProviders(data || []);
          setIsLoading(false);
        }}
      />
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {ConfirmDialog}
    </DashboardLayout>
  );
}
