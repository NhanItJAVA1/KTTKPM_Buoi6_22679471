import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Kafka, Producer, logLevel } from "kafkajs";

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private connected = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: "payment-service",
      brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
      logLevel: logLevel.ERROR,
      retry: { retries: 10, initialRetryTime: 3000 },
    });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.connected) await this.producer.disconnect();
  }

  private async connect() {
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        await this.producer.connect();
        this.connected = true;
        console.log("[Payment Service] Kafka Producer connected");
        return;
      } catch (err) {
        console.warn(
          `[Payment Service] Producer connect attempt ${attempt}/10. Retrying in 5s...`,
        );
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    console.error(
      "[Payment Service] Failed to connect Kafka Producer after 10 attempts",
    );
  }

  async publishEvent(topic: string, event: string, data: any) {
    if (!this.connected) return;
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: data.bookingId || "key",
            value: JSON.stringify({
              event,
              data,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
      console.log(`[Payment Service] Published ${event} to ${topic}`);
    } catch (err) {
      console.error(
        `[Payment Service] Failed to publish event: ${err.message}`,
      );
    }
  }
}
