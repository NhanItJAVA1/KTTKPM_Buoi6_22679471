# DEPLOYMENT.md — Movie Ticket System (EDA)

Hướng dẫn triển khai hệ thống trên **5 máy vật lý** kết nối qua mạng LAN.

| Máy | IP            | Vai trò                         |
| --- | ------------- | ------------------------------- |
| 1   | 192.168.1.100 | Kafka Broker + Zookeeper        |
| 2   | 192.168.1.101 | User Service + PostgreSQL       |
| 3   | 192.168.1.102 | Movie Service + Booking Service |
| 4   | 192.168.1.103 | Payment Service + Notification  |
| 5   | 192.168.1.104 | Frontend (ReactJS)              |

---

## 1. Chuẩn bị môi trường (Tất cả máy)

### Cài đặt Docker & Docker Compose

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git curl
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
newgrp docker
```

### Mở cổng tường lửa (ufw)

```bash
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 9092/tcp     # Kafka (Máy 1)
sudo ufw allow 2181/tcp     # Zookeeper (Máy 1)
sudo ufw allow 5432/tcp     # PostgreSQL (nội bộ)
sudo ufw allow 8081/tcp     # user-service
sudo ufw allow 8082/tcp     # movie-service
sudo ufw allow 8083/tcp     # booking-service
sudo ufw allow 8084/tcp     # payment-service
sudo ufw allow 8086/tcp     # notification-service
sudo ufw allow 8085/tcp     # frontend
sudo ufw enable
```

### Kiểm tra kết nối LAN

```bash
ping 192.168.1.100   # từ máy bất kỳ → Máy 1
ping 192.168.1.101
ping 192.168.1.102
ping 192.168.1.103
ping 192.168.1.104
```

### Clone source code (tất cả máy)

```bash
git clone <REPO_URL> movie-ticket-system
cd movie-ticket-system
```

---

## 2. Máy 1 — Kafka Broker (192.168.1.100)

```bash
cd movie-ticket-system

# Khởi động Kafka + Zookeeper
KAFKA_HOST_IP=192.168.1.100 docker compose -f docker-compose.kafka.yml up -d

# Kiểm tra trạng thái
docker compose -f docker-compose.kafka.yml ps

# Tạo các Kafka topics
docker exec kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --if-not-exists \
  --topic user-events \
  --partitions 3 --replication-factor 1

docker exec kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --if-not-exists \
  --topic booking-events \
  --partitions 3 --replication-factor 1

docker exec kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --if-not-exists \
  --topic payment-events \
  --partitions 3 --replication-factor 1

# Xác nhận topics đã tạo
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092
```

> **Lưu ý:** Đảm bảo `KAFKA_ADVERTISED_LISTENERS` được set đúng IP LAN. Các máy khác sẽ kết nối vào `192.168.1.100:9092`.

---

## 3. Máy 2 — User Service (192.168.1.101)

```bash
cd movie-ticket-system

# Khởi động PostgreSQL cho user-service
docker run -d \
  --name postgres-user \
  -e POSTGRES_DB=userdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5432:5432 \
  --restart unless-stopped \
  postgres:15-alpine

# Chờ DB sẵn sàng (~10s)
sleep 10

# Build image user-service
cd services/user-service
docker build -t user-service:latest .

# Chạy user-service
docker run -d \
  --name user-service \
  -p 8081:8081 \
  -e PORT=8081 \
  -e DB_HOST=192.168.1.101 \
  -e DB_PORT=5432 \
  -e DB_NAME=userdb \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres123 \
  -e KAFKA_BROKER=192.168.1.100:9092 \
  -e JWT_SECRET=super_secret_jwt_key_2024 \
  -e JWT_EXPIRES_IN=24h \
  --restart unless-stopped \
  user-service:latest

# Kiểm tra health
curl http://192.168.1.101:8081/health
```

---

## 4. Máy 3 — Movie Service + Booking Service (192.168.1.102)

```bash
cd movie-ticket-system

# PostgreSQL cho movie-service
docker run -d \
  --name postgres-movie \
  -e POSTGRES_DB=moviedb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5433:5432 \
  --restart unless-stopped \
  postgres:15-alpine

# PostgreSQL cho booking-service
docker run -d \
  --name postgres-booking \
  -e POSTGRES_DB=bookingdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5434:5432 \
  --restart unless-stopped \
  postgres:15-alpine

sleep 10

# Build và chạy movie-service
cd services/movie-service
docker build -t movie-service:latest .

docker run -d \
  --name movie-service \
  -p 8082:8082 \
  -e PORT=8082 \
  -e DB_HOST=192.168.1.102 \
  -e DB_PORT=5433 \
  -e DB_NAME=moviedb \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres123 \
  --restart unless-stopped \
  movie-service:latest

# Build và chạy booking-service
cd ../booking-service
docker build -t booking-service:latest .

docker run -d \
  --name booking-service \
  -p 8083:8083 \
  -e PORT=8083 \
  -e DB_HOST=192.168.1.102 \
  -e DB_PORT=5434 \
  -e DB_NAME=bookingdb \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres123 \
  -e KAFKA_BROKER=192.168.1.100:9092 \
  -e JWT_SECRET=super_secret_jwt_key_2024 \
  --restart unless-stopped \
  booking-service:latest

# Kiểm tra health
curl http://192.168.1.102:8082/health
curl http://192.168.1.102:8083/health
```

---

## 5. Máy 4 — Payment Service + Notification Service (192.168.1.103)

```bash
cd movie-ticket-system

