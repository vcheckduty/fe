'use client';

import { useState } from 'react';
import Button from './ui/Button';

interface ReasonFormProps {
  attendanceId: string;
  type: 'checkin' | 'checkout';
  onSubmit?: (success: boolean) => void;
}

export default function ReasonForm({ attendanceId, type, onSubmit }: ReasonFormProps) {
  const [reason, setReason] = useState('');
  const [reasonPhoto, setReasonPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReasonPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/reason`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          attendanceId,
          type,
          reason: reason.trim(),
          reasonPhoto,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSubmit?.(true);
      } else {
        setError(data.error || 'Không thể gửi lý do');
        onSubmit?.(false);
      }
    } catch (error) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
      onSubmit?.(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Bổ sung lý do {type === 'checkin' ? 'Check-in' : 'Check-out'} ngoài phạm vi
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Lý do <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Nhập lý do tại sao bạn check-in/out ngoài phạm vi cho phép..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ảnh minh chứng (tùy chọn)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoCapture}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          
          {reasonPhoto && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-2">Ảnh đã chọn:</p>
              <img
                src={reasonPhoto}
                alt="Reason evidence"
                className="max-w-full h-48 object-cover rounded-lg border border-gray-200"
              />
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || !reason.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi lý do'}
          </Button>
        </div>
      </form>
    </div>
  );
}
