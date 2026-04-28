import { useState } from "react";
import type { Movie } from "../services/movieService";

interface Props {
  movie: Movie;
  onSubmit: (seats: number, totalAmount: number) => void;
  loading: boolean;
}

export default function BookingForm({ movie, onSubmit, loading }: Props) {
  const [seats, setSeats] = useState(1);

  const totalAmount = seats * Number(movie.price);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(seats, totalAmount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Số ghế
        </label>
        <input
          type="number"
          min={1}
          max={Math.min(movie.availableSeats, 10)}
          value={seats}
          onChange={(e) => setSeats(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
        />
        <p className="text-xs text-gray-400 mt-1">
          Còn {movie.availableSeats} ghế trống
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Giá vé</span>
          <span>{Number(movie.price).toLocaleString("vi-VN")} ₫ / ghế</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900">
          <span>Tổng tiền</span>
          <span className="text-yellow-600">
            {totalAmount.toLocaleString("vi-VN")} ₫
          </span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || movie.availableSeats === 0}
        className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-gray-300 text-gray-900 font-bold py-3 rounded-lg transition-colors"
      >
        {loading ? "Đang xử lý..." : "Xác nhận đặt vé"}
      </button>
    </form>
  );
}
