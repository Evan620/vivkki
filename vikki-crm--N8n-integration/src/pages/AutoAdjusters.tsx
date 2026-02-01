import { useState, useEffect, useMemo } from 'react';
import { useConfirmDialog } from '../hooks/useConfirmDialog.tsx';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/layout/PageHeader';
import BreadcrumbNav from '../components/layout/BreadcrumbNav';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, Search, Trash2, Eye, Archive, ArchiveRestore, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAutoAdjusters, deleteAutoAdjuster, archiveAutoAdjuster, unarchiveAutoAdjuster } from '../utils/database';
import Toast from '../components/common/Toast';

export default function AutoAdjusters() {
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const navigate = useNavigate();
  const [adjusters, setAdjusters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAdjusters, setFilteredAdjusters] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'insurance' | 'email' | 'phone'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showArchived, setShowArchived] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  const fetchAdjusters = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAutoAdjusters(showArchived);
      setAdjusters(data || []);
    } catch (error) {
      console.error('Error fetching auto adjusters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdjusters();
  }, [showArchived]);

  useEffect(() => {
    let filtered = adjusters;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => 
        (a.first_name || '').toLowerCase().includes(query) ||
        (a.last_name || '').toLowerCase().includes(query) ||
        (a.middle_name || '').toLowerCase().includes(query) ||
        (a.email || '').toLowerCase().includes(query) ||
        (a.phone || '').includes(query) ||
        (a.auto_insurance?.name || '').toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string = '';
      let bValue: string = '';
      
      switch (sortBy) {
        case 'name':
          aValue = [a.first_name, a.middle_name, a.last_name].filter(Boolean).join(' ').toLowerCase();
          bValue = [b.first_name, b.middle_name, b.last_name].filter(Boolean).join(' ').toLowerCase();
          break;
        case 'insurance':
          aValue = (a.auto_insurance?.name || '').toLowerCase();
          bValue = (b.auto_insurance?.name || '').toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'phone':
          aValue = (a.phone || '').toLowerCase();
          bValue = (b.phone || '').toLowerCase();
          break;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    setFilteredAdjusters(filtered);
  }, [adjusters, searchQuery, sortBy, sortOrder]);

  // Group adjusters by insurance company
  const groupedAdjusters = useMemo(() => {
    const groups: Record<number, { insurance: any; adjusters: any[] }> = {};
    const ungrouped: any[] = [];

    filteredAdjusters.forEach(adjuster => {
      const insuranceId = adjuster.auto_insurance_id;
      if (insuranceId && adjuster.auto_insurance) {
        if (!groups[insuranceId]) {
          groups[insuranceId] = {
            insurance: adjuster.auto_insurance,
            adjusters: []
          };
        }
        groups[insuranceId].adjusters.push(adjuster);
      } else {
        ungrouped.push(adjuster);
      }
    });

    return { groups, ungrouped };
  }, [filteredAdjusters]);

  const toggleGroup = (insuranceId: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(insuranceId)) {
        newSet.delete(insuranceId);
      } else {
        newSet.add(insuranceId);
      }
      return newSet;
    });
  };

  return (
    <DashboardLayout>
      <BreadcrumbNav 
        items={[
          { label: 'Home', href: '/home' },
          { label: 'Auto Insurance', href: '/auto-insurance' },
          { label: 'Adjusters' }
        ]} 
        className="mb-4" 
      />
      
      <PageHeader 
        title="Auto Insurance Adjusters" 
        description="Manage auto insurance adjusters"
      >
        <Button size="sm" className="gap-2" onClick={() => navigate('/auto-adjusters/new')}>
          <Plus className="h-4 w-4" />
          Add Adjuster
        </Button>
      </PageHeader>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Sort</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'insurance' | 'email' | 'phone')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="name">Name</option>
                  <option value="insurance">Insurance Company</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="asc">Ascending (A-Z)</option>
                  <option value="desc">Descending (Z-A)</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show Archived</span>
                </label>
              </div>
              <div className="flex items-end">
                {(sortBy !== 'name' || sortOrder !== 'asc' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder('asc');
                      setSearchQuery('');
                    }}
                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Auto Insurance Adjusters</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading adjusters...</p>
          </div>
        ) : filteredAdjusters.length > 0 ? (
          <div className="space-y-4">
            {/* Grouped by Insurance */}
            {Object.entries(groupedAdjusters.groups).map(([insuranceId, group]) => {
              const isExpanded = expandedGroups.has(Number(insuranceId));
              return (
                <Card key={`insurance-${insuranceId}`} className="overflow-hidden">
                  <CardHeader 
                    className="bg-gradient-to-r from-blue-50 to-blue-100 cursor-pointer hover:from-blue-100 hover:to-blue-200 transition-colors"
                    onClick={() => toggleGroup(Number(insuranceId))}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-blue-600" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-blue-600" />
                        )}
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg text-gray-900">
                          {group.insurance.name}
                        </CardTitle>
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs font-semibold">
                          {group.adjusters.length} {group.adjusters.length === 1 ? 'adjuster' : 'adjusters'}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {group.adjusters.map((adjuster) => (
              <Card 
                key={adjuster.id} 
                            className="hover-lift cursor-pointer group border border-gray-200"
                onClick={() => navigate(`/auto-adjusters/${adjuster.id}`)}
              >
                <CardHeader className="pb-2">
                              <CardTitle className="text-base group-hover:text-blue-700">
                                {[adjuster.first_name, adjuster.middle_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster'}
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
                              {adjuster.is_archived && (
                                <div className="mb-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    Archived
                                  </span>
                                </div>
                              )}
                              <div className="mt-3 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/auto-adjusters/${adjuster.id}`);
                                  }}
                                  className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                {adjuster.is_archived ? (
                                  <button
                                    type="button"
                                    className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                    title="Unarchive"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const adjusterName = [adjuster.first_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster';
                                      const yes = await confirm(`Unarchive adjuster "${adjusterName}"?`, { title: 'Unarchive Adjuster', variant: 'info' });
                                      if (!yes) return;
                                      
                                      try {
                                        const ok = await unarchiveAutoAdjuster(adjuster.id);
                                        if (ok) {
                                          await fetchAdjusters();
                                          setToast({ message: 'Adjuster unarchived successfully', type: 'success' });
                                        } else {
                                          setToast({ message: 'Failed to unarchive adjuster. Please try again.', type: 'error' });
                                        }
                                      } catch (e) {
                                        console.error('Unarchive auto adjuster failed', e);
                                        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                                        setToast({ 
                                          message: `Unarchive failed: ${errorMessage}`, 
                                          type: 'error' 
                                        });
                                      }
                                    }}
                                  >
                                    <ArchiveRestore className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                                    title="Archive"
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      const adjusterName = [adjuster.first_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster';
                                      const yes = await confirm(`Archive adjuster "${adjusterName}"? You can unarchive it later.`, { title: 'Archive Adjuster', variant: 'warning' });
                                      if (!yes) return;
                                      
                                      try {
                                        const ok = await archiveAutoAdjuster(adjuster.id);
                                        if (ok) {
                                          await fetchAdjusters();
                                          setToast({ message: 'Adjuster archived successfully', type: 'success' });
                                        } else {
                                          setToast({ message: 'Failed to archive adjuster. Please try again.', type: 'error' });
                                        }
                                      } catch (e) {
                                        console.error('Archive auto adjuster failed', e);
                                        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                                        setToast({ 
                                          message: `Archive failed: ${errorMessage}`, 
                                          type: 'error' 
                                        });
                                      }
                                    }}
                                  >
                                    <Archive className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const adjusterName = [adjuster.first_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster';
                                    const yes = await confirm(`Delete adjuster "${adjusterName}"? This action cannot be undone.`, { title: 'Delete Adjuster', variant: 'danger' });
                                    if (!yes) return;
                                    
                                    try {
                                      const ok = await deleteAutoAdjuster(adjuster.id);
                                      if (ok) {
                                        setAdjusters(prev => prev.filter(a => a.id !== adjuster.id));
                                        setToast({ message: 'Adjuster deleted successfully', type: 'success' });
                                      } else {
                                        setToast({ message: 'Failed to delete adjuster. Please check your permissions or try again.', type: 'error' });
                                      }
                                    } catch (e) {
                                      console.error('Delete auto adjuster failed', e);
                                      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                                      setToast({ 
                                        message: `Delete failed: ${errorMessage}`, 
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

            {/* Ungrouped Adjusters (no insurance assigned) */}
            {groupedAdjusters.ungrouped.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <CardTitle className="text-lg text-gray-900">
                    Adjusters Without Insurance Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedAdjusters.ungrouped.map((adjuster) => (
                      <Card 
                        key={adjuster.id} 
                        className="hover-lift cursor-pointer group border border-gray-200"
                        onClick={() => navigate(`/auto-adjusters/${adjuster.id}`)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base group-hover:text-blue-700">
                            {[adjuster.first_name, adjuster.middle_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster'}
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
                          {adjuster.is_archived && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                Archived
                              </span>
                            </div>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/auto-adjusters/${adjuster.id}`);
                      }}
                      className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                            {adjuster.is_archived ? (
                              <button
                                type="button"
                                className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                title="Unarchive"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const adjusterName = [adjuster.first_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster';
                                  const yes = await confirm(`Unarchive adjuster "${adjusterName}"?`, { title: 'Unarchive Adjuster', variant: 'info' });
                                  if (!yes) return;
                                  
                                  try {
                                    const ok = await unarchiveAutoAdjuster(adjuster.id);
                                    if (ok) {
                                      await fetchAdjusters();
                                      setToast({ message: 'Adjuster unarchived successfully', type: 'success' });
                                    } else {
                                      setToast({ message: 'Failed to unarchive adjuster. Please try again.', type: 'error' });
                                    }
                                  } catch (e) {
                                    console.error('Unarchive auto adjuster failed', e);
                                    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                                    setToast({ 
                                      message: `Unarchive failed: ${errorMessage}`, 
                                      type: 'error' 
                                    });
                                  }
                                }}
                              >
                                <ArchiveRestore className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="p-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-md transition-colors"
                                title="Archive"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const adjusterName = [adjuster.first_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster';
                                  const yes = await confirm(`Archive adjuster "${adjusterName}"? You can unarchive it later.`, { title: 'Archive Adjuster', variant: 'warning' });
                                  if (!yes) return;
                                  
                                  try {
                                    const ok = await archiveAutoAdjuster(adjuster.id);
                                    if (ok) {
                                      await fetchAdjusters();
                                      setToast({ message: 'Adjuster archived successfully', type: 'success' });
                                    } else {
                                      setToast({ message: 'Failed to archive adjuster. Please try again.', type: 'error' });
                                    }
                                  } catch (e) {
                                    console.error('Archive auto adjuster failed', e);
                                    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                                    setToast({ 
                                      message: `Archive failed: ${errorMessage}`, 
                                      type: 'error' 
                                    });
                                  }
                                }}
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                            )}
                    <button
                      type="button"
                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                      onClick={async (e) => {
                        e.stopPropagation();
                                const adjusterName = [adjuster.first_name, adjuster.last_name].filter(Boolean).join(' ') || 'Unnamed Adjuster';
                                const yes = await confirm(`Delete adjuster "${adjusterName}"? This action cannot be undone.`, { title: 'Delete Adjuster', variant: 'danger' });
                        if (!yes) return;
                                
                        try {
                          const ok = await deleteAutoAdjuster(adjuster.id);
                          if (ok) {
                            setAdjusters(prev => prev.filter(a => a.id !== adjuster.id));
                            setToast({ message: 'Adjuster deleted successfully', type: 'success' });
                          } else {
                                    setToast({ message: 'Failed to delete adjuster. Please check your permissions or try again.', type: 'error' });
                          }
                        } catch (e) {
                          console.error('Delete auto adjuster failed', e);
                                  const errorMessage = e instanceof Error ? e.message : 'Unknown error';
                          setToast({ 
                                    message: `Delete failed: ${errorMessage}`, 
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
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border">
            <p className="text-gray-500">No adjusters found</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/auto-adjusters/new')}>
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

