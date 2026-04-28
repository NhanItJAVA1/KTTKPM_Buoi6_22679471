import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Controller, Get } from "@nestjs/common";
import { BookingsModule } from "./bookings/bookings.module";
import { Booking } from "./entities/booking.entity";

@Controller()
class HealthController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "booking-service",
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASS || "postgres123",
      database: process.env.DB_NAME || "booking_db",
      entities: [Booking],
      synchronize: true,
    }),
    BookingsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
