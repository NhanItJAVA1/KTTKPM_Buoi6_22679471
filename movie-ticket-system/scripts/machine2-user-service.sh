#!/usr/bin/env bash
# =============================================================
# MÁY 2 — User Service + PostgreSQL
# IP: 192.168.1.101
# =============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Cấu hình — đổi nếu IP thực khác ──────────────────────────
KAFKA_BROKER="${KAFKA_BROKER:-192.168.1.100:9092}"
DB_HOST="${DB_HOST:-192.168.1.101}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-userdb}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres123}"
SERVICE_PORT="${SERVICE_PORT:-8081}"
JWT_SECRET="${JWT_SECRET:-super_secret_jwt_key_2024}"
# ─────────────────────────────────────────────────────────────

echo "========================================"
echo "  MÁY 2 — User Service (192.168.1.101)  "
echo "========================================"

# Kiểm tra Docker
if ! command -v docker &>/dev/null; then
  echo "[ERROR] Docker chưa cài."
  exit 1
fi

echo ""
echo "Cấu hình:"
echo "  KAFKA_BROKER = $KAFKA_BROKER"
echo "  DB_HOST      = $DB_HOST:$DB_PORT"
echo "  SERVICE_PORT = $SERVICE_PORT"

# 1. Dọn dẹp container cũ (nếu có)
echo ""
echo "[1/4] Dọn dẹp containers cũ..."
docker rm -f postgres-user user-service 2>/dev/null || true

# 2. Khởi động PostgreSQL
echo ""
echo "[2/4] Khởi động PostgreSQL (userdb)..."
docker run -d \
  --name postgres-user \
  -e POSTGRES_DB="$DB_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -p "$DB_PORT:5432" \
  --restart unless-stopped \
  postgres:15-alpine

echo "  Chờ PostgreSQL sẵn sàng (15s)..."
sleep 5
for i in {1..5}; do
  if docker exec postgres-user pg_isready -U "$DB_USER" &>/dev/null; then
    echo "  ✅ PostgreSQL sẵn sàng"
    break
  fi
  echo "  Lần thử $i/5..."
  sleep 3
done

# 3. Build user-service
echo ""
echo "[3/4] Build Docker image user-service..."
cd "$ROOT_DIR/services/user-service"
docker build -t user-service:latest .

# 4. Chạy user-service
echo ""
echo "[4/4] Khởi động user-service..."
docker run -d \
  --name user-service \
  -p "$SERVICE_PORT:$SERVICE_PORT" \
  -e PORT="$SERVICE_PORT" \
  -e DB_HOST="$DB_HOST" \
  -e DB_PORT="$DB_PORT" \
  -e DB_NAME="$DB_NAME" \
  -e DB_USER="$DB_USER" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  -e KAFKA_BROKER="$KAFKA_BROKER" \
  -e JWT_SECRET="$JWT_SECRET" \
  -e JWT_EXPIRES_IN="24h" \
  --restart unless-stopped \
  user-service:latest

# 5. Kiểm tra health
echo ""
echo "Chờ service khởi động (10s)..."
sleep 10

echo "Kiểm tra health endpoint..."
for i in {1..5}; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$SERVICE_PORT/health" 2>/dev/null || echo "000")
  if [ "$RESPONSE" = "200" ]; then
    echo "✅ user-service đang chạy tại http://localhost:$SERVICE_PORT"
    break
  fi
  echo "  HTTP $RESPONSE — Lần thử $i/5 (5s)..."
  sleep 5
done

echo ""
echo "========================================"
echo "  ✅ Máy 2 sẵn sàng!"
echo "  User Service: http://192.168.1.101:$SERVICE_PORT"
echo "========================================"
echo ""
echo "Theo dõi log:"
echo "  docker logs -f user-service"
echo ""
echo "Test nhanh:"
echo "  curl -X POST http://localhost:$SERVICE_PORT/register \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\":\"test\",\"email\":\"test@test.com\",\"password\":\"123456\"}'"
