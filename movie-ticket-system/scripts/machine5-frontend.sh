#!/usr/bin/env bash
# =============================================================
# MÁY 5 — Frontend (ReactJS + Nginx)
# IP: 192.168.1.104
# =============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# ── Cấu hình — đổi IP các service cho đúng với LAN ───────────
VITE_USER_SERVICE_URL="${VITE_USER_SERVICE_URL:-http://192.168.1.101:8081}"
VITE_MOVIE_SERVICE_URL="${VITE_MOVIE_SERVICE_URL:-http://192.168.1.102:8082}"
VITE_BOOKING_SERVICE_URL="${VITE_BOOKING_SERVICE_URL:-http://192.168.1.102:8083}"
FRONTEND_PORT="${FRONTEND_PORT:-8085}"
THIS_IP="${THIS_IP:-192.168.1.104}"
# ─────────────────────────────────────────────────────────────

echo "========================================"
echo "  MÁY 5 — Frontend (192.168.1.104)      "
echo "========================================"

if ! command -v docker &>/dev/null; then
  echo "[ERROR] Docker chưa cài."
  exit 1
fi

echo ""
echo "Cấu hình:"
echo "  VITE_USER_SERVICE_URL    = $VITE_USER_SERVICE_URL"
echo "  VITE_MOVIE_SERVICE_URL   = $VITE_MOVIE_SERVICE_URL"
echo "  VITE_BOOKING_SERVICE_URL = $VITE_BOOKING_SERVICE_URL"
echo "  FRONTEND_PORT            = $FRONTEND_PORT"

# Kiểm tra kết nối đến các service trước khi build
echo ""
echo "Kiểm tra kết nối đến các backend services..."

check_service() {
  local NAME=$1
  local URL=$2
  local RESPONSE
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$URL/health" 2>/dev/null || echo "000")
  if [ "$RESPONSE" = "200" ]; then
    echo "  ✅ $NAME ($URL) — OK"
  else
    echo "  ⚠️  $NAME ($URL) — HTTP $RESPONSE (service chưa chạy hoặc chưa kết nối được)"
  fi
}

check_service "user-service"    "$VITE_USER_SERVICE_URL"
check_service "movie-service"   "$VITE_MOVIE_SERVICE_URL"
check_service "booking-service" "$VITE_BOOKING_SERVICE_URL"

# Dọn dẹp container cũ
echo ""
echo "Dọn dẹp container frontend cũ..."
docker rm -f movie-frontend 2>/dev/null || true

# Build image frontend
# QUAN TRỌNG: VITE_ env vars được bake vào lúc build (không phải runtime)
echo ""
echo "Build Docker image frontend (có thể mất 2-3 phút)..."
cd "$ROOT_DIR/frontend"
docker build \
  --build-arg VITE_USER_SERVICE_URL="$VITE_USER_SERVICE_URL" \
  --build-arg VITE_MOVIE_SERVICE_URL="$VITE_MOVIE_SERVICE_URL" \
  --build-arg VITE_BOOKING_SERVICE_URL="$VITE_BOOKING_SERVICE_URL" \
  -t movie-frontend:latest .

# Chạy frontend
echo ""
echo "Khởi động frontend container..."
docker run -d \
  --name movie-frontend \
  -p "$FRONTEND_PORT:8085" \
  --restart unless-stopped \
  movie-frontend:latest

# Kiểm tra
echo ""
echo "Chờ Nginx khởi động (5s)..."
sleep 5

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$FRONTEND_PORT" 2>/dev/null || echo "000")
if [ "$RESPONSE" = "200" ]; then
  echo "✅ Frontend đang chạy"
else
  echo "⚠️  HTTP $RESPONSE — kiểm tra: docker logs movie-frontend"
fi

echo ""
echo "========================================"
echo "  ✅ Máy 5 sẵn sàng!"
echo "  Frontend: http://$THIS_IP:$FRONTEND_PORT"
echo ""
echo "  Truy cập từ bất kỳ máy trong LAN:"
echo "  http://$THIS_IP:$FRONTEND_PORT"
echo "========================================"
echo ""
echo "Theo dõi log:"
echo "  docker logs -f movie-frontend"
echo ""
echo "Lưu ý: Nếu đổi IP backend sau khi build,"
echo "cần rebuild lại image vì VITE_ vars bake vào lúc build."
