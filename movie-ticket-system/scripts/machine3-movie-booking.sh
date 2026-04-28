#!/usr/bin/env bash
# =============================================================
# MÁY 3 — Movie Service + Booking Service
# IP: 192.168.1.102
# =============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Cấu hình — đổi nếu IP thực khác ──────────────────────────
KAFKA_BROKER="${KAFKA_BROKER:-192.168.1.100:9092}"
THIS_IP="${THIS_IP:-192.168.1.102}"
JWT_SECRET="${JWT_SECRET:-super_secret_jwt_key_2024}"

# Movie DB
MOVIE_DB_PORT="${MOVIE_DB_PORT:-5433}"
MOVIE_DB_NAME="${MOVIE_DB_NAME:-moviedb}"

# Booking DB
BOOKING_DB_PORT="${BOOKING_DB_PORT:-5434}"
BOOKING_DB_NAME="${BOOKING_DB_NAME:-bookingdb}"

DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres123}"

MOVIE_SERVICE_PORT="${MOVIE_SERVICE_PORT:-8082}"
BOOKING_SERVICE_PORT="${BOOKING_SERVICE_PORT:-8083}"
# ─────────────────────────────────────────────────────────────

echo "=================================================="
echo "  MÁY 3 — Movie + Booking Service (192.168.1.102) "
echo "=================================================="

if ! command -v docker &>/dev/null; then
  echo "[ERROR] Docker chưa cài."
  exit 1
fi

echo ""
echo "Cấu hình:"
echo "  KAFKA_BROKER         = $KAFKA_BROKER"
echo "  Movie  DB port       = $MOVIE_DB_PORT  → $MOVIE_DB_NAME"
echo "  Booking DB port      = $BOOKING_DB_PORT → $BOOKING_DB_NAME"
echo "  Movie  Service port  = $MOVIE_SERVICE_PORT"
echo "  Booking Service port = $BOOKING_SERVICE_PORT"

# 1. Dọn dẹp containers cũ
echo ""
echo "[1/6] Dọn dẹp containers cũ..."
docker rm -f postgres-movie postgres-booking movie-service booking-service 2>/dev/null || true

# 2. Khởi động PostgreSQL cho movie-service
echo ""
echo "[2/6] Khởi động PostgreSQL (moviedb) trên cổng $MOVIE_DB_PORT..."
docker run -d \
  --name postgres-movie \
  -e POSTGRES_DB="$MOVIE_DB_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -p "$MOVIE_DB_PORT:5432" \
  --restart unless-stopped \
  postgres:15-alpine

# 3. Khởi động PostgreSQL cho booking-service
echo ""
echo "[3/6] Khởi động PostgreSQL (bookingdb) trên cổng $BOOKING_DB_PORT..."
docker run -d \
  --name postgres-booking \
  -e POSTGRES_DB="$BOOKING_DB_NAME" \
  -e POSTGRES_USER="$DB_USER" \
  -e POSTGRES_PASSWORD="$DB_PASSWORD" \
  -p "$BOOKING_DB_PORT:5432" \
  --restart unless-stopped \
  postgres:15-alpine

echo "  Chờ các DB sẵn sàng (15s)..."
sleep 5
for i in {1..5}; do
  MOVIE_READY=$(docker exec postgres-movie pg_isready -U "$DB_USER" 2>/dev/null && echo "ok" || echo "no")
  BOOKING_READY=$(docker exec postgres-booking pg_isready -U "$DB_USER" 2>/dev/null && echo "ok" || echo "no")
  if [ "$MOVIE_READY" = "ok" ] && [ "$BOOKING_READY" = "ok" ]; then
    echo "  ✅ Cả 2 DB sẵn sàng"
    break
  fi
  echo "  movie=$MOVIE_READY booking=$BOOKING_READY — Lần thử $i/5..."
  sleep 3
done

# 4. Build + chạy movie-service
echo ""
echo "[4/6] Build + khởi động movie-service..."
cd "$ROOT_DIR/services/movie-service"
docker build -t movie-service:latest .

docker run -d \
  --name movie-service \
  -p "$MOVIE_SERVICE_PORT:$MOVIE_SERVICE_PORT" \
  -e PORT="$MOVIE_SERVICE_PORT" \
  -e DB_HOST="$THIS_IP" \
  -e DB_PORT="$MOVIE_DB_PORT" \
  -e DB_NAME="$MOVIE_DB_NAME" \
  -e DB_USER="$DB_USER" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  --restart unless-stopped \
  movie-service:latest

# 5. Build + chạy booking-service
echo ""
echo "[5/6] Build + khởi động booking-service..."
cd "$ROOT_DIR/services/booking-service"
docker build -t booking-service:latest .

docker run -d \
  --name booking-service \
  -p "$BOOKING_SERVICE_PORT:$BOOKING_SERVICE_PORT" \
  -e PORT="$BOOKING_SERVICE_PORT" \
  -e DB_HOST="$THIS_IP" \
  -e DB_PORT="$BOOKING_DB_PORT" \
  -e DB_NAME="$BOOKING_DB_NAME" \
  -e DB_USER="$DB_USER" \
  -e DB_PASSWORD="$DB_PASSWORD" \
  -e KAFKA_BROKER="$KAFKA_BROKER" \
  -e JWT_SECRET="$JWT_SECRET" \
  --restart unless-stopped \
  booking-service:latest

# 6. Kiểm tra health
echo ""
echo "[6/6] Chờ services khởi động (15s)..."
sleep 15

for SVC_PORT in "$MOVIE_SERVICE_PORT" "$BOOKING_SERVICE_PORT"; do
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$SVC_PORT/health" 2>/dev/null || echo "000")
  if [ "$RESPONSE" = "200" ]; then
    echo "  ✅ Port $SVC_PORT — OK"
  else
    echo "  ⚠️  Port $SVC_PORT — HTTP $RESPONSE (service có thể chưa kịp khởi động)"
  fi
done

echo ""
echo "=================================================="
echo "  ✅ Máy 3 sẵn sàng!"
echo "  Movie   Service: http://$THIS_IP:$MOVIE_SERVICE_PORT"
echo "  Booking Service: http://$THIS_IP:$BOOKING_SERVICE_PORT"
echo "=================================================="
echo ""
echo "Theo dõi log:"
echo "  docker logs -f movie-service"
echo "  docker logs -f booking-service"
echo ""
echo "Test nhanh:"
echo "  curl http://localhost:$MOVIE_SERVICE_PORT/movies"
