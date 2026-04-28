import { Controller, Get, Post, Put, Body, Param, Query } from "@nestjs/common";
import { MoviesService } from "./movies.service";
import { CreateMovieDto } from "./dto/create-movie.dto";

@Controller("movies")
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  findAll(
    @Query("genre") genre?: string,
    @Query("available") available?: string,
  ) {
    return this.moviesService.findAll(genre, available);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.moviesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMovieDto) {
    return this.moviesService.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: Partial<CreateMovieDto>) {
    return this.moviesService.update(id, dto);
  }
}
