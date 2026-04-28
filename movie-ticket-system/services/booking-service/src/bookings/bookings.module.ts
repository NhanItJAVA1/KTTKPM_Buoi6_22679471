import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { KafkaProducer } from "../kafka/kafka.producer";
import { KafkaConsumer } from "../kafka/kafka.consumer";
import { Booking } from "../entities/booking.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "super_secret_jwt_key_2024",
    }),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, KafkaProducer, KafkaConsumer],
})
export class BookingsModule {}
