'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, officeAPI } from '@/lib/api';
import type { Attendance, Office } from '@/types';
import Image from 'next/image';

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
      console.log('🔍 User officeId:', user?.officeId, 'Type:', typeof user?.officeId);
      
      // Chỉ fetch office nếu user có officeId
      if (!user?.officeId) {
        console.log('⚠️ User không có officeId');
        setOffices([]);
        return;
      }

      const response = await officeAPI.getAll();
      if (response.success) {
        console.log('📋 All offices:', response.data.offices.map((o: Office) => ({
          id: o._id || o.id,
          name: o.name
        })));
        
        // Chỉ lấy office mà user được gán
        const userOffice = response.data.offices.find(
          (o: Office) => {
            const officeId = o._id || o.id;
            const match = officeId === user.officeId || String(officeId) === String(user.officeId);
            console.log(`Comparing office ${officeId} with user officeId ${user.officeId}:`, match);
            return match && o.isActive;
          }
        );
        
        if (userOffice) {
          console.log('✅ Found user office:', userOffice.name);
          setOffices([userOffice]);
          setSelectedOffice(userOffice._id || userOffice.id || '');
        } else {
          console.log('❌ Không tìm thấy office của user');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const validRecords = records.filter((r) => r.status === 'Valid').length;
  const invalidRecords = records.filter((r) => r.status === 'Invalid').length;
  const selectedOfficeData = offices.find(o => (o._id || o.id) === selectedOffice);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">V-CHECK</h1>
                <p className="text-sm text-gray-500">{user.fullName} • {user.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {(user.role === 'admin' || user.role === 'supervisor') && (
                <button
                  onClick={() => router.push('/offices')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Quản lý Trụ sở
                </button>
              )}
              {user.role === 'admin' && (
                <button
                  onClick={() => router.push('/users')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                >
                  Quản lý Users
                </button>
              )}
              <button onClick={logout} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Check-in Section - Only for Officers */}
        {user.role === 'officer' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Check-in GPS</h2>
          
          {/* Office Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn trụ sở:
            </label>
            <select
              value={selectedOffice}
              onChange={(e) => setSelectedOffice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-medium bg-white"
            >
              {offices.length === 0 && <option value="">Chưa có trụ sở nào</option>}
              {offices.map((office) => (
                <option key={office._id || office.id} value={office._id || office.id}>
                  {office.name} - {office.address} (Bán kính: {office.radius}m)
                </option>
              ))}
            </select>
            {selectedOfficeData && (
              <p className="text-xs text-gray-500 mt-2">
                📍 {selectedOfficeData.location.lat}, {selectedOfficeData.location.lng} • Bán kính: {selectedOfficeData.radius}m
              </p>
            )}
          </div>
          
          {checkInMessage && (
            <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
              checkInMessage.includes('successful') || checkInMessage.includes('thành công')
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <span className="text-xl">{checkInMessage.includes('successful') || checkInMessage.includes('thành công') ? '✓' : '⚠️'}</span>
              <p className={`text-sm flex-1 ${
                checkInMessage.includes('successful') || checkInMessage.includes('thành công')
                  ? 'text-green-700'
                  : 'text-red-700'
              }`}>
                {checkInMessage}
              </p>
            </div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn || !selectedOffice}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isCheckingIn ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Đang check-in...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                📍 Check-in ngay
              </span>
            )}
          </button>
        </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Tổng check-in</p>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{records.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Hợp lệ</p>
              <span className="text-2xl">✓</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{validRecords}</p>
            <p className="text-xs text-gray-500 mt-1">
              {records.length > 0 ? ((validRecords / records.length) * 100).toFixed(1) : 0}%
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Không hợp lệ</p>
              <span className="text-2xl">✗</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{invalidRecords}</p>
            <p className="text-xs text-gray-500 mt-1">
              {records.length > 0 ? ((invalidRecords / records.length) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Lịch sử check-in</h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Chưa có dữ liệu check-in</div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div 
                  key={record._id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {record.officerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{record.officerName}</p>
                        {record.officeName && (
                          <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                            🏢 {record.officeName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500">
                          📍 {record.location.lat.toFixed(4)}, {record.location.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'Valid'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {record.status === 'Valid' ? 'Hợp lệ' : 'Không hợp lệ'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                    <span className="text-gray-600">
                      ⏰ {new Date(record.timestamp).toLocaleString('vi-VN')}
                    </span>
                    <span className={`font-semibold ${record.distance <= 50 ? 'text-green-600' : 'text-red-600'}`}>
                      📏 {record.distance}m
                    </span>
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
