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
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          label: distance !== undefined ? `${distance}m - Hợp lệ` : 'Hợp lệ',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
        };
      case 'invalid':
      case 'Invalid':
      case 'out-of-range':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          label: distance !== undefined ? `${distance}m - Ngoài phạm vi` : 'Không hợp lệ',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
        };
      case 'absent':
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-700',
          label: 'Vắng mặt',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          ),
        };
      case 'on-mission':
        return {
          bg: 'bg-orange-100',
          text: 'text-orange-700',
          label: 'Đang công tác',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
        };
      default:
        return {
          bg: 'bg-slate-100',
          text: 'text-slate-600',
          label: 'Không xác định',
          icon: (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const config = getStatusConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
}
