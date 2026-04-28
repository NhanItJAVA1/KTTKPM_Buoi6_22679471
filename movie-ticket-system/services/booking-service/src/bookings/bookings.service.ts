import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Booking, BookingStatus } from "../entities/booking.entity";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { KafkaProducer } from "../kafka/kafka.producer";

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingsRepository: Repository<Booking>,
    private readonly kafkaProducer: KafkaProducer,
  ) {}

  async create(dto: CreateBookingDto) {
    const booking = this.bookingsRepository.create({
      userId: dto.userId,
      movieId: dto.movieId,
      movieTitle: dto.movieTitle,
      seats: dto.seats,
      totalAmount: dto.totalAmount,
      status: BookingStatus.PENDING,
    });

    const saved = await this.bookingsRepository.save(booking);

    // Publish BOOKING_CREATED event — KHÔNG gọi trực tiếp Payment Service
    await this.kafkaProducer.publishEvent("booking-events", "BOOKING_CREATED", {
      bookingId: saved.id,
      userId: saved.userId,
      movieId: saved.movieId,
      movieTitle: saved.movieTitle,
      seats: saved.seats,
      totalAmount: saved.totalAmount,
      createdAt: saved.createdAt.toISOString(),
    });

    return saved;
  }

  async findAll(userId?: string) {
    if (userId) {
      return this.bookingsRepository.find({
        where: { userId },
        order: { createdAt: "DESC" },
      });
    }
    return this.bookingsRepository.find({ order: { createdAt: "DESC" } });
  }

  async findOne(id: string) {
    const booking = await this.bookingsRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException(`Booking #${id} không tồn tại`);
    return booking;
  }

  async updateStatus(bookingId: string, status: "CONFIRMED" | "FAILED") {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId },
    });
    if (!booking) {
      console.warn(
        `[Booking Service] Booking ${bookingId} not found for status update`,
      );
      return;
    }
    booking.status = status as BookingStatus;
    await this.bookingsRepository.save(booking);
    console.log(
      `[Booking Service] Booking ${bookingId} status updated to ${status}`,
    );
  }
}
