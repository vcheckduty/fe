'use client';

import { useState, useEffect } from 'react';
import { Attendance } from '@/types';
import Button from './ui/Button';
import StatusBadge from './StatusBadge';

export default function PendingApprovals() {
  const [pendingAttendances, setPendingAttendances] = useState<Attendance[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  useEffect(() => {
    // Filter attendances by selected date
    if (!selectedDate) {
      setFilteredAttendances(pendingAttendances);
    } else {
      const filtered = pendingAttendances.filter((attendance) => {
        const attendanceDate = new Date(attendance.checkinTime).toDateString();
        const filterDate = new Date(selectedDate).toDateString();
        return attendanceDate === filterDate;
      });
      setFilteredAttendances(filtered);
    }
    // Clear selection when filter changes
    setSelectedIds(new Set());
  }, [selectedDate, pendingAttendances]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/approve`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setPendingAttendances(data.data);
      } else {
        setError(data.error || 'Không thể tải danh sách chờ duyệt');
      }
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (
    attendanceId: string,
    action: 'approve' | 'reject',
    type: 'checkin' | 'checkout'
  ) => {
    try {
      setProcessingId(attendanceId);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            attendanceId,
            action,
            type,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        // Refresh the list
        fetchPendingApprovals();
      } else {
        alert(data.error || 'Không thể xử lý yêu cầu');
      }
    } catch (err) {
      alert('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredAttendances.length) {
      setSelectedIds(new Set());
    } else {
      const allIds = new Set(filteredAttendances.map(a => a._id!));
      setSelectedIds(allIds);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkApproval = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) {
      alert('Vui lòng chọn ít nhất một yêu cầu');
      return;
    }

    const confirmed = confirm(
      `Bạn có chắc muốn ${action === 'approve' ? 'duyệt' : 'từ chối'} ${selectedIds.size} yêu cầu đã chọn?`
    );

    if (!confirmed) return;

    setIsProcessingBulk(true);
    const token = localStorage.getItem('token');
    let successCount = 0;
    let errorCount = 0;

    for (const attendanceId of selectedIds) {
      const attendance = pendingAttendances.find(a => a._id === attendanceId);
      if (!attendance) continue;

      // Determine type based on pending status
      const type = attendance.checkinStatus === 'pending' ? 'checkin' : 'checkout';

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/approve`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              attendanceId,
              action,
              type,
            }),
          }
        );

        const data = await response.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch (err) {
        errorCount++;
      }
    }

    setIsProcessingBulk(false);
    setSelectedIds(new Set());
    
    alert(`Hoàn thành: ${successCount} thành công, ${errorCount} lỗi`);
    fetchPendingApprovals();
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('vi-VN');
  };

  const formatDistance = (distance: number) => {
    return `${distance.toFixed(0)}m`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
        <Button onClick={fetchPendingApprovals} className="mt-3">
          Thử lại
        </Button>
      </div>
    );
  }

  if (pendingAttendances.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-600">Không có yêu cầu nào đang chờ duyệt</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Duyệt điểm danh ({filteredAttendances.length})
        </h2>

        {/* Date Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="dateFilter" className="text-sm font-medium text-gray-700">
            Lọc theo ngày:
          </label>
          <input
            type="date"
            id="dateFilter"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate('')}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Xóa bộ lọc"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {filteredAttendances.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredAttendances.length && filteredAttendances.length > 0}
              onChange={handleSelectAll}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              id="selectAll"
            />
            <label htmlFor="selectAll" className="text-sm font-medium text-gray-900 cursor-pointer">
              Chọn tất cả ({selectedIds.size}/{filteredAttendances.length})
            </label>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleBulkApproval('approve')}
                disabled={isProcessingBulk}
                className="bg-white !text-orange-600 border-2 border-orange-600 px-4 py-2 text-sm cursor-pointer"
              >
                {isProcessingBulk ? 'Đang xử lý...' : `Duyệt (${selectedIds.size})`}
              </Button>
              <Button
                onClick={() => handleBulkApproval('reject')}
                disabled={isProcessingBulk}
                className="bg-red-600 text-white px-4 py-2 text-sm cursor-pointer"
              >
                {isProcessingBulk ? 'Đang xử lý...' : `Từ chối (${selectedIds.size})`}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {filteredAttendances.map((attendance) => {
          const user = typeof attendance.user === 'object' ? attendance.user : null;
          const office = typeof attendance.office === 'object' ? attendance.office : null;
          
          return (
            <div
              key={attendance._id}
              className={`bg-white rounded-lg shadow-sm border p-6 transition-all ${
                selectedIds.has(attendance._id!)
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.has(attendance._id!)}
                  onChange={() => handleSelectOne(attendance._id!)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer mt-1"
                />

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {attendance.officerName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {user && 'email' in user ? user.email : 'N/A'}
                      </p>
                    </div>
                    <StatusBadge status={attendance.status} />
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cơ quan:</span>
                      <span className="font-medium text-gray-900">
                        {attendance.officeName}
                      </span>
                    </div>

                    {/* Check-in section */}
                    {attendance.checkinStatus === 'pending' && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Check-in</span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Chờ duyệt
                          </span>
                        </div>
                        <div className="space-y-2 ml-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Thời gian:</span>
                            <span className="text-gray-900">{formatDate(attendance.checkinTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Khoảng cách:</span>
                            <span className={attendance.status === 'Invalid' ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {formatDistance(attendance.distance)}
                            </span>
                          </div>
                          {attendance.checkinReason && (
                            <div className="bg-gray-50 p-3 rounded-lg mt-2">
                              <p className="text-xs text-gray-600 mb-1">Lý do:</p>
                              <p className="text-sm text-gray-900">{attendance.checkinReason}</p>
                              {attendance.checkinReasonPhoto && (
                                <img
                                  src={attendance.checkinReasonPhoto}
                                  alt="Reason evidence"
                                  className="mt-2 max-w-full h-32 object-cover rounded border"
                                />
                              )}
                            </div>
                          )}
                          {attendance.checkinPhoto && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1">Ảnh check-in:</p>
                              <img
                                src={attendance.checkinPhoto}
                                alt="Check-in"
                                className="max-w-full h-32 object-cover rounded border"
                              />
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={() => handleApproval(attendance._id!, 'approve', 'checkin')}
                              disabled={processingId === attendance._id}
                              className="flex-1 bg-white !text-orange-600 border-2 border-orange-600 cursor-pointer"
                            >
                              Duyệt
                            </Button>
                            <Button
                              onClick={() => handleApproval(attendance._id!, 'reject', 'checkin')}
                              disabled={processingId === attendance._id}
                              className="flex-1 bg-red-600 text-white cursor-pointer"
                            >
                              Từ chối
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Check-out section */}
                    {attendance.checkoutStatus === 'pending' && attendance.checkoutTime && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Check-out</span>
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Chờ duyệt
                          </span>
                        </div>
                        <div className="space-y-2 ml-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Thời gian:</span>
                            <span className="text-gray-900">{formatDate(attendance.checkoutTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Khoảng cách:</span>
                            <span className={attendance.checkoutDistance && attendance.checkoutDistance > (office?.radius || 100) ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {attendance.checkoutDistance ? formatDistance(attendance.checkoutDistance) : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tổng giờ:</span>
                            <span className="font-medium text-gray-900">
                              {attendance.totalHours?.toFixed(2)}h
                            </span>
                          </div>
                          {attendance.checkoutReason && (
                            <div className="bg-gray-50 p-3 rounded-lg mt-2">
                              <p className="text-xs text-gray-600 mb-1">Lý do:</p>
                              <p className="text-sm text-gray-900">{attendance.checkoutReason}</p>
                              {attendance.checkoutReasonPhoto && (
                                <img
                                  src={attendance.checkoutReasonPhoto}
                                  alt="Reason evidence"
                                  className="mt-2 max-w-full h-32 object-cover rounded border"
                                />
                              )}
                            </div>
                          )}
                          {attendance.checkoutPhoto && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1">Ảnh check-out:</p>
                              <img
                                src={attendance.checkoutPhoto}
                                alt="Check-out"
                                className="max-w-full h-32 object-cover rounded border"
                              />
                            </div>
                          )}
                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={() => handleApproval(attendance._id!, 'approve', 'checkout')}
                              disabled={processingId === attendance._id}
                              className="flex-1 bg-white !text-orange-600 border-2 border-orange-600 cursor-pointer"
                            >
                              Duyệt
                            </Button>
                            <Button
                              onClick={() => handleApproval(attendance._id!, 'reject', 'checkout')}
                              disabled={processingId === attendance._id}
                              className="flex-1 bg-red-600 text-white cursor-pointer"
                            >
                              Từ chối
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
