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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Image src="/image/logoson.png" alt="Logo" fill className="object-contain animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">✓</div>
          <p className="text-gray-800 text-xl font-semibold">Chào mừng trở lại!</p>
          <p className="text-gray-500 mt-2">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 backdrop-blur-lg bg-white/90">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image src="/image/logoson.png" alt="Logo" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">V-CHECK</h1>
                <p className="text-xs text-gray-500">Hệ thống điểm danh GPS</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogin}
                className="px-5 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                Đăng nhập
              </button>
              <button
                onClick={handleRegister}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-8">
              <div className="relative w-32 h-32">
                <Image src="/image/logoson.png" alt="V-Check Logo" fill className="object-contain" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
              Hệ thống V-Check
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Giải pháp quản lý điểm danh GPS thông minh cho doanh nghiệp hiện đại
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleLogin}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl"
              >
                Đăng nhập →
              </button>
              <button
                onClick={handleRegister}
                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition border-2 border-gray-200"
              >
                Đăng ký miễn phí
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">📍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Định vị GPS chính xác</h3>
              <p className="text-gray-600 leading-relaxed">
                Xác minh vị trí check-in với độ chính xác cao, đảm bảo tính minh bạch
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">🏢</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quản lý đa trụ sở</h3>
              <p className="text-gray-600 leading-relaxed">
                Hỗ trợ nhiều địa điểm làm việc, tùy chỉnh bán kính cho từng văn phòng
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition border border-gray-100">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Báo cáo chi tiết</h3>
              <p className="text-gray-600 leading-relaxed">
                Dashboard trực quan với thống kê real-time, dễ dàng theo dõi
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
