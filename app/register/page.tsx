'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import Image from 'next/image';
import OTPInput from '@/components/OTPInput';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1); // 1: Form, 2: OTP
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    badgeNumber: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP to email
      await authAPI.sendOTP(formData.email);
      setOtpSent(true);
      setStep(2);
      setCountdown(300);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setError('');
    setIsLoading(true);

    try {
      // Verify OTP
      await authAPI.verifyOTP(formData.email, otp);
      
      // OTP verified, proceed with registration
      const { confirmPassword, ...registerData } = formData;
      const response = await authAPI.register(registerData);

      if (response.success) {
        // Registration successful, redirect to login page
        alert('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
        router.push('/login');
      } else {
        setError(response.error || 'Đăng ký thất bại');
      }
    } catch (err: any) {
      setError(err.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setError('');
    setIsLoading(true);

    try {
      await authAPI.sendOTP(formData.email);
      setCountdown(300);
      setCanResend(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToForm = () => {
    setStep(1);
    setOtpSent(false);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-green-800 p-12 flex-col justify-between">
        <div className="flex items-center gap-3 text-white">
          <div className="relative w-12 h-12">
            <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
          </div>
          <span className="text-2xl font-bold">V-CHECK</span>
        </div>
        
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-6">
            Tham gia cùng chúng tôi
          </h1>
          <p className="text-xl text-green-100 mb-8">
            Trải nghiệm hệ thống quản lý điểm danh hiện đại và chuyên nghiệp
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span>✓</span>
              </div>
              <span className="text-green-50">Miễn phí sử dụng</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span>⚡</span>
              </div>
              <span className="text-green-50">Thiết lập nhanh chóng</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span>🎯</span>
              </div>
              <span className="text-green-50">Dễ dàng sử dụng</span>
            </div>
          </div>
        </div>

        <p className="text-green-200 text-sm">
          © 2025 V-Check System. All rights reserved.
        </p>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md my-8">
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
            {step === 1 ? (
              // Step 1: Registration Form
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Đăng ký</h2>
                  <p className="text-gray-600">Tạo tài khoản V-Check mới</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <span className="text-red-500 text-xl">⚠️</span>
                    <p className="text-sm text-red-600 flex-1">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Tên đăng nhập *
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="badgeNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Số hiệu
                  </label>
                  <input
                    id="badgeNumber"
                    name="badgeNumber"
                    type="text"
                    value={formData.badgeNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="A001"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                    Phòng ban
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="PC01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Mật khẩu *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="Min. 6 ký tự"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Xác nhận *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                    placeholder="Nhập lại"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm mt-6"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Đang gửi mã...
                  </span>
                ) : (
                  'Tiếp tục'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-green-600 hover:text-green-700 font-semibold"
                >
                  Đăng nhập
                </button>
              </p>
            </div>
          </>
        ) : (
          // Step 2: OTP Verification
          <>
            <div className="mb-8">
              <button
                onClick={handleBackToForm}
                className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
              >
                <span>←</span> Quay lại
              </button>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Xác thực Email</h2>
              <p className="text-gray-600">
                Nhập mã 6 số đã được gửi đến
                <br />
                <span className="font-semibold text-gray-900">{formData.email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-sm text-red-600 flex-1">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Mã OTP
                </label>
                <OTPInput
                  length={6}
                  onComplete={handleOTPComplete}
                  disabled={isLoading}
                />
              </div>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-600">
                    Mã sẽ hết hạn sau{' '}
                    <span className="font-semibold text-green-600">
                      {formatTime(countdown)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-red-600">Mã OTP đã hết hạn</p>
                )}
              </div>

              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-green-600 hover:text-green-700 font-semibold text-sm disabled:opacity-50"
                  >
                    Gửi lại mã OTP
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Chưa nhận được mã?{' '}
                    <span className="text-gray-400">
                      Gửi lại sau {formatTime(countdown)}
                    </span>
                  </p>
                )}
              </div>

              {isLoading && (
                <div className="text-center">
                  <span className="text-sm text-gray-600 flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Đang xác thực...
                  </span>
                </div>
              )}
            </div>
          </>
        )}
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <a href="#" className="text-green-600 hover:underline">Điều khoản sử dụng</a>
          </p>
        </div>
      </div>
    </div>
  );
}