# PostgreSQL cho payment-service
docker run -d \
  --name postgres-payment \
  -e POSTGRES_DB=paymentdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -p 5435:5432 \
  --restart unless-stopped \
  postgres:15-alpine

sleep 10

# Build và chạy payment-service
cd services/payment-service
docker build -t payment-service:latest .

docker run -d \
  --name payment-service \
  -p 8084:8084 \
  -e PORT=8084 \
  -e DB_HOST=192.168.1.103 \
  -e DB_PORT=5435 \
  -e DB_NAME=paymentdb \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres123 \
  -e KAFKA_BROKER=192.168.1.100:9092 \
  --restart unless-stopped \
  payment-service:latest

# Build và chạy notification-service (không có DB, ghi log ra file)
mkdir -p ~/logs

cd ../notification-service
docker build -t notification-service:latest .

docker run -d \
  --name notification-service \
  -p 8086:8086 \
  -e PORT=8086 \
  -e KAFKA_BROKER=192.168.1.100:9092 \
  -v ~/logs:/app/logs \
  --restart unless-stopped \
  notification-service:latest

# Kiểm tra health
curl http://192.168.1.103:8084/health
curl http://192.168.1.103:8086/health

# Xem log notifications
tail -f ~/logs/notifications.log
```

---

## 6. Máy 5 — Frontend (192.168.1.104)

```bash
cd movie-ticket-system/frontend

# Build image với các VITE_ biến trỏ đến đúng IP của từng service
docker build \
  --build-arg VITE_USER_SERVICE_URL=http://192.168.1.101:8081 \
  --build-arg VITE_MOVIE_SERVICE_URL=http://192.168.1.102:8082 \
  --build-arg VITE_BOOKING_SERVICE_URL=http://192.168.1.102:8083 \
  -t movie-frontend:latest .

# Chạy frontend
docker run -d \
  --name movie-frontend \
  -p 8085:8085 \
  --restart unless-stopped \
  movie-frontend:latest

# Kiểm tra
curl http://192.168.1.104:8085
```

Truy cập ứng dụng từ bất kỳ máy trong LAN: **http://192.168.1.104:8085**

---

## 7. Kịch bản kiểm thử End-to-End

1. **Mở trình duyệt** → truy cập `http://192.168.1.104:8085`
2. **Đăng ký tài khoản**: Điền username, email, password → Submit
3. **Đăng nhập**: Dùng email/password vừa đăng ký
4. **Xem danh sách phim**: 8 phim được seed tự động hiển thị
5. **Chọn phim**: Click vào một phim để xem chi tiết
6. **Đặt vé**: Nhập số ghế → Click "Đặt vé ngay"
7. **Xác nhận booking**: Màn hình hiển thị mã booking, trạng thái `🟡 PENDING`
8. **Xem "Vé của tôi"**: Trạng thái tự động cập nhật mỗi 3 giây
9. **Kết quả sau ~2 giây**: Trạng thái đổi thành `✅ CONFIRMED` (70%) hoặc `❌ FAILED` (30%)

### Kiểm thử bằng cURL

```bash
# 1. Đăng ký
curl -X POST http://192.168.1.101:8081/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"123456"}'

# 2. Đăng nhập → lấy access_token
curl -X POST http://192.168.1.101:8081/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# 3. Xem phim
curl http://192.168.1.102:8082/movies

# 4. Đặt vé (thay TOKEN và MOVIE_ID phù hợp)
curl -X POST http://192.168.1.102:8083/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"movieId":"<MOVIE_ID>","movieTitle":"Avengers","seats":2,"totalAmount":200000}'

# 5. Xem vé của tôi (thay USER_ID)
curl http://192.168.1.102:8083/bookings/user/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 8. Xử lý sự cố

### Kafka: Services không kết nối được Kafka

```bash
# Kiểm tra Kafka đang lắng nghe
nc -zv 192.168.1.100 9092

# Nếu timeout: kiểm tra KAFKA_ADVERTISED_LISTENERS trong docker-compose.kafka.yml
# Phải là IP LAN thực của Máy 1, không phải localhost
# KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://192.168.1.100:9092

# Restart Kafka
docker restart kafka
```

### Database: Service báo lỗi kết nối DB

```bash
# Kiểm tra PostgreSQL container đang chạy
docker ps | grep postgres

# Kiểm tra logs
docker logs postgres-user

# Test kết nối thủ công
docker exec -it postgres-user psql -U postgres -d userdb -c "\dt"
```

### CORS: Frontend gọi API bị blocked

```bash
# Tất cả services đã bật CORS cho origin '*'
# Nếu vẫn lỗi, kiểm tra VITE_*_URL trong frontend đúng IP/port chưa
# Rebuild frontend image với --build-arg đúng IP
```

### Port bị chặn

```bash
# Kiểm tra port đang được mở
sudo ufw status verbose

# Kiểm tra service đang lắng nghe port
sudo ss -tlnp | grep 8081
```

### Xem logs service

```bash
docker logs -f user-service
docker logs -f booking-service
docker logs -f payment-service
docker logs -f notification-service

# Notifications log file (Máy 4)
tail -f ~/logs/notifications.log
```

### Restart toàn bộ service

```bash
# Dừng tất cả containers
docker stop $(docker ps -aq) && docker rm $(docker ps -aq)

# Khởi động lại theo thứ tự: Máy 1 → Máy 2 → Máy 3 → Máy 4 → Máy 5
```
