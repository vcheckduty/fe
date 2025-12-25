'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { officeAPI } from '@/lib/api';
import type { Office } from '@/types';
import Image from 'next/image';
import OfficeMembersModal from '@/components/OfficeMembersModal';
import Logo from '@/components/Logo';

export default function OfficesPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [selectedOfficeForMembers, setSelectedOfficeForMembers] = useState<Office | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    radius: '50',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || (currentUser?.role !== 'admin' && currentUser?.role !== 'supervisor'))) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  useEffect(() => {
    if (isAuthenticated && (currentUser?.role === 'admin' || currentUser?.role === 'supervisor')) {
      fetchOffices();
    }
  }, [isAuthenticated, currentUser]);

  const fetchOffices = async () => {
    try {
      setIsLoading(true);
      const response = await officeAPI.getAll();
      if (response.success) {
        setOffices(response.data.offices);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate coordinates
    if (!formData.lat || !formData.lng) {
      alert('Vui lòng nhập tọa độ (Latitude và Longitude)');
      return;
    }

    try {
      const officeData = {
        name: formData.name,
        address: formData.address,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
        radius: 50, // Fixed radius: 50m
        description: formData.description,
        isActive: formData.isActive,
      };

      if (editingOffice) {
        await officeAPI.update(editingOffice._id || editingOffice.id!, officeData);
      } else {
        await officeAPI.create(officeData);
      }

      setShowModal(false);
      resetForm();
      fetchOffices();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  const handleEdit = (office: Office) => {
    setEditingOffice(office);
    setFormData({
      name: office.name,
      address: office.address,
      lat: office.location.lat.toString(),
      lng: office.location.lng.toString(),
      radius: office.radius.toString(),
      description: office.description || '',
      isActive: office.isActive,
    });
    setShowModal(true);
  };

  const handleDelete = async (officeId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa trụ sở này?')) return;

    try {
      await officeAPI.delete(officeId);
      setOffices(offices.filter((o) => (o._id || o.id) !== officeId));
    } catch (err: any) {
      alert('Xóa thất bại: ' + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      lat: '',
      lng: '',
      radius: '50',
      description: '',
      isActive: true,
    });
    setEditingOffice(null);
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    );
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
                  <h1 className="text-xl font-bold text-slate-900">Quản lý Trụ sở</h1>
                  <p className="text-xs text-slate-500 font-medium">{currentUser.fullName} • {currentUser.role === 'admin' ? 'Quản trị viên' : 'Giám sát'}</p>
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
        {/* Stats & Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4 flex items-center gap-4">
            <div className="p-3 bg-orange-50 rounded-lg text-orange-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Tổng số trụ sở</p>
              <p className="text-2xl font-bold text-slate-900">{offices.length}</p>
            </div>
          </div>
          
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition shadow-sm hover:shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm trụ sở mới
            </button>
          )}
        </div>

        {/* Offices Grid */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
              {error}
            </div>
          ) : offices.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Chưa có trụ sở nào</h3>
              <p className="text-slate-500">Bắt đầu bằng cách thêm một trụ sở mới.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {offices.map((office) => (
                <div
                  key={office._id || office.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-50 rounded-lg text-orange-600 group-hover:bg-orange-100 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">{office.name}</h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            office.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {office.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <p className="text-sm text-slate-600 flex items-start gap-2">
                      <svg className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{office.address}</span>
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7" />
                        </svg>
                        {office.location.lat.toFixed(4)}, {office.location.lng.toFixed(4)}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        R: {office.radius}m
                      </div>
                    </div>
                    {office.description && (
                      <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2 line-clamp-2">
                        {office.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    {currentUser?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => handleEdit(office)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(office._id || office.id!)}
                          className="flex-1 px-3 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Xóa
                        </button>
                      </>
                    )}
                    {(currentUser?.role === 'supervisor' || currentUser?.role === 'admin') && (
                      <button
                        onClick={() => setSelectedOfficeForMembers(office)}
                        className="flex-1 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Quản lý
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">
                {editingOffice ? 'Chỉnh sửa trụ sở' : 'Thêm trụ sở mới'}
              </h2>
              <button 
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tên trụ sở <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="VD: Trụ sở chính"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Nhập địa chỉ đầy đủ..."
                />
              </div>
              
              {/* Coordinate inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Vĩ độ (Latitude) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    placeholder="VD: 16.467"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kinh độ (Longitude) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                    placeholder="VD: 107.590"
                  />
                </div>
              </div>
              
              {/* Helper text */}
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <div className="flex gap-3">
                  <div className="text-orange-600 mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-orange-900">
                    <strong>Cách lấy tọa độ:</strong> Mở{' '}
                    <a 
                      href="https://www.google.com/maps" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-orange-700 hover:underline font-bold"
                    >
                      Google Maps
                    </a>
                    , click chuột phải vào địa điểm, chọn dòng số đầu tiên để copy tọa độ.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                  placeholder="Mô tả thêm về trụ sở..."
                />
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                  Đang hoạt động
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition shadow-sm"
                >
                  {editingOffice ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Office Members Modal */}
      {selectedOfficeForMembers && (
        <OfficeMembersModal
          office={selectedOfficeForMembers}
          isOpen={!!selectedOfficeForMembers}
          onClose={() => setSelectedOfficeForMembers(null)}
          onUpdate={fetchOffices}
          currentUserRole={currentUser?.role}
        />
      )}
    </div>
  );
}
