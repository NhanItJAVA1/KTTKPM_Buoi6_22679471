import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment, PaymentStatus } from "../entities/payment.entity";
import { KafkaProducer } from "../kafka/kafka.producer";

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async processPayment(bookingData: any) {
    console.log(
      `[Payment Service] Processing payment for booking ${bookingData.bookingId}...`,
    );

    // Giả lập xử lý mất 2 giây
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 70% thành công, 30% thất bại
    const isSuccess = Math.random() > 0.3;

    if (isSuccess) {
      const payment = this.paymentRepository.create({
        bookingId: bookingData.bookingId,
        userId: bookingData.userId,
        amount: bookingData.totalAmount,
        status: PaymentStatus.SUCCESS,
      });
      const saved = await this.paymentRepository.save(payment);

      await this.kafkaProducer.publishEvent(
        "payment-events",
        "PAYMENT_COMPLETED",
        {
          paymentId: saved.id,
          bookingId: bookingData.bookingId,
          userId: bookingData.userId,
          movieTitle: bookingData.movieTitle,
          amount: bookingData.totalAmount,
          paidAt: saved.processedAt.toISOString(),
        },
      );

      console.log(
        `[Payment Service] ✅ Payment SUCCESS for booking ${bookingData.bookingId}`,
      );
    } else {
      const payment = this.paymentRepository.create({
        bookingId: bookingData.bookingId,
        userId: bookingData.userId,
        amount: bookingData.totalAmount,
        status: PaymentStatus.FAILED,
      });
      await this.paymentRepository.save(payment);

      await this.kafkaProducer.publishEvent(
        "payment-events",
        "BOOKING_FAILED",
        {
          bookingId: bookingData.bookingId,
          userId: bookingData.userId,
          reason: "Payment declined",
          failedAt: new Date().toISOString(),
        },
      );

      console.log(
        `[Payment Service] ❌ Payment FAILED for booking ${bookingData.bookingId}`,
      );
    }
  }
}
