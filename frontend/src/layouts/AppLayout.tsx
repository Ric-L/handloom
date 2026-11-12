import { Link, Outlet, useNavigate } from "react-router-dom";

export default function AppLayout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-primary-800 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-2xl">🧵</span>
          <div>
            <div className="font-bold text-lg leading-tight">Handloom & Artisan Portal</div>
            <div className="text-xs text-primary-100">Skill Development Registration</div>
          </div>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-primary-200">Home</Link>
          <Link to="/categories" className="hover:text-primary-200">Categories</Link>
          {token ? (
            <>
              <Link to="/dashboard" className="hover:text-primary-200">My Applications</Link>
              <button onClick={logout} className="hover:text-red-300">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-primary-200">Login</Link>
              <Link to="/register" className="bg-accent-600 hover:bg-accent-700 px-3 py-1.5 rounded-lg text-white">Register</Link>
            </>
          )}
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-gray-400 py-6 border-t mt-16">
        © 2026 Handloom & Skilled Artisan Registration Portal. All rights reserved.
      </footer>
    </div>
  );
}
