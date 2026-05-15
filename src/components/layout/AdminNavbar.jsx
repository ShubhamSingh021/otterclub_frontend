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
        <div className="flex gap-6 items-center">
          <button onClick={() => navigate("/admin/memberships")} className="text-sm font-medium text-slate-400 hover:text-white">Memberships</button>
          <button onClick={() => navigate("/admin/registrations")} className="text-sm font-medium text-slate-400 hover:text-white">Registrations</button>
          <button onClick={() => navigate("/admin/events")} className="text-sm font-medium text-slate-400 hover:text-white">Manage Events</button>
          <button onClick={() => navigate("/admin/cms")} className="text-sm font-medium text-slate-400 hover:text-white">Manage CMS</button>
          <button onClick={() => navigate("/admin/payments")} className="text-sm font-medium text-slate-400 hover:text-white">Payments</button>
          <button onClick={() => navigate("/")} className="text-sm font-medium text-slate-400 hover:text-white">View Site</button>
          <button onClick={handleLogout} className="text-sm font-medium text-red-400 hover:text-red-300">Logout</button>
        </div>
      </Container>
    </nav>
  );
};

export default AdminNavbar;
