import { useState, useEffect } from 'react';
import { Edit2, Save, X, Calculator } from 'lucide-react';
import { supabase } from '../../utils/database';
import { formatCurrency } from '../../utils/formatting';

interface SettlementCardProps {
  casefileId: number;
  firstPartyClaims?: any[];
  thirdPartyClaims?: any[];
  medicalBills?: any[];
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function SettlementCard({
  casefileId,
  firstPartyClaims = [],
  thirdPartyClaims = [],
  medicalBills = [],
  onUpdate,
  onShowToast
}: SettlementCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settlement, setSettlement] = useState({
    gross_settlement: 0,
    attorney_fee_percentage: 33.33,
    attorney_fee: 0,
    case_expenses: 0,
    medical_liens: 0,
    client_net: 0,
    settlement_date: new Date().toISOString().split('T')[0],
    status: 'pending',
    settlement_type: '',
    notes: ''
  });
  const [originalValues, setOriginalValues] = useState(settlement);

  useEffect(() => {
    fetchSettlement();
    autoPopulateFromClaims();
    calculateMedicalLiensFromBills();
  }, [casefileId, firstPartyClaims, thirdPartyClaims, medicalBills]);

  const fetchSettlement = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('casefile_id', casefileId)
        .order('settlement_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && !error.message.includes('does not exist')) {
        console.error('Error fetching settlement:', error);
      }

