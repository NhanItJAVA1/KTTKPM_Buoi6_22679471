import { IsString, IsNumber, IsNotEmpty, Min } from "class-validator";

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  movieId: string;

  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @IsNumber()
  @Min(1)
  seats: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;
}
