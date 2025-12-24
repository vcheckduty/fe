'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import Logo from '@/components/Logo';
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
            <p className="font-medium text-indigo-600 mt-1">{userEmail}</p>
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

          <div className="mt-8 text-center">
            <button
              onClick={() => setShowOTP(false)}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
            >
              <span>←</span>
              <span>Quay lại đăng nhập</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Modern Abstract Design */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 relative overflow-hidden items-center justify-center p-12">
        {/* Abstract Shapes */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full blur-3xl opacity-50 animate-float"></div>
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
            Quản lý điểm danh <br />
            <span className="text-indigo-200">Thông minh & Hiệu quả</span>
          </h1>
          
          <p className="text-lg text-indigo-100 mb-12 leading-relaxed">
            Hệ thống V-Check giúp tối ưu hóa quy trình quản lý nhân sự với công nghệ định vị GPS chính xác và bảo mật cao.
          </p>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="text-2xl mb-2">📍</div>
              <h3 className="font-semibold mb-1">GPS Chính xác</h3>
              <p className="text-sm text-indigo-200">Định vị thời gian thực</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold mb-1">Bảo mật cao</h3>
              <p className="text-sm text-indigo-200">Mã hóa dữ liệu 256-bit</p>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-12 text-indigo-200 text-sm">
          © 2025 V-Check System. All rights reserved.
        </div>
      </div>

      {/* Right Side - Clean Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center justify-center gap-3 mb-2">
              <Logo size="lg" />
              <span className="text-2xl font-bold text-slate-900">V-CHECK</span>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Chào mừng trở lại</h2>
            <p className="text-slate-500">Vui lòng nhập thông tin đăng nhập để tiếp tục</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fade-in">
              <span className="text-red-500">⚠️</span>
              <p className="text-sm text-red-600 flex-1">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-2">
                Tên đăng nhập
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input"
                placeholder="Nhập tên đăng nhập của bạn"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Mật khẩu
                </label>
                <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Quên mật khẩu?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full py-3.5 text-base shadow-indigo-500/20 hover:shadow-indigo-500/30"
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
                  Đăng nhập
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-slate-600">
              Chưa có tài khoản?{' '}
              <button
                onClick={() => router.push('/register')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
