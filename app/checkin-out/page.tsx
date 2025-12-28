'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { CheckInOutFlow, CheckInOutModal } from '@/components';
import type { Office, Attendance } from '@/types';

export default function CheckInOutPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [offices, setOffices] = useState<Office[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'checkin' | 'checkout'>('checkin');
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOffices();
      fetchTodayAttendance();
    }
  }, [isAuthenticated, user]);

  const fetchOffices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/offices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      
      if (data.success) {
        const userOffice = data.data.offices.find(
          (o: Office) => (o._id || o.id) === user?.officeId && o.isActive
        );
        if (userOffice) {
          setOffices([userOffice]);
          setSelectedOffice(userOffice);
        }
      }
    } catch (error) {
      console.error('Error fetching offices:', error);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance?startDate=${today.toISOString()}&limit=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      
      if (data.success && data.data.records.length > 0) {
        setTodayAttendance(data.data.records[0]);
      } else {
        setTodayAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (type: 'checkin' | 'checkout') => {
    if (!selectedOffice) {
      alert('Vui lòng chọn văn phòng');
      return;
    }
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    fetchTodayAttendance();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Chờ duyệt',
      approved: 'Đã duyệt',
      rejected: 'Bị từ chối',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!user || user.role !== 'officer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h1>
          <p className="text-gray-600">Trang này chỉ dành cho nhân viên (officer)</p>
        </div>
      </div>
    );
  }

  const canCheckIn = !todayAttendance;
  const canCheckOut = todayAttendance && 
    !todayAttendance.checkoutTime && 
    todayAttendance.checkinStatus === 'approved';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Điểm danh
          </h1>
          <p className="text-gray-600">
            Chụp ảnh và ghi nhận vị trí để điểm danh. Supervisor sẽ phê duyệt yêu cầu của bạn.
          </p>
        </div>

        {/* Office Info */}
        {selectedOffice && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Thông tin văn phòng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Tên văn phòng</p>
                <p className="font-medium text-gray-900">{selectedOffice.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Địa chỉ</p>
                <p className="font-medium text-gray-900">{selectedOffice.address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bán kính cho phép</p>
                <p className="font-medium text-gray-900">{selectedOffice.radius}m</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tọa độ</p>
                <p className="font-mono text-sm text-gray-900">
                  {selectedOffice.location.lat.toFixed(6)}, {selectedOffice.location.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Today's Attendance Status */}
        {todayAttendance && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Trạng thái hôm nay
            </h2>
            
            {/* Điểm danh vào Status */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">Điểm danh vào</h3>
                {getStatusBadge(todayAttendance.checkinStatus)}
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600">
                  Thời gian: <span className="text-gray-900">
                    {new Date(todayAttendance.checkinTime).toLocaleString('vi-VN')}
                  </span>
                </p>
                <p className="text-gray-600">
                  Khoảng cách: <span className={todayAttendance.status === 'Invalid' ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {todayAttendance.distance.toFixed(0)}m
                  </span>
                </p>
                {todayAttendance.checkinReason && (
                  <p className="text-gray-600">
                    Lý do: <span className="text-gray-900">{todayAttendance.checkinReason}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Điểm danh ra Status */}
            {todayAttendance.checkoutTime && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Điểm danh ra</h3>
                  {todayAttendance.checkoutStatus && getStatusBadge(todayAttendance.checkoutStatus)}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Thời gian: <span className="text-gray-900">
                      {new Date(todayAttendance.checkoutTime).toLocaleString('vi-VN')}
                    </span>
                  </p>
                  {todayAttendance.checkoutDistance && (
                    <p className="text-gray-600">
                      Khoảng cách: <span className={todayAttendance.checkoutDistance > (selectedOffice?.radius || 100) ? 'text-red-600 font-medium' : 'text-green-600'}>
                        {todayAttendance.checkoutDistance.toFixed(0)}m
                      </span>
                    </p>
                  )}
                  {todayAttendance.totalHours !== undefined && (
                    <p className="text-gray-600">
                      Tổng giờ làm việc: <span className="text-gray-900 font-medium">
                        {todayAttendance.totalHours.toFixed(2)}h
                      </span>
                    </p>
                  )}
                  {todayAttendance.checkoutReason && (
                    <p className="text-gray-600">
                      Lý do: <span className="text-gray-900">{todayAttendance.checkoutReason}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Thao tác
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleOpenModal('checkin')}
              disabled={!canCheckIn || !selectedOffice}
              className={`p-6 rounded-lg border-2 text-center transition-all ${
                canCheckIn && selectedOffice
                  ? 'border-green-500 bg-green-50 hover:bg-green-100 cursor-pointer'
                  : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="text-4xl mb-2">📷</div>
              <h3 className="font-semibold text-lg mb-1">Check-in</h3>
              <p className="text-sm text-gray-600">
                {canCheckIn 
                  ? 'Bắt đầu điểm danh'
                  : 'Bạn đã điểm danh hôm nay'}
              </p>
            </button>

            <button
              onClick={() => handleOpenModal('checkout')}
              disabled={!canCheckOut || !selectedOffice}
              className={`p-6 rounded-lg border-2 text-center transition-all ${
                canCheckOut && selectedOffice
                  ? 'border-blue-500 bg-blue-50 hover:bg-blue-100 cursor-pointer'
                  : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="text-4xl mb-2">📸</div>
              <h3 className="font-semibold text-lg mb-1">Check-out</h3>
              <p className="text-sm text-gray-600">
                {!todayAttendance
                  ? 'Vui lòng check-in trước'
                  : todayAttendance.checkoutTime
                  ? 'Bạn đã check-out hôm nay'
                  : todayAttendance.checkinStatus !== 'approved'
                  ? 'Đợi supervisor duyệt check-in'
                  : 'Kết thúc ca làm việc'}
              </p>
            </button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📝 Lưu ý quan trọng:</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Tất cả check-in/out đều cần supervisor phê duyệt</li>
              <li>Nếu bạn ở ngoài phạm vi cho phép, vui lòng cung cấp lý do và ảnh minh chứng</li>
              <li>Check-out chỉ khả dụng sau khi check-in được duyệt</li>
              <li>Bạn có thể theo dõi trạng thái phê duyệt trong dashboard</li>
            </ul>
          </div>
        </div>

        {/* Modal */}
        <CheckInOutModal isOpen={isModalOpen} onClose={handleCloseModal}>
          {selectedOffice && (
            <CheckInOutFlow
              officeId={selectedOffice._id || selectedOffice.id || ''}
              officeName={selectedOffice.name}
              type={modalType}
              onComplete={handleCloseModal}
            />
          )}
        </CheckInOutModal>
      </div>
    </div>
  );
}
