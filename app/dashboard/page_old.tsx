'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, officeAPI } from '@/lib/api';
import { config } from '@/lib/config';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import type { Attendance, Office } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Valid' | 'Invalid'>('all');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAttendance();
      fetchOffices();
    }
  }, [isAuthenticated]);

  const fetchOffices = async () => {
    try {
      const response = await officeAPI.getAll();
      if (response.success) {
        const activeOffices = response.data.offices.filter((o: Office) => o.isActive);
        setOffices(activeOffices);
        if (activeOffices.length > 0) {
          setSelectedOffice(activeOffices[0]._id || activeOffices[0].id || '');
        }
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách trụ sở:', err.message);
    }
  };

  const fetchAttendance = async () => {
    try {
      setIsLoading(true);
      const response = await attendanceAPI.getRecords({ limit: 20, page: 1 });
      if (response.success) {
        setRecords(response.data.records);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setCheckInMessage('');
    setIsCheckingIn(true);

    if (!selectedOffice) {
      setCheckInMessage('Vui lòng chọn trụ sở để check-in');
      setIsCheckingIn(false);
      return;
    }

    if (!navigator.geolocation) {
      setCheckInMessage('Trình duyệt không hỗ trợ GPS');
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await attendanceAPI.checkIn({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            officeId: selectedOffice,
          });

          if (response.success) {
            setCheckInMessage(response.data.message);
            fetchAttendance(); // Refresh list
          }
        } catch (err: any) {
          setCheckInMessage(err.message || 'Check-in thất bại');
        } finally {
          setIsCheckingIn(false);
        }
      },
      (error) => {
        setCheckInMessage('Không thể lấy vị trí GPS: ' + error.message);
        setIsCheckingIn(false);
      }
    );
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const validRecords = records.filter((r) => r.status === 'Valid').length;
  const invalidRecords = records.filter((r) => r.status === 'Invalid').length;
  
  const filteredData = selectedFilter === 'all' 
    ? records 
    : records.filter(r => r.status === selectedFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 bg-pattern">
      {/* Header */}
      <header className="gradient-red text-white shadow-strong relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        <div className="container mx-auto px-6 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-gold">
                <span className="text-4xl">🇻🇳</span>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-government-gold drop-shadow-lg tracking-wide">
                  HỆ THỐNG QUẢN LÝ QUÂN SỐ V-CHECK
                </h1>
                <p className="text-sm text-yellow-100 font-semibold mt-1 flex items-center gap-2">
                  <span className="text-lg">👤</span> {user.fullName} • {user.role.toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user.role === 'admin' && (
                <>
                  <button
                    onClick={() => router.push('/offices')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition font-semibold"
                  >
                    🏢 Quản lý Trụ sở
                  </button>
                  <button
                    onClick={() => router.push('/users')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition font-semibold"
                  >
                    👥 Quản lý Users
                  </button>
                </>
              )}
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition font-semibold"
              >
                🚪 Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Check-in Section */}
        <div className="bg-white rounded-2xl shadow-strong p-6 mb-8 border-t-4 border-orange-500">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📍</span> Check-in GPS
          </h2>
          
          {/* Office Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn trụ sở check-in:
            </label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full px-4 py-3 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-gradient-to-r from-orange-50 to-orange-50 font-medium"
            >
              {offices.length === 0 && <option value="">Chưa có trụ sở nào</option>}
              {offices.map((office) => (
                <option key={office._id || office.id} value={office._id || office.id}>
                  {office.name} - {office.address} (Bán kính: {office.radius}m)
                </option>
              ))}
            </select>
            {selectedOffice && offices.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                📍 Tọa độ: {offices.find(o => (o._id || o.id) === selectedOffice)?.location.lat}, {offices.find(o => (o._id || o.id) === selectedOffice)?.location.lng}
              </p>
            )}
          </div>
          
          {checkInMessage && (
            <div className={`mb-4 p-3 rounded-lg ${
              checkInMessage.includes('successful') || checkInMessage.includes('thành công')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {checkInMessage}
            </div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn || !selectedOffice}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isCheckingIn ? '⏳ Đang check-in...' : '📍 Check-in ngay'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Tổng check-in"
            value={records.length}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="Hợp lệ"
            value={validRecords}
            icon="✓"
            color="green"
          />
          <StatCard
            title="Không hợp lệ"
            value={invalidRecords}
            icon="✗"
            color="red"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Attendance Records Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-strong p-6 border-t-4 border-government-gold">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-government-navy flex items-center gap-2">
                  <span>📊</span>
                  Lịch sử check-in
                </h2>
                <select 
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value as any)}
                  className="text-sm border-2 border-orange-300 rounded-lg px-4 py-2 font-medium bg-gradient-to-r from-orange-50 to-orange-50 hover:border-orange-500 focus:ring-2 focus:ring-orange-300 transition-all"
                >
                  <option value="all">Tất cả</option>
                  <option value="Valid">Hợp lệ</option>
                  <option value="Invalid">Không hợp lệ</option>
                </select>
              </div>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">{error}</div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Chưa có dữ liệu check-in</div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {filteredData.map((record) => (
                    <div 
                      key={record._id}
                      className="group border-2 border-slate-200 rounded-xl p-4 hover:shadow-strong hover:border-orange-400 transition-all duration-300 bg-gradient-to-br from-white to-slate-50"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-government-navy to-orange-600 flex items-center justify-center text-white font-bold shadow-md">
                            {record.officerName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-government-navy">{record.officerName}</p>
                            {record.officeName && (
                              <p className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                                🏢 {record.officeName}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              📍 {record.location.lat.toFixed(4)}, {record.location.lng.toFixed(4)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={record.status} />
                      </div>
                      
                      <div className="text-sm space-y-2 mt-3 pt-3 border-t border-slate-200">
                        <p className="flex items-center gap-2">
                          <span className="text-lg">⏰</span>
                          <span className="font-medium text-gray-700">
                            {new Date(record.timestamp).toLocaleString('vi-VN')}
                          </span>
                        </p>
                        <p className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="text-lg">📏</span>
                            <span className="font-medium text-gray-700">Khoảng cách:</span>
                          </span>
                          <span className={`font-bold text-lg ${record.distance <= 50 ? 'text-green-600' : 'text-red-600'}`}>
                            {record.distance}m {record.distance <= 50 ? '✔️' : '⚠️'}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-strong p-6 border-t-4 border-government-gold">
          <h2 className="text-xl font-bold text-government-navy mb-6 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Thống kê hệ thống
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="group bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-2xl border-2 border-green-300 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tỷ lệ hợp lệ</p>
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-5xl font-extrabold text-green-600 drop-shadow-md">
                {records.length > 0 ? ((validRecords / records.length) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-green-700 mt-2 font-medium">{validRecords}/{records.length} lần check-in</p>
            </div>
            <div className="group bg-gradient-to-br from-red-50 to-pink-100 p-6 rounded-2xl border-2 border-red-300 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">Không hợp lệ</p>
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-5xl font-extrabold text-red-600 drop-shadow-md">
                {records.length > 0 ? ((invalidRecords / records.length) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-xs text-red-700 mt-2 font-medium">{invalidRecords}/{records.length} lần check-in</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-8 gradient-red text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="relative z-10">
          <p className="text-base font-semibold tracking-wide">Hệ thống quản lý quân số V-Check</p>
          <p className="text-government-gold mt-2 font-bold text-lg">🇻🇳 Công an tỉnh © 2025</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-yellow-200">
            <span>Version 1.0</span>
            <span>•</span>
            <span>Powered by Next.js</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
