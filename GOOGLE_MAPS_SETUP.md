# Hướng dẫn cài đặt Google Maps API

## Bước 1: Tạo Google Maps API Key

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Vào **APIs & Services** > **Library**
4. Tìm và bật các API sau:
   - **Maps JavaScript API**
   - **Places API**
   - **Geocoding API**

## Bước 2: Tạo API Key

1. Vào **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API key**
3. Copy API key vừa tạo

## Bước 3: Cấu hình API Key (Tuỳ chọn nhưng khuyến nghị)

1. Click vào API key vừa tạo
2. Trong **Application restrictions**:
   - Chọn **HTTP referrers (web sites)**
   - Thêm: `http://localhost:3001/*` cho development
   - Thêm domain production của bạn
3. Trong **API restrictions**:
   - Chọn **Restrict key**
   - Chọn các API: Maps JavaScript API, Places API, Geocoding API
4. Click **Save**

## Bước 4: Cập nhật file .env.local

Mở file `.env.local` và thay thế:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

với API key thực của bạn:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC...your-actual-key...
```

## Bước 5: Restart development server

```bash
# Dừng server hiện tại (Ctrl+C)
# Chạy lại
pnpm dev
```

## Tính năng đã được thêm

- ✅ Autocomplete địa chỉ từ Google Maps
- ✅ Tự động lấy tọa độ (latitude, longitude) khi chọn địa chỉ
- ✅ Bán kính mặc định cố định 50m
- ✅ Ẩn các trường nhập tọa độ và bán kính thủ công
- ✅ Hiển thị tọa độ sau khi chọn địa chỉ để xác nhận

## Lưu ý

- Miễn phí cho 28,000 lượt gọi Maps JavaScript API/tháng
- Miễn phí cho 28,000 lượt gọi Places API/tháng
- Đối với production, nên cấu hình billing và giới hạn API key
