# Cài đặt

Tài liệu này sẽ hướng dẫn bạn cách khởi chạy **Intern Management App (IMA)** trên máy tính nội bộ (Local) hoặc máy chủ (Server).

## Cài đặt thông qua Docker Compose (Khuyến nghị)

Sử dụng Docker là cách dễ dàng nhất để chạy cả Frontend, Backend và Database mà không phải lo cấu hình từng môi trường riêng lẻ.

### 1. Chuẩn bị
- Đảm bảo bạn đã cài đặt [Docker](https://docs.docker.com/get-docker/) và [Docker Compose](https://docs.docker.com/compose/install/).
- Git để clone mã nguồn.

### 2. Tải mã nguồn
```bash
git clone https://github.com/your-repo/sern.git
```

### 3. Cấu hình biến môi trường
Tạo file `.env` đồng cấp với file docker-compose.yml, ví dụ:
```env
BACKEND_PORT=12345
FRONTEND_PORT=23456
```

### 4. Khởi chạy
```bash
docker-compose up -d --build
```
Hệ thống sẽ tự động build image cho Node.js API (Backend) và React Vite (Frontend). Sau khi hoàn tất, bạn có thể truy cập hệ thống tại: `http://localhost:23456` (hoặc port bạn đã cấu hình).

## Cài đặt thủ công (Không dùng Docker)

Nếu bạn muốn chạy môi trường dev để code, thực hiện các bước sau:

### 1. Yêu cầu
- Node.js >= 16
- MySQL Server >= 8.0

### 2. Cài đặt Backend
```bash
cd be
npm install
```
Tạo file `.env` theo mẫu (sử dụng database của bạn), sau đó chạy:
```bash
npm run dev
```

### 3. Cài đặt Frontend
Mở một terminal khác:
```bash
cd fe
npm install
npm run dev
```
Truy cập đường dẫn hiển thị trên terminal (thường là `http://localhost:5173`).
