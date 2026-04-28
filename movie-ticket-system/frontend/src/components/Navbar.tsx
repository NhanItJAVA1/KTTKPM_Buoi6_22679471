import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <Link
        to="/movies"
        className="text-xl font-bold text-yellow-400 hover:text-yellow-300"
      >
        🎬 Movie Tickets
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to="/movies"
          className="hover:text-yellow-400 transition-colors text-sm"
        >
          Phim
        </Link>

        {isAuthenticated ? (
          <>
            <Link
              to="/my-bookings"
              className="hover:text-yellow-400 transition-colors text-sm"
            >
              Vé của tôi
            </Link>
            <span className="text-gray-400 text-sm">
              Xin chào, {user?.username}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded transition-colors"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="hover:text-yellow-400 transition-colors text-sm"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-semibold px-3 py-1 rounded transition-colors"
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
