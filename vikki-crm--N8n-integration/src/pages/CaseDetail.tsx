import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Archive } from 'lucide-react';
import Layout from '../components/Layout';
import CaseHeader from '../components/case/CaseHeader';
import TabNavigation from '../components/case/TabNavigation';
import OverviewTab from '../components/case/OverviewTab';
import AccidentTab from '../components/case/AccidentTab';
import ClientsTab from '../components/case/ClientsTab';
import ClientDetailsModal from '../components/case/ClientDetailsModal';
import DefendantsTab from '../components/case/DefendantsTab';
import MedicalTab from '../components/case/MedicalTab';
import InsuranceTab from '../components/case/InsuranceTab';
import CaseNotes from '../components/case/CaseNotes';
import DocumentsTab from '../components/case/DocumentsTab';
import WorkLogTab from '../components/case/WorkLogTab';
import TabPlaceholder from '../components/case/TabPlaceholder';
import Toast from '../components/common/Toast';
import BackToTop from '../components/BackToTop';
import { useCaseData } from '../hooks/useCaseData';
import { unarchiveCase } from '../utils/archiveService';

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClientForModal, setSelectedClientForModal] = useState<any | null>(null);

  const { data, loading, error, refetch } = useCaseData(id!);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [unarchiving, setUnarchiving] = useState(false);

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleUnarchive = async () => {
    if (!casefile?.id) return;
    
    setUnarchiving(true);
    const success = await unarchiveCase(casefile.id);
    if (success) {
      showToast('Case unarchived successfully', 'success');
      refetch();
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } else {
      showToast('Failed to unarchive case', 'error');
    }
    setUnarchiving(false);
  };

  // Initialize selected client to first client when data loads
  useEffect(() => {
    if (data?.clients && data.clients.length > 0 && selectedClientId === null) {
      const firstClientId = data.clients[0].id;
      setSelectedClientId(firstClientId);
      // Also set for modal in case user wants to view single client
      if (data.clients.length === 1) {
        setSelectedClientForModal(data.clients[0]);
      }
    }
  }, [data, selectedClientId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading case...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600 mb-4">{error || 'Case not found'}</p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  const { casefile, clients, client, defendants, defendant, medicalBills, workLogs, firstPartyClaim, thirdPartyClaim, healthClaim, firstPartyClaimsByClient, healthClaimsByClient, thirdPartyClaimsByDefendant } = data;

  const totalMedicalBills = medicalBills?.reduce((sum, bill) => sum + (bill.total_billed || 0), 0) || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <CaseHeader
          casefile={casefile}
          client={client}
          clients={clients}
          onUpdate={refetch}
          onShowToast={showToast}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Archive Status Banner */}
          {casefile?.is_archived && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Archive className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">This case is archived</p>
                  {casefile.archived_at && (
                    <p className="text-xs text-orange-700">
                      Archived on {new Date(casefile.archived_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleUnarchive}
                disabled={unarchiving}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                {unarchiving ? 'Unarchiving...' : 'Unarchive Case'}
              </button>
            </div>
          )}
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />

          {/* Client Tabs - Show when multiple clients exist */}
          {clients && clients.length > 1 && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
              <div className="flex space-x-1 overflow-x-auto -mb-px">
                {clients.map((cl) => {
                  const isSelected = selectedClientId === cl.id;
                  const clientName = `${cl.firstName} ${cl.lastName}`;
                  const label = cl.isDriver ? `${clientName} (Driver)` : clientName;
                  
                  return (
                    <button
                      key={cl.id}
                      onClick={() => {
                        setSelectedClientId(cl.id);
                        setSelectedClientForModal(cl);
                        setIsClientModalOpen(true);
                      }}
                      className={`
                        px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                        ${isSelected
                          ? 'border-blue-600 text-blue-600 bg-blue-50'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }
                      `}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Single Client - Show button to view client info */}
          {clients && clients.length === 1 && selectedClientId && (
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3">
              <button
                onClick={() => {
                  setSelectedClientForModal(clients[0]);
                  setIsClientModalOpen(true);
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              >
                View Client Information
              </button>
            </div>
          )}

        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab
              casefile={casefile}
              medicalBills={medicalBills}
              workLogs={workLogs}
              clients={clients}
              defendants={defendants}
              firstPartyClaimsByClient={firstPartyClaimsByClient}
              thirdPartyClaimsByDefendant={thirdPartyClaimsByDefendant}
              healthClaimsByClient={healthClaimsByClient}
              onUpdate={refetch}
              onShowToast={showToast}
              onSwitchTab={handleTabChange}
            />
          )}

          {activeTab === 'accident' && (
            <AccidentTab
              casefile={casefile}
              onUpdate={refetch}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsTab
              clients={clients}
              medicalBills={medicalBills}
              casefileId={casefile.id}
              onUpdate={refetch}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'defendant' && (
            <DefendantsTab
              defendants={defendants}
              casefileId={casefile.id}
              onUpdate={refetch}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'medical' && (() => {
            // Determine the correct health claim based on selectedClientId
            let selectedHealthClaim = healthClaim;
            if (selectedClientId && healthClaimsByClient && healthClaimsByClient[selectedClientId]) {
              // Use the first health claim for the selected client
              selectedHealthClaim = healthClaimsByClient[selectedClientId][0] || healthClaim;
            }
            
            return (
              <MedicalTab
                medicalBills={medicalBills}
                clients={clients}
                selectedClientId={selectedClientId}
                casefileId={casefile.id}
                healthClaim={selectedHealthClaim}
                onUpdate={refetch}
                onShowToast={showToast}
              />
            );
          })()}

          {activeTab === 'insurance' && (
            <InsuranceTab
              firstPartyClaim={firstPartyClaim}
              thirdPartyClaim={thirdPartyClaim}
              defendants={defendants}
              thirdPartyClaimsByDefendant={thirdPartyClaimsByDefendant || {}}
              clients={clients}
              firstPartyClaimsByClient={firstPartyClaimsByClient || {}}
              healthClaimsByClient={healthClaimsByClient || {}}
              casefileId={casefile.id}
              onUpdate={refetch}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'notes' && (
            <CaseNotes
              casefileId={casefile.id}
              onUpdate={refetch}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab
              casefileId={casefile.id}
              onShowToast={showToast}
            />
          )}

          {activeTab === 'worklog' && (
            <WorkLogTab
              casefileId={casefile.id}
              onShowToast={showToast}
            />
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        {/* Client Details Modal */}
        {selectedClientForModal && (
          <ClientDetailsModal
            isOpen={isClientModalOpen}
            onClose={() => {
              setIsClientModalOpen(false);
              setSelectedClientForModal(null);
            }}
            client={selectedClientForModal}
            casefileId={casefile.id}
            onUpdate={refetch}
            onShowToast={showToast}
          />
        )}

        <BackToTop />
        </div>
      </div>
    </Layout>
  );
}
