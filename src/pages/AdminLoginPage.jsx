import { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api/client.js";
import Container from "../components/layout/Container.jsx";
import toast from "react-hot-toast";

const AdminLoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await apiClient.post("/admin/login", { email, password });
      if (res.data.success) {
        // Clear any old session data to prevent state mix
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        localStorage.setItem("adminToken", res.data.data.token);
        localStorage.setItem("adminUser", JSON.stringify(res.data.data));
        toast.success("Login successful!");
        navigate("/admin/events");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060b16] text-white">
      <Container className="max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-xl sm:p-10">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold">Admin Portal</h1>
            <p className="mt-2 text-slate-400">Secure login for club management</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                <input
                  type="email"
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white transition focus:border-[#40e0d0] focus:ring-1 focus:ring-[#40e0d0]"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</label>
                <input
                  type="password"
                  required
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white transition focus:border-[#40e0d0] focus:ring-1 focus:ring-[#40e0d0]"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-3.5 text-sm font-bold text-[#061323] transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>
      </Container>
    </div>
  );
};

export default AdminLoginPage;
