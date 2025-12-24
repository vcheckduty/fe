interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: string;
  color?: 'red' | 'green' | 'blue' | 'gold' | 'gray';
  subtitle?: string;
}

export default function StatsCard({ title, value, icon, color = 'red', subtitle }: StatsCardProps) {
  const colorClasses = {
    red: 'bg-white border-red-100 text-red-600 shadow-sm hover:shadow-md',
    green: 'bg-white border-emerald-100 text-emerald-600 shadow-sm hover:shadow-md',
    blue: 'bg-white border-orange-100 text-orange-600 shadow-sm hover:shadow-md',
    gold: 'bg-white border-amber-100 text-amber-600 shadow-sm hover:shadow-md',
    gray: 'bg-white border-slate-100 text-slate-600 shadow-sm hover:shadow-md',
  };

  const iconColorClasses = {
    red: 'bg-red-50 text-red-500',
    green: 'bg-emerald-50 text-emerald-500',
    blue: 'bg-orange-50 text-orange-500',
    gold: 'bg-amber-50 text-amber-500',
    gray: 'bg-slate-50 text-slate-500',
  };

  return (
    <div className={`border rounded-2xl p-6 transition-all duration-200 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
