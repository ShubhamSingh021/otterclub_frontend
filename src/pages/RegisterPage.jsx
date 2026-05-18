import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { register } from "../api/authApi";
import Navbar from "../components/home/Navbar";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await register(formData);
      if (res.success) {
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.data));
        toast.success("Account created successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Navbar />
      <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4 py-12">
        <div className="w-full max-w-[92vw] sm:max-w-md rounded-3xl border border-white/10 bg-white/[0.02] p-5 sm:p-8 shadow-2xl backdrop-blur-xl box-border overflow-hidden">
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold tracking-tight">Join Otter Society</h1>
            <p className="mt-2 text-slate-400">Create an account to manage your memberships</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Address</label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Phone Number</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                placeholder="+91 98765 43210"
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
                placeholder="Min 6 characters"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 font-bold text-[#061323] transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Register Now"}
            </button>
          </form>

          <GoogleLoginButton />

          <p className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-[#40e0d0] hover:underline">
              Log in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
