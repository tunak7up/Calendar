# Cấu hình Tên miền & SSL

Khi chạy **Intern Management App** trên môi trường thực tế (Production), bạn sẽ muốn truy cập qua một tên miền (Domain) thay vì địa chỉ IP và bảo mật ứng dụng với SSL/HTTPS.

## Sử dụng Nginx làm Reverse Proxy

Giải pháp phổ biến nhất là đặt ứng dụng phía sau một Nginx Reverse Proxy. Nginx sẽ hứng các request ở cổng 80/443 và đẩy về cổng của ứng dụng (Frontend và Backend).

### Cấu hình Nginx cơ bản

Giả sử Frontend của bạn chạy ở cổng `34321` và Backend ở cổng `36363`.
File cấu hình Nginx mẫu:

```nginx
server {
    listen 80;
    server_name ima.yourdomain.com;

    # Cấu hình chuyển hướng Frontend
    location / {
        proxy_pass http://localhost:34321;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cấu hình chuyển hướng API Backend
    location /api/ {
        proxy_pass http://localhost:36363/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Bật HTTPS / SSL bằng Certbot (Let's Encrypt)

Bạn có thể tạo chứng chỉ SSL miễn phí bằng Certbot.

1. Cài đặt Certbot:
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. Yêu cầu tạo chứng chỉ cho Nginx:
```bash
sudo certbot --nginx -d ima.yourdomain.com
```

Certbot sẽ tự động cấu hình lại file Nginx của bạn để bật HTTPS và tự động gia hạn trước khi chứng chỉ hết hạn. Từ lúc này, đường dẫn cấu hình FRONTEND_URL trong `.env` có thể đổi thành `https://ima.yourdomain.com`.
