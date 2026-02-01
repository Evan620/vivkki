import { useState, useEffect } from 'react';
import { Clock, Search, Download, Calendar, Filter } from 'lucide-react';
import { supabase } from '../../utils/database';

interface WorkLog {
  id: number;
  casefile_id: number;
  description: string;
  timestamp: string;
  user_name: string;
}

interface WorkLogTabProps {
  casefileId: number;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function WorkLogTab({ casefileId, onShowToast }: WorkLogTabProps) {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, [casefileId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('work_logs')
        .select('*')
        .eq('casefile_id', casefileId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      onShowToast('Failed to load work log', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm && !log.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (filter !== 'all') {
      const desc = log.description.toLowerCase();
      if (filter === 'documents' && !desc.includes('document')) return false;
      if (filter === 'medical' && !desc.includes('medical') && !desc.includes('provider') && !desc.includes('bill')) return false;
      if (filter === 'insurance' && !desc.includes('insurance') && !desc.includes('claim')) return false;
      if (filter === 'client' && !desc.includes('client')) return false;
    }

    if (dateRange !== 'all') {
      const logDate = new Date(log.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dateRange === 'today' && daysDiff > 0) return false;
      if (dateRange === 'week' && daysDiff > 7) return false;
      if (dateRange === 'month' && daysDiff > 30) return false;
    }

    return true;
  });

  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
    return groups;
  }, {} as Record<string, WorkLog[]>);

  const getIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('document')) return '📄';
    if (desc.includes('medical') || desc.includes('provider') || desc.includes('bill')) return '🏥';
    if (desc.includes('insurance') || desc.includes('claim')) return '🛡️';
    if (desc.includes('client')) return '👤';
    if (desc.includes('defendant')) return '⚖️';
    if (desc.includes('accident')) return '🚗';
    return '📝';
  };

  const exportToCSV = () => {
    try {
      const csv = [
        ['Date', 'Time', 'User', 'Description'],
        ...filteredLogs.map(log => {
          const date = new Date(log.timestamp);
          return [
            date.toLocaleDateString(),
            date.toLocaleTimeString(),
            log.user_name,
            `"${log.description.replace(/"/g, '""')}"`
          ];
        })
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `work-log-case-${casefileId}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onShowToast('Work log exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      onShowToast('Failed to export work log', 'error');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Work Log</h2>
            </div>
            <button
              onClick={exportToCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="documents">Documents</option>
              <option value="medical">Medical</option>
              <option value="insurance">Insurance</option>
              <option value="client">Client</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
            <p className="text-xs sm:text-sm text-blue-900">
              Showing <span className="font-semibold">{filteredLogs.length}</span> of{' '}
              <span className="font-semibold">{logs.length}</span> activities
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading work log...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-600">
              {searchTerm || filter !== 'all' || dateRange !== 'all'
                ? 'Try adjusting your filters'
                : 'Work log entries will appear here as actions are performed'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([date, dateLogs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-gray-200"></div>
                  <h3 className="text-sm font-semibold text-gray-700 px-3 py-1 bg-gray-100 rounded-full">
                    {date}
                  </h3>
                  <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                <div className="space-y-3">
                  {dateLogs.map((log, index) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all group"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {getIcon(log.description)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 mb-2">{log.description}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span>•</span>
                          <span>{log.user_name}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0 text-xs text-gray-400">
                        #{logs.length - logs.indexOf(log)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
