import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { movieService, type Movie } from "../services/movieService";
import { bookingService } from "../services/bookingService";
import { useAuthStore } from "../store/authStore";
import BookingForm from "../components/BookingForm";

export default function BookingPage() {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    status: string;
  } | null>(null);
  const [error, setError] = useState("");
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!id) return;
    movieService
      .getById(id)
      .then(setMovie)
      .catch(() => setError("Không tìm thấy phim"))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  const handleSubmit = async (seats: number, totalAmount: number) => {
    if (!movie || !user) return;
    setSubmitting(true);
    setError("");
    try {
      const booking = await bookingService.create({
        userId: user.id,
        movieId: movie.id,
        movieTitle: movie.title,
        seats,
        totalAmount,
      });
      setBookingResult({ id: booking.id, status: booking.status });
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Đặt vé thất bại. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );

  if (bookingResult)
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-5xl mb-4">🎟️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Đặt vé thành công!
          </h2>
          <p className="text-gray-500 mb-2 text-sm">
            Mã booking:{" "}
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {bookingResult.id}
            </code>
          </p>
          <span className="inline-block bg-yellow-100 text-yellow-700 text-sm font-bold px-3 py-1 rounded-full mb-6">
            🟡 {bookingResult.status}
          </span>
          <p className="text-gray-500 text-sm mb-6">
            Thanh toán đang được xử lý. Trạng thái sẽ cập nhật sau vài giây.
          </p>
          <div className="flex gap-3">
            <Link
              to="/my-bookings"
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 rounded-lg text-center transition-colors"
            >
              Xem vé của tôi
            </Link>
            <Link
              to="/movies"
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg text-center transition-colors"
            >
              Xem phim khác
            </Link>
          </div>
        </div>
      </div>
    );

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Link
        to={`/movies/${id}`}
        className="text-yellow-600 hover:underline text-sm mb-6 inline-block"
      >
        ← Quay lại chi tiết phim
      </Link>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Đặt vé</h1>
        {movie && <p className="text-gray-500 text-sm mb-6">{movie.title}</p>}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {movie && (
          <BookingForm
            movie={movie}
            onSubmit={handleSubmit}
            loading={submitting}
          />
        )}
      </div>
    </div>
  );
}
