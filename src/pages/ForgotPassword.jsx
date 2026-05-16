import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword } from "../api/authApi";
import Navbar from "../components/home/Navbar";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    
    setLoading(true);
    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setSent(true);
        toast.success("Reset link sent to your email!");
      }
    } catch (error) {
      console.error("FORGOT_PASS_ERROR:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to send reset link";
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
            <h1 className="font-display text-3xl font-bold tracking-tight">Forgot Password</h1>
            <p className="mt-2 text-slate-400">
              {sent 
                ? "Check your inbox for the reset link" 
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                  placeholder="name@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 font-bold text-[#061323] transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="mt-8 space-y-4 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">
                If an account exists for {email}, you will receive an email shortly with instructions.
              </p>
              <button
                onClick={() => setSent(false)}
                className="text-sm font-medium text-[#40e0d0] hover:underline"
              >
                Try another email
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm font-medium text-[#40e0d0] hover:underline">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
