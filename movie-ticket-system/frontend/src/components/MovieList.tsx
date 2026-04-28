import { Link } from "react-router-dom";
import type { Movie } from "../services/movieService";

interface Props {
  movies: Movie[];
  loading: boolean;
}

export default function MovieList({ movies, loading }: Props) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-xl">Không có phim nào.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {movies.map((movie) => (
        <Link
          key={movie.id}
          to={`/movies/${movie.id}`}
          className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow overflow-hidden group"
        >
          <div className="relative h-64 bg-gray-200 overflow-hidden">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/300x400?text=No+Image";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                🎬
              </div>
            )}
            <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded">
              {movie.genre}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-gray-900 text-sm line-clamp-2 mb-1">
              {movie.title}
            </h3>
            <p className="text-gray-500 text-xs mb-2">{movie.duration} phút</p>
            <div className="flex items-center justify-between">
              <span className="text-yellow-600 font-bold text-sm">
                {Number(movie.price).toLocaleString("vi-VN")} ₫
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${movie.availableSeats > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {movie.availableSeats > 0
                  ? `${movie.availableSeats} ghế`
                  : "Hết vé"}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
