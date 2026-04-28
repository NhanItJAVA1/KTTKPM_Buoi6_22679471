#!/usr/bin/env bash
# =============================================================
# MÁY 4 — Payment Service + Notification Service
# IP: 192.168.1.103
# =============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Cấu hình — đổi nếu IP thực khác ──────────────────────────
KAFKA_BROKER="${KAFKA_BROKER:-192.168.1.100:9092}"
THIS_IP="${THIS_IP:-192.168.1.103}"

# Payment DB
PAYMENT_DB_PORT="${PAYMENT_DB_PORT:-5435}"
PAYMENT_DB_NAME="${PAYMENT_DB_NAME:-paymentdb}"

DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres123}"

PAYMENT_SERVICE_PORT="${PAYMENT_SERVICE_PORT:-8084}"
NOTIFICATION_SERVICE_PORT="${NOTIFICATION_SERVICE_PORT:-8086}"

# Thư mục log cho notification-service
LOG_DIR="${LOG_DIR:-$HOME/logs}"
# ─────────────────────────────────────────────────────────────

echo "========================================================"
echo "  MÁY 4 — Payment + Notification Service (192.168.1.103)"
echo "========================================================"

if ! command -v docker &>/dev/null; then
  echo "[ERROR] Docker chưa cài."
  exit 1
fi

echo ""
echo "Cấu hình:"
echo "  KAFKA_BROKER             = $KAFKA_BROKER"
echo "  Payment DB port          = $PAYMENT_DB_PORT → $PAYMENT_DB_NAME"
echo "  Payment Service port     = $PAYMENT_SERVICE_PORT"
echo "  Notification Service port= $NOTIFICATION_SERVICE_PORT"
echo "  Log directory            = $LOG_DIR"

# 1. Tạo thư mục log
mkdir -p "$LOG_DIR"
echo ""
echo "[1/5] Thư mục log: $LOG_DIR ✅"

# 2. Dọn dẹp containers cũ
echo ""
echo "[2/5] Dọn dẹp containers cũ..."
docker rm -f postgres-payment payment-service notification-service 2>/dev/null || true

# 3. Khởi động PostgreSQL cho payment-service
echo ""
echo "[3/5] Khởi động PostgreSQL (paymentdb) trên cổng $PAYMENT_DB_PORT..."
docker run -d \
  --name postgres-payment \
  -e POSTGRES_DB="$PAYMENT_DB_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -p "$PAYMENT_DB_PORT:5432" \
  --restart unless-stopped \
  postgres:15-alpine

echo "  Chờ DB sẵn sàng (15s)..."
sleep 5
for i in {1..5}; do
  if docker exec postgres-payment pg_isready -U "$DB_USER" &>/dev/null; then
    echo "  ✅ PostgreSQL sẵn sàng"
    break
  fi
  echo "  Lần thử $i/5..."
  sleep 3
done

# 4. Build + chạy payment-service
echo ""
echo "[4/5] Build + khởi động payment-service..."
cd "$ROOT_DIR/services/payment-service"
docker build -t payment-service:latest .

docker run -d \
  --name payment-service \
  -p "$PAYMENT_SERVICE_PORT:$PAYMENT_SERVICE_PORT" \
  -e PORT="$PAYMENT_SERVICE_PORT" \
  -e DB_HOST="$THIS_IP" \
  -e DB_PORT="$PAYMENT_DB_PORT" \
  -e DB_NAME="$PAYMENT_DB_NAME" \
  -e DB_USER="$DB_USER" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  -e KAFKA_BROKER="$KAFKA_BROKER" \
  --restart unless-stopped \
  payment-service:latest

# 5. Build + chạy notification-service
echo ""
echo "[5/5] Build + khởi động notification-service..."
cd "$ROOT_DIR/services/notification-service"
docker build -t notification-service:latest .

docker run -d \
  --name notification-service \
  -p "$NOTIFICATION_SERVICE_PORT:$NOTIFICATION_SERVICE_PORT" \
  -e PORT="$NOTIFICATION_SERVICE_PORT" \
  -e KAFKA_BROKER="$KAFKA_BROKER" \
  -v "$LOG_DIR:/app/logs" \
  --restart unless-stopped \
  notification-service:latest

# Kiểm tra health
echo ""
echo "Chờ services khởi động (15s)..."
sleep 15

for SVC_PORT in "$PAYMENT_SERVICE_PORT" "$NOTIFICATION_SERVICE_PORT"; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$SVC_PORT/health" 2>/dev/null || echo "000")
  if [ "$RESPONSE" = "200" ]; then
    echo "  ✅ Port $SVC_PORT — OK"
  else
    echo "  ⚠️  Port $SVC_PORT — HTTP $RESPONSE"
  fi
done

echo ""
echo "========================================================"
echo "  ✅ Máy 4 sẵn sàng!"
echo "  Payment Service     : http://$THIS_IP:$PAYMENT_SERVICE_PORT"
echo "  Notification Service: http://$THIS_IP:$NOTIFICATION_SERVICE_PORT"
echo "  Notification logs   : $LOG_DIR/notifications.log"
echo "========================================================"
echo ""
echo "Theo dõi log:"
echo "  docker logs -f payment-service"
echo "  docker logs -f notification-service"
echo "  tail -f $LOG_DIR/notifications.log"
