import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Kafka, Consumer, logLevel } from "kafkajs";
import { BookingsService } from "../bookings/bookings.service";

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(private readonly bookingsService: BookingsService) {
    this.kafka = new Kafka({
      clientId: "booking-service-consumer",
      brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
      logLevel: logLevel.ERROR,
      retry: { retries: 10, initialRetryTime: 3000 },
    });
    this.consumer = this.kafka.consumer({
      groupId: process.env.KAFKA_GROUP_ID || "booking-service-group",
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
  }

  private async connect() {
    for (let attempt = 1; attempt <= 10; attempt++) {
      try {
        await this.consumer.connect();
        await this.consumer.subscribe({
          topic: "payment-events",
          fromBeginning: false,
        });
        await this.consumer.run({
          eachMessage: async ({ message }) => {
            try {
              const payload = JSON.parse(message.value.toString());
              await this.handleMessage(payload);
            } catch (err) {
              console.error(
                "[Booking Consumer] Error processing message:",
                err instanceof Error ? err.message : String(err),
              );
            }
          },
        });
        console.log(
          "[Booking Service] Kafka Consumer connected — subscribed to payment-events",
        );
        return;
      } catch (err) {
        console.warn(
          `[Booking Service] Consumer connect attempt ${attempt}/10. Retrying in 5s...`,
        );
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    console.error(
      "[Booking Service] Failed to connect Kafka Consumer after 10 attempts",
    );
  }

  private async handleMessage(payload: any) {
    const { event, data } = payload;
    console.log(`[Booking Consumer] Received event: ${event}`);

    if (event === "PAYMENT_COMPLETED") {
      await this.bookingsService.updateStatus(data.bookingId, "CONFIRMED");
    } else if (event === "BOOKING_FAILED") {
      await this.bookingsService.updateStatus(data.bookingId, "FAILED");
    }
  }
}
