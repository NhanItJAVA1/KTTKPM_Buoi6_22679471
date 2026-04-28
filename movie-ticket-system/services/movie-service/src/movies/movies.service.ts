import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Movie } from "../entities/movie.entity";
import { CreateMovieDto } from "./dto/create-movie.dto";

const SEED_MOVIES: Partial<Movie>[] = [
  {
    title: "Avengers: Endgame",
    description:
      "The Avengers assemble once more to reverse Thanos devastation.",
    genre: "Action",
    duration: 181,
    releaseDate: new Date("2019-04-26"),
    posterUrl:
      "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
    totalSeats: 150,
    availableSeats: 150,
    price: 85000,
    isActive: true,
  },
  {
    title: "Interstellar",
    description: "A team of explorers travel through a wormhole in space.",
    genre: "Sci-Fi",
    duration: 169,
    releaseDate: new Date("2014-11-07"),
    posterUrl:
      "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    totalSeats: 120,
    availableSeats: 120,
    price: 75000,
    isActive: true,
  },
  {
    title: "The Dark Knight",
    description: "Batman faces the Joker in a battle for Gotham City.",
    genre: "Action",
    duration: 152,
    releaseDate: new Date("2008-07-18"),
    posterUrl:
      "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    totalSeats: 100,
    availableSeats: 100,
    price: 70000,
    isActive: true,
  },
  {
    title: "Inception",
    description:
      "A thief who steals corporate secrets through dream-sharing technology.",
    genre: "Thriller",
    duration: 148,
    releaseDate: new Date("2010-07-16"),
    posterUrl:
      "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    totalSeats: 120,
    availableSeats: 120,
    price: 70000,
    isActive: true,
  },
  {
    title: "Spider-Man: No Way Home",
    description:
      "Peter Parker asks Doctor Strange for help after his identity is revealed.",
    genre: "Action",
    duration: 148,
    releaseDate: new Date("2021-12-17"),
    posterUrl:
      "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
    totalSeats: 200,
    availableSeats: 200,
    price: 90000,
    isActive: true,
  },
  {
    title: "Parasite",
    description:
      "A poor family schemes to become employed by a wealthy family.",
    genre: "Thriller",
    duration: 132,
    releaseDate: new Date("2019-05-30"),
    posterUrl:
      "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    totalSeats: 100,
    availableSeats: 100,
    price: 65000,
    isActive: true,
  },
  {
    title: "Dune: Part Two",
    description: "Paul Atreides unites with Chani and the Fremen.",
    genre: "Sci-Fi",
    duration: 166,
    releaseDate: new Date("2024-03-01"),
    posterUrl:
      "https://image.tmdb.org/t/p/w500/czembW0Rk1Ke7lCJGahbOhdCuhV.jpg",
    totalSeats: 180,
    availableSeats: 180,
    price: 95000,
    isActive: true,
  },
  {
    title: "Oppenheimer",
    description: "The story of the creation of the atomic bomb.",
    genre: "Drama",
    duration: 180,
    releaseDate: new Date("2023-07-21"),
    posterUrl:
      "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    totalSeats: 130,
    availableSeats: 130,
    price: 85000,
    isActive: true,
  },
];

@Injectable()
export class MoviesService implements OnModuleInit {
  constructor(
    @InjectRepository(Movie)
    private readonly moviesRepository: Repository<Movie>,
  ) {}

  async onModuleInit() {
    const count = await this.moviesRepository.count();
    if (count === 0) {
      await this.moviesRepository.save(SEED_MOVIES);
      console.log("[Movie Service] Seeded 8 movies successfully");
    }
  }

  async findAll(genre?: string, available?: string) {
    const qb = this.moviesRepository.createQueryBuilder("movie");
    qb.where("movie.isActive = :isActive", { isActive: true });

    if (genre) {
      qb.andWhere("LOWER(movie.genre) = LOWER(:genre)", { genre });
    }
    if (available === "true") {
      qb.andWhere("movie.availableSeats > 0");
    }

    return qb.orderBy("movie.createdAt", "DESC").getMany();
  }

  async findOne(id: string) {
    const movie = await this.moviesRepository.findOne({ where: { id } });
    if (!movie) throw new NotFoundException(`Phim #${id} không tồn tại`);
    return movie;
  }

  async create(dto: CreateMovieDto) {
    const movie = this.moviesRepository.create({
      ...dto,
      availableSeats: dto.totalSeats,
    });
    return this.moviesRepository.save(movie);
  }

  async update(id: string, dto: Partial<CreateMovieDto>) {
    const movie = await this.findOne(id);
    Object.assign(movie, dto);
    return this.moviesRepository.save(movie);
  }
}
