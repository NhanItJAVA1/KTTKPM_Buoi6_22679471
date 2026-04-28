import { Module, Controller, Get } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { PaymentModule } from "./payment/payment.module";
import { Payment } from "./entities/payment.entity";

@Controller()
class HealthController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "payment-service",
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
      database: process.env.DB_NAME || "payment_db",
      entities: [Payment],
      synchronize: true,
    }),
    PaymentModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
