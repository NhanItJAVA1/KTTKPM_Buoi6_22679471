import { useEffect, useState } from "react";
import { movieService, type Movie } from "../services/movieService";
import MovieList from "../components/MovieList";

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [genre, setGenre] = useState("");

  const genres = [
    "",
    "Action",
    "Sci-Fi",
    "Thriller",
    "Drama",
    "Comedy",
    "Horror",
  ];

  const fetchMovies = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await movieService.getAll(genre ? { genre } : undefined);
      setMovies(data);
    } catch {
      setError("Không thể tải danh sách phim. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [genre]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🎬 Danh sách phim</h1>
        <select
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-yellow-400 outline-none"
        >
          {genres.map((g) => (
            <option key={g} value={g}>
              {g || "Tất cả thể loại"}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
          <button onClick={fetchMovies} className="ml-2 underline">
            Thử lại
          </button>
        </div>
      )}

      <MovieList movies={movies} loading={loading} />
    </div>
  );
}
