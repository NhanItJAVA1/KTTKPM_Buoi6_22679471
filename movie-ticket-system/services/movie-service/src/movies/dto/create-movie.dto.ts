import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsDateString,
} from "class-validator";

export class CreateMovieDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  genre: string;

  @IsNumber()
  @Min(1)
  duration: number;

  @IsDateString()
  @IsOptional()
  releaseDate?: string;

  @IsString()
  @IsOptional()
  posterUrl?: string;

  @IsNumber()
  @Min(1)
  totalSeats: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
