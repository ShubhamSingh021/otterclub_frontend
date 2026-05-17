import { useNavigate } from "react-router-dom";
import Container from "./Container";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  return (
    <nav className="border-b border-white/10 bg-[#081429]/50 backdrop-blur-md">
      <Container className="flex h-20 items-center justify-between">
        <h1 className="font-display text-xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
          <button onClick={() => navigate("/admin/analytics")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Analytics</button>
          <button onClick={() => navigate("/admin/scanner")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Scanner</button>
          <button onClick={() => navigate("/admin/memberships")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Memberships</button>
          <button onClick={() => navigate("/admin/registrations")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Registrations</button>
          <button onClick={() => navigate("/admin/events")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Manage Events</button>
          <button onClick={() => navigate("/admin/coupons")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Coupons</button>
          <button onClick={() => navigate("/admin/broadcast")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Broadcast</button>
          <button onClick={() => navigate("/admin/community")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Community</button>
          <button onClick={() => navigate("/admin/cms")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Manage CMS</button>
          <button onClick={() => navigate("/admin/reviews")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Reviews</button>
          <button onClick={() => navigate("/admin/payments")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">Payments</button>
          <button onClick={() => navigate("/")} className="text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200">View Site</button>
          <button onClick={handleLogout} className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors duration-200">Logout</button>
        </div>
      </Container>
    </nav>
  );
};

export default AdminNavbar;
