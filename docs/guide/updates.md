# Cập nhật phiên bản

Khi có phiên bản mới của **Intern Management App**, bạn có thể dễ dàng cập nhật hệ thống của mình theo hướng dẫn dưới đây mà không làm mất dữ liệu.

## Cập nhật bằng Docker (Khuyến nghị)

Nếu bạn đã chạy IMA bằng Docker Compose, quy trình cập nhật cực kỳ đơn giản:

1. Di chuyển vào thư mục chứa code:
```bash
cd sern
```

2. Pull (kéo) mã nguồn mới nhất từ kho lưu trữ (nếu bạn deploy qua Git):
```bash
git pull origin main
```

3. Build lại image và khởi động lại container:
```bash
docker-compose up -d --build
```
Hệ thống sẽ tải xuống các bản cập nhật mới nhất, cài đặt package (nếu có thêm) và tự động khởi động lại. Dữ liệu của bạn được lưu trong volume nên sẽ được an toàn.

## Cập nhật thủ công

Nếu bạn không dùng Docker:

1. Kéo mã nguồn mới nhất:
```bash
git pull origin main
```

2. Cập nhật thư viện cho Backend:
```bash
cd be
npm install
```

3. Cập nhật thư viện cho Frontend:
```bash
cd ../fe
npm install
npm run build # (Nếu bạn đang deploy production)
```

4. Khởi động lại ứng dụng (qua PM2 hoặc node/nodemon).

## Lưu ý trước khi cập nhật
- Luôn sao lưu (backup) database của bạn trước khi cập nhật lên các phiên bản lớn (Major Update) để đề phòng rủi ro.
