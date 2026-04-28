#!/usr/bin/env bash
# =============================================================
# MÁY 1 — Kafka Broker + Zookeeper
# IP: 192.168.1.100
# =============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  MÁY 1 — Kafka Broker (192.168.1.100)  "
echo "========================================"

# 1. Kiểm tra IP máy hiện tại
echo ""
echo "[1/4] IP máy này:"
hostname -I | tr ' ' '\n' | grep -v '^$'

# 2. Kiểm tra Docker
if ! command -v docker &>/dev/null; then
  echo "[ERROR] Docker chưa cài. Chạy: sudo apt install -y docker.io docker-compose-plugin"
  exit 1
fi

# 3. Set biến môi trường Kafka sẽ advertise ra LAN
export KAFKA_HOST_IP="${KAFKA_HOST_IP:-192.168.1.100}"
echo ""
echo "[2/4] KAFKA_HOST_IP = $KAFKA_HOST_IP"
echo "      (Đổi bằng: export KAFKA_HOST_IP=<IP-thực-của-máy-này> trước khi chạy script)"

# 4. Khởi động Kafka + Zookeeper
echo ""
echo "[3/4] Khởi động Kafka + Zookeeper..."
cd "$ROOT_DIR"
KAFKA_HOST_IP=$KAFKA_HOST_IP docker compose -f docker-compose.kafka.yml up -d

# 5. Chờ Kafka sẵn sàng
echo ""
echo "[4/4] Chờ Kafka sẵn sàng (30s)..."
sleep 15
for i in {1..6}; do
  if docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092 &>/dev/null 2>&1; then
    echo "      ✅ Kafka đã sẵn sàng!"
    break
  fi
  echo "      Lần thử $i/6... (5s)"
  sleep 5
done

# 6. Tạo Kafka topics
echo ""
echo "Tạo Kafka topics..."

for TOPIC in user-events booking-events payment-events; do
  docker exec kafka kafka-topics.sh \
    --bootstrap-server localhost:9092 \
    --create --if-not-exists \
    --topic "$TOPIC" \
    --partitions 3 \
    --replication-factor 1
  echo "  ✅ Topic '$TOPIC' đã tạo"
done

echo ""
echo "Danh sách topics hiện có:"
docker exec kafka kafka-topics.sh --list --bootstrap-server localhost:9092

echo ""
echo "========================================"
echo "  ✅ Máy 1 sẵn sàng!"
echo "  Kafka: $KAFKA_HOST_IP:9092"
echo "========================================"
echo ""
echo "Theo dõi log:"
echo "  docker compose -f docker-compose.kafka.yml logs -f"
