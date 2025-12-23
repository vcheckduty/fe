'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import Image from 'next/image';
import OTPInput from '@/components/OTPInput';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(username, password);
      
      if (response.success) {
        router.push('/dashboard');
      } else if (response.error === 'Account not activated' || (response as any).needsActivation) {
        // Account needs activation - show OTP screen
        const email = (response as any).email;
        setUserEmail(email);
        
        // Send OTP
        await authAPI.sendOTP(email);
        setShowOTP(true);
        setCountdown(300);
        setCanResend(false);
      } else {
        setError(response.error || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      if (err.message?.includes('Account not activated') || err.needsActivation) {
        // Account needs activation
        const email = err.email || userEmail;
        if (email) {
          setUserEmail(email);
          try {
            await authAPI.sendOTP(email);
            setShowOTP(true);
            setCountdown(300);
            setCanResend(false);
          } catch {
            setError('Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên.');
          }
        } else {
          setError('Tài khoản chưa được kích hoạt. Vui lòng liên hệ quản trị viên.');
        }
      } else {
        setError(err.message || 'Đăng nhập thất bại');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setError('');
    setIsLoading(true);

    try {
      await authAPI.verifyOTP(userEmail, otp);
      alert('Tài khoản đã được kích hoạt! Vui lòng đăng nhập lại.');
      setShowOTP(false);
      setUsername('');
      setPassword('');
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
      await authAPI.sendOTP(userEmail);
      setCountdown(300);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP');
    } finally {
      setIsLoading(false);
    }
  };

  if (showOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Kích hoạt tài khoản</h2>
            <p className="text-sm text-gray-600">
              Nhập mã OTP đã được gửi đến email: <strong>{userEmail}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <OTPInput
            length={6}
            onComplete={handleOTPComplete}
            disabled={isLoading}
          />

          <div className="mt-6 text-center">
            <button
              onClick={() => setShowOTP(false)}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="relative w-12 h-12">
            <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="text-2xl font-bold">V-CHECK</span>
        </div>
        
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-6">
            Chào mừng bạn trở lại
          </h1>
          <p className="text-xl text-blue-100 mb-8">
            Hệ thống quản lý điểm danh GPS thông minh cho doanh nghiệp hiện đại
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span>📍</span>
              </div>
              <span className="text-blue-50">Định vị GPS chính xác</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span>🔒</span>
              </div>
              <span className="text-blue-50">Bảo mật tuyệt đối</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span>📊</span>
              </div>
              <span className="text-blue-50">Báo cáo chi tiết</span>
            </div>
          </div>
        </div>

        <p className="text-blue-200 text-sm">
          © 2025 V-Check System. All rights reserved.
        </p>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative w-12 h-12">
                <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="text-2xl font-bold text-gray-900">V-CHECK</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
              <p className="text-gray-600">Truy cập vào hệ thống V-Check</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-sm text-red-600 flex-1">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Nhập mật khẩu"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Đang xử lý...
                  </span>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => router.push('/register')}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Đăng ký ngay
                </button>
              </p>
            </div>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#" className="text-blue-600 hover:underline">Điều khoản sử dụng</a>
          </p>
        </div>
      </div>
    </div>
  );
}
