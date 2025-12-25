'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import Logo from '@/components/Logo';
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
      // Step 1: Create user with isActive=false
      const { confirmPassword, ...registerData } = formData;
      const registerResponse = await authAPI.register(registerData);
      
      if (!registerResponse.success) {
        setError(registerResponse.error || 'Đăng ký thất bại');
        setIsLoading(false);
        return;
      }

      // Step 2: Send OTP to email
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
      // Verify OTP - this will activate the user account
      const response = await authAPI.verifyOTP(formData.email, otp);

      if (response.success) {
        // OTP verified and account activated, redirect to login page
        alert('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
        router.push('/login');
      } else {
        setError('Xác thực OTP thất bại');
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
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Modern Abstract Design */}
      <div className="hidden lg:flex lg:w-1/2 bg-orange-600 relative overflow-hidden items-center justify-center p-12">
        {/* Abstract Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500 rounded-full blur-3xl opacity-50 animate-float"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500 rounded-full blur-3xl opacity-50 animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-[40%] left-[40%] w-[20%] h-[20%] bg-pink-500 rounded-full blur-3xl opacity-30 animate-float" style={{animationDelay: '4s'}}></div>
        </div>
        
        <div className="relative z-10 max-w-lg text-white">
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
              <Logo size="md" className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">V-CHECK</span>
          </div>
          
          <h1 className="text-5xl font-bold leading-tight mb-6">
            Tham gia <br />
            <span className="text-orange-200">Cộng đồng V-Check</span>
          </h1>
          
          <p className="text-lg text-orange-100 mb-12 leading-relaxed">
            Trải nghiệm hệ thống quản lý điểm danh hiện đại, minh bạch và hiệu quả ngay hôm nay.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <p className="font-semibold text-lg">Miễn phí hoàn toàn</p>
                <p className="text-sm text-orange-200">Không giới hạn tính năng cơ bản</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-2xl">⚡</span>
              </div>
              <div>
                <p className="font-semibold text-lg">Thiết lập nhanh chóng</p>
                <p className="text-sm text-orange-200">Chỉ mất vài phút để bắt đầu</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/10">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <p className="font-semibold text-lg">Giao diện thân thiện</p>
                <p className="text-sm text-orange-200">Dễ dàng sử dụng trên mọi thiết bị</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-12 text-orange-200 text-sm">
          © 2025 V-Check System. All rights reserved.
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-white">
        <div className="w-full max-w-md my-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <Logo size="lg" />
              <span className="text-2xl font-bold text-slate-900">V-CHECK</span>
            </div>
          </div>

          <div className="bg-white">
            {step === 1 ? (
              // Step 1: Registration Form
              <>
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">Đăng ký tài khoản</h2>
                  <p className="text-slate-500">Điền thông tin để tạo tài khoản mới</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fade-in">
                    <span className="text-red-500 text-xl">⚠️</span>
                    <p className="text-sm text-red-600 flex-1">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                    Tên đăng nhập *
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="username"
                  />
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
                    Họ và tên *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="badgeNumber" className="block text-sm font-medium text-slate-700 mb-2">
                    Số hiệu CAND
                  </label>
                  <input
                    id="badgeNumber"
                    name="badgeNumber"
                    type="text"
                    value={formData.badgeNumber}
                    onChange={handleChange}
                    className="input"
                    placeholder="CAND001"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-2">
                    Cơ quan
                  </label>
                  <input
                    id="department"
                    name="department"
                    type="text"
                    value={formData.department}
                    onChange={handleChange}
                    className="input"
                    placeholder="Công an TP. HCM"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    Mật khẩu *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="Min. 6 ký tự"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                    Xác nhận *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="input"
                    placeholder="Nhập lại"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3.5 text-base shadow-orange-500/20 hover:shadow-orange-500/30 mt-4"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xử lý...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Tiếp tục
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-center text-slate-600">
                Đã có tài khoản?{' '}
                <button
                  onClick={() => router.push('/login')}
                  className="text-orange-600 hover:text-orange-700 font-semibold transition-colors"
                >
                  Đăng nhập ngay
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
                className="text-slate-500 hover:text-orange-600 mb-6 flex items-center gap-2 font-medium transition-colors"
              >
                <span>←</span> Quay lại
              </button>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Xác thực Email</h2>
              <p className="text-slate-600">
                Nhập mã 6 số đã được gửi đến email:
              </p>
              <p className="font-medium text-orange-600 mt-1">{formData.email}</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fade-in">
                <span className="text-red-500 text-xl">⚠️</span>
                <p className="text-sm text-red-600 flex-1">{error}</p>
              </div>
            )}

            <div className="space-y-8">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4 text-center">
                  Nhập mã xác thực
                </label>
                <OTPInput
                  length={6}
                  onComplete={handleOTPComplete}
                  disabled={isLoading}
                />
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100">
                {countdown > 0 ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-orange-800">
                      Mã sẽ hết hạn sau{' '}
                      <span className="font-bold">
                        {formatTime(countdown)}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 font-semibold">⚠️ Mã OTP đã hết hạn</p>
                )}
              </div>

              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="btn btn-primary w-full"
                  >
                    Gửi lại mã OTP
                  </button>
                ) : (
                  <p className="text-sm text-slate-500">
                    Chưa nhận được mã?{' '}
                    <span className="text-slate-400">
                      Gửi lại sau {formatTime(countdown)}
                    </span>
                  </p>
                )}
              </div>

              {isLoading && (
                <div className="text-center">
                  <span className="text-sm text-slate-600 flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang xác thực...
                  </span>
                </div>
              )}
            </div>
          </>
        )}
          </div>

          <p className="text-center text-xs text-slate-500 mt-8">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <a href="#" className="text-orange-600 hover:underline font-medium">Điều khoản sử dụng</a>
            {' '}và{' '}
            <a href="#" className="text-orange-600 hover:underline font-medium">Chính sách bảo mật</a>
          </p>
        </div>
      </div>
    </div>
  );
}
