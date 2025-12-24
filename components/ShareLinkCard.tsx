'use client';

import { useState } from 'react';

interface ShareLinkCardProps {
  link: string;
  title?: string;
  description?: string;
  className?: string;
}

export default function ShareLinkCard({ 
  link, 
  title = "To invite someone to your room",
  description = "share the link below.",
  className = ""
}: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-8 bg-gradient-to-br from-white to-orange-50/30 ${className}`}>
      <div className="flex items-center gap-8">
        {/* Icon */}
        <div className="hidden md:block flex-shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path d="M20 15 L35 30 L20 45" stroke="#10b981" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M35 20 L50 35 L35 50" stroke="#f97316" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M50 25 L65 40 L50 55" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          <div className="text-center md:text-left">
            <p className="text-2xl md:text-3xl text-slate-900 font-bold">
              {title}{' '}
              <span className="text-slate-400 font-normal">{description}</span>
            </p>
          </div>

          {/* Link box */}
          <div className="flex items-center gap-3 bg-orange-50/50 border border-orange-100 rounded-xl p-4 group hover:border-orange-300 transition-colors">
            <input
              type="text"
              value={link}
              readOnly
              className="flex-1 bg-transparent outline-none text-slate-700 font-mono text-sm md:text-base"
            />
            <button
              onClick={handleCopy}
              className="flex-shrink-0 p-2 hover:bg-orange-100 rounded-lg transition-colors group"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-slate-400 group-hover:text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>

          {copied && (
            <p className="text-sm text-emerald-600 font-medium animate-in fade-in slide-in-from-bottom-1 text-center md:text-left">
              ✓ Đã sao chép vào clipboard!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
