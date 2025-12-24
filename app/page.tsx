'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        setIsRedirecting(true);
        setTimeout(() => router.push('/dashboard'), 800);
      }
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Image src="/image/logoson.png" alt="Logo" fill className="object-contain animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce text-emerald-500">✓</div>
          <p className="text-slate-800 text-xl font-semibold">Chào mừng trở lại!</p>
          <p className="text-slate-500 mt-2">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
              </div>
              <span className="text-xl font-bold text-slate-900">V-CHECK</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLogin}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Đăng nhập
              </button>
              <button
                onClick={handleRegister}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/30 transition-all hover:shadow-indigo-500/40 active:scale-95"
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center relative">
            {/* Abstract Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl -z-10 opacity-50"></div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-8 border border-indigo-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Giải pháp quản lý nhân sự 4.0
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              Quản lý điểm danh <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Thông minh & Hiệu quả</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Hệ thống V-Check giúp tối ưu hóa quy trình quản lý nhân sự với công nghệ định vị GPS chính xác, báo cáo thời gian thực và bảo mật tuyệt đối.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={handleRegister}
                className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xl shadow-indigo-500/30 transition-all hover:shadow-indigo-500/40 hover:-translate-y-1"
              >
                Bắt đầu miễn phí
              </button>
              <button
                onClick={handleLogin}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-xl transition-all hover:border-slate-300"
              >
                Đăng nhập hệ thống
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-slate-100 group">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Định vị GPS chính xác</h3>
              <p className="text-slate-600 leading-relaxed">
                Xác minh vị trí check-in với độ chính xác cao, đảm bảo tính minh bạch và công bằng.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-slate-100 group">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Quản lý đa trụ sở</h3>
              <p className="text-slate-600 leading-relaxed">
                Hỗ trợ nhiều địa điểm làm việc, tùy chỉnh bán kính và quy định cho từng văn phòng.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all border border-slate-100 group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Báo cáo chi tiết</h3>
              <p className="text-slate-600 leading-relaxed">
                Dashboard trực quan với thống kê real-time, xuất báo cáo dễ dàng và nhanh chóng.
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
              Tính năng nổi bật
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Check-in tự động</h4>
                  <p className="text-sm text-gray-600">Ghi nhận thời gian và vị trí chính xác</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Phân quyền linh hoạt</h4>
                  <p className="text-sm text-gray-600">Admin, Supervisor, Officer phân cấp rõ ràng</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Bảo mật cao</h4>
                  <p className="text-sm text-gray-600">Mã hóa dữ liệu, xác thực JWT an toàn</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow">
                  <span className="text-2xl">📱</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Đa nền tảng</h4>
                  <p className="text-sm text-gray-600">Tương thích mọi thiết bị và trình duyệt</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10">
                  <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-xl font-bold text-gray-900">V-CHECK</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                Hệ thống quản lý điểm danh GPS thông minh, giúp doanh nghiệp quản lý nhân sự hiệu quả và minh bạch.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Sản phẩm</h3>
              <ul className="space-y-2 text-sm">
                <li><button onClick={handleLogin} className="text-gray-600 hover:text-blue-600 transition">Đăng nhập</button></li>
                <li><button onClick={handleRegister} className="text-gray-600 hover:text-blue-600 transition">Đăng ký</button></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition">Tính năng</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition">Bảng giá</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Hỗ trợ</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>📧 support@vcheck.vn</li>
                <li>📞 1900-xxxx</li>
                <li>🏢 Việt Nam</li>
                <li>⏰ 24/7</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-600">
            <p>© 2025 V-Check System. Thiết kế bởi DCson.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