      if (data) {
        const values = {
          gross_settlement: parseFloat(data.gross_settlement) || 0,
          attorney_fee_percentage: parseFloat(data.attorney_fee_percentage) || 33.33,
          attorney_fee: parseFloat(data.attorney_fee) || 0,
          case_expenses: parseFloat(data.case_expenses) || 0,
          medical_liens: parseFloat(data.medical_liens) || 0,
          client_net: parseFloat(data.client_net) || 0,
          settlement_date: data.settlement_date || new Date().toISOString().split('T')[0],
          status: data.status || 'pending',
          settlement_type: data.settlement_type || '',
          notes: data.notes || ''
        };
        // Recalculate client_net
        values.client_net = values.gross_settlement - values.attorney_fee - values.case_expenses - values.medical_liens;
        setSettlement(values);
        setOriginalValues(values);
      } else {
        // No record exists, use defaults
        const defaults = {
          gross_settlement: 0,
          attorney_fee_percentage: 33.33,
          attorney_fee: 0,
          case_expenses: 0,
          medical_liens: 0,
          client_net: 0,
          settlement_date: new Date().toISOString().split('T')[0],
          status: 'pending',
          settlement_type: '',
          notes: ''
        };
        setSettlement(defaults);
        setOriginalValues(defaults);
      }
    } catch (error) {
      console.error('Error fetching settlement:', error);
      onShowToast('Failed to load settlement', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-populate settlement data from first party and third party claims
  const autoPopulateFromClaims = () => {
    // Check for settlements in first party claims
    const firstPartySettlement = firstPartyClaims.find(
      (claim) => claim.settlement_reached && claim.settlement_amount && claim.settlement_amount > 0
    );

    // Check for settlements in third party claims
    const thirdPartySettlement = thirdPartyClaims.find(
      (claim) => claim.settlement_reached && claim.settlement_amount && claim.settlement_amount > 0
    );

    // Use third party settlement if available, otherwise use first party
    const claimSettlement = thirdPartySettlement || firstPartySettlement;

    if (claimSettlement && !isEditing) {
      const grossSettlement = parseFloat(claimSettlement.settlement_amount) || 0;
      const attorneyFeePercentage = settlement.attorney_fee_percentage || 33.33;
      const attorneyFee = grossSettlement * (attorneyFeePercentage / 100);
      const caseExpenses = settlement.case_expenses || 0;
      const medicalLiens = settlement.medical_liens || 0;
      const clientNet = grossSettlement - attorneyFee - caseExpenses - medicalLiens;

      // Only update if settlement amount is different or not set
      if (settlement.gross_settlement === 0 || settlement.gross_settlement !== grossSettlement) {
        setSettlement(prev => ({
          ...prev,
          gross_settlement: grossSettlement,
          attorney_fee: attorneyFee,
          client_net: clientNet,
          settlement_date: claimSettlement.settlement_date || prev.settlement_date,
          status: 'finalized',
          settlement_type: thirdPartySettlement ? 'third_party' : 'first_party'
        }));
      }
    }
  };

  // Calculate medical liens from medical bills (balance due)
  const calculateMedicalLiensFromBills = () => {
    if (!medicalBills || medicalBills.length === 0) {
      if (settlement.medical_liens === 0) return; // Don't update if already 0
      setSettlement(prev => ({ ...prev, medical_liens: 0 }));
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

    // Only update if medical liens are different
    if (settlement.medical_liens !== total && !isEditing) {
      const newClientNet = settlement.gross_settlement - settlement.attorney_fee - settlement.case_expenses - total;
      setSettlement(prev => ({
        ...prev,
        medical_liens: total,
        client_net: newClientNet
      }));
    }
  };

  // Auto-calculate attorney_fee and client_net when gross_settlement or attorney_fee_percentage changes
  useEffect(() => {
    if (isEditing) {
      const calculatedFee = settlement.gross_settlement * (settlement.attorney_fee_percentage / 100);
      const calculatedNet = settlement.gross_settlement - calculatedFee - settlement.case_expenses - settlement.medical_liens;
      
      setSettlement(prev => ({
        ...prev,
        attorney_fee: calculatedFee,
        client_net: calculatedNet
      }));
    }
  }, [settlement.gross_settlement, settlement.attorney_fee_percentage, settlement.case_expenses, settlement.medical_liens, isEditing]);

  const handleChange = (field: keyof typeof settlement, value: string | number) => {
    if (field === 'attorney_fee_percentage' || field === 'gross_settlement' || field === 'case_expenses' || field === 'medical_liens') {
      const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      setSettlement(prev => ({
        ...prev,
        [field]: numValue
      }));
    } else {
      setSettlement(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleAttorneyFeeChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    const calculatedPercentage = settlement.gross_settlement > 0 
      ? (numValue / settlement.gross_settlement) * 100 
      : 0;
    const calculatedNet = settlement.gross_settlement - numValue - settlement.case_expenses - settlement.medical_liens;
    
    setSettlement(prev => ({
      ...prev,
      attorney_fee: numValue,
      attorney_fee_percentage: calculatedPercentage,
      client_net: calculatedNet
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Ensure client_net is calculated
      const finalClientNet = settlement.gross_settlement - settlement.attorney_fee - settlement.case_expenses - settlement.medical_liens;
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('settlements')
        .select('id')
        .eq('casefile_id', casefileId)
        .order('settlement_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const settlementData = {
        casefile_id: casefileId,
        gross_settlement: settlement.gross_settlement,
        attorney_fee_percentage: settlement.attorney_fee_percentage,
        attorney_fee: settlement.attorney_fee,
        case_expenses: settlement.case_expenses,
        medical_liens: settlement.medical_liens,
        client_net: finalClientNet,
        settlement_date: settlement.settlement_date || new Date().toISOString().split('T')[0],
        status: settlement.status,
        settlement_type: settlement.settlement_type || null,
        notes: settlement.notes || null,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('settlements')
          .update(settlementData)
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('settlements')
          .insert(settlementData);

        if (error) throw error;
      }

      const updatedSettlement = {
        ...settlement,
        client_net: finalClientNet
      };
      setOriginalValues(updatedSettlement);
      setIsEditing(false);
      onShowToast('Settlement saved successfully', 'success');
      onUpdate();

      // Create work log entry
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email || 'Admin';
      await supabase.from('work_logs').insert({
        casefile_id: casefileId,
        description: `Settlement ${existing ? 'updated' : 'created'}: $${settlement.gross_settlement.toLocaleString()} (Client Net: $${finalClientNet.toLocaleString()})`,
        timestamp: new Date().toISOString(),
        user_name: userName
      });
    } catch (error: any) {
      console.error('Error saving settlement:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      
      // Check if it's an RLS policy error
      if (errorMessage.includes('row-level security') || errorMessage.includes('policy')) {
        onShowToast('Permission denied. Please run the SQL migration to add settlements RLS policies.', 'error');
      } else {
        onShowToast(`Failed to save settlement: ${errorMessage}`, 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSettlement(originalValues);
    setIsEditing(false);
  };

  const hasChanges = JSON.stringify(settlement) !== JSON.stringify(originalValues);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-2 bg-gray-200 rounded"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-green-600" />
          <h3 className="text-base font-semibold text-gray-900">Settlement Management</h3>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Settlement"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Save"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Gross Settlement *
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settlement.gross_settlement}
                  onChange={(e) => handleChange('gross_settlement', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Attorney Fee (%)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={settlement.attorney_fee_percentage}
                  onChange={(e) => handleChange('attorney_fee_percentage', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="33.33"
                />
                <span className="text-gray-500 text-xs">%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Attorney Fee (Auto)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settlement.attorney_fee.toFixed(2)}
                  onChange={(e) => handleAttorneyFeeChange(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Case Expenses
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settlement.case_expenses}
                  onChange={(e) => handleChange('case_expenses', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Medical Liens
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settlement.medical_liens}
                  onChange={(e) => handleChange('medical_liens', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Client Net (Auto)
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500 text-xs">$</span>
                <input
                  type="text"
                  value={formatCurrency(settlement.client_net)}
                  readOnly
                  className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm bg-gray-100 text-gray-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Settlement Date
              </label>
              <input
                type="date"
                value={settlement.settlement_date}
                onChange={(e) => handleChange('settlement_date', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={settlement.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="finalized">Finalized</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Settlement Type (Optional)
              </label>
              <input
                type="text"
                value={settlement.settlement_type}
                onChange={(e) => handleChange('settlement_type', e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Lump Sum, Structured Settlement"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={settlement.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional settlement notes..."
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Client Net (Final):</span>
              <span className="text-base font-bold text-green-600">
                {formatCurrency(settlement.client_net)}
              </span>
            </div>
          </div>
          {hasChanges && (
            <div className="text-xs text-blue-600 mt-1">
              * You have unsaved changes
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-gray-600">Gross Settlement:</span>
            <span className="text-xs font-medium text-gray-900">
              {formatCurrency(settlement.gross_settlement)}
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-gray-600">Attorney Fee ({settlement.attorney_fee_percentage}%):</span>
            <span className="text-xs font-medium text-gray-900">
              {formatCurrency(settlement.attorney_fee)}
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-gray-600">Case Expenses:</span>
            <span className="text-xs font-medium text-gray-900">
              {formatCurrency(settlement.case_expenses)}
            </span>
          </div>
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-gray-600">Medical Liens:</span>
            <span className="text-xs font-medium text-gray-900">
              {formatCurrency(settlement.medical_liens)}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Client Net:</span>
              <span className="text-base font-bold text-green-600">
                {formatCurrency(settlement.client_net)}
              </span>
            </div>
          </div>
          {settlement.settlement_date && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-xs text-gray-600">Settlement Date:</span>
              <span className="text-xs font-medium text-gray-900">
                {new Date(settlement.settlement_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {settlement.status && (
            <div className="flex items-center justify-between py-0.5">
              <span className="text-xs text-gray-600">Status:</span>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                settlement.status === 'finalized' ? 'bg-green-100 text-green-800' :
                settlement.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
              </span>
            </div>
          )}
          {settlement.gross_settlement === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Click edit to add settlement information
            </p>
          )}
        </div>
      )}
    </div>
  );
}

