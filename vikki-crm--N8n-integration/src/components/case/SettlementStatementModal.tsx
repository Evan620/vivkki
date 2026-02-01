import { useState, useEffect } from 'react';
import { Calculator, DollarSign, FileText, AlertCircle } from 'lucide-react';
import Modal from '../common/Modal';
import { supabase } from '../../utils/database';

interface SettlementStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  settlement: any;
  onGenerate: () => void;
}

export default function SettlementStatementModal({
  isOpen,
  onClose,
  settlement,
  onGenerate
}: SettlementStatementModalProps) {
  const [medicalBills, setMedicalBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && settlement?.casefile_id) {
      fetchMedicalBills();
    }
  }, [isOpen, settlement?.casefile_id]);

  const fetchMedicalBills = async () => {
    try {
      setLoading(true);
      
      // Get client ID first
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('casefile_id', settlement.casefile_id)
        .eq('client_number', 1)
        .maybeSingle();

      if (!client) return;

      // Fetch medical bills
      const { data: bills, error } = await supabase
        .from('medical_bills')
        .select(`
          *,
          medical_provider:medical_providers(*)
        `)
        .eq('client_id', client.id);

      if (error) throw error;
      setMedicalBills(bills || []);
    } catch (error) {
      console.error('Error fetching medical bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBreakdown = () => {
    if (!settlement) return null;

    const grossSettlement = settlement.gross_settlement || 0;
    const attorneyFee = settlement.attorney_fee || 0;
    const caseExpenses = settlement.case_expenses || 0;
    const medicalLiens = settlement.medical_liens || 0;
    const clientNet = settlement.client_net || 0;

    return {
      grossSettlement,
      attorneyFee,
      caseExpenses,
      medicalLiens,
      clientNet,
      attorneyFeePercentage: settlement.attorney_fee_percentage || 33.33
    };
  };

  const breakdown = calculateBreakdown();

  if (!isOpen || !settlement || !breakdown) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settlement Statement Preview">
      <div className="space-y-6">
        {/* Settlement Summary */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-5 h-5 text-green-600" />
            <h3 className="font-medium text-green-900">Settlement Breakdown</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-green-700">Gross Settlement:</span>
              <span className="font-semibold text-green-900">${breakdown.grossSettlement.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Attorney Fee ({breakdown.attorneyFeePercentage}%):</span>
              <span className="font-semibold text-green-900">${breakdown.attorneyFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Case Expenses:</span>
              <span className="font-semibold text-green-900">${breakdown.caseExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Medical Liens:</span>
              <span className="font-semibold text-green-900">${breakdown.medicalLiens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-green-300 pt-2 font-bold">
              <span className="text-green-800">Client Net:</span>
              <span className="text-green-900 text-lg">${breakdown.clientNet.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Medical Bills Breakdown */}
        {loading ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ) : medicalBills.length > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Medical Bills</h3>
            </div>
            <div className="space-y-2 text-sm">
              {medicalBills.map((bill, index) => (
                <div key={index} className="flex justify-between">
                  <span className="text-blue-700">
                    {bill.medical_provider?.name || bill.medical_provider?.provider_name || 'Unknown Provider'}
                  </span>
                  <span className="font-medium text-blue-900">${(bill.total_billed || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-blue-300 pt-2 font-semibold">
                <span className="text-blue-800">Total Medical Bills:</span>
                <span className="text-blue-900">
                  ${medicalBills.reduce((sum, bill) => sum + (bill.total_billed || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800 text-sm">No medical bills found for this case</span>
            </div>
          </div>
        )}

        {/* Settlement Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Settlement Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Settlement Date:</span>
              <span className="font-medium text-gray-900 ml-2">{settlement.settlement_date}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="font-medium text-gray-900 ml-2">{settlement.status}</span>
            </div>
            {settlement.settlement_type && (
              <div className="col-span-2">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900 ml-2">{settlement.settlement_type}</span>
              </div>
            )}
            {settlement.notes && (
              <div className="col-span-2">
                <span className="text-gray-600">Notes:</span>
                <span className="font-medium text-gray-900 ml-2">{settlement.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Generate Statement
          </button>
        </div>
      </div>
    </Modal>
  );
}
