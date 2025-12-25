'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authAPI } from '@/lib/api';
import Logo from '@/components/Logo';
import OTPInput from '@/components/OTPInput';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
      // Send OTP automatically
      sendOTP(emailParam);
    } else {
      router.push('/login');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const sendOTP = async (emailAddress: string) => {
    try {
      await authAPI.sendOTP(emailAddress);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP');
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setError('');
    setIsLoading(true);

    try {
      await authAPI.verifyOTP(email, otp);
      alert('Tài khoản đã được kích hoạt! Vui lòng đăng nhập lại.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Mã OTP không hợp lệ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setError('');
    setIsLoading(true);

    try {
      await authAPI.sendOTP(email);
      setCountdown(300);
      setCanResend(false);
      alert('Mã OTP mới đã được gửi!');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md animate-scale-in border border-slate-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Kích hoạt tài khoản</h2>
          <p className="text-slate-600">
            Mã OTP đã được gửi đến email:
          </p>
          <p className="font-medium text-orange-600 mt-1">{email}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
            <span className="text-red-500">⚠️</span>
            <p className="text-sm text-red-600 flex-1">{error}</p>
          </div>
        )}

        <OTPInput
          length={6}
          onComplete={handleOTPComplete}
          disabled={isLoading}
        />

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 mb-3">
            Mã OTP có hiệu lực trong: <span className="font-bold text-orange-600">{formatTime(countdown)}</span>
          </p>
          
          <button
            onClick={handleResendOTP}
            disabled={!canResend || isLoading}
            className={`text-sm font-medium transition-colors ${
              canResend && !isLoading
                ? 'text-orange-600 hover:text-orange-700 cursor-pointer'
                : 'text-slate-400 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-orange-600 font-medium transition-colors"
          >
            <span>←</span>
            <span>Quay lại đăng nhập</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Đang tải...</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
