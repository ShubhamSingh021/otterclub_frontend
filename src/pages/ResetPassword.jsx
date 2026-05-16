import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPassword } from "../api/authApi";
import Navbar from "../components/home/Navbar";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    if (password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const res = await resetPassword(token, password);
      if (res.success) {
        toast.success("Password reset successfully! Please login.");
        navigate("/login");
      }
    } catch (error) {
      console.error("RESET_PASSWORD_ERROR:", error);
      const errorMsg = error.response?.data?.message || "Invalid or expired token";
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
            <h1 className="font-display text-3xl font-bold tracking-tight">Set New Password</h1>
            <p className="mt-2 text-slate-400">Choose a strong password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 font-bold text-[#061323] transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Update Password"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Wait, I remembered it!{" "}
            <Link to="/login" className="font-bold text-[#40e0d0] hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
