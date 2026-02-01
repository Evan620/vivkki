import { useState, useEffect, useMemo } from 'react';
import { useConfirmDialog } from '../hooks/useConfirmDialog.tsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/layout/PageHeader';
import BreadcrumbNav from '../components/layout/BreadcrumbNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Search, Trash2, Eye, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchHealthAdjusters, deleteHealthAdjuster } from '../utils/database';
import Toast from '../components/common/Toast';

export default function HealthAdjusters() {
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const navigate = useNavigate();
  const [adjusters, setAdjusters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAdjusters, setFilteredAdjusters] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAdjusters();
  }, []);

  const fetchAdjusters = async () => {
    setIsLoading(true);
    try {
      const data = await fetchHealthAdjusters();
      setAdjusters(data || []);
    } catch (error) {
      console.error('Error fetching health adjusters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedAdjusters = useMemo(() => {
    let filtered = adjusters;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        (a.first_name || '').toLowerCase().includes(query) ||
        (a.last_name || '').toLowerCase().includes(query) ||
        (a.middle_name || '').toLowerCase().includes(query) ||
        (a.email || '').toLowerCase().includes(query) ||
        (a.phone || '').includes(query) ||
        (a.health_insurance?.name || '').toLowerCase().includes(query)
      );
    }

    // Group by health insurance company
    const groups: Record<string, any[]> = {};
    filtered.forEach(adj => {
      const groupKey = adj.health_insurance?.name || 'Unassigned';
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(adj);
    });

    // Sort adjusters within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
    });

    return groups;
  }, [adjusters, searchQuery]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  return (
    <DashboardLayout>
      <BreadcrumbNav 
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Health Insurance', href: '/health-insurance' },
          { label: 'Adjusters' }
        ]} 
        className="mb-4" 
      />
      
      <PageHeader 
        title="Health Insurance Adjusters" 
        description="Manage health insurance adjusters"
      >
        <Button size="sm" className="gap-2" onClick={() => navigate('/health-adjusters/new')}>
          <Plus className="h-4 w-4" />
          Add Adjuster
        </Button>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center border rounded-md px-3 py-2 bg-white">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or insurance company..."
              className="flex-1 ml-2 bg-transparent border-0 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Health Insurance Adjusters</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading adjusters...</p>
          </div>
        ) : Object.keys(groupedAdjusters).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedAdjusters).map(([groupName, adjustersInGroup]) => {
              const isExpanded = expandedGroups.has(groupName) || expandedGroups.size === 0;
              return (
                <Card key={groupName} className="shadow-sm">
                  <CardHeader 
                    className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleGroup(groupName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg font-semibold text-gray-900">
                          {groupName}
                        </CardTitle>
                        <span className="text-sm text-gray-500 font-medium">
                          ({adjustersInGroup.length} {adjustersInGroup.length === 1 ? 'adjuster' : 'adjusters'})
                        </span>
                      </div>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(groupName);
                        }}
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {adjustersInGroup.map((adjuster) => (
                          <Card 
                            key={adjuster.id} 
                            className="hover-lift cursor-pointer group border border-gray-200"
                            onClick={() => navigate(`/health-adjusters/${adjuster.id}`)}
                          >
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base group-hover:text-blue-700">
                                {adjuster.first_name} {adjuster.middle_name ? `${adjuster.middle_name} ` : ''}{adjuster.last_name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {adjuster.email && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <strong>Email:</strong> {adjuster.email}
                                </p>
                              )}
                              {adjuster.phone && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <strong>Phone:</strong> {adjuster.phone}
                                </p>
                              )}
                              {adjuster.fax && (
                                <p className="text-sm text-gray-600 mb-1">
                                  <strong>Fax:</strong> {adjuster.fax}
                                </p>
                              )}
                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/health-adjusters/${adjuster.id}`);
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
                                    const yes = await confirm(`Delete adjuster "${adjuster.first_name} ${adjuster.last_name}"?`, { title: 'Delete Adjuster', variant: 'danger' });
                                    if (!yes) return;
                                    try {
                                      const ok = await deleteHealthAdjuster(adjuster.id);
                                      if (ok) {
                                        setAdjusters(prev => prev.filter(a => a.id !== adjuster.id));
                                        setToast({ message: 'Adjuster deleted successfully', type: 'success' });
                                      } else {
                                        setToast({ message: 'Failed to delete. Please try again.', type: 'error' });
                                      }
                                    } catch (e) {
                                      console.error('Delete health adjuster failed', e);
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
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border">
            <p className="text-gray-500">No adjusters found</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/health-adjusters/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Adjuster
            </Button>
          </div>
        )}
      </div>

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

