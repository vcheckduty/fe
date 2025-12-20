'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/lib/api';
import type { User, UserRole } from '@/types';

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, isAuthenticated, currentUser, router]);

  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, currentUser]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getAll();
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa user này?')) return;

    try {
      await userAPI.delete(userId);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert('Xóa user thất bại: ' + err.message);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await userAPI.update(userId, { isActive: !currentStatus });
      setUsers(
        users.map((u) => (u.id === userId ? { ...u, isActive: !currentStatus } : u))
      );
    } catch (err: any) {
      alert('Cập nhật thất bại: ' + err.message);
    }
  };

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  const filteredUsers =
    filter === 'all' ? users : users.filter((u) => u.role === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                ← Quay lại
              </button>
              <div>
                <h1 className="text-3xl font-bold">Quản lý Users</h1>
                <p className="text-sm text-blue-100 mt-1">
                  {currentUser.fullName} • ADMIN
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Tổng users</p>
            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Admins</p>
            <p className="text-3xl font-bold text-purple-600">
              {users.filter((u) => u.role === 'admin').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Supervisors</p>
            <p className="text-3xl font-bold text-orange-600">
              {users.filter((u) => u.role === 'supervisor').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">Officers</p>
            <p className="text-3xl font-bold text-green-600">
              {users.filter((u) => u.role === 'officer').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Danh sách Users</h2>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Tất cả</option>
              <option value="admin">Admin</option>
              <option value="supervisor">Supervisor</option>
              <option value="officer">Officer</option>
            </select>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Không có user nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Tên
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Username
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Số hiệu
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Trạng thái
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">{user.fullName}</td>
                      <td className="py-3 px-4 text-gray-600">{user.username}</td>
                      <td className="py-3 px-4 text-gray-600">{user.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'supervisor'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {user.badgeNumber || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.isActive ? 'Hoạt động' : 'Vô hiệu hóa'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleActive(user.id, user.isActive)}
                            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-xs font-semibold transition"
                          >
                            {user.isActive ? 'Vô hiệu' : 'Kích hoạt'}
                          </button>
                          {user.id !== currentUser.id && (
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
