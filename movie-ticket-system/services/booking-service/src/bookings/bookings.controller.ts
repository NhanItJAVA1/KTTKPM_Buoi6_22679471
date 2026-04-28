import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";

@Controller("bookings")
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async create(
    @Headers("authorization") auth: string,
    @Body() dto: CreateBookingDto,
  ) {
    // Trích xuất userId từ JWT nếu có
    if (auth?.startsWith("Bearer ")) {
      try {
        const token = auth.split(" ")[1];
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || "super_secret_jwt_key_2024",
        });
        dto.userId = payload.sub;
      } catch {
        // Dùng userId từ body nếu token không hợp lệ
      }
    }
    return this.bookingsService.create(dto);
  }

  @Get()
  findAll(@Query("userId") userId?: string) {
    return this.bookingsService.findAll(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.bookingsService.findOne(id);
  }

  @Get("/health/check")
  health() {
    return {
      status: "ok",
      service: "booking-service",
      timestamp: new Date().toISOString(),
    };
  }
}
