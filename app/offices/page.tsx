'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { officeAPI } from '@/lib/api';
import type { Office } from '@/types';
import Image from 'next/image';

export default function OfficesPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [offices, setOffices] = useState<Office[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
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
    if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'admin') {
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
    
    try {
      const officeData = {
        name: formData.name,
        address: formData.address,
        location: {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        },
        radius: parseInt(formData.radius),
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                ← 
              </button>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Quản lý Trụ sở</h1>
                  <p className="text-sm text-gray-500">{currentUser.fullName} • Admin</p>
                </div>
              </div>
            </div>
            <button onClick={logout} className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition">
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats & Add Button */}
        <div className="flex items-center justify-between mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
            <p className="text-sm text-gray-600 mb-1">Tổng trụ sở</p>
            <p className="text-3xl font-bold text-gray-900">{offices.length}</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition shadow-sm flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Thêm trụ sở mới
          </button>
        </div>

        {/* Offices Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : offices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Chưa có trụ sở nào</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {offices.map((office) => (
                <div
                  key={office._id || office.id}
                  className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-900">{office.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        office.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {office.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2 flex items-start gap-2">
                    <span className="text-base">📍</span>
                    <span>{office.address}</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Tọa độ: {office.location.lat}, {office.location.lng}
                  </p>
                  <p className="text-sm font-semibold text-blue-600 mb-3">
                    Bán kính: {office.radius}m
                  </p>
                  {office.description && (
                    <p className="text-xs text-gray-500 mb-4 italic">{office.description}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(office)}
                      className="flex-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(office._id || office.id!)}
                      className="flex-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingOffice ? 'Chỉnh sửa trụ sở' : 'Thêm trụ sở mới'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên trụ sở *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Trụ sở Công an..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="123 Đường ABC..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="16.467"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="107.590"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bán kính (mét) *</label>
                <input
                  type="number"
                  value={formData.radius}
                  onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Mô tả về trụ sở..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Trạng thái hoạt động
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  {editingOffice ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
