# Cách lấy Google Maps API Key (Nhanh - 5 phút)

## Bước 1: Tạo Project & API Key

1. Truy cập: https://console.cloud.google.com/
2. Click **Select a project** ở top → **New Project**
3. Đặt tên project (VD: "VCheck App") → **Create**
4. Chờ project được tạo (khoảng 10-30 giây)

## Bước 2: Bật APIs

1. Vào **APIs & Services** → **Library** (menu bên trái)
2. Tìm và bật 3 API này (click vào từng cái → **Enable**):
   - **Maps JavaScript API**
   - **Places API**  
   - **Geocoding API**

## Bước 3: Tạo API Key

1. Vào **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API key**
3. Copy API key vừa tạo (dạng: `AIzaSyC...`)

## Bước 4: Cập nhật .env.local

Mở file `vcheck/.env.local` và thay:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY_HERE
```

thành:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC...(paste API key của bạn)
```

## Bước 5: Restart server

```bash
# Terminal 1 - Backend
cd vcheckbe
pnpm dev

# Terminal 2 - Frontend  
cd vcheck
pnpm dev
```

---

## ⚠️ Nếu KHÔNG có API Key

Ứng dụng vẫn hoạt động! Bạn sẽ phải:
- Nhập tọa độ (Latitude/Longitude) thủ công
- Lấy tọa độ từ Google Maps:
  1. Mở https://www.google.com/maps
  2. Click chuột phải vào địa điểm
  3. Click vào số tọa độ để copy

---

## 📝 Lưu ý

- **Miễn phí**: 28,000 lượt/tháng cho mỗi API
- **Không cần thẻ tín dụng** cho giai đoạn test
- API key có thể dùng ngay, không cần chờ
