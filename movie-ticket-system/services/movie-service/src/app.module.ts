import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Controller, Get } from "@nestjs/common";
import { MoviesModule } from "./movies/movies.module";
import { Movie } from "./entities/movie.entity";

@Controller()
class HealthController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "movie-service",
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
      database: process.env.DB_NAME || "movie_db",
      entities: [Movie],
      synchronize: true,
    }),
    MoviesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
