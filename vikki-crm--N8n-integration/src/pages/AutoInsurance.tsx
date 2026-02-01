import { useState, useEffect } from 'react';
import { useConfirmDialog } from '../hooks/useConfirmDialog.tsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/layout/PageHeader';
import BreadcrumbNav from '../components/layout/BreadcrumbNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Search, Trash2, Eye, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAutoInsurers, fetchAutoAdjusters } from '../utils/database';
import AddAutoInsuranceModal from '@/components/forms/AddAutoInsuranceModal';
import Toast from '../components/common/Toast';

// Placeholder for auto insurance components
// These will be implemented in Phase 4

export default function AutoInsurance() {
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const navigate = useNavigate();
  const [insurers, setInsurers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [filteredInsurers, setFilteredInsurers] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [insurerAdjusters, setInsurerAdjusters] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchInsurers = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAutoInsurers();
        setInsurers(data || []);
        
        // Fetch adjusters for all insurers
        if (data && data.length > 0) {
          const adjustersMap: Record<number, any[]> = {};
          const allAdjusters = await fetchAutoAdjusters(false);
          
          // Group adjusters by insurance ID
          data.forEach((insurer: any) => {
            adjustersMap[insurer.id] = allAdjusters.filter(adj => adj.auto_insurance_id === insurer.id);
          });
          
          setInsurerAdjusters(adjustersMap);
        }
      } catch (error) {
        console.error('Error fetching auto insurers:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInsurers();
    }, []);

  useEffect(() => {
    let filtered = insurers;
    if (searchQuery) {
      filtered = filtered.filter(i => (i.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (i.phone || '').includes(searchQuery));
    }
    if (stateFilter) {
      filtered = filtered.filter(i => (i.state || '').toLowerCase() === stateFilter.toLowerCase());
    }
    setFilteredInsurers(filtered);
  }, [insurers, searchQuery, stateFilter]);

  return (
    <DashboardLayout>
      <BreadcrumbNav 
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Auto Insurance' }
        ]} 
        className="mb-4" 
      />
      
      <PageHeader 
        title="Auto Insurance" 
        description="Manage auto insurance companies"
      >
        <div className="flex gap-2">
          <Button size="sm" className="gap-2" onClick={() => navigate('/auto-adjusters')}>
            <Plus className="h-4 w-4" />
            Adjusters
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Insurance
          </Button>
        </div>
      </PageHeader>

        <Card className="mb-6">
        <CardHeader>
            <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
              <div className="flex items-center border rounded-md px-3 py-2 bg-white">
                <Search className="h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by company name or phone..."
                  className="flex-1 ml-2 bg-transparent border-0 focus:outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <select
                    value={stateFilter}
                    onChange={(e) => setStateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All States</option>
                    <option value="OK">Oklahoma</option>
                    <option value="IA">Iowa</option>
                    <option value="MO">Missouri</option>
                    <option value="National">National</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => { setSearchQuery(''); setStateFilter(''); }}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Insurance Companies</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading insurance companies...</p>
          </div>
        ) : filteredInsurers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInsurers.map((insurer) => (
              <Card 
                key={insurer.id} 
                className="hover-lift cursor-pointer group"
                onClick={() => navigate(`/auto-insurance/${insurer.id}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg group-hover:text-blue-700">{insurer.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {insurer.phone_1 || insurer.phone || 'No phone number'}
                  </p>
                  {insurer.state && <p className="text-sm text-gray-500">{insurer.state}</p>}
                  {insurerAdjusters[insurer.id] && insurerAdjusters[insurer.id].length > 0 && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                      <Users className="h-3 w-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">
                        {insurerAdjusters[insurer.id].length} {insurerAdjusters[insurer.id].length === 1 ? 'adjuster' : 'adjusters'}
                      </span>
                    </div>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/auto-insurance/${insurer.id}`);
                      }}
                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const yes = await confirm(`Delete "${insurer.name}"?`, { title: 'Delete Insurer', variant: 'danger' });
                        if (!yes) return;
                        try {
                          const { deleteAutoInsurer } = await import('../utils/database');
                          const source = insurer._source || 'auto_insurance'; // 'complete' or 'basic'
                          const result = await deleteAutoInsurer(insurer.id, source);
                          if (result.success) {
                            setInsurers(prev => prev.filter(i => i.id !== insurer.id));
                            setToast({ message: 'Insurance company deleted successfully', type: 'success' });
                          } else {
                            const errorMsg = result.error || 'Unknown error';
                            console.error('Delete failed:', errorMsg);
                            // Provide user-friendly messages
                            if (errorMsg.includes('row-level security') || errorMsg.includes('policy')) {
                              setToast({ 
                                message: 'Permission denied. Please run the SQL migration to enable delete permissions.', 
                                type: 'error' 
                              });
                            } else if (errorMsg.includes('not found')) {
                              setToast({ 
                                message: 'Record not found. It may have already been deleted.', 
                                type: 'error' 
                              });
                            } else {
                              setToast({ 
                                message: 'Failed to delete. Please try again or check console for details.', 
                                type: 'error' 
                              });
                            }
                          }
                        } catch (e) {
                          console.error('Delete auto insurer failed', e);
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
          <div className="text-center py-8 bg-gray-50 rounded-lg border">
            <p className="text-gray-500">No insurance companies found</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Insurance Company
            </Button>
          </div>
        )}
      </div>

      <AddAutoInsuranceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={async () => {
          setIsAddModalOpen(false);
          setIsLoading(true);
          const data = await fetchAutoInsurers();
          setInsurers(data || []);
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
