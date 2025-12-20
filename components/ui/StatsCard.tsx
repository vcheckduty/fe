interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: string;
  color?: 'red' | 'green' | 'blue' | 'gold' | 'gray';
  subtitle?: string;
}

export default function StatsCard({ title, value, icon, color = 'red', subtitle }: StatsCardProps) {
  const colorClasses = {
    red: 'border-l-[--color-government-red] bg-red-50',
    green: 'border-l-green-500 bg-green-50',
    blue: 'border-l-blue-500 bg-blue-50',
    gold: 'border-l-[--color-government-gold] bg-yellow-50',
    gray: 'border-l-gray-500 bg-gray-50',
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-l-4 ${colorClasses[color]} p-6 hover:shadow-lg transition-shadow`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-3xl font-bold text-[--color-government-navy]">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {icon && (
          <div className="text-4xl opacity-80">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
