interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'red' | 'green' | 'blue' | 'gray';
  className?: string;
}

export default function StatCard({ title, value, icon, color, className = '' }: StatCardProps) {
  const colorClasses = {
    red: 'bg-white border-red-100 text-red-600 shadow-sm hover:shadow-md',
    green: 'bg-white border-emerald-100 text-emerald-600 shadow-sm hover:shadow-md',
    blue: 'bg-white border-indigo-100 text-indigo-600 shadow-sm hover:shadow-md',
    gray: 'bg-white border-slate-100 text-slate-600 shadow-sm hover:shadow-md',
  };

  const iconColorClasses = {
    red: 'bg-red-50 text-red-500',
    green: 'bg-emerald-50 text-emerald-500',
    blue: 'bg-indigo-50 text-indigo-500',
    gray: 'bg-slate-50 text-slate-500',
  };

  return (
    <div className={`border rounded-2xl p-6 transition-all duration-200 ${colorClasses[color]} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
