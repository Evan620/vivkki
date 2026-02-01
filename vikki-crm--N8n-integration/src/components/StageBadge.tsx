interface StageBadgeProps {
  stage: 'Intake' | 'Processing' | 'Demand' | 'Closed';
}

const stageBadgeColors = {
  Intake: 'bg-gray-100 text-gray-800',
  Processing: 'bg-blue-100 text-blue-800',
  Demand: 'bg-yellow-100 text-yellow-800',
  Closed: 'bg-green-100 text-green-800'
};

export default function StageBadge({ stage }: StageBadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageBadgeColors[stage]}`}>
      {stage}
    </span>
  );
}
