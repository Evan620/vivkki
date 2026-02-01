import { Calendar, Users, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency, getDaysSinceDate } from '../../utils/caseUtils';

interface QuickStatsCardProps {
  medicalBills: any[];
  casefile: any;
}

export default function QuickStatsCard({ medicalBills, casefile }: QuickStatsCardProps) {
  const providerCount = medicalBills.length;

  const totalBilled = medicalBills.reduce((sum, bill) => {
    return sum + (bill.total_billed || 0);
  }, 0);

  const outstandingCount = medicalBills.filter(
    (bill) => !bill.bill_received || !bill.records_received
  ).length;

  const daysOpen = getDaysSinceDate(casefile.date_of_loss);

  const stats = [
    {
      label: 'Days Open',
      value: daysOpen,
      suffix: 'days',
      icon: Calendar,
      gradient: 'from-blue-500 to-blue-700',
      textColor: 'text-blue-100',
      valueColor: 'text-white'
    },
    {
      label: 'Medical Providers',
      value: providerCount,
      suffix: 'providers',
      icon: Users,
      gradient: 'from-purple-500 to-purple-700',
      textColor: 'text-purple-100',
      valueColor: 'text-white'
    },
    {
      label: 'Total Billed',
      value: formatCurrency(totalBilled),
      suffix: 'medical bills',
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-700',
      textColor: 'text-green-100',
      valueColor: 'text-white'
    },
    {
      label: 'Outstanding B&R',
      value: outstandingCount,
      suffix: 'records',
      icon: AlertCircle,
      gradient: 'from-orange-500 to-red-600',
      textColor: 'text-orange-100',
      valueColor: 'text-white'
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} rounded-lg shadow-sm p-3 text-white group hover:shadow-md transition-all duration-200 min-h-[80px] flex flex-col justify-between`}
          >
            <div className="relative flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-1.5">
                <p className={`text-xs font-medium ${stat.textColor} leading-tight`}>{stat.label}</p>
                <Icon className={`w-3.5 h-3.5 ${stat.textColor} flex-shrink-0`} />
              </div>
              <p className="text-lg sm:text-xl font-bold mb-1 leading-tight break-all">{stat.value}</p>
              <p className={`text-xs ${stat.textColor} leading-tight mt-auto`}>{stat.suffix}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
