'use client';

import { useState, useEffect } from 'react';
import Button from './ui/Button';
import CameraCapture from './CameraCapture';
import ReasonForm from './ReasonForm';

interface CheckInOutFlowProps {
  officeId: string;
  officeName: string;
  type: 'checkin' | 'checkout';
  onComplete?: () => void;
}

interface LocationData {
  lat: number;
  lng: number;
}

export default function CheckInOutFlow({ 
  officeId, 
  officeName, 
  type,
  onComplete 
}: CheckInOutFlowProps) {
  const [step, setStep] = useState<'capture' | 'submit' | 'reason' | 'success'>('capture');
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [attendanceId, setAttendanceId] = useState<string | null>(null);
  const [needsReason, setNeedsReason] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setError('Không thể lấy vị trí. Vui lòng bật GPS.');
        }
      );
    } else {
      setError('Trình duyệt không hỗ trợ GPS.');
    }
  }, []);

  const handlePhotoCapture = (photoData: string) => {
    setPhoto(photoData);
    setStep('submit');
  };

  const handleSubmit = async () => {
    if (!location || !photo) {
      setError('Vui lòng chụp ảnh và bật GPS');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const endpoint = type === 'checkin' ? '/api/checkin' : '/api/checkout';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          officeId,
          lat: location.lat,
          lng: location.lng,
          photo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setAttendanceId(data.data.id || data.data.attendanceId);
        setNeedsReason(data.data.needsReason || false);
        
        if (data.data.needsReason) {
          setStep('reason');
        } else {
          setStep('success');
        }
      } else {
        setError(data.error || `Không thể ${type === 'checkin' ? 'check-in' : 'check-out'}`);
      }
    } catch (error) {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReasonSubmit = (success: boolean) => {
    if (success) {
      setStep('success');
    }
  };

  const handleComplete = () => {
    onComplete?.();
  };

  // Step 1: Capture photo
  if (step === 'capture') {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            {type === 'checkin' ? 'Check-in' : 'Check-out'} tại {officeName}
          </h3>
          <p className="text-sm text-blue-700">
            Vui lòng chụp ảnh và hệ thống sẽ ghi nhận vị trí GPS của bạn.
          </p>
          {location && (
            <p className="text-xs text-blue-600 mt-2">
              📍 GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </p>
          )}
        </div>

        <CameraCapture onCapture={handlePhotoCapture} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Review and submit
  if (step === 'submit') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">
            Xác nhận {type === 'checkin' ? 'Check-in' : 'Check-out'}
          </h3>
          
          {photo && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Ảnh của bạn:</p>
              <img
                src={photo}
                alt="Captured"
                className="w-full max-h-64 object-cover rounded-lg border"
              />
            </div>
          )}

          {location && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Vị trí GPS:</p>
              <p className="text-xs font-mono text-gray-900">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setStep('capture');
                setPhoto(null);
              }}
              className="flex-1 bg-gray-500 hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Chụp lại
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting || !location}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Add reason (if out of range)
  if (step === 'reason' && attendanceId) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">
            ⚠️ Ngoài phạm vi cho phép
          </h3>
          <p className="text-sm text-yellow-700">
            Bạn đang ở ngoài phạm vi cho phép của văn phòng. 
            Vui lòng cung cấp lý do và ảnh minh chứng (nếu có) để supervisor có thể xem xét.
          </p>
          {result && result.distance && (
            <p className="text-xs text-yellow-600 mt-2">
              Khoảng cách: {result.distance.toFixed(0)}m (Yêu cầu: trong vòng {result.requiredRadius}m)
            </p>
          )}
        </div>

        <ReasonForm
          attendanceId={attendanceId}
          type={type}
          onSubmit={handleReasonSubmit}
        />
      </div>
    );
  }

  // Step 4: Success
  if (step === 'success') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h3 className="font-bold text-green-900 text-xl mb-2">
            {type === 'checkin' ? 'Check-in' : 'Check-out'} thành công!
          </h3>
          <p className="text-sm text-green-700 mb-4">
            {result?.message || `Yêu cầu ${type === 'checkin' ? 'check-in' : 'check-out'} đã được gửi và đang chờ supervisor duyệt.`}
          </p>
          
          {result && (
            <div className="space-y-2 text-left bg-white rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Thời gian:</span>
                <span className="font-medium text-gray-900">
                  {new Date(result.checkinTime || result.checkoutTime).toLocaleString('vi-VN')}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Khoảng cách:</span>
                <span className={`font-medium ${result.isWithinRange ? 'text-green-600' : 'text-red-600'}`}>
                  {result.distance?.toFixed(0)}m
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Trạng thái:</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Chờ duyệt
                </span>
              </div>
              {result.totalHours !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng giờ làm việc:</span>
                  <span className="font-medium text-gray-900">
                    {result.totalHours.toFixed(2)}h
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs text-gray-600">
              💡 Bạn có thể theo dõi trạng thái phê duyệt trong dashboard
            </p>
            {needsReason && (
              <p className="text-xs text-yellow-600">
                ⚠️ Supervisor sẽ xem xét lý do của bạn trước khi phê duyệt
              </p>
            )}
          </div>
        </div>

        <Button onClick={handleComplete} className="w-full">
          Hoàn tất
        </Button>
      </div>
    );
  }

  return null;
}
