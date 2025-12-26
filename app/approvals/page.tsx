'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import PendingApprovals from '@/components/PendingApprovals';
import Logo from '@/components/Logo';

export default function ApprovalPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && mounted) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'supervisor' && user.role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, mounted, router]);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'supervisor' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                ← Quay lại
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 text-orange-600">
                  <Logo />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Phê duyệt điểm danh</h1>
                  <p className="text-xs text-slate-500 font-medium">{user.fullName} • {user.role === 'admin' ? 'Quản trị viên' : 'Giám sát'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center">
              <button 
                onClick={logout} 
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600 mt-2">
            Xem và duyệt các yêu cầu điểm danh của nhân viên
          </p>
        </div>

        <PendingApprovals />
      </main>
    </div>
  );
}
