'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendanceAPI, officeAPI, userAPI } from '@/lib/api';
import type { Attendance, Office, User } from '@/types';
import Logo from '@/components/Logo';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';

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

  const handleCheckIn = async () => {
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

  const handleCheckOut = async () => {
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
          });

          if (response.success) {
            setCheckInMessage(`Kết thúc ca làm thành công! Tổng giờ làm việc: ${response.data.totalHours} giờ`);
            // Wait a bit then fetch to ensure DB is updated
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

  const totalWorkingHours = records.reduce((acc, record) => {
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
                    className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer"
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
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 mb-1">Bắt đầu</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(todayAttendance.checkinTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {todayAttendance.checkoutTime && (
                    <>
                      <div>
                        <p className="text-slate-600 mb-1">Kết thúc</p>
                        <p className="font-semibold text-slate-900">
                          {new Date(todayAttendance.checkoutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-600 mb-1">Tổng giờ làm việc</p>
                        <p className="font-bold text-orange-600 text-xl">
                          {todayAttendance.totalHours?.toFixed(2)} giờ
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Single button that changes based on state */}
            {!todayAttendance ? (
              // Haven't checked in yet today
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn || !selectedOffice}
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
            ) : !todayAttendance.checkoutTime ? (
              // Checked in but haven't checked out yet
              <button
                onClick={handleCheckOut}
                disabled={isCheckingOut || !selectedOffice}
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
                  className="p-4 sm:p-6 hover:bg-slate-50 transition-colors"
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
                          {/* <span className="flex items-center gap-1">
                            <span>📍</span>
                            {record.location.lat.toFixed(5)}, {record.location.lng.toFixed(5)}
                          </span> */}
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
                  
                  {/* Time info - always show */}
                  <div className="mt-4 pt-4 border-t border-slate-100 pl-14 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Bắt đầu</p>
                      <p className="font-medium text-slate-900">
                        {new Date(record.checkinTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Kết thúc</p>
                      {record.checkoutTime ? (
                        <p className="font-medium text-slate-900">
                          {new Date(record.checkoutTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      ) : (
                        <p className="text-slate-400 italic">Chưa kết thúc</p>
                      )}
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Tổng giờ làm</p>
                      {record.totalHours ? (
                        <p className="font-bold text-orange-600">{record.totalHours.toFixed(2)} /8 giờ</p>
                      ) : (
                        <p className="text-slate-400 italic">--</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
