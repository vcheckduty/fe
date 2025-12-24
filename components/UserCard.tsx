import Image from 'next/image';

interface UserCardProps {
  name: string;
  subtitle?: string;
  imageUrl?: string;
  time?: string;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export default function UserCard({ 
  name, 
  subtitle, 
  imageUrl, 
  time, 
  badge,
  onClick,
  className = ""
}: UserCardProps) {
  return (
    <div 
      className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-all cursor-pointer group ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          {imageUrl ? (
            <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-indigo-50 group-hover:ring-indigo-100 transition-all">
              <Image 
                src={imageUrl} 
                alt={name}
                width={56}
                height={56}
                className="object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl ring-2 ring-indigo-50 group-hover:ring-indigo-100 transition-all">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          {badge && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors">{name}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 truncate">{subtitle}</p>
          )}
        </div>

        {/* Time/Badge */}
        {time && (
          <div className="flex-shrink-0">
            <span className="px-3 py-1 bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-lg text-sm font-medium transition-colors">
              {time}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
