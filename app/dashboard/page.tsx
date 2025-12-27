'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, officeAPI, userAPI } from '@/lib/api';
import { calculateDistance } from '@/lib/haversine';
import type { Attendance, Office, User } from '@/types';
import Logo from '@/components/Logo';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import SmartUpload from '@/components/SmartUpload';
import ConfirmDialog from '@/components/ConfirmDialog';
import ReasonDialog from '@/components/ReasonDialog';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [selectedOfficer, setSelectedOfficer] = useState<User | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [allOffices, setAllOffices] = useState<Office[]>([]);
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkInMessage, setCheckInMessage] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [adminView, setAdminView] = useState<'offices' | 'officers' | 'supervisors'>('offices');
  const [capturedPhoto, setCapturedPhoto] = useState<string>('');
  const [previewPhoto, setPreviewPhoto] = useState<{url: string, title: string, location?: {lat: number, lng: number}, time?: string} | null>(null);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  const [isLocationChecked, setIsLocationChecked] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogType, setConfirmDialogType] = useState<'checkin' | 'checkout'>('checkin');
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reasonDialogData, setReasonDialogData] = useState<{type: 'checkin' | 'checkout', attendanceId: string}>({type: 'checkin', attendanceId: ''});
  const [showActionMenu, setShowActionMenu] = useState<{recordId: string, type: 'checkin' | 'checkout'} | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectDialogData, setRejectDialogData] = useState<{attendanceId: string, type: 'checkin' | 'checkout'} | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'supervisor') {
        fetchOfficers();
      } else if (user?.role === 'officer') {
        fetchAttendance();
      } else if (user?.role === 'admin') {
        fetchAllData();
      }
      fetchOffices();
    }
  }, [isAuthenticated, user?.role]);

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

  const fetchOfficers = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAll({ role: 'officer' });
      if (response.success) {
        // Filter officers by supervisor's officeId
        const officeOfficers = response.data.users.filter(
          (officer: User) => officer.officeId === user?.officeId && officer.isActive
        );
        setOfficers(officeOfficers);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách nhân viên:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch offices
      const officesResponse = await officeAPI.getAll();
      if (officesResponse.success) {
        setAllOffices(officesResponse.data.offices);
      }

      // Fetch officers
      const officersResponse = await userAPI.getAll({ role: 'officer' });
      if (officersResponse.success) {
        setOfficers(officersResponse.data.users);
      }

      // Fetch supervisors
      const supervisorsResponse = await userAPI.getAll({ role: 'supervisor' });
      if (supervisorsResponse.success) {
        setSupervisors(supervisorsResponse.data.users);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async (officerId?: string) => {
    try {
      setIsLoading(true);
      const response = await attendanceAPI.getRecords({ limit: 20, page: 1 });
      if (response.success) {
        let filteredRecords = response.data.records;
        
        // Filter by officer if selected
        if (officerId) {
          filteredRecords = filteredRecords.filter((record) => {
            const userId = typeof record.user === 'string' ? record.user : record.user?.id || record.user?._id;
            return userId === officerId;
          });
        }
        
        // Sort records by checkinTime descending (newest first)
        const sortedRecords = [...filteredRecords].sort((a, b) => {
          return new Date(b.checkinTime).getTime() - new Date(a.checkinTime).getTime();
        });
        setRecords(sortedRecords);
        
        // Find today's attendance (only for officers viewing their own)
        if (!officerId && user?.role === 'officer') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayRecord = sortedRecords.find((record) => {
            const recordDate = new Date(record.checkinTime);
            recordDate.setHours(0, 0, 0, 0);
            return recordDate.getTime() === today.getTime();
          });
          setTodayAttendance(todayRecord || null);
        }
      }
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckLocation = () => {
    setCheckInMessage('');
    setIsLocationVerified(false);
    setIsLocationChecked(false);
    
    if (!selectedOffice) {
      setCheckInMessage('Vui lòng chọn trụ sở để kiểm tra vị trí');
      return;
    }

    if (!navigator.geolocation) {
      setCheckInMessage('Trình duyệt không hỗ trợ GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const office = offices.find(o => (o._id || o.id) === selectedOffice);
        if (!office) {
           setCheckInMessage('Không tìm thấy thông tin trụ sở');
           return;
        }

        // Handle both data structures (flat or nested location)
        const officeLat = office.location?.lat || (office as any).latitude;
        const officeLng = office.location?.lng || (office as any).longitude;

        if (officeLat === undefined || officeLng === undefined) {
           setCheckInMessage('Dữ liệu tọa độ trụ sở không hợp lệ');
           return;
        }

        const distance = calculateDistance(
          position.coords.latitude,
          position.coords.longitude,
          officeLat,
          officeLng
        );

        setIsLocationChecked(true);
        if (distance <= office.radius) {
          setCheckInMessage(`✅ Bạn đang ở trong phạm vi cho phép (${distance}m / ${office.radius}m)`);
          setIsLocationVerified(true);
        } else {
          setCheckInMessage(`❌ Bạn đang ở quá xa trụ sở (${distance}m / ${office.radius}m)`);
          setIsLocationVerified(false);
        }
      },
      (error) => {
        setCheckInMessage('Không thể lấy vị trí GPS: ' + error.message);
        setIsLocationChecked(false);
        setIsLocationVerified(false);
      }
    );
  };

  const handleCheckIn = async () => {
    // If location is checked and verified, and photo is captured, proceed directly
    if (isLocationChecked && isLocationVerified && capturedPhoto) {
      await performCheckIn();
      return;
    }

    // Otherwise, show confirmation dialog
    setConfirmDialogType('checkin');
    setShowConfirmDialog(true);
  };

  const performCheckIn = async () => {
    setCheckInMessage('');
    setIsCheckingIn(true);

    if (!selectedOffice) {
      setCheckInMessage('Vui lòng chọn trụ sở để bắt đầu ca làm');
      setIsCheckingIn(false);
      return;
    }
    setCheckInMessage('');
    setIsCheckingIn(true);

    if (!selectedOffice) {
      setCheckInMessage('Vui lòng chọn trụ sở để bắt đầu ca làm');
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
            photo: capturedPhoto, // Send photo if captured
          });

          if (response.success) {
            setCheckInMessage(response.data.message);
            setCapturedPhoto(''); // Reset photo
            setIsLocationChecked(false);
            setIsLocationVerified(false);
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

  const handleCheckOut = async () => {
    // If location is checked and verified, and photo is captured, proceed directly
    if (isLocationChecked && isLocationVerified && capturedPhoto) {
      await performCheckOut();
      return;
    }

    // Otherwise, show confirmation dialog
    setConfirmDialogType('checkout');
    setShowConfirmDialog(true);
  };

  const performCheckOut = async () => {
    setCheckInMessage('');
    setIsCheckingOut(true);

    if (!selectedOffice) {
      setCheckInMessage('Vui lòng chọn trụ sở để kết thúc ca làm');
      setIsCheckingOut(false);
      return;
    }

    if (!navigator.geolocation) {
      setCheckInMessage('Trình duyệt không hỗ trợ GPS');
      setIsCheckingOut(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await attendanceAPI.checkOut({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            officeId: selectedOffice,
            photo: capturedPhoto, // Send photo if captured
          });

          if (response.success) {
            setCheckInMessage(`Kết thúc ca làm thành công! Tổng giờ làm việc: ${response.data.totalHours} giờ`);
            setCapturedPhoto(''); // Reset photo
            setIsLocationChecked(false);
            setIsLocationVerified(false);
            
            setTimeout(() => {
              fetchAttendance();
            }, 500);
          }
        } catch (err: any) {
          setCheckInMessage(err.message || 'Kết thúc ca làm thất bại');
        } finally {
          setIsCheckingOut(false);
        }
      },
      (error) => {
        setCheckInMessage('Không thể lấy vị trí GPS: ' + error.message);
        setIsCheckingOut(false);
      }
    );
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  const validRecords = records.filter((r) => r.status === 'Valid').length;
  const invalidRecords = records.filter((r) => r.status === 'Invalid').length;
  const selectedOfficeData = offices.find(o => (o._id || o.id) === selectedOffice);

  // Calculate total working hours - exclude rejected records
  const totalWorkingHours = records.reduce((acc, record) => {
    // Don't count if check-in or check-out is rejected
    if (record.checkinStatus === 'rejected' || record.checkoutStatus === 'rejected') {
      return acc;
    }
    return acc + (record.totalHours || 0);
  }, 0);

  // Calculate stats based on role
  const getTotalCount = () => {
    if (user.role === 'admin') {
      return allOffices.length;
    }
    if (user.role === 'supervisor') {
      return officers.length;
    }
    return records.length;
  };

  const getValidCount = () => {
    if (user.role === 'admin') {
      return officers.length;
    }
    if (user.role === 'supervisor') {
      // For supervisor, show active officers count
      return officers.filter(o => o.isActive).length;
    }
    return validRecords;
  };

  const getInvalidCount = () => {
    if (user.role === 'admin') {
      return supervisors.length;
    }
    if (user.role === 'supervisor') {
      // For supervisor, show inactive officers count
      return officers.filter(o => !o.isActive).length;
    }
    return invalidRecords;
  };

  const handleOfficerClick = (officer: User) => {
    setSelectedOfficer(officer);
    fetchAttendance(officer.id || officer._id);
  };

  const handleBackToOfficers = () => {
    setSelectedOfficer(null);
    setRecords([]);
  };

  const handleDialogConfirm = async () => {
    setShowConfirmDialog(false);
    if (confirmDialogType === 'checkin') {
      await performCheckIn();
    } else {
      await performCheckOut();
    }
  };

  const handleDialogCancel = () => {
    setShowConfirmDialog(false);
    // User can update location/photo
  };

  const handleReasonSubmit = async (reason: string, photo?: string) => {
    try {
      await attendanceAPI.addReason({
        attendanceId: reasonDialogData.attendanceId,
        type: reasonDialogData.type,
        reason,
        reasonPhoto: photo
      });
      setCheckInMessage('✅ Đã gửi lý do thành công! Chờ supervisor phê duyệt.');
      
      // Reload attendance data to update UI without page refresh
      await fetchAttendance();
      
      // Close the dialog
      setShowReasonDialog(false);
    } catch (error: any) {
      setCheckInMessage('❌ Gửi lý do thất bại: ' + error.message);
    }
  };

  const handleApproval = async (attendanceId: string, action: 'approve' | 'reject', type: 'checkin' | 'checkout', rejectionReason?: string) => {
    try {
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
            ...(action === 'reject' && rejectionReason ? { rejectionReason } : {}),
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setCheckInMessage(`✅ ${action === 'approve' ? 'Đã duyệt' : 'Đã từ chối'} thành công!`);
        setShowActionMenu(null);
        // Reload attendance to see updated status
        if (selectedOfficer) {
          await fetchAttendance(selectedOfficer.id || selectedOfficer._id);
        }
      } else {
        setCheckInMessage(`❌ ${data.error || 'Có lỗi xảy ra'}`);
      }
    } catch (error: any) {
      setCheckInMessage(`❌ ${error.message || 'Có lỗi xảy ra'}`);
    }
  };

  const handleRejectClick = (attendanceId: string, type: 'checkin' | 'checkout') => {
    setRejectDialogData({ attendanceId, type });
    setShowRejectDialog(true);
    setShowActionMenu(null);
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối');
      return;
    }
    
    if (rejectDialogData) {
      await handleApproval(rejectDialogData.attendanceId, 'reject', rejectDialogData.type, rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason('');
    }
  };

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
                Trang chủ
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-slate-700">
                  {user.fullName} <span className="text-slate-400 mx-1">|</span> <span className="text-orange-600">{user.role}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {(user.role === 'admin' || user.role === 'supervisor') && (
                  <button
                    onClick={() => router.push('/offices')}
                    className="px-3 py-2 text-sm font-medium bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                    title="Quản lý trụ sở"
                  >
                    Trụ sở
                  </button>
                )}
                {user.role === 'admin' && (
                  <button
                    onClick={() => router.push('/users')}
                    className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                    title="Quản lý người dùng"
                  >
                    Người dùng
                  </button>
                )}
                {user.role === 'officer' ? (
                  <button
                    onClick={() => router.push('/messages')}
                    className="px-3 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors cursor-pointer"
                    title="Phản hồi với cấp trên"
                  >
                    📞 Phản hồi
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/messages')}
                    className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="Tin nhắn"
                  >
                    💬 Tin nhắn
                  </button>
                )}
                <button 
                  onClick={logout} 
                  className="px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
                  title="Đăng xuất"
                >
                  Đăng xuất
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Chấm công</h2>
                  <p className="text-slate-500">Xác thực vị trí và chấm công</p>
                </div>
              </div>
            </div>
            
            {selectedOfficeData && (
              <div className="flex items-center gap-6 mb-6 text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 inline-flex">
                <div className="flex items-center gap-2">
                  <span>Trụ sở: {offices.length === 0 && <div>Chưa có trụ sở nào</div>}
                  {offices.map((office) => ( <span className="font-semibold text-slate-700" key={office._id || office.id}>{office.name}</span>))}</span>
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <span>Bán kính: <span className="font-semibold text-slate-700">{selectedOfficeData.radius}m</span></span>
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <span>{selectedOfficeData.address}</span>
                </div>
              </div>
            )}
            
            {checkInMessage && (
              <div className={`mb-6 p-4 rounded-xl border ${
                checkInMessage.includes('successful') || checkInMessage.includes('thành công')
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                  : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                <p className="font-medium">{checkInMessage}</p>
              </div>
            )}

            {/* Today's attendance status */}
            {todayAttendance && (
              <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900">Trạng thái hôm nay</h3>
                  <StatusBadge status={todayAttendance.status} />
                </div>
                
                {/* Check-in status */}
                <div className="mb-3 p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-700">Check-in</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      todayAttendance.checkinStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      todayAttendance.checkinStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {todayAttendance.checkinStatus === 'pending' ? '⏳ Chờ phê duyệt' :
                       todayAttendance.checkinStatus === 'approved' ? '✅ Đã duyệt' :
                       '❌ Bị từ chối'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    {new Date(todayAttendance.checkinTime).toLocaleString('vi-VN')}
                  </p>
                  {todayAttendance.checkinStatus === 'pending' && (
                    <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Đang chờ supervisor phê duyệt...
                    </p>
                  )}
                  {todayAttendance.checkinStatus === 'rejected' && todayAttendance.checkinRejectionReason && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-xs font-medium text-red-800 mb-1">Lý do từ chối:</p>
                      <p className="text-xs text-red-700">{todayAttendance.checkinRejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Check-out status */}
                {todayAttendance.checkoutTime && (
                  <div className="p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-700">Check-out</p>
                      {todayAttendance.checkoutStatus && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          todayAttendance.checkoutStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          todayAttendance.checkoutStatus === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {todayAttendance.checkoutStatus === 'pending' ? '⏳ Chờ phê duyệt' :
                           todayAttendance.checkoutStatus === 'approved' ? '✅ Đã duyệt' :
                           '❌ Bị từ chối'}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      {new Date(todayAttendance.checkoutTime).toLocaleString('vi-VN')}
                    </p>
                    {todayAttendance.totalHours !== undefined && (
                      <p className="text-sm text-slate-600">
                        Tổng giờ: <span className="font-bold text-orange-600">{todayAttendance.totalHours.toFixed(2)}h</span>
                      </p>
                    )}
                    {todayAttendance.checkoutStatus === 'pending' && (
                      <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Đang chờ supervisor phê duyệt...
                      </p>
                    )}
                    {todayAttendance.checkoutStatus === 'rejected' && todayAttendance.checkoutRejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs font-medium text-red-800 mb-1">Lý do từ chối:</p>
                        <p className="text-xs text-red-700">{todayAttendance.checkoutRejectionReason}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Warning for Invalid attendance without reason */}
            {todayAttendance && todayAttendance.status === 'Invalid' && !todayAttendance.checkinReason && !todayAttendance.checkoutReason && (
              <>
                <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">⚠️</span>
                    <div className="flex-1">
                      <p className="text-base font-bold text-amber-900 mb-2">
                        Điểm danh không hợp lệ - Cần cung cấp lý do
                      </p>
                      <p className="text-sm text-amber-700 mb-4">
                        Bạn đã điểm danh ngoài phạm vi cho phép. Vui lòng cung cấp lý do để supervisor có thể xem xét phê duyệt.
                      </p>
                      <button
                        onClick={() => {
                          const type = !todayAttendance.checkinReason ? 'checkin' : 'checkout';
                          setReasonDialogData({
                            type,
                            attendanceId: todayAttendance._id || ''
                          });
                          setShowReasonDialog(true);
                        }}
                        className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-lg transition-all hover:shadow-lg active:scale-95 flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Cập nhật lý do ngay
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Divider */}
                <div className="relative my-6 mt-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                </div>
              </>
            )}

            {/* Single button that changes based on state */}
            {!todayAttendance ? (
              <div className="space-y-4">{/* Photo capture button */}
                {!capturedPhoto && (
                  <SmartUpload 
                    onImageSelect={setCapturedPhoto} 
                    onCheckLocation={handleCheckLocation}
                  />
                )}
                {capturedPhoto && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Đã chụp ảnh
                    </div>
                )}

                {/* Preview captured photo */}
                {capturedPhoto && (
                  <div className="relative">
                    <img src={capturedPhoto} alt="Preview" className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200" />
                    <button
                      onClick={() => setCapturedPhoto('')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Check-in button */}
                <button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="w-full sm:w-auto px-8 py-4 bg-orange-600 text-white font-bold rounded-xl transition-all hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
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
                    <span>Bắt đầu ca làm</span>
                  )}
                </button>
              </div>
            ) : !todayAttendance.checkoutTime ? (
              <div className="space-y-4">
                {/* Photo capture button for checkout */}
                {!capturedPhoto && (
                  <SmartUpload 
                    onImageSelect={setCapturedPhoto} 
                    onCheckLocation={handleCheckLocation}
                  />
                )}
                {capturedPhoto && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Đã chụp ảnh
                    </div>
                )}

                {/* Preview captured photo */}
                {capturedPhoto && (
                  <div className="relative">
                    <img src={capturedPhoto} alt="Preview" className="w-32 h-32 object-cover rounded-lg border-2 border-slate-200" />
                    <button
                      onClick={() => setCapturedPhoto('')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Checkout button */}
                <button
                  onClick={handleCheckOut}
                  disabled={isCheckingOut}
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {isCheckingOut ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Đang xử lý...</span>
                    </>
                  ) : (
                    <span>Kết thúc ca làm</span>
                  )}
                </button>
              </div>
            ) : (
              // Already checked in and checked out today
              <div className="w-full">
                <button
                  disabled
                  className="w-full sm:w-auto px-8 py-4 bg-slate-300 text-slate-600 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-3"
                >
                  <span>Bạn đã kết thúc ca làm hôm nay</span>
                </button>
                <p className="text-sm text-slate-500 mt-3 text-center sm:text-left">
                  Mai bạn sẽ có thể bắt đầu ca làm mới
                </p>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {user.role === 'admin' ? (
            <>
              <div onClick={() => setAdminView('offices')} className="cursor-pointer">
                <StatCard
                  title="TỔNG SỐ TRỤ SỞ"
                  value={getTotalCount()}
                  icon="🏢"
                  color="blue"
                />
              </div>
              <div onClick={() => setAdminView('officers')} className="cursor-pointer">
                <StatCard
                  title="TỔNG SỐ NHÂN VIÊN"
                  value={getValidCount()}
                  icon="👥"
                  color="green"
                />
              </div>
              <div onClick={() => setAdminView('supervisors')} className="cursor-pointer">
                <StatCard
                  title="TỔNG SỐ GIÁM SÁT"
                  value={getInvalidCount()}
                  icon="👔"
                  color="red"
                />
              </div>
            </>
          ) : (
            <>
              <StatCard
                title={user.role === 'supervisor' ? "TỔNG SỐ NHÂN VIÊN" : "TỔNG SỐ"}
                value={getTotalCount()}
                icon="📊"
                color="blue"
              />
              <StatCard
                title={user.role === 'supervisor' ? "ĐANG HOẠT ĐỘNG" : "HỢP LỆ"}
                value={getValidCount()}
                icon="✓"
                color="green"
              />
              <StatCard
                title={user.role === 'supervisor' ? "NGỪNG HOẠT ĐỘNG" : "KHÔNG HỢP LỆ"}
                value={getInvalidCount()}
                icon="✗"
                color="red"
              />
            </>
          )}
        </div>

        {/* Attendance Records or Officer List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {user.role === 'admin' ? (
            // Admin view
            <>
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  {adminView === 'offices' && 'Danh sách Trụ sở'}
                  {adminView === 'officers' && 'Danh sách Nhân viên'}
                  {adminView === 'supervisors' && 'Danh sách Giám sát viên'}
                </h2>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-3"></div>
                  <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {adminView === 'offices' && (
                    allOffices.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-slate-900 font-medium text-lg">Chưa có trụ sở nào</p>
                        <p className="text-slate-500 text-sm mt-1">Danh sách trụ sở sẽ xuất hiện tại đây</p>
                      </div>
                    ) : (
                      allOffices.map((office) => (
                        <div
                          key={office._id || office.id}
                          className="p-4 sm:p-6 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                                🏢
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-lg">{office.name}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                  <span>{office.address}</span>
                                  <span>•</span>
                                  <span>Bán kính: {office.radius}m</span>
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              office.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {office.isActive ? 'Hoạt động' : 'Ngừng'}
                            </span>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {adminView === 'officers' && (
                    officers.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-slate-900 font-medium text-lg">Chưa có nhân viên nào</p>
                        <p className="text-slate-500 text-sm mt-1">Danh sách nhân viên sẽ xuất hiện tại đây</p>
                      </div>
                    ) : (
                      officers.map((officer) => (
                        <div
                          key={officer.id || officer._id}
                          className="p-4 sm:p-6 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-lg shrink-0">
                                {officer.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-lg">{officer.fullName}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                  <span>{officer.email}</span>
                                  {officer.badgeNumber && (
                                    <>
                                      <span>•</span>
                                      <span>Mã: {officer.badgeNumber}</span>
                                    </>
                                  )}
                                  {officer.department && (
                                    <>
                                      <span>•</span>
                                      <span>{officer.department}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              officer.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {officer.isActive ? 'Hoạt động' : 'Ngừng'}
                            </span>
                          </div>
                        </div>
                      ))
                    )
                  )}

                  {adminView === 'supervisors' && (
                    supervisors.length === 0 ? (
                      <div className="text-center py-16">
                        <p className="text-slate-900 font-medium text-lg">Chưa có giám sát viên nào</p>
                        <p className="text-slate-500 text-sm mt-1">Danh sách giám sát viên sẽ xuất hiện tại đây</p>
                      </div>
                    ) : (
                      supervisors.map((supervisor) => (
                        <div
                          key={supervisor.id || supervisor._id}
                          className="p-4 sm:p-6 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shrink-0">
                                {supervisor.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 text-lg">{supervisor.fullName}</p>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                  <span>{supervisor.email}</span>
                                  {supervisor.badgeNumber && (
                                    <>
                                      <span>•</span>
                                      <span>Mã: {supervisor.badgeNumber}</span>
                                    </>
                                  )}
                                  {supervisor.department && (
                                    <>
                                      <span>•</span>
                                      <span>{supervisor.department}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              supervisor.isActive
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {supervisor.isActive ? 'Hoạt động' : 'Ngừng'}
                            </span>
                          </div>
                        </div>
                      ))
                    )
                  )}
                </div>
              )}
            </>
          ) : (
            // Supervisor and Officer view
            <>
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedOfficer && (
                <button
                  onClick={handleBackToOfficers}
                  className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
                >
                  ← Quay lại
                </button>
              )}
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {user.role === 'supervisor' && !selectedOfficer
                    ? 'Danh sách nhân viên'
                    : selectedOfficer
                    ? `Lịch sử điểm danh - ${selectedOfficer.fullName}`
                    : 'Lịch sử điểm danh'}
                </h2>
                
                {((user.role === 'officer') || (user.role === 'supervisor' && selectedOfficer)) && records.length > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    Tổng giờ làm: <span className="font-bold text-orange-600">{totalWorkingHours.toFixed(2)} giờ</span>
                  </p>
                )}
              </div>
            </div>
            
            {user.role === 'supervisor' && (
              <button
                onClick={() => router.push('/approvals')}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-sm hover:shadow-md"
                title="Phê duyệt Check-in/out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <span className="hidden sm:inline">Phê duyệt</span>
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-3"></div>
              <p className="text-slate-500 text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : user.role === 'supervisor' && !selectedOfficer ? (
            // Show officers list for supervisor
            officers.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-900 font-medium text-lg">Chưa có nhân viên</p>
                <p className="text-slate-500 text-sm mt-1">Danh sách nhân viên sẽ xuất hiện tại đây</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {officers.map((officer) => (
                  <div
                    key={officer.id || officer._id}
                    onClick={() => handleOfficerClick(officer)}
                    className="p-4 sm:p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg shrink-0">
                          {officer.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-lg">{officer.fullName}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                            <span>{officer.email}</span>
                            {officer.badgeNumber && (
                              <>
                                <span>•</span>
                                <span>Mã: {officer.badgeNumber}</span>
                              </>
                            )}
                            {officer.department && (
                              <>
                                <span>•</span>
                                <span>{officer.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          officer.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {officer.isActive ? 'Hoạt động' : 'Ngừng'}
                        </span>
                        <span className="text-slate-400">→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : records.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-900 font-medium text-lg">Chưa có dữ liệu</p>
              <p className="text-slate-500 text-sm mt-1">Lịch sử điểm danh sẽ xuất hiện tại đây</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <div 
                  key={record._id}
                  className="p-4 sm:p-6 hover:bg-slate-50 transition-colors relative"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {record.officerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{record.officerName}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                          {record.officeName && (
                            <span className="flex items-center gap-1">
                              {record.officeName}
                            </span>
                          )}
                          {(user.role === 'supervisor' || user.role === 'admin') && (
                            <>
                              {record.location && (
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${record.location.lat},${record.location.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-blue-600 hover:underline cursor-pointer text-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                  title="Xem vị trí trên Google Maps"
                                >
                                  <span>📍</span>
                                  {record.location.lat.toFixed(5)}, {record.location.lng.toFixed(5)}
                                </a>
                              )}
                              {record.checkinPhoto && (
                                <div className="relative group">
                                  <span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 cursor-help">
                                    📷 Ảnh
                                  </span>
                                  <div className="hidden group-hover:block absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 p-1 bg-white rounded-lg shadow-xl border border-slate-200 w-48">
                                    <img src={record.checkinPhoto} alt="Check-in" className="w-full h-auto rounded" />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 pl-14 sm:pl-0">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          {new Date(record.checkinTime).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      
                      <StatusBadge status={record.status} />
                    </div>
                  </div>
                  
                  {/* Approval status for supervisor */}
                  {user.role === 'supervisor' && selectedOfficer && (
                    <div className="mt-4 pt-4 border-t border-slate-100 pl-14 space-y-3">
                      {/* Check-in status */}
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-700">Check-in:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            record.checkinStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            record.checkinStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.checkinStatus === 'pending' ? 'Chờ duyệt' :
                             record.checkinStatus === 'approved' ? 'Đã duyệt' :
                             'Đã từ chối'}
                          </span>
                          {record.checkinRejectionReason && (
                            <span className="text-xs text-red-600" title={record.checkinRejectionReason}>
                              (Lý do: {record.checkinRejectionReason.substring(0, 30)}...)
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setShowActionMenu(
                              showActionMenu?.recordId === record._id && showActionMenu?.type === 'checkin' 
                                ? null 
                                : {recordId: record._id || '', type: 'checkin'}
                            )}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Thay đổi trạng thái"
                          >
                            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                          </button>
                          
                          {showActionMenu?.recordId === record._id && showActionMenu?.type === 'checkin' && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                              <button
                                onClick={() => {
                                  handleApproval(record._id || '', 'approve', 'checkin');
                                }}
                                disabled={record.checkinStatus === 'approved'}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                  record.checkinStatus === 'approved' ? 'text-slate-400 cursor-not-allowed' : 'text-green-600'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {record.checkinStatus === 'approved' ? 'Đã duyệt' : 'Duyệt'}
                              </button>
                              <button
                                onClick={() => handleRejectClick(record._id || '', 'checkin')}
                                disabled={record.checkinStatus === 'rejected'}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                  record.checkinStatus === 'rejected' ? 'text-slate-400 cursor-not-allowed' : 'text-red-600'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {record.checkinStatus === 'rejected' ? 'Đã từ chối' : 'Từ chối'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Check-out status */}
                      {record.checkoutTime && (
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">Check-out:</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              record.checkoutStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              record.checkoutStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {record.checkoutStatus === 'pending' ? 'Chờ duyệt' :
                               record.checkoutStatus === 'approved' ? 'Đã duyệt' :
                               'Đã từ chối'}
                            </span>
                            {record.checkoutRejectionReason && (
                              <span className="text-xs text-red-600" title={record.checkoutRejectionReason}>
                                (Lý do: {record.checkoutRejectionReason.substring(0, 30)}...)
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => setShowActionMenu(
                                showActionMenu?.recordId === record._id && showActionMenu?.type === 'checkout' 
                                  ? null 
                                  : {recordId: record._id || '', type: 'checkout'}
                              )}
                              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                              title="Thay đổi trạng thái"
                            >
                              <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                            </button>
                            
                            {showActionMenu?.recordId === record._id && showActionMenu?.type === 'checkout' && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                                <button
                                  onClick={() => {
                                    handleApproval(record._id || '', 'approve', 'checkout');
                                  }}
                                  disabled={record.checkoutStatus === 'approved'}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                    record.checkoutStatus === 'approved' ? 'text-slate-400 cursor-not-allowed' : 'text-green-600'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {record.checkoutStatus === 'approved' ? 'Đã duyệt' : 'Duyệt'}
                                </button>
                                <button
                                  onClick={() => handleRejectClick(record._id || '', 'checkout')}
                                  disabled={record.checkoutStatus === 'rejected'}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                    record.checkoutStatus === 'rejected' ? 'text-slate-400 cursor-not-allowed' : 'text-red-600'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  {record.checkoutStatus === 'rejected' ? 'Đã từ chối' : 'Từ chối'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Approval status for supervisor */}
                  {user.role === 'supervisor' && selectedOfficer && (
                    <div className="mt-4 pt-4 border-t border-slate-100 pl-14 space-y-3">
                      {/* Check-in status */}
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-slate-700">Check-in:</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            record.checkinStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            record.checkinStatus === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {record.checkinStatus === 'pending' ? 'Chờ duyệt' :
                             record.checkinStatus === 'approved' ? 'Đã duyệt' :
                             'Đã từ chối'}
                          </span>
                          {record.checkinRejectionReason && (
                            <span className="text-xs text-red-600" title={record.checkinRejectionReason}>
                              (Lý do: {record.checkinRejectionReason.substring(0, 30)}...)
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setShowActionMenu(
                              showActionMenu?.recordId === record._id && showActionMenu?.type === 'checkin' 
                                ? null 
                                : {recordId: record._id || '', type: 'checkin'}
                            )}
                            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                            title="Thay đổi trạng thái"
                          >
                            <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                            </svg>
                          </button>
                          
                          {showActionMenu?.recordId === record._id && showActionMenu?.type === 'checkin' && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                              <button
                                onClick={() => {
                                  handleApproval(record._id || '', 'approve', 'checkin');
                                }}
                                disabled={record.checkinStatus === 'approved'}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                  record.checkinStatus === 'approved' ? 'text-slate-400 cursor-not-allowed' : 'text-green-600'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {record.checkinStatus === 'approved' ? 'Đã duyệt' : 'Duyệt'}
                              </button>
                              <button
                                onClick={() => handleRejectClick(record._id || '', 'checkin')}
                                disabled={record.checkinStatus === 'rejected'}
                                className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                  record.checkinStatus === 'rejected' ? 'text-slate-400 cursor-not-allowed' : 'text-red-600'
                                }`}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                {record.checkinStatus === 'rejected' ? 'Đã từ chối' : 'Từ chối'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Check-out status */}
                      {record.checkoutTime && (
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">Check-out:</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              record.checkoutStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              record.checkoutStatus === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {record.checkoutStatus === 'pending' ? 'Chờ duyệt' :
                               record.checkoutStatus === 'approved' ? 'Đã duyệt' :
                               'Đã từ chối'}
                            </span>
                            {record.checkoutRejectionReason && (
                              <span className="text-xs text-red-600" title={record.checkoutRejectionReason}>
                                (Lý do: {record.checkoutRejectionReason.substring(0, 30)}...)
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              onClick={() => setShowActionMenu(
                                showActionMenu?.recordId === record._id && showActionMenu?.type === 'checkout' 
                                  ? null 
                                  : {recordId: record._id || '', type: 'checkout'}
                              )}
                              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                              title="Thay đổi trạng thái"
                            >
                              <svg className="w-5 h-5 text-slate-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                              </svg>
                            </button>
                            
                            {showActionMenu?.recordId === record._id && showActionMenu?.type === 'checkout' && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                                <button
                                  onClick={() => {
                                    handleApproval(record._id || '', 'approve', 'checkout');
                                  }}
                                  disabled={record.checkoutStatus === 'approved'}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                    record.checkoutStatus === 'approved' ? 'text-slate-400 cursor-not-allowed' : 'text-green-600'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {record.checkoutStatus === 'approved' ? 'Đã duyệt' : 'Duyệt'}
                                </button>
                                <button
                                  onClick={() => handleRejectClick(record._id || '', 'checkout')}
                                  disabled={record.checkoutStatus === 'rejected'}
                                  className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 ${
                                    record.checkoutStatus === 'rejected' ? 'text-slate-400 cursor-not-allowed' : 'text-red-600'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  {record.checkoutStatus === 'rejected' ? 'Đã từ chối' : 'Từ chối'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time info - always show */}
                  <div className="mt-4 pt-4 border-t border-slate-100 pl-14 grid grid-cols-3 gap-4 text-sm">
                    <div 
                      className={record.checkinPhoto ? "cursor-pointer group" : ""}
                      onClick={() => record.checkinPhoto && setPreviewPhoto({ 
                        url: record.checkinPhoto, 
                        title: 'Ảnh Check-in',
                        location: record.location,
                        time: new Date(record.checkinTime).toLocaleString('vi-VN')
                      })}
                      title={record.checkinPhoto ? "Nhấn để xem ảnh và vị trí check-in" : ""}
                    >
                      <p className="text-slate-500 mb-1 flex items-center gap-1">
                        Bắt đầu
                        {record.checkinPhoto && <span className="text-xs text-blue-500">📷</span>}
                      </p>
                      <p className={`font-medium ${record.checkinPhoto ? "text-blue-600 group-hover:underline" : "text-slate-900"}`}>
                        {new Date(record.checkinTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div
                      className={record.checkoutPhoto ? "cursor-pointer group" : ""}
                      onClick={() => record.checkoutPhoto && setPreviewPhoto({ 
                        url: record.checkoutPhoto, 
                        title: 'Ảnh Check-out',
                        location: record.location,
                        time: record.checkoutTime ? new Date(record.checkoutTime).toLocaleString('vi-VN') : undefined
                      })}
                      title={record.checkoutPhoto ? "Nhấn để xem ảnh và vị trí check-out" : ""}
                    >
                      <p className="text-slate-500 mb-1 flex items-center gap-1">
                        Kết thúc
                        {record.checkoutPhoto && <span className="text-xs text-blue-500">📷</span>}
                      </p>
                      {record.checkoutTime ? (
                        <p className={`font-medium ${record.checkoutPhoto ? "text-blue-600 group-hover:underline" : "text-slate-900"}`}>
                          {new Date(record.checkoutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      ) : (
                        <p className="text-slate-400 italic">Chưa kết thúc</p>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Tổng giờ làm</p>
                      {record.checkinStatus === 'rejected' || record.checkoutStatus === 'rejected' ? (
                        <p className="text-red-600 italic text-sm">Không tính (bị từ chối)</p>
                      ) : record.totalHours ? (
                        <p className="font-bold text-orange-600">{record.totalHours.toFixed(2)} /8 giờ</p>
                      ) : (
                        <p className="text-slate-400 italic">--</p>
                      )}
                    </div>
                  </div>

                  {/* Reason section for Invalid records */}
                  {record.status === 'Invalid' && (
                    <div className="mt-4 pt-4 border-t border-slate-100 pl-14">
                      {/* Show update reason button for officer's own records */}
                      {user.role === 'officer' && !record.checkinReason && !record.checkoutReason && (
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-amber-900 mb-2">
                                Điểm danh không hợp lệ - Cần cung cấp lý do
                              </p>
                              <p className="text-xs text-amber-700 mb-3">
                                Bạn đã điểm danh ngoài phạm vi cho phép. Vui lòng cung cấp lý do để supervisor có thể xem xét phê duyệt.
                              </p>
                              <button
                                onClick={() => {
                                  // Determine which type based on what needs reason
                                  const type = !record.checkinReason ? 'checkin' : 'checkout';
                                  setReasonDialogData({
                                    type,
                                    attendanceId: record._id || ''
                                  });
                                  setShowReasonDialog(true);
                                }}
                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Cập nhật lý do
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show reason details for supervisors/admins or after officer submitted */}
                      {((user.role === 'supervisor' || user.role === 'admin') || (record.checkinReason || record.checkoutReason)) && (record.checkinReason || record.checkoutReason) && (
                        <div className="space-y-3">
                          {record.checkinReason && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-yellow-600 mt-0.5">⚠️</span>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-yellow-800 mb-1">Lý do Check-in ngoài phạm vi:</p>
                                  <p className="text-sm text-yellow-900">{record.checkinReason}</p>
                                  {record.checkinReasonPhoto && (
                                    <div 
                                      className="mt-2 cursor-pointer"
                                      onClick={() => setPreviewPhoto({ url: record.checkinReasonPhoto!, title: 'Ảnh lý do Check-in' })}
                                    >
                                      <img src={record.checkinReasonPhoto} alt="Lý do" className="w-32 h-32 object-cover rounded border-2 border-yellow-300 hover:border-yellow-500 transition-colors" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          {record.checkoutReason && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <div className="flex items-start gap-2">
                                <span className="text-yellow-600 mt-0.5">⚠️</span>
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-yellow-800 mb-1">Lý do Check-out ngoài phạm vi:</p>
                                  <p className="text-sm text-yellow-900">{record.checkoutReason}</p>
                                  {record.checkoutReasonPhoto && (
                                    <div 
                                      className="mt-2 cursor-pointer"
                                      onClick={() => setPreviewPhoto({ url: record.checkoutReasonPhoto!, title: 'Ảnh lý do Check-out' })}
                                    >
                                      <img src={record.checkoutReasonPhoto} alt="Lý do" className="w-32 h-32 object-cover rounded border-2 border-yellow-300 hover:border-yellow-500 transition-colors" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {(user.role === 'supervisor' || user.role === 'admin') && !record.checkinReason && !record.checkoutReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-700 flex items-center gap-2">
                            <span>❌</span>
                            <span>Nhân viên chưa cung cấp lý do cho điểm danh không hợp lệ</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      </main>

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewPhoto(null)}
        >
          <div 
            className="relative bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{previewPhoto.title}</h3>
                {previewPhoto.time && (
                  <p className="text-sm text-slate-500 mt-1">{previewPhoto.time}</p>
                )}
              </div>
              <button 
                onClick={() => setPreviewPhoto(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-2 bg-slate-100 flex justify-center">
              <img 
                src={previewPhoto.url} 
                alt={previewPhoto.title} 
                className="max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            {previewPhoto.location && (
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Vị trí GPS</p>
                    <p className="text-sm text-slate-600">
                      {previewPhoto.location.lat.toFixed(6)}, {previewPhoto.location.lng.toFixed(6)}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${previewPhoto.location.lat},${previewPhoto.location.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Xem trên Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Xác nhận điểm danh"
        message={
          !isLocationChecked && !capturedPhoto
            ? "Hệ thống sẽ tự động lấy vị trí hiện tại của bạn để điểm danh. Bạn chưa kiểm tra vị trí và chụp ảnh, điểm danh có thể nằm ngoài phạm vi. Vẫn muốn tiếp tục?"
            : !isLocationChecked && capturedPhoto
            ? "Hệ thống sẽ tự động lấy vị trí hiện tại của bạn để điểm danh. Bạn chưa kiểm tra vị trí trước, có thể nằm ngoài phạm vi. Vẫn muốn tiếp tục?"
            : isLocationChecked && !isLocationVerified && !capturedPhoto
            ? "⚠️ Bạn đang ở NGOÀI phạm vi cho phép và chưa chụp ảnh. Điểm danh sẽ được đánh dấu là KHÔNG HỢP LỆ và cần cung cấp lí do để người giám sát có thể phê duyệt. Vẫn muốn tiếp tục?"
            : isLocationChecked && !isLocationVerified && capturedPhoto
            ? "⚠️ Bạn đang ở NGOÀI phạm vi cho phép. Điểm danh sẽ được đánh dấu là KHÔNG HỢP LỆ và cần cung cấp lí do để người giám sát có thể phê duyệt. Vẫn muốn tiếp tục?"
            : isLocationChecked && isLocationVerified && !capturedPhoto
            ? "Bạn đang trong phạm vi cho phép nhưng chưa chụp ảnh. Vẫn muốn điểm danh?"
            : "Hệ thống sẽ tự động lấy vị trí GPS hiện tại của bạn để điểm danh. Vẫn muốn tiếp tục?"
        }
        confirmText="Đồng ý"
        cancelText="Cập nhật"
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
      />

      {/* Reason Dialog for Invalid Check-in/out */}
      <ReasonDialog
        isOpen={showReasonDialog}
        type={reasonDialogData.type}
        attendanceId={reasonDialogData.attendanceId}
        onClose={() => setShowReasonDialog(false)}
        onSubmit={handleReasonSubmit}
      />

      {/* Reject Dialog for Supervisor */}
      {showRejectDialog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowRejectDialog(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Lý do từ chối</h3>
              <button 
                onClick={() => setShowRejectDialog(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Vui lòng nhập lý do từ chối <span className="text-red-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ví dụ: Ảnh không rõ mặt, vị trí không hợp lệ..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={4}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectDialog(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectSubmit}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
