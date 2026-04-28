import axios from "axios";

// ─── Axios instances — mỗi instance cho một service riêng ───────────────────
// Nguyên tắc EDA: Frontend chỉ gọi trực tiếp User/Movie/Booking service
// KHÔNG gọi Payment hay Notification service

export const userApi = axios.create({
  baseURL: import.meta.env.VITE_USER_SERVICE_URL || "http://localhost:8081",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export const movieApi = axios.create({
  baseURL: import.meta.env.VITE_MOVIE_SERVICE_URL || "http://localhost:8082",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export const bookingApi = axios.create({
  baseURL: import.meta.env.VITE_BOOKING_SERVICE_URL || "http://localhost:8083",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// ─── Interceptor: tự động đính kèm Bearer token ──────────────────────────────
const addAuthInterceptor = (instance: typeof axios) => {
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      return Promise.reject(err);
    },
  );
};

addAuthInterceptor(userApi as any);
addAuthInterceptor(movieApi as any);
addAuthInterceptor(bookingApi as any);
