'use client';

import { useState, useEffect } from 'react';
import { User, Office } from '@/types';
import { officeAPI, userAPI } from '@/lib/api';

interface OfficeMembersModalProps {
  office: Office;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function OfficeMembersModal({
  office,
  isOpen,
  onClose,
  onUpdate,
}: OfficeMembersModalProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      loadAvailableUsers();
    }
  }, [isOpen, office._id]);

  const loadMembers = async () => {
    try {
      const officeId = office._id || office.id || '';
      console.log('🔍 Loading members for office:', officeId, 'Office object:', office);
      const response = await officeAPI.getMembers(officeId);
      setMembers(response.data.members);
    } catch (err: any) {
      console.error('❌ Load members error:', err);
      setError(err.message || 'Failed to load members');
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await userAPI.getAll({ role: 'officer' });
      setAvailableUsers(response.data.users);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    }
  };

  const handleAddMember = async () => {
    if (!selectedUserId) {
      setError('Please select a user');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await officeAPI.addMember(office._id || office.id || '', selectedUserId);
      setSuccessMessage('Member added successfully');
      setShowAddMember(false);
      setSelectedUserId('');
      await loadMembers();
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member from the office?')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await officeAPI.removeMember(office._id || office.id || '', userId);
      setSuccessMessage('Member removed successfully');
      await loadMembers();
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const memberIds = members.map((m) => m.id || m._id);
  const usersNotInOffice = availableUsers.filter(
    (user) => !memberIds.includes(user.id || user._id) && user.isActive && !user.officeId
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Quản lý thành viên</h2>
              <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {office.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition p-2 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
              <svg className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-emerald-600">{successMessage}</p>
            </div>
          )}

          {/* Add Member Section */}
          <div className="mb-6">
            {!showAddMember ? (
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full py-3 px-4 bg-white border border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50 text-orange-600 font-medium rounded-xl transition flex items-center justify-center gap-2 group"
              >
                <div className="p-1 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                Thêm thành viên mới
              </button>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Chọn nhân viên để thêm
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-slate-50"
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {usersNotInOffice.map((user) => (
                        <option key={user.id || user._id} value={user.id || user._id}>
                          {user.fullName} ({user.username})
                        </option>
                      ))}
                    </select>
                    {usersNotInOffice.length === 0 && (
                      <p className="text-xs text-amber-600 mt-2">
                        * Không có nhân viên nào khả dụng (tất cả đã thuộc về văn phòng khác hoặc không hoạt động)
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => {
                        setShowAddMember(false);
                        setSelectedUserId('');
                        setError('');
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAddMember}
                      disabled={isLoading || !selectedUserId}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                    >
                      {isLoading ? 'Đang thêm...' : 'Thêm thành viên'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              Danh sách thành viên 
              <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs">{members.length}</span>
            </h3>
            
            {members.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4 text-slate-400">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-slate-500 font-medium">Chưa có thành viên nào</p>
                <p className="text-slate-400 text-sm mt-1">Thêm thành viên mới để bắt đầu quản lý</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id || member._id}
                    className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-lg">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{member.fullName}</p>
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{member.username}</span>
                            <span>•</span>
                            <span>{member.email}</span>
                          </div>
                          {member.badgeNumber && (
                            <p className="text-xs text-slate-400 mt-0.5 font-mono bg-slate-100 inline-block px-1.5 rounded">
                              ID: {member.badgeNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember((member.id || member._id) as string)}
                      disabled={isLoading}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Xóa khỏi văn phòng"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
