'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, officeAPI } from '@/lib/api';
import type { Attendance, Office } from '@/types';
import Logo from '@/components/Logo';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');

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
      if (!user?.officeId) {
        setOffices([]);
        return;
      }

      const response = await officeAPI.getAll();
      if (response.success) {
        const userOffice = response.data.offices.find(
          (o: Office) => {
            const officeId = o._id || o.id;
            const match = officeId === user.officeId || String(officeId) === String(user.officeId);
            return match && o.isActive;
          }
        );
        
        if (userOffice) {
          setOffices([userOffice]);
          setSelectedOffice(userOffice._id || userOffice.id || '');
        } else {
          setOffices([]);
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
      console.error(err.message);
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
            fetchAttendance();
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const validRecords = records.filter((r) => r.status === 'Valid').length;
  const invalidRecords = records.filter((r) => r.status === 'Invalid').length;
  const selectedOfficeData = offices.find(o => (o._id || o.id) === selectedOffice);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <div className="hidden md:block w-px h-6 bg-slate-200"></div>
              <h1 className="hidden md:block text-lg font-semibold text-slate-800">
                Dashboard
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-slate-700">
                  {user.fullName} <span className="text-slate-400 mx-1">|</span> <span className="text-indigo-600">{user.role}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(user.role === 'admin' || user.role === 'supervisor') && (
                  <button
                    onClick={() => router.push('/offices')}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Quản lý trụ sở"
                  >
                    <span className="text-xl">🏢</span>
                  </button>
                )}
                {user.role === 'admin' && (
                  <button
                    onClick={() => router.push('/users')}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Quản lý người dùng"
                  >
                    <span className="text-xl">👥</span>
                  </button>
                )}
                <button 
                  onClick={logout} 
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Đăng xuất"
                >
                  <span className="text-xl">🚪</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Check-in Section - Only for Officers */}
        {user.role === 'officer' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                  📍
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Check-in GPS</h2>
                  <p className="text-slate-500">Xác thực vị trí và chấm công</p>
                </div>
              </div>
              
              <div className="flex-1 max-w-md">
                <select
                  value={selectedOffice}
                  onChange={(e) => setSelectedOffice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-medium text-slate-700"
                >
                  {offices.length === 0 && <option value="">⚠️ Chưa có trụ sở nào</option>}
                  {offices.map((office) => (
                    <option key={office._id || office.id} value={office._id || office.id}>
                      🏢 {office.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedOfficeData && (
              <div className="flex items-center gap-6 mb-6 text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 inline-flex">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-500">📍</span>
                  <span>{selectedOfficeData.location.lat}, {selectedOfficeData.location.lng}</span>
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-500">📏</span>
                  <span>Bán kính: <span className="font-semibold text-slate-700">{selectedOfficeData.radius}m</span></span>
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-500">🏠</span>
                  <span>{selectedOfficeData.address}</span>
                </div>
              </div>
            )}
            
            {checkInMessage && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
                checkInMessage.includes('successful') || checkInMessage.includes('thành công')
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                <span className="text-xl">{checkInMessage.includes('successful') || checkInMessage.includes('thành công') ? '✓' : '⚠️'}</span>
                <p className="font-medium">{checkInMessage}</p>
              </div>
            )}

            <button
              onClick={handleCheckIn}
              disabled={isCheckingIn || !selectedOffice}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-3"
            >
              {isCheckingIn ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="text-xl">⚡</span>
                  <span>Check-in Ngay</span>
                </>
              )}
            </button>
          </div>
        </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="TỔNG SỐ"
            value={records.length}
            icon="📊"
            color="blue"
          />
          <StatCard
            title="HỢP LỆ"
            value={validRecords}
            icon="✓"
            color="green"
          />
          <StatCard
            title="KHÔNG HỢP LỆ"
            value={invalidRecords}
            icon="✗"
            color="red"
          />
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Lịch sử điểm danh</h2>
            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
              {records.length} bản ghi
            </span>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent mx-auto mb-3"></div>
              <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                📭
              </div>
              <p className="text-slate-900 font-medium">Chưa có dữ liệu</p>
              <p className="text-slate-500 text-sm mt-1">Lịch sử điểm danh sẽ xuất hiện tại đây</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <div 
                  key={record._id}
                  className="p-4 sm:p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {record.officerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{record.officerName}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                        {record.officeName && (
                          <span className="flex items-center gap-1">
                            <span>🏢</span> {record.officeName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <span>📍</span>
                          {record.location.lat.toFixed(5)}, {record.location.lng.toFixed(5)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 pl-14 sm:pl-0">
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(record.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(record.timestamp).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    
                    <StatusBadge status={record.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
