import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword } from "../api/authApi";
import Navbar from "../components/home/Navbar";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await forgotPassword(email);
      if (res.success) {
        setSubmitted(true);
        toast.success("Reset link sent to your email!");
      }
    } catch (error) {
      console.error("FORGOT_PASSWORD_ERROR:", error);
      const errorMsg = error.response?.data?.message || "Something went wrong";
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
            <h1 className="font-display text-3xl font-bold tracking-tight">Recover Password</h1>
            <p className="mt-2 text-slate-400">
              {submitted 
                ? "Check your inbox for the reset link" 
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {!submitted ? (
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
            <div className="mt-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#40e0d0]/10 text-[#40e0d0]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                Didn't receive the email? Check your spam folder or{" "}
                <button onClick={() => setSubmitted(false)} className="text-[#40e0d0] hover:underline">try again</button>
              </p>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-slate-400">
            Remember your password?{" "}
            <Link to="/login" className="font-bold text-[#40e0d0] hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
