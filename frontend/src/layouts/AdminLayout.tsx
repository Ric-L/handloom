import { Link, Outlet, useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col py-6 px-4 gap-2 shrink-0">
        <div className="text-primary-400 font-bold text-lg mb-6 px-2 flex items-center gap-2">
          <span>🧵</span> Admin Panel
        </div>
        <Link to="/admin" className="px-3 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium">Dashboard</Link>
        <Link to="/admin/applications" className="px-3 py-2 rounded-lg hover:bg-gray-800 text-sm font-medium">Applications</Link>
        <div className="flex-1" />
        <Link to="/" className="px-3 py-2 rounded-lg hover:bg-gray-800 text-xs text-gray-400">View Public Portal</Link>
        <button onClick={logout} className="px-3 py-2 rounded-lg hover:bg-red-900 text-sm text-red-300 text-left">Logout</button>
      </aside>
      <div className="flex-1 bg-gray-50 flex flex-col">
        <header className="bg-white border-b px-8 py-4 shadow-sm flex justify-between items-center">
          <h1 className="text-gray-700 font-semibold text-lg">Handloom & Artisan Portal — Administrator</h1>
          <span className="text-xs bg-primary-100 text-primary-800 font-semibold px-2.5 py-1 rounded-full">Official Admin Session</span>
        </header>
        <main className="p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
