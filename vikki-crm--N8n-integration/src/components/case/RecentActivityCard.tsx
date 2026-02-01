import { formatDateTime } from '../../utils/caseUtils';

interface RecentActivityCardProps {
  workLogs: any[];
  onViewAll: () => void;
}

export default function RecentActivityCard({ workLogs, onViewAll }: RecentActivityCardProps) {
  console.log('RecentActivityCard - workLogs:', workLogs);
  console.log('RecentActivityCard - workLogs length:', workLogs?.length);

  const recentLogs = workLogs ? workLogs.slice(0, 5) : [];

  return (
    <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
        {workLogs.length > 5 && (
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
          >
            View All →
          </button>
        )}
      </div>

      {recentLogs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No activity yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentLogs.map((log) => (
            <div key={log.id} className="border-l-4 border-blue-500 pl-4 py-2.5 bg-blue-50 rounded-r-lg hover:bg-blue-100 transition-colors">
              <p className="text-sm text-gray-900 leading-relaxed font-medium">{log.description}</p>
              <p className="text-xs text-gray-600 mt-1.5 font-medium">
                {formatDateTime(log.timestamp)} • {log.user_name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
