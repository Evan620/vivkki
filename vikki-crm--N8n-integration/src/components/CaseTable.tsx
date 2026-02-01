import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Users, Calendar, Clock, Archive, CheckSquare, Square, Trash2 } from 'lucide-react';
import StageBadge from './StageBadge';
import { formatDate } from '../utils/formatters';
import { calculateDaysOpen, calculateDaysUntilStatute, generateCaseName } from '../utils/calculations';
import { archiveCase, bulkArchiveCases } from '../utils/archiveService';
import type { Casefile, Client } from '../types';
import { useConfirmDialog } from '../hooks/useConfirmDialog.tsx';
import { useAlertDialog } from '../hooks/useAlertDialog.tsx';

interface CaseWithClients extends Casefile {
  clients: Client[];
}

interface CaseTableProps {
  cases: CaseWithClients[];
  onDeleted?: (id: number) => void;
  onArchived?: (id: number) => void;
  onUnarchived?: (id: number) => void; // For unarchive functionality
  showArchive?: boolean; // Whether to show archive buttons (default: true for dashboard, false for archives)
  showUnarchive?: boolean; // Whether to show unarchive buttons (default: false, true for archives page)
}

export default function CaseTable({ cases, onDeleted, onArchived, onUnarchived, showArchive = true, showUnarchive = false }: CaseTableProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCases, setSelectedCases] = useState<Set<number>>(new Set());
  const [archiving, setArchiving] = useState(false);
  const { confirm, Dialog: ConfirmDialog } = useConfirmDialog();
  const { alert, Dialog: AlertDialog } = useAlertDialog();

  const handleCaseClick = (caseId: number) => {
    navigate(`/case/${caseId}`);
  };

  if (cases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No cases found</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'from-green-400 to-emerald-600';
      case 'Settled':
        return 'from-blue-400 to-blue-600';
      case 'Closed':
        return 'from-gray-400 to-gray-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-700 ring-1 ring-green-600/20';
      case 'Settled':
        return 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20';
      case 'Closed':
        return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
      default:
        return 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20';
    }
  };

  const getStatuteAlert = (caseItem: CaseWithClients) => {
    const daysUntilStatute = caseItem.daysUntilStatute || calculateDaysUntilStatute(caseItem.statuteDeadline || '');
    
    if (daysUntilStatute <= 0) {
      return { 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        icon: AlertTriangle,
        text: 'STATUTE EXPIRED',
        urgent: true
      };
    } else if (daysUntilStatute <= 30) {
      return { 
        color: 'text-red-600', 
        bg: 'bg-red-50', 
        border: 'border-red-200',
        icon: AlertTriangle,
        text: `${daysUntilStatute} days left`,
        urgent: true
      };
    } else if (daysUntilStatute <= 90) {
      return { 
        color: 'text-orange-600', 
        bg: 'bg-orange-50', 
        border: 'border-orange-200',
        icon: AlertTriangle,
        text: `${daysUntilStatute} days left`,
        urgent: false
      };
    } else if (daysUntilStatute <= 180) {
      return { 
        color: 'text-yellow-600', 
        bg: 'bg-yellow-50', 
        border: 'border-yellow-200',
        icon: Clock,
        text: `${daysUntilStatute} days left`,
        urgent: false
      };
    }
    
    return null;
  };

  const getDaysOpen = (caseItem: CaseWithClients) => {
    return caseItem.signUpDate ? calculateDaysOpen(caseItem.signUpDate) : 0;
  };

  const handleArchive = async (caseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm(
      `Archive case #${caseId}? You can retrieve it from Archives.`,
      { title: 'Archive Case', variant: 'warning' }
    );
    if (!confirmed) return;

    setArchiving(true);
    const success = await archiveCase(caseId);
    if (success) {
      onArchived && onArchived(caseId);
      
      // Redirect to Archives page if not already there
      if (location.pathname !== '/archives') {
        setTimeout(() => {
          navigate('/archives');
        }, 500); // Small delay to allow UI update
      }
    } else {
      await alert('Failed to archive case. Please try again.', { title: 'Error', variant: 'error' });
    }
    setArchiving(false);
  };

  const handleBulkArchive = async () => {
    if (selectedCases.size === 0) return;
    
    const confirmed = await confirm(
      `Archive ${selectedCases.size} case(s)? You can retrieve them from Archives.`,
      { title: 'Archive Cases', variant: 'warning' }
    );
    if (!confirmed) return;

    setArchiving(true);
    const caseIds = Array.from(selectedCases);
    const success = await bulkArchiveCases(caseIds);
    if (success) {
      caseIds.forEach(id => onArchived && onArchived(id));
      setSelectedCases(new Set());
    } else {
      await alert('Failed to archive cases. Please try again.', { title: 'Error', variant: 'error' });
    }
    setArchiving(false);
  };

  const toggleCaseSelection = (caseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedCases);
    if (newSelected.has(caseId)) {
      newSelected.delete(caseId);
    } else {
      newSelected.add(caseId);
    }
    setSelectedCases(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCases.size === cases.length) {
      setSelectedCases(new Set());
    } else {
      setSelectedCases(new Set(cases.map(c => c.id)));
    }
  };

  return (
    <>
      {showArchive && selectedCases.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">
            {selectedCases.size} case{selectedCases.size > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={handleBulkArchive}
            disabled={archiving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Archive className="w-4 h-4" />
            {archiving ? 'Archiving...' : 'Archive Selected'}
          </button>
        </div>
      )}
      <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {showArchive && (
                <th className="px-4 py-4 text-left">
                  <button
                    onClick={toggleSelectAll}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    title="Select all"
                  >
                    {selectedCases.size === cases.length && cases.length > 0 ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                </th>
              )}
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Case Name
              </th>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Stage
              </th>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Days Open
              </th>
              <th className="px-4 xl:px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                Statute Alert
              </th>
              <th className="px-4 xl:px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {cases.map((caseItem) => {
              const caseName = generateCaseName(caseItem.clients);
              const statuteAlert = getStatuteAlert(caseItem);
              const daysOpen = getDaysOpen(caseItem);
              const isSelected = selectedCases.has(caseItem.id);
              
              return (
                <tr
                  key={caseItem.id}
                  onClick={() => handleCaseClick(caseItem.id)}
                  className={`hover:bg-gray-50 cursor-pointer transition-all duration-200 group ${
                    statuteAlert?.urgent ? 'bg-red-50/30' : ''
                  } ${isSelected ? 'bg-blue-50' : ''}`}
                >
                  {showArchive && (
                    <td className="px-4 xl:px-6 py-4 whitespace-nowrap" onClick={(e) => toggleCaseSelection(caseItem.id, e)}>
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </td>
                  )}
                  <td className="px-4 xl:px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {caseName}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                      <span>Case #{caseItem.id}</span>
                      {caseItem.clients.length > 1 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          <Users className="w-3 h-3" />
                          {caseItem.clients.length} clients
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <StageBadge stage={caseItem.stage} />
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 xl:px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(caseItem.status)}`}>
                      {caseItem.status}
                    </span>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{daysOpen} days</div>
                    <div className="text-xs text-gray-500">Since sign-up</div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    {statuteAlert ? (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statuteAlert.bg} ${statuteAlert.color} ${statuteAlert.border} border`}>
                        <statuteAlert.icon className="w-3 h-3" />
                        {statuteAlert.text}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400">No alert</div>
                    )}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-right">
                    <div className="inline-flex items-center gap-1.5 xl:gap-2">
                      <button
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        onClick={(e) => { e.stopPropagation(); handleCaseClick(caseItem.id); }}
                        title="View case"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      {showArchive && (
                        <button
                          className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={(e) => handleArchive(caseItem.id, e)}
                          disabled={archiving}
                          title="Archive case"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      )}
                      {showUnarchive && onUnarchived && (
                        <button
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnarchived(caseItem.id);
                          }}
                          title="Unarchive case"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const yes = await confirm(`Delete case #${caseItem.id}?`, { title: 'Delete Case', variant: 'danger' });
                          if (!yes) return;
                          try {
                            const { supabase } = await import('../utils/database');
                            const { error } = await supabase.from('casefiles' as any).delete().eq('id', caseItem.id);
                            if (!error) {
                              onDeleted && onDeleted(caseItem.id);
                            } else {
                              console.error('Delete case failed', error);
                            }
                          } catch (err) {
                            console.error('Delete case exception', err);
                          }
                        }}
                        title="Delete case"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:hidden">
        {cases.map((caseItem) => {
          const caseName = generateCaseName(caseItem.clients);
          const statuteAlert = getStatuteAlert(caseItem);
          const daysOpen = getDaysOpen(caseItem);
          const isSelected = selectedCases.has(caseItem.id);
          
          return (
            <div
              key={caseItem.id}
              className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border transform hover:-translate-y-1 ${
                statuteAlert?.urgent ? 'border-red-200 bg-red-50/30' : 'border-gray-100 hover:border-blue-200'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className={`h-1.5 bg-gradient-to-r ${getStatusColor(caseItem.status)}`} />

              <div className="p-4 sm:p-5">
                {showArchive && (
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCaseSelection(caseItem.id, e);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      title={isSelected ? 'Deselect' : 'Select'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {showArchive && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchive(caseItem.id, e);
                          }}
                          disabled={archiving}
                          className="p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Archive"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      )}
                      {showUnarchive && onUnarchived && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnarchived(caseItem.id);
                          }}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Unarchive"
                        >
                          <Archive className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const yes = await confirm(`Delete case #${caseItem.id}?`, { title: 'Delete Case', variant: 'danger' });
                          if (!yes) return;
                          try {
                            const { supabase } = await import('../utils/database');
                            const { error } = await supabase.from('casefiles' as any).delete().eq('id', caseItem.id);
                            if (!error) {
                              onDeleted && onDeleted(caseItem.id);
                            } else {
                              console.error('Delete case failed', error);
                            }
                          } catch (err) {
                            console.error('Delete case exception', err);
                          }
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                <div 
                  onClick={() => handleCaseClick(caseItem.id)}
                  className="cursor-pointer"
                >
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1 truncate">
                      {caseName}
                    </h3>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
                      <span>Case #{caseItem.id}</span>
                      {caseItem.clients.length > 1 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                          <Users className="w-3 h-3" />
                          {caseItem.clients.length} clients
                        </span>
                      )}
                    </div>
                  </div>
                    <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold shadow-sm ml-2 flex-shrink-0 ${getStatusBadgeClass(caseItem.status)}`}>
                    {caseItem.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Stage</span>
                    <StageBadge stage={caseItem.stage} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Days Open</span>
                    <span className="text-sm font-medium text-gray-900">{daysOpen} days</span>
                  </div>
                  {statuteAlert && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Statute Alert</span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statuteAlert.bg} ${statuteAlert.color} ${statuteAlert.border} border`}>
                        <statuteAlert.icon className="w-3 h-3" />
                        {statuteAlert.text}
                      </div>
                    </div>
                  )}
                </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCaseClick(caseItem.id);
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg group-hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                  >
                    View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {ConfirmDialog}
      {AlertDialog}
    </>
  );
}
