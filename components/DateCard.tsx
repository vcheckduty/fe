interface DateCardProps {
  dayName?: string;
  date?: number;
  message?: string;
  count?: number;
  countLabel?: string;
  className?: string;
}

export default function DateCard({ 
  dayName = new Date().toLocaleDateString('vi-VN', { weekday: 'long' }),
  date = new Date().getDate(),
  message,
  count,
  countLabel = "meetings",
  className = ""
}: DateCardProps) {
  const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Day name */}
      <h2 className="text-3xl font-bold text-slate-900">
        {capitalizedDayName}
      </h2>
      
      {/* Date */}
      <div className="text-7xl font-bold text-slate-900 leading-none tracking-tight">
        {date}
      </div>

      {/* Message with count */}
      {message && (
        <div className="flex items-start gap-3 mt-4">
          <div className="w-1 h-12 bg-orange-500 rounded-full"></div>
          <div className="flex-1">
            <p className="text-slate-600 text-base">
              {message}{' '}
              {count !== undefined && (
                <span className="text-orange-600 font-bold">
                  {count} {countLabel}
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
