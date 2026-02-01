import { useState } from 'react';
import { Shield } from 'lucide-react';
import FirstPartyClaimTab from './FirstPartyClaimTab';
import ThirdPartyClaimTab from './ThirdPartyClaimTab';

interface InsuranceTabProps {
  firstPartyClaim: any;
  thirdPartyClaim: any;
  defendants: any[];
  thirdPartyClaimsByDefendant?: Record<number, any>;
  clients: any[];
  firstPartyClaimsByClient: Record<number, any[]>;
  healthClaimsByClient: Record<number, any[]>;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

type SubTab = 'first-party' | 'third-party';

export default function InsuranceTab({
  firstPartyClaim,
  thirdPartyClaim,
  defendants,
  thirdPartyClaimsByDefendant,
  clients,
  firstPartyClaimsByClient,
  healthClaimsByClient,
  casefileId,
  onUpdate,
  onShowToast
}: InsuranceTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('first-party');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Insurance Claims</h2>
          </div>
          <nav className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide" aria-label="Insurance sub-tabs">
            <button
              onClick={() => setActiveSubTab('first-party')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all ${
                activeSubTab === 'first-party'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              First Party
            </button>
            <button
              onClick={() => setActiveSubTab('third-party')}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all ${
                activeSubTab === 'third-party'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Third Party
            </button>
          </nav>
        </div>
      </div>

      {activeSubTab === 'first-party' && (
        <FirstPartyClaimTab
          firstPartyClaim={firstPartyClaim}
          clients={clients}
          firstPartyClaimsByClient={firstPartyClaimsByClient}
          healthClaimsByClient={healthClaimsByClient}
          casefileId={casefileId}
          onUpdate={onUpdate}
          onShowToast={onShowToast}
        />
      )}

      {activeSubTab === 'third-party' && (
        <ThirdPartyClaimTab
          thirdPartyClaim={thirdPartyClaim}
          defendants={defendants}
          thirdPartyClaimsByDefendant={thirdPartyClaimsByDefendant}
          casefileId={casefileId}
          onUpdate={onUpdate}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
