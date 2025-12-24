interface ChartDataItem {
  label: string;
  value: number;
  color: string;
}

interface ChartCardProps {
  title: string;
  data: ChartDataItem[];
  type?: 'bar' | 'pie';
  legend?: boolean;
  className?: string;
}

export default function ChartCard({ 
  title, 
  data, 
  type = 'bar',
  legend = true,
  className = ""
}: ChartCardProps) {
  const maxValue = Math.max(...data.map(item => item.value));

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 ${className}`}>
      <h3 className="font-bold text-slate-900 text-lg mb-6">{title}</h3>
      
      {type === 'bar' && (
        <div className="space-y-6">
          {/* Legend */}
          {legend && (
            <div className="flex flex-wrap gap-4">
              {data.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-xs text-slate-600 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bar Chart */}
          <div className="flex items-end justify-around gap-4 h-40">
            {data.map((item, index) => {
              const heightPercent = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-3">
                  {/* Bar */}
                  <div className="w-full flex flex-col justify-end h-full">
                    <div 
                      className="w-full rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                      style={{ 
                        height: `${heightPercent}%`,
                        backgroundColor: item.color 
                      }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap font-medium">
                          {item.value}
                          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Label */}
                  <span className="text-xs font-semibold text-slate-600 truncate w-full text-center">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {type === 'pie' && (
        <div className="flex items-center justify-center h-40 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <div className="text-center text-slate-400 text-sm font-medium">
            Pie chart coming soon
          </div>
        </div>
      )}
    </div>
  );
}
