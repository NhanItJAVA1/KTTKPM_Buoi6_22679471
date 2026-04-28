import { Module, Controller, Get } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NotificationModule } from "./notification/notification.module";

@Controller()
class HealthController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "notification-service",
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NotificationModule],
  controllers: [HealthController],
})
export class AppModule {}
