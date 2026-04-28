import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentService } from "./payment.service";
import { KafkaProducer } from "../kafka/kafka.producer";
import { KafkaConsumer } from "../kafka/kafka.consumer";
import { Payment } from "../entities/payment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  providers: [PaymentService, KafkaProducer, KafkaConsumer],
})
export class PaymentModule {}
