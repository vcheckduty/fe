interface StatusBadgeProps {
  status: 'valid' | 'invalid' | 'out-of-range' | 'present' | 'absent' | 'on-mission' | 'Valid' | 'Invalid';
  distance?: number;
  className?: string;
}

export default function StatusBadge({ status, distance, className = '' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'valid':
      case 'Valid':
      case 'present':
        return {
          color: 'bg-green-500',
          text: distance !== undefined ? `${distance}m - Hợp lệ` : 'Hợp lệ',
          icon: '✓',
        };
      case 'invalid':
      case 'Invalid':
      case 'out-of-range':
        return {
          color: 'bg-red-500',
          text: distance !== undefined ? `${distance}m - Ngoài phạm vi` : 'Không hợp lệ',
          icon: '✗',
        };
      case 'absent':
        return {
          color: 'bg-gray-500',
          text: 'Vắng mặt',
          icon: '○',
        };
      case 'on-mission':
        return {
          color: 'bg-blue-500',
          text: 'Đang công tác',
          icon: '◈',
        };
      default:
        return {
          color: 'bg-gray-400',
          text: 'Không xác định',
          icon: '?',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-sm font-medium ${config.color} ${className}`}
    >
      <span className="text-base">{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
}
