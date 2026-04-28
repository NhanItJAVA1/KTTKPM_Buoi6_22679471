import { Module } from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { KafkaConsumer } from "../kafka/kafka.consumer";

@Module({
  providers: [NotificationService, KafkaConsumer],
})
export class NotificationModule {}
