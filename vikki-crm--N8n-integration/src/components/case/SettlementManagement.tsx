import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, Clock, AlertCircle, Plus, FileText } from 'lucide-react';
import { supabase } from '../../utils/database';
import SettlementOfferModal from './SettlementOfferModal';
import SettlementStatementModal from './SettlementStatementModal';

interface SettlementManagementProps {
  casefile: any;
  firstPartyClaims?: any[];
  thirdPartyClaims?: any[];
  medicalBills?: any[];
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

interface SettlementOffer {
  id: number;
  offer_date: string;
  offer_amount: number;
  offered_by: string;
  status: string;
  response_date?: string;
  response_type?: string;
  counter_amount?: number;
  notes?: string;
}

interface Settlement {
  id: number;
  settlement_date: string;
  gross_settlement: number;
  attorney_fee: number;
  attorney_fee_percentage: number;
  case_expenses: number;
  medical_liens: number;
  client_net: number;
  status: string;
  settlement_type?: string;
  notes?: string;
}

export default function SettlementManagement({
  casefile,
  firstPartyClaims = [],
  thirdPartyClaims = [],
  medicalBills = [],
  onUpdate,
  onShowToast
}: SettlementManagementProps) {
  const [settlementOffers, setSettlementOffers] = useState<SettlementOffer[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<SettlementOffer | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Extract offers and settlements from claims
  const [offersFromClaims, setOffersFromClaims] = useState<SettlementOffer[]>([]);
  const [settlementsFromClaims, setSettlementsFromClaims] = useState<Settlement[]>([]);
  const [totalMedicalLiens, setTotalMedicalLiens] = useState(0);

  useEffect(() => {
    if (casefile?.id) {
      fetchSettlementData();
      extractSettlementDataFromClaims();
      calculateMedicalLiens();
    }
  }, [casefile?.id, firstPartyClaims, thirdPartyClaims, medicalBills]);

  const fetchSettlementData = async () => {
    try {
      setLoading(true);
      setHasError(false);
      setErrorMessage('');

      // Fetch settlement offers - handle gracefully if table doesn't exist
      const { data: offers, error: offersError } = await supabase
        .from('settlement_offers')
        .select('*')
        .eq('casefile_id', casefile.id)
        .order('offer_date', { ascending: false });

      if (offersError && !offersError.message.includes('does not exist')) {
        console.warn('Error fetching settlement offers:', offersError);
      }

      // Fetch settlements - handle gracefully if table doesn't exist
      const { data: settlementsData, error: settlementsError } = await supabase
        .from('settlements')
        .select('*')
        .eq('casefile_id', casefile.id)
        .order('settlement_date', { ascending: false });

      if (settlementsError && !settlementsError.message.includes('does not exist')) {
        console.warn('Error fetching settlements:', settlementsError);
      }

      // Check if tables are missing
      const isMissingOffersTable = offersError?.message?.includes('does not exist');
      const isMissingSettlementsTable = settlementsError?.message?.includes('does not exist');

      if (isMissingSettlementsTable || isMissingOffersTable) {
        setHasError(true);
        setErrorMessage('Settlement tracking is not configured yet. This feature requires database setup.');
        return;
      }

      setSettlementOffers(offers || []);
      setSettlements(settlementsData || []);
    } catch (error: any) {
      console.error('Unexpected error fetching settlement data:', error);
      setHasError(false);
      setErrorMessage('');
    } finally {
      setLoading(false);
    }
  };

  // Extract offers and settlements from first party and third party claims
  const extractSettlementDataFromClaims = () => {
    const offers: SettlementOffer[] = [];
    const settlements: Settlement[] = [];

    // Extract offers from first party claims
    firstPartyClaims.forEach((claim) => {
      if (claim.offer_received && claim.offer_amount && claim.offer_amount > 0) {
        offers.push({
          id: claim.id,
          offer_date: claim.offer_date || new Date().toISOString().split('T')[0],
          offer_amount: parseFloat(claim.offer_amount) || 0,
          offered_by: claim.auto_insurance?.name || 'First Party Insurance',
          status: 'pending',
          notes: claim.notes
        });
      }

      // Extract settlements from first party claims
      if (claim.settlement_reached && claim.settlement_amount && claim.settlement_amount > 0) {
        const grossSettlement = parseFloat(claim.settlement_amount) || 0;
        const attorneyFeePercentage = 33.33; // Default attorney fee percentage
        const attorneyFee = grossSettlement * (attorneyFeePercentage / 100);
        const medicalLiens = totalMedicalLiens;
        const caseExpenses = 0; // Could be calculated from expenses table
        const clientNet = grossSettlement - attorneyFee - caseExpenses - medicalLiens;

        settlements.push({
          id: claim.id,
          settlement_date: claim.settlement_date || new Date().toISOString().split('T')[0],
          gross_settlement: grossSettlement,
          attorney_fee: attorneyFee,
          attorney_fee_percentage: attorneyFeePercentage,
          case_expenses: caseExpenses,
          medical_liens: medicalLiens,
          client_net: clientNet,
          status: 'finalized',
          settlement_type: 'first_party',
          notes: claim.notes
        });
      }
    });

    // Extract offers from third party claims
    thirdPartyClaims.forEach((claim) => {
      if (claim.offer_received && claim.offer_amount && claim.offer_amount > 0) {
        offers.push({
          id: claim.id,
          offer_date: claim.offer_date || new Date().toISOString().split('T')[0],
          offer_amount: parseFloat(claim.offer_amount) || 0,
          offered_by: claim.auto_insurance?.name || 'Third Party Insurance',
          status: 'pending',
          notes: claim.notes
        });
      }

      // Extract settlements from third party claims
      if (claim.settlement_reached && claim.settlement_amount && claim.settlement_amount > 0) {
        const grossSettlement = parseFloat(claim.settlement_amount) || 0;
        const attorneyFeePercentage = 33.33; // Default attorney fee percentage
        const attorneyFee = grossSettlement * (attorneyFeePercentage / 100);
        const medicalLiens = totalMedicalLiens;
        const caseExpenses = 0; // Could be calculated from expenses table
        const clientNet = grossSettlement - attorneyFee - caseExpenses - medicalLiens;

        settlements.push({
          id: claim.id,
          settlement_date: claim.settlement_date || new Date().toISOString().split('T')[0],
          gross_settlement: grossSettlement,
          attorney_fee: attorneyFee,
          attorney_fee_percentage: attorneyFeePercentage,
          case_expenses: caseExpenses,
          medical_liens: medicalLiens,
          client_net: clientNet,
          status: 'finalized',
          settlement_type: 'third_party',
          notes: claim.notes
        });
      }
    });

    setOffersFromClaims(offers);
    setSettlementsFromClaims(settlements);
  };

  // Calculate total medical liens from medical bills (balance due)
  const calculateMedicalLiens = () => {
    if (!medicalBills || medicalBills.length === 0) {
      setTotalMedicalLiens(0);
      return;
    }

    const total = medicalBills.reduce((sum, bill) => {
      const amountBilled = parseFloat(bill.amountBilled || bill.total_billed || bill.amount_billed || '0') || 0;
      const insurancePaid = parseFloat(bill.insurancePaid || bill.insurance_paid || '0') || 0;
      const insuranceAdjusted = parseFloat(bill.insuranceAdjusted || bill.insurance_adjusted || '0') || 0;
      const medpayPaid = parseFloat(bill.medpayPaid || bill.medpay_paid || bill.med_pay_paid || '0') || 0;
      const patientPaid = parseFloat(bill.patientPaid || bill.patient_paid || '0') || 0;
      const reductionAmount = parseFloat(bill.reductionAmount || bill.reduction_amount || '0') || 0;

      const balanceDue = amountBilled - insurancePaid - insuranceAdjusted - medpayPaid - patientPaid - reductionAmount;
      return sum + Math.max(0, balanceDue); // Only positive balances
    }, 0);

    setTotalMedicalLiens(total);
  };

  const handleOfferSubmit = async (offerData: Partial<SettlementOffer>) => {
    try {
      const { error } = await supabase
        .from('settlement_offers')
        .insert({
          casefile_id: casefile.id,
          ...offerData
        });

      if (error) throw error;

      onShowToast('Settlement offer added successfully', 'success');
      fetchSettlementData();
      setShowOfferModal(false);
      setEditingOffer(null);
    } catch (error) {
      console.error('Error adding settlement offer:', error);
      onShowToast('Failed to add settlement offer', 'error');
    }
  };

  const handleOfferResponse = async (offerId: number, response: { response_type: string; counter_amount?: number; notes?: string }) => {
    try {
      const { error } = await supabase
        .from('settlement_offers')
        .update({
          status: response.response_type,
          response_date: new Date().toISOString().split('T')[0],
          counter_amount: response.counter_amount,
          notes: response.notes
        })
        .eq('id', offerId);

      if (error) throw error;

      onShowToast('Offer response recorded', 'success');
      fetchSettlementData();
    } catch (error) {
      console.error('Error updating offer:', error);
      onShowToast('Failed to update offer', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'countered': return 'text-yellow-600 bg-yellow-50';
      case 'pending': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected': return <AlertCircle className="w-4 h-4" />;
      case 'countered': return <Clock className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Combine offers from settlement_offers table and claims
  const allOffers = [...settlementOffers, ...offersFromClaims].sort((a, b) => {
    const dateA = new Date(a.offer_date).getTime();
    const dateB = new Date(b.offer_date).getTime();
    return dateB - dateA; // Most recent first
  });

  // Combine settlements from settlements table and claims
  const allSettlements = [...settlements, ...settlementsFromClaims].sort((a, b) => {
    const dateA = new Date(a.settlement_date).getTime();
    const dateB = new Date(b.settlement_date).getTime();
    return dateB - dateA; // Most recent first
  });

  const latestOffer = allOffers[0];
  const latestSettlement = allSettlements[0];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if settlement table doesn't exist
  if (hasError && errorMessage) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            Settlement Management
          </h3>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="flex flex-col items-center">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Settlement Tracking Not Configured
            </h4>
            <p className="text-sm text-gray-600 mb-4 max-w-md">
              {errorMessage}
            </p>
            <a
              href="https://github.com/jim-luman/vikki-crm-/blob/main/DATABASE_MIGRATION_STEPS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              View Database Setup Instructions →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Settlement Management
        </h3>
        <button
          onClick={() => setShowOfferModal(true)}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Offer
        </button>
      </div>

      {/* Current Settlement Status */}
      {latestSettlement ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-green-900">Settlement Finalized</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(latestSettlement.status)}`}>
              {latestSettlement.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-green-700">Gross Settlement:</span>
              <span className="font-semibold text-green-900 ml-2">${latestSettlement.gross_settlement?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-green-700">Client Net:</span>
              <span className="font-semibold text-green-900 ml-2">${latestSettlement.client_net?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-green-700">Attorney Fee:</span>
              <span className="font-semibold text-green-900 ml-2">${latestSettlement.attorney_fee?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-green-700">Date:</span>
              <span className="font-semibold text-green-900 ml-2">{latestSettlement.settlement_date}</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setShowStatementModal(true)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3" />
              Generate Statement
            </button>
          </div>
        </div>
      ) : latestOffer ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">Current Offer</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(latestOffer.status)}`}>
              {getStatusIcon(latestOffer.status)}
              {latestOffer.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <span className="text-blue-700">Amount:</span>
              <span className="font-semibold text-blue-900 ml-2">${latestOffer.offer_amount?.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-blue-700">Offered By:</span>
              <span className="font-semibold text-blue-900 ml-2">{latestOffer.offered_by}</span>
            </div>
            <div>
              <span className="text-blue-700">Date:</span>
              <span className="font-semibold text-blue-900 ml-2">{latestOffer.offer_date}</span>
            </div>
            {latestOffer.counter_amount && (
              <div>
                <span className="text-blue-700">Counter:</span>
                <span className="font-semibold text-blue-900 ml-2">${latestOffer.counter_amount.toLocaleString()}</span>
              </div>
            )}
          </div>
          {latestOffer.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleOfferResponse(latestOffer.id, { response_type: 'accepted' })}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
              >
                Accept
              </button>
              <button
                onClick={() => handleOfferResponse(latestOffer.id, { response_type: 'rejected' })}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => {
                  const counterAmount = prompt('Enter counter offer amount:');
                  if (counterAmount) {
                    handleOfferResponse(latestOffer.id, { 
                      response_type: 'countered', 
                      counter_amount: parseFloat(counterAmount) 
                    });
                  }
                }}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors"
              >
                Counter
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-gray-600 text-center">No settlement offers yet</p>
        </div>
      )}

      {/* Settlement Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Settlement Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Total Medical Liens:</span>
            <span className="font-semibold text-gray-900 ml-2 block">${totalMedicalLiens.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">Offers from Claims:</span>
            <span className="font-semibold text-gray-900 ml-2 block">{offersFromClaims.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Settlements from Claims:</span>
            <span className="font-semibold text-gray-900 ml-2 block">{settlementsFromClaims.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Offers:</span>
            <span className="font-semibold text-gray-900 ml-2 block">{allOffers.length}</span>
          </div>
        </div>
      </div>

      {/* Settlement History */}
      {allOffers.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Settlement History</h4>
          <div className="space-y-2">
            {allOffers.slice(0, 5).map((offer, index) => (
              <div key={offer.id || `offer-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(offer.status)}`}>
                    {getStatusIcon(offer.status)}
                    {offer.status}
                  </span>
                  <div>
                    <span className="font-medium">${offer.offer_amount?.toLocaleString()}</span>
                    <span className="text-gray-600 ml-2">by {offer.offered_by}</span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{offer.offer_date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showOfferModal && (
        <SettlementOfferModal
          isOpen={showOfferModal}
          onClose={() => {
            setShowOfferModal(false);
            setEditingOffer(null);
          }}
          onSubmit={handleOfferSubmit}
          editingOffer={editingOffer}
        />
      )}

      {showStatementModal && (
        <SettlementStatementModal
          isOpen={showStatementModal}
          onClose={() => setShowStatementModal(false)}
          settlement={latestSettlement}
          onGenerate={() => {
            // This will be handled by the GenerateDocumentsModal
            setShowStatementModal(false);
            onShowToast('Settlement statement generated', 'success');
          }}
        />
      )}
    </div>
  );
}
