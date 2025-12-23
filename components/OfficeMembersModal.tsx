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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quản lý thành viên</h2>
              <p className="text-sm text-gray-600 mt-1">{office.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">{successMessage}</p>
            </div>
          )}

          {/* Add Member Section */}
          <div className="mb-6">
            {!showAddMember ? (
              <button
                onClick={() => setShowAddMember(true)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm thành viên
              </button>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chọn nhân viên
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {usersNotInOffice.map((user) => (
                        <option key={user.id || user._id} value={user.id || user._id}>
                          {user.fullName} ({user.username}) - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-7">
                    <button
                      onClick={handleAddMember}
                      disabled={isLoading || !selectedUserId}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Thêm
                    </button>
                    <button
                      onClick={() => {
                        setShowAddMember(false);
                        setSelectedUserId('');
                        setError('');
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Members List */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Danh sách thành viên ({members.length})
            </h3>
            
            {members.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">Chưa có thành viên nào trong văn phòng này</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id || member._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.fullName}</p>
                          <p className="text-sm text-gray-500">
                            {member.username} • {member.email}
                          </p>
                          {member.badgeNumber && (
                            <p className="text-xs text-gray-400">Badge: {member.badgeNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember((member.id || member._id) as string)}
                      disabled={isLoading}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
