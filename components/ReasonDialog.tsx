'use client';

import { useState } from 'react';
import SmartUpload from './SmartUpload';

interface ReasonDialogProps {
  isOpen: boolean;
  type: 'checkin' | 'checkout';
  attendanceId: string;
  onClose: () => void;
  onSubmit: (reason: string, photo?: string) => Promise<void>;
}

export default function ReasonDialog({
  isOpen,
  type,
  attendanceId,
  onClose,
  onSubmit,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [reasonPhoto, setReasonPhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      alert('Vui lòng nhập lý do');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(reason, reasonPhoto);
      setReason('');
      setReasonPhoto('');
      onClose();
    } catch (error) {
      console.error('Error submitting reason:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100">
          <h3 className="font-bold text-xl text-slate-900">
            Thêm lý do {type === 'checkin' ? 'Check-in' : 'Check-out'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Điểm danh của bạn nằm ngoài phạm vi cho phép. Vui lòng giải thích lý do.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lý do <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              placeholder="Nhập lý do tại sao bạn điểm danh ngoài phạm vi..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Ảnh minh chứng (tùy chọn)
            </label>
            {!reasonPhoto ? (
              <SmartUpload onImageSelect={setReasonPhoto} />
            ) : (
              <div className="relative">
                <img src={reasonPhoto} alt="Reason" className="w-full h-48 object-cover rounded-lg border-2 border-slate-200" />
                <button
                  onClick={() => setReasonPhoto('')}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className="flex-1 px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi'}
          </button>
        </div>
      </div>
    </div>
  );
}
