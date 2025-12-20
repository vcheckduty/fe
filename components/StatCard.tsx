interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'red' | 'green' | 'blue' | 'gray';
  className?: string;
}

export default function StatCard({ title, value, icon, color, className = '' }: StatCardProps) {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  };

  const iconColorClasses = {
    red: 'text-red-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    gray: 'text-gray-500',
  };

  return (
    <div className={`border-2 rounded-lg p-6 ${colorClasses[color]} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`text-5xl ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
