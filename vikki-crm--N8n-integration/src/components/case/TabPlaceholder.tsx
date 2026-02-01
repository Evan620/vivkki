interface TabPlaceholderProps {
  tabName?: string;
  onBackToOverview: () => void;
}

export default function TabPlaceholder({ tabName = 'This tab', onBackToOverview }: TabPlaceholderProps) {
  const getTabContent = () => {
    switch (tabName.toLowerCase()) {
      case 'documents':
        return {
          title: 'Documents Tab',
          phase: 'Phase 5',
          features: [
            'Document upload',
            'Document management',
            'Integration with n8n for automated document generation',
            'Letter templates (LOR, demand letters, etc.)'
          ]
        };
      case 'worklog':
      case 'work log':
        return {
          title: 'Work Log Tab',
          phase: 'Phase 5',
          features: [
            'Complete work log history',
            'Filter by date range',
            'Filter by activity type',
            'Export capabilities',
            'Detailed timeline view'
          ]
        };
      default:
        return {
          title: tabName,
          phase: 'a future phase',
          features: []
        };
    }
  };

  const content = getTabContent();

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="max-w-md text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{content.title}</h3>
        <p className="text-lg text-gray-600 mb-6">
          This tab will be built in {content.phase}.
        </p>

        {content.features.length > 0 && (
          <div className="mb-8 text-left bg-gray-50 rounded-lg p-6">
            <p className="text-sm font-semibold text-gray-900 mb-3">Features coming:</p>
            <ul className="space-y-2">
              {content.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onBackToOverview}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Back to Overview
        </button>
      </div>
    </div>
  );
}
