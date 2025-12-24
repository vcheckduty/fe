import Image from 'next/image';

interface QueueItem {
  id: string;
  name: string;
  time: string;
  imageUrl?: string;
  status?: 'waiting' | 'active' | 'completed';
}

interface QueueListProps {
  title: string;
  items: QueueItem[];
  maxVisible?: number;
  emptyMessage?: string;
}

export default function QueueList({ 
  title, 
  items, 
  maxVisible = 5,
  emptyMessage = "Danh sách trống" 
}: QueueListProps) {
  const visibleItems = items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return 'ring-2 ring-emerald-400';
      case 'completed':
        return 'opacity-60';
      default:
        return 'ring-2 ring-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <h3 className="font-bold text-slate-900 text-lg mb-4">{title}</h3>
      
      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <div 
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
            >
              {/* Time */}
              <div className="flex-shrink-0 w-14">
                <span className="text-sm font-semibold text-slate-600">{item.time}</span>
              </div>

              {/* Avatar */}
              <div className="relative">
                {item.imageUrl ? (
                  <div className={`w-10 h-10 rounded-full overflow-hidden ${getStatusColor(item.status)}`}>
                    <Image 
                      src={item.imageUrl} 
                      alt={item.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm ${getStatusColor(item.status)}`}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                )}
                {item.status === 'active' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${
                  item.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-900'
                }`}>
                  {item.name}
                </p>
              </div>

              {/* Arrow indicator */}
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-slate-400">→</span>
              </div>
            </div>
          ))}

          {hasMore && (
            <button className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
              + Xem thêm {items.length - maxVisible} người
            </button>
          )}
        </div>
      )}
    </div>
  );
}
