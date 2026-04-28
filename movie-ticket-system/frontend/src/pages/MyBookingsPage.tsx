import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { bookingService, type Booking } from "../services/bookingService";
import { useAuthStore } from "../store/authStore";

const STATUS_CONFIG = {
  PENDING: { label: "🟡 PENDING", cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMED: { label: "✅ CONFIRMED", cls: "bg-green-100 text-green-700" },
  FAILED: { label: "❌ FAILED", cls: "bg-red-100 text-red-700" },
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBookings = async () => {
    if (!user?.id) return;
    try {
      const data = await bookingService.getMyBookings(user.id);
      setBookings(data);
      setError("");
    } catch {
      setError("Không thể tải danh sách vé.");
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchBookings().finally(() => setLoading(false));

    intervalRef.current = setInterval(fetchBookings, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">🎟️ Vé của tôi</h1>
        <span className="text-xs text-gray-400">
          Tự động cập nhật mỗi 3 giây
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {bookings.length === 0 && !error ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-6xl mb-4">🎬</div>
          <p>Bạn chưa đặt vé nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const statusInfo = STATUS_CONFIG[b.status] ?? {
              label: b.status,
              cls: "bg-gray-100 text-gray-600",
            };
            return (
              <div
                key={b.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">
                      {b.movieTitle}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {b.seats} ghế ·{" "}
                      {Number(b.totalAmount).toLocaleString("vi-VN")} ₫
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(b.createdAt).toLocaleString("vi-VN")}
                    </p>
                    <p className="text-xs text-gray-300 mt-1 font-mono">
                      {b.id}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${statusInfo.cls}`}
                  >
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
