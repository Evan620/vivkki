import { useState } from 'react';
import { Edit2, User, Phone, Mail, Heart } from 'lucide-react';
import EditClientModal from './EditClientModal';
import { formatPhone, maskSSN } from '../../utils/formatting';
import { formatDate } from '../../utils/formatters';

interface ClientTabProps {
  client: any;
  casefileId: number;
  onUpdate: () => void;
  onShowToast: (message: string, type: 'success' | 'error') => void;
}

export default function ClientTab({ client, casefileId, onUpdate, onShowToast }: ClientTabProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!client) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <p className="text-gray-500">No client information found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <span>Personal Information</span>
          </h3>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm hover:bg-blue-700 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2">Full Name</p>
            <p className="text-sm sm:text-base font-bold text-gray-900">
              {client.first_name} {client.middle_name} {client.last_name}
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 sm:mb-2">Date of Birth</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{formatDate(client.date_of_birth)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-white rounded-lg sm:rounded-xl border border-green-100">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 sm:mb-2">SSN</p>
            <p className="text-sm sm:text-base font-mono font-medium text-gray-900">{maskSSN(client.ssn)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg sm:rounded-xl border border-orange-100">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 sm:mb-2">Marital Status</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{client.marital_status || 'Not specified'}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2">Is Driver</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{client.is_driver ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-100 flex items-center gap-2">
          <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Contact Information</h3>
        </div>
        <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="sm:col-span-2 p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2">Address</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">
              {client.street_address && client.city && client.state && client.zip_code
                ? `${client.street_address}, ${client.city}, ${client.state} ${client.zip_code}`
                : 'Not provided'}
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-100">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 sm:mb-2">Primary Phone</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{formatPhone(client.primary_phone)}</p>
          </div>

          <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-white rounded-lg sm:rounded-xl border border-green-100">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 sm:mb-2">Secondary Phone</p>
            <p className="text-sm sm:text-base font-medium text-gray-900">{formatPhone(client.secondary_phone) || 'Not provided'}</p>
          </div>

          <div className="sm:col-span-2 p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg sm:rounded-xl border border-orange-100">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 sm:mb-2">Email</p>
            <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{client.email || 'Not provided'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100 flex items-center gap-2">
          <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
          <h3 className="text-base sm:text-lg font-bold text-gray-900">Medical Information</h3>
        </div>
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {client.injury_description && (
            <div className="p-3 sm:p-4 bg-gradient-to-br from-gray-50 to-white rounded-lg sm:rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1 sm:mb-2">Injury Description</p>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                {client.injury_description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg sm:rounded-xl border border-blue-100">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1 sm:mb-2">Prior Accidents</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">{client.prior_accidents || 'None'}</p>
            </div>

            <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-xl border border-purple-100">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1 sm:mb-2">Prior Injuries</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">{client.prior_injuries || 'None'}</p>
            </div>

            <div className="sm:col-span-2 p-3 sm:p-4 bg-gradient-to-br from-green-50 to-white rounded-lg sm:rounded-xl border border-green-100">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1 sm:mb-2">Work Impact</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">{client.work_impact || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>

      {(client.referrer || client.referrer_relationship) && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-100">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Referral Information</h3>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-white rounded-lg sm:rounded-xl border border-orange-100">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1 sm:mb-2">Referred By</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">{client.referrer || 'Not specified'}</p>
            </div>

            <div className="p-3 sm:p-4 bg-gradient-to-br from-yellow-50 to-white rounded-lg sm:rounded-xl border border-yellow-100">
              <p className="text-xs font-semibold text-yellow-600 uppercase tracking-wide mb-1 sm:mb-2">Relationship</p>
              <p className="text-sm sm:text-base font-medium text-gray-900">{client.referrer_relationship || 'Not specified'}</p>
            </div>
          </div>
        </div>
      )}

      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client}
        casefileId={casefileId}
        onUpdate={onUpdate}
        onShowToast={onShowToast}
      />
    </div>
  );
}
