import { useState, useEffect } from 'react';
import { X, Filter, AlertCircle } from 'lucide-react';
import { CASE_STAGES, CASE_STATUSES, getStatusesForStage } from '../../constants/caseStages';

export interface CaseFilters {
  stages: string[];
  statuses: string[];
  daysOpenFilter: string; // 'all' | '30' | '60' | '90' | '180'
  daysOpenSort: 'newest' | 'oldest' | 'alphabetical';
  statuteAlertOnly: boolean;
}

interface CaseFiltersProps {
  filters: CaseFilters;
  onFiltersChange: (filters: CaseFilters) => void;
  totalCases: number;
  filteredCount: number;
}

export default function CaseFiltersComponent({
  filters,
  onFiltersChange,
  totalCases,
  filteredCount
}: CaseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);

  // Update available statuses when stages change
  useEffect(() => {
    if (filters.stages.length === 0) {
      // If no stages selected, show all statuses
      const allStatuses = new Set<string>();
      Object.values(CASE_STATUSES).forEach(statuses => {
        statuses.forEach(status => allStatuses.add(status));
      });
      setAvailableStatuses(Array.from(allStatuses));
    } else {
      // Show statuses for selected stages only
      const statusSet = new Set<string>();
      filters.stages.forEach(stage => {
        getStatusesForStage(stage).forEach(status => statusSet.add(status));
      });
      setAvailableStatuses(Array.from(statusSet));
    }
  }, [filters.stages]);

  const handleStageToggle = (stage: string) => {
    const newStages = filters.stages.includes(stage)
      ? filters.stages.filter(s => s !== stage)
      : [...filters.stages, stage];
    
    // If stage is removed, remove statuses that are only valid for that stage
    let newStatuses = [...filters.statuses];
    if (!newStages.includes(stage)) {
      const removedStageStatuses = getStatusesForStage(stage);
      newStatuses = newStatuses.filter(s => !removedStageStatuses.includes(s));
    }
    
    onFiltersChange({
      ...filters,
      stages: newStages,
      statuses: newStatuses
    });
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    
    onFiltersChange({
      ...filters,
      statuses: newStatuses
    });
  };

  const handleDaysOpenFilterChange = (value: string) => {
    onFiltersChange({
      ...filters,
      daysOpenFilter: value
    });
  };

  const handleDaysOpenSortChange = (value: 'newest' | 'oldest' | 'alphabetical') => {
    onFiltersChange({
      ...filters,
      daysOpenSort: value
    });
  };

  const resetSort = () => {
    onFiltersChange({
      ...filters,
      daysOpenSort: 'alphabetical'
    });
  };

  const handleStatuteAlertToggle = () => {
    onFiltersChange({
      ...filters,
      statuteAlertOnly: !filters.statuteAlertOnly
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      stages: [],
      statuses: [],
      daysOpenFilter: 'all',
      daysOpenSort: 'alphabetical',
      statuteAlertOnly: false
    });
  };

  const hasActiveFilters = 
    filters.stages.length > 0 ||
    filters.statuses.length > 0 ||
    filters.daysOpenFilter !== 'all' ||
    filters.statuteAlertOnly;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
          <span className="font-medium text-gray-900 text-sm sm:text-base">Filters</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-gray-600">
            {filteredCount} of {totalCases}
          </span>
          {isExpanded ? (
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          ) : (
            <span className="text-xs sm:text-sm text-gray-400">▼</span>
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 sm:px-4 pb-4 border-t border-gray-200 space-y-4 pt-4">
          {/* Stage Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Stage
            </label>
            <div className="flex flex-wrap gap-2">
              {CASE_STAGES.map(stage => (
                <button
                  key={stage}
                  onClick={() => handleStageToggle(stage)}
                  className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    filters.stages.includes(stage)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
              Status {filters.stages.length > 0 && <span className="text-gray-500 text-xs">(for selected stages)</span>}
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {availableStatuses.length === 0 ? (
                <p className="text-xs sm:text-sm text-gray-500">Select a stage to see statuses</p>
              ) : (
                availableStatuses.map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusToggle(status)}
                    className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      filters.statuses.includes(status)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Days Open Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Days Open Filter
              </label>
              <select
                value={filters.daysOpenFilter}
                onChange={(e) => handleDaysOpenFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">All</option>
                <option value="30">Last 30 days</option>
                <option value="60">Last 60 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 180 days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  value={filters.daysOpenSort}
                  onChange={(e) => handleDaysOpenSortChange(e.target.value as 'newest' | 'oldest' | 'alphabetical')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="alphabetical">A-Z (Alphabetical)</option>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
                {filters.daysOpenSort !== 'alphabetical' && (
                  <button
                    onClick={resetSort}
                    className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors whitespace-nowrap"
                    title="Reset to alphabetical order"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Statute Alert Filter */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.statuteAlertOnly}
                onChange={handleStatuteAlertToggle}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">
                  Show only cases with statute alerts (≤90 days)
                </span>
              </div>
            </label>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {filters.stages.length > 0 && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {filters.stages.length} stage{filters.stages.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {filters.statuses.length > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                      {filters.statuses.length} status{filters.statuses.length > 1 ? 'es' : ''}
                    </span>
                  )}
                  {filters.daysOpenFilter !== 'all' && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      Last {filters.daysOpenFilter} days
                    </span>
                  )}
                  {filters.statuteAlertOnly && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                      Statute Alert
                    </span>
                  )}
                </div>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

