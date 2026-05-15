import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getProfile } from "../api/authApi";
import { getMyMembership } from "../api/membershipApi";
import Navbar from "../components/home/Navbar";

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token, navigate]);

  const fetchData = async () => {
    try {
      const [profileRes, membershipRes] = await Promise.all([
        getProfile(token),
        getMyMembership(token)
      ]);
      setUser(profileRes.data);
      setMembership(membershipRes.data);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060b16]">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Welcome, {user?.name}</h1>
            <p className="mt-2 text-slate-400">Manage your membership and event registrations.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm font-medium"
          >
            Log Out
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Membership Card */}
          <div className="lg:col-span-2 space-y-8">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <svg className="h-32 w-32" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                    membership?.membershipType === 'PRO' ? 'bg-[#2d61ff] text-white' : 
                    membership?.membershipType === 'ELITE' ? 'bg-[#40e0d0] text-[#061323]' : 
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {membership?.membershipType || 'NO ACTIVE PLAN'}
                  </div>
                  {membership && <span className="text-sm text-slate-500">Active since {format(new Date(membership.startDate), 'MMM dd, yyyy')}</span>}
                </div>

                <h2 className="text-3xl font-bold mb-4">
                  {membership ? `${membership.membershipType} Membership` : "No Membership Found"}
                </h2>

                {membership ? (
                  <>
                    <div className="grid grid-cols-2 gap-6 mb-8 py-6 border-y border-white/5">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Expires On</p>
                        <p className="text-xl font-medium mt-1">{format(new Date(membership.expiryDate), 'MMMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Billing Cycle</p>
                        <p className="text-xl font-medium mt-1">Monthly</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Your Benefits</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {membership.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                            <svg className="h-5 w-5 text-[#40e0d0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                      <Link to="/membership" className="px-8 py-3 rounded-xl bg-[#40e0d0] text-[#061323] font-bold hover:scale-[1.02] transition">
                        Upgrade Plan
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="py-6">
                    <p className="text-slate-400 mb-8 max-w-md">Join Otter Society to unlock exclusive event discounts, priority access, and a premium member badge.</p>
                    <Link to="/membership" className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] text-[#061323] font-bold hover:scale-[1.02] transition inline-block">
                      View Membership Plans
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <h3 className="text-lg font-bold mb-6">Profile Info</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Email</p>
                  <p className="text-slate-200">{user?.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Phone</p>
                  <p className="text-slate-200">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#40e0d0]/5 p-8 border-dashed">
              <h3 className="text-lg font-bold text-[#40e0d0] mb-2">Member Discount</h3>
              <p className="text-sm text-slate-400">Your membership discount is automatically applied during event checkout when you are logged in.</p>
              <div className="mt-4 text-2xl font-bold">
                {membership?.membershipType === 'PRO' ? '20% OFF' : 
                 membership?.membershipType === 'ELITE' ? '10% OFF' : 
                 '0% OFF'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
