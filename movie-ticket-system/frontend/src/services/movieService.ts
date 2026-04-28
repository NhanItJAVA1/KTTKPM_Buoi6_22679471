import { movieApi } from "./api";

export interface Movie {
  id: string;
  title: string;
  description: string;
  genre: string;
  duration: number;
  releaseDate: string;
  posterUrl: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  isActive: boolean;
}

export const movieService = {
  getAll: async (params?: { genre?: string; available?: boolean }) => {
    const res = await movieApi.get("/movies", { params });
    return res.data as Movie[];
  },

  getById: async (id: string) => {
    const res = await movieApi.get(`/movies/${id}`);
    return res.data as Movie;
  },
};
