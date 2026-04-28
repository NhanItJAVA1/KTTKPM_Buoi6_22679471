import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { KafkaProducer } from "../kafka/kafka.producer";
import { User } from "../entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "super_secret_jwt_key_2024",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || "24h" },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, KafkaProducer],
})
export class UsersModule {}
