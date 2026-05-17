import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Container from "./Container";

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  const navLinks = [
    { name: "Analytics", path: "/admin/analytics" },
    { name: "Scanner", path: "/admin/scanner" },
    { name: "Memberships", path: "/admin/memberships" },
    { name: "Registrations", path: "/admin/registrations" },
    { name: "Events", path: "/admin/events" },
    { name: "Coupons", path: "/admin/coupons" },
    { name: "Broadcast", path: "/admin/broadcast" },
    { name: "Community", path: "/admin/community" },
    { name: "Manage CMS", path: "/admin/cms" },
    { name: "Reviews", path: "/admin/reviews" },
    { name: "Payments", path: "/admin/payments" },
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <>
      <nav className="border-b border-white/10 bg-[#081429]/50 backdrop-blur-md sticky top-0 z-[9999] w-full">
        <Container className="flex h-20 items-center justify-between">
          <h1 
            onClick={() => navigate("/admin/analytics")} 
            className="font-display text-xl font-bold tracking-tight cursor-pointer hover:text-[#40e0d0] transition-colors"
          >
            Admin Dashboard
          </h1>

          {/* Desktop View */}
          <div className="hidden lg:flex flex-wrap gap-x-5 gap-y-2 items-center">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-[#40e0d0] font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {link.name}
              </button>
            ))}
            <button onClick={() => navigate("/")} className="text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors duration-200">View Site</button>
            <button onClick={handleLogout} className="text-xs font-semibold uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors duration-200">Logout</button>
          </div>

          {/* Mobile / Tablet Drawer Trigger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
            aria-label="Toggle Menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </Container>
      </nav>

      {/* Backdrop for Mobile Drawer */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[9998] bg-black/65 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Drawer Menu */}
      <div
        className={`fixed top-0 bottom-0 right-0 z-[9999] w-72 bg-[#0B1020] border-l border-white/10 p-6 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col justify-between ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ backgroundColor: '#0B1020', opacity: 1 }}
      >
        <div>
          {/* Header in Drawer */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h2 className="font-display text-lg font-bold text-white">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Links List */}
          <div className="flex flex-col gap-4 overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  setIsOpen(false);
                  navigate(link.path);
                }}
                className={`text-left text-sm font-medium transition-colors py-1.5 px-3 rounded-lg ${
                  isActive(link.path)
                    ? "bg-[#40e0d0]/10 text-[#40e0d0] font-bold"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Actions inside Drawer */}
        <div className="border-t border-white/10 pt-4 mt-auto space-y-3">
          <button
            onClick={() => {
              setIsOpen(false);
              navigate("/");
            }}
            className="w-full text-center py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold hover:bg-white/10 transition text-sm"
          >
            View Site
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="w-full text-center py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold hover:bg-red-500/20 transition text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminNavbar;
