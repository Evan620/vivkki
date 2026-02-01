import { useState, useMemo } from 'react';
import { FileCheck2, Calendar, AlertTriangle, Users, Scale, DollarSign, TrendingUp } from 'lucide-react';
import CaseStatusCard from './CaseStatusCard';
import QuickStatsCard from './QuickStatsCard';
import RecentActivityCard from './RecentActivityCard';
import GenerateDocumentsModal from './GenerateDocumentsModal';
import SettlementCard from './SettlementCard';
import { calculateDaysUntilStatute, generateCaseName } from '../../utils/calculations';
import { formatCurrency, formatSSN } from '../../utils/formatting';
import { formatDate } from '../../utils/formatters';

interface OverviewTabProps {
  casefile: any;
  medicalBills: any[];
  workLogs: any[];
  clients: any[];
  defendants: any[];
  firstPartyClaimsByClient?: Record<number, any[]>;
  thirdPartyClaimsByDefendant?: Record<number, any>;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
  onSwitchTab: (tab: string) => void;
}

export default function OverviewTab({
  casefile,
  medicalBills,
  workLogs,
  clients,
  defendants,
  firstPartyClaimsByClient,
  thirdPartyClaimsByDefendant,
  onUpdate,
  onShowToast,
  onSwitchTab
}: OverviewTabProps) {
  const [showGenerateDocumentsModal, setShowGenerateDocumentsModal] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<number[]>([]);

  // Calculate case metrics
  const daysUntilStatute = useMemo(() => calculateDaysUntilStatute(casefile.statuteDeadline || casefile.statute_deadline), [casefile.statuteDeadline, casefile.statute_deadline]);
  // Guard against null for comparisons
  const safeDaysUntilStatute = typeof daysUntilStatute === 'number' ? daysUntilStatute : Number.POSITIVE_INFINITY;
  const caseName = useMemo(() => {
    const name = generateCaseName(clients || []);
    return name !== 'Unknown' ? name : 'Loading...';
  }, [clients]);
  
  // Calculate medical totals
  const medicalTotals = useMemo(() => {
    return medicalBills.reduce(
      (totals, bill) => ({
        totalBilled: totals.totalBilled + (bill.amountBilled || bill.total_billed || 0),
        balanceDue: totals.balanceDue + ((bill.amountBilled || bill.total_billed || 0) - (bill.insurancePaid || bill.insurance_paid || 0) - (bill.insuranceAdjusted || bill.insurance_adjusted || 0))
      }),
      { totalBilled: 0, balanceDue: 0 }
    );
  }, [medicalBills]);

  // Get statute alert status
  const getStatuteAlert = () => {
    if (safeDaysUntilStatute <= 0) return { level: 'expired', color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' };
    if (safeDaysUntilStatute <= 90) return { level: 'urgent', color: 'red', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800' };
    if (safeDaysUntilStatute <= 180) return { level: 'warning', color: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800' };
    if (safeDaysUntilStatute <= 365) return { level: 'caution', color: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800' };
    return { level: 'normal', color: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800' };
  };

  const statuteAlert = getStatuteAlert();

  return (
    <>
      {/* Statute Warning Box - Show when ≤90 days */}
      {(statuteAlert.level === 'expired' || statuteAlert.level === 'urgent') && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-base font-bold text-red-900 mb-1.5">
                {safeDaysUntilStatute <= 0 ? '⚠️ STATUTE OF LIMITATIONS EXPIRED' : `⚠️ STATUTE DEADLINE APPROACHING - ${safeDaysUntilStatute} DAYS LEFT`}
              </h3>
              <p className="text-xs text-red-800 mb-2.5">
                {safeDaysUntilStatute <= 0 
                  ? 'The statute of limitations has expired on this case. No legal action can be pursued without court approval.'
                  : 'This case is approaching the deadline. Take immediate action to file suit before the statute expires.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onSwitchTab('documents')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-xs transition-colors"
                >
                  View Documents
                </button>
                <button
                  onClick={() => onSwitchTab('accident')}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium text-xs transition-colors"
                >
                  Review Case Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Left (Case Status + Generate Documents) | Right (Stats & Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Left Column: Case Status + Generate Documents */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900">Case Status</h3>
              {clients && clients.length > 0 && clients[0].ssn && (
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-600 mb-0.5">Social Security Number</p>
                  <p className="text-sm font-mono font-bold text-gray-900">{formatSSN(clients[0].ssn)}</p>
                </div>
              )}
            </div>
            <CaseStatusCard
              casefile={casefile}
              onUpdate={onUpdate}
              onShowToast={onShowToast}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <button
              onClick={() => setShowGenerateDocumentsModal(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <FileCheck2 size={16} />
              Generate Documents
            </button>
          </div>
        </div>

        {/* Right Column: Quick Stats & Summary Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Stats - Compact */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Quick Stats</h3>
            <QuickStatsCard medicalBills={medicalBills} casefile={casefile} />
          </div>

          {/* Case Summary - Compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Statute Deadline */}
            <div className={`${statuteAlert.bg} ${statuteAlert.border} border rounded-lg p-3 min-h-[75px] flex flex-col justify-between ${statuteAlert.level === 'expired' || statuteAlert.level === 'urgent' ? 'ring-1 ring-red-300' : ''}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Calendar className={`w-3.5 h-3.5 ${statuteAlert.text}`} />
                <p className={`text-xs font-medium ${statuteAlert.text}`}>Statute</p>
              </div>
              <p className={`text-base font-bold ${statuteAlert.text} leading-tight mb-1`}>
                {safeDaysUntilStatute <= 0 ? 'EXPIRED' : `${safeDaysUntilStatute}d`}
              </p>
              {casefile.statuteDeadline || casefile.statute_deadline ? (
                <p className={`text-xs ${statuteAlert.text} leading-tight`}>
                  {formatDate(casefile.statuteDeadline || casefile.statute_deadline)}
                </p>
              ) : null}
            </div>

            {/* Clients */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[75px] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Clients</p>
          </div>
              <p className="text-base font-bold text-gray-900 mb-1">{clients.length}</p>
              <p className="text-xs text-gray-500 truncate leading-tight">{caseName || 'None'}</p>
            </div>

            {/* Defendants */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[75px] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Scale className="w-3.5 h-3.5 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Defendants</p>
              </div>
              <p className="text-base font-bold text-gray-900 mb-1">{defendants.length}</p>
              {defendants.length > 0 && (
                <p className="text-xs text-gray-500 leading-tight">
                  {defendants.reduce((sum, d) => sum + ((d.liabilityPercentage !== null && d.liabilityPercentage !== undefined) ? d.liabilityPercentage : 100), 0)}% liability
                </p>
          )}
        </div>

            {/* Medical Bills */}
            <div className="bg-white rounded-lg border border-gray-200 p-3 min-h-[75px] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 mb-1.5">
                <DollarSign className="w-3.5 h-3.5 text-gray-600" />
                <p className="text-xs font-medium text-gray-600">Medical Bills</p>
            </div>
              <p className="text-base font-bold text-gray-900 mb-1">{formatCurrency(medicalTotals.totalBilled)}</p>
              <p className="text-xs text-gray-500 leading-tight">{medicalBills.length} providers</p>
        </div>
      </div>

          {/* Medical Bills & Balance - Compact */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">Total Billed</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(medicalTotals.totalBilled)}</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <p className="text-xs font-medium text-gray-600 mb-1.5">Balance Due</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(medicalTotals.balanceDue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <div className="mb-4">
        <RecentActivityCard
          workLogs={workLogs}
          onViewAll={() => onSwitchTab('worklog')}
        />
        </div>

      {/* Settlement Management - Compact */}
      <div className="mb-4">
          <SettlementCard
            casefileId={casefile.id}
            firstPartyClaims={Object.values(firstPartyClaimsByClient || {}).flat()}
            thirdPartyClaims={Object.values(thirdPartyClaimsByDefendant || {})}
            medicalBills={medicalBills}
            onUpdate={onUpdate}
            onShowToast={onShowToast}
          />
      </div>

      {showGenerateDocumentsModal && (
        <GenerateDocumentsModal
          isOpen={showGenerateDocumentsModal}
          onClose={() => {
            setShowGenerateDocumentsModal(false);
            setSelectedProviders([]);
          }}
          casefileId={casefile.id}
          clients={clients}
          defendants={defendants}
          medicalBills={medicalBills}
          selectedProviders={selectedProviders}
          onProviderSelectionChange={setSelectedProviders}
          onSuccess={() => {
            setShowGenerateDocumentsModal(false);
            setSelectedProviders([]);
            onUpdate();
          }}
          onShowToast={onShowToast}
        />
      )}
    </>
  );
}
