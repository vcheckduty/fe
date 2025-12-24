'use client';

import DateCard from '@/components/DateCard';
import UserCard from '@/components/UserCard';
import QueueList from '@/components/QueueList';
import ChartCard from '@/components/ChartCard';
import ShareLinkCard from '@/components/ShareLinkCard';
import Logo from '@/components/Logo';

export default function ComponentsShowcase() {
  // Sample data
  const queueItems = [
    { id: '1', name: 'Nguyễn Văn A', time: '8AM', status: 'completed' as const },
    { id: '2', name: 'Trần Thị B', time: '9AM', status: 'active' as const },
    { id: '3', name: 'Lê Văn C', time: '10AM', status: 'waiting' as const },
    { id: '4', name: 'Phạm Thị D', time: '11AM', status: 'waiting' as const },
  ];

  const chartData = [
    { label: 'Jan', value: 45, color: '#f97316' },
    { label: 'Feb', value: 32, color: '#f59e0b' },
    { label: 'Mar', value: 58, color: '#10b981' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <Logo size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Component Showcase</h1>
              <p className="text-slate-600">Reusable V-Check UI Components</p>
            </div>
          </div>
        </div>

        {/* Layout Grid - Similar to image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Date Card */}
          <div className="lg:col-span-3">
            <DateCard 
              dayName="Monday"
              date={12}
              message="Hi Martha, you have"
              count={13}
              countLabel="meetings today"
            />
          </div>

          {/* Middle Column - Upcoming Patient/User Card */}
          <div className="lg:col-span-6 space-y-6">
            {/* Section Header */}
            <div className="flex items-center justify-between">
              <button className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 transition flex items-center gap-2">
                <span>📍</span>
                Upcoming Check-in
              </button>
            </div>

            {/* User Card with Time Slider */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <UserCard
                name="Dean Ferrera"
                subtitle="Officer since Jan, 2021"
                badge="verified"
              />
              
              {/* Time Slider */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <span className="text-sm font-semibold text-slate-600">3:00</span>
                <div className="flex-1 max-w-xs">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    defaultValue="50"
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                  />
                </div>
                <span className="text-sm font-semibold text-slate-600">3:30</span>
              </div>
            </div>

            {/* Show More Button */}
            <div className="text-center">
              <button className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2 mx-auto">
                More
                <span className="text-xs">▼</span>
              </button>
            </div>

            {/* Share Link Section */}
            <ShareLinkCard
              link="vcheck.app/office/central"
              title="To invite officers to check-in"
              description="share the link below."
            />
          </div>

          {/* Right Column - Queue & Charts */}
          <div className="lg:col-span-3 space-y-6">
            <QueueList 
              title="Waiting List"
              items={queueItems}
            />

            <ChartCard 
              title="Check-in Stats"
              data={chartData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
