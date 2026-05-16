import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { login } from "../api/authApi";
import Navbar from "../components/home/Navbar";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await login(formData);
      if (res.success) {
        // Clear ALL old session data to prevent state mix
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");

        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.data));
        toast.success(`Welcome back, ${res.data.name}!`);
        navigate(from);
      }
    } catch (error) {
      console.error("LOGIN_ERROR:", error);
      const errorMsg = error.response?.data?.message || error.message || "Login failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Navbar />
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight">Member Login</h1>
            <p className="mt-2 text-slate-400">Access your club membership dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex justify-end">
                <Link to="/forgot-password" size="sm" className="text-sm font-medium text-[#40e0d0] hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 font-bold text-[#061323] transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-[#40e0d0] hover:underline">
              Join the society
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
