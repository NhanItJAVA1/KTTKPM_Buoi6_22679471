import { bookingApi } from "./api";

export interface Booking {
  id: string;
  userId: string;
  movieId: string;
  movieTitle: string;
  seats: number;
  totalAmount: number;
  status: "PENDING" | "CONFIRMED" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingPayload {
  userId: string;
  movieId: string;
  movieTitle: string;
  seats: number;
  totalAmount: number;
}

export const bookingService = {
  create: async (data: CreateBookingPayload) => {
    const res = await bookingApi.post("/bookings", data);
    return res.data as Booking;
  },

  getMyBookings: async (userId: string) => {
    const res = await bookingApi.get("/bookings", { params: { userId } });
    return res.data as Booking[];
  },

  getById: async (id: string) => {
    const res = await bookingApi.get(`/bookings/${id}`);
    return res.data as Booking;
  },
};
