import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { movieService, type Movie } from "../services/movieService";
import { useAuthStore } from "../store/authStore";

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    movieService
      .getById(id)
      .then(setMovie)
      .catch(() => setError("Không tìm thấy phim"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );

  if (error || !movie)
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 text-xl">{error || "Không tìm thấy phim"}</p>
        <Link
          to="/movies"
          className="mt-4 inline-block text-yellow-600 underline"
        >
          Quay lại
        </Link>
      </div>
    );

  const handleBookingClick = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    navigate(`/booking/${movie.id}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/movies"
        className="text-yellow-600 hover:underline text-sm mb-6 inline-block"
      >
        ← Quay lại danh sách phim
      </Link>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-80 flex-shrink-0">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://via.placeholder.com/300x450?text=No+Image";
              }}
            />
          ) : (
            <div className="w-full h-80 bg-gray-200 flex items-center justify-center text-6xl">
              🎬
            </div>
          )}
        </div>

        <div className="p-8 flex flex-col justify-between flex-1">
          <div>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
              {movie.genre}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mt-3 mb-2">
              {movie.title}
            </h1>
            <p className="text-gray-600 text-sm mb-4">{movie.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-6">
              <div>⏱️ {movie.duration} phút</div>
              <div>
                📅{" "}
                {movie.releaseDate
                  ? new Date(movie.releaseDate).getFullYear()
                  : "N/A"}
              </div>
              <div>💺 {movie.availableSeats} ghế còn trống</div>
              <div>
                🎟️ {Number(movie.price).toLocaleString("vi-VN")} ₫ / ghế
              </div>
            </div>
          </div>

          <button
            onClick={handleBookingClick}
            disabled={movie.availableSeats === 0}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-900 font-bold py-3 rounded-xl text-lg transition-colors"
          >
            {movie.availableSeats > 0 ? "🎟️ Đặt vé ngay" : "Hết vé"}
          </button>
        </div>
      </div>
    </div>
  );
}
