import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format, differenceInDays } from "date-fns";
import { getProfile, updateProfile } from "../api/authApi";
import { getMyMembership, getMembershipHistory } from "../api/membershipApi";
import { getMyRegistrations } from "../api/registrationApi";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [updating, setUpdating] = useState(false);

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
      const [profileRes, membershipRes, registrationsRes, historyRes] = await Promise.all([
        getProfile(),
        getMyMembership(),
        getMyRegistrations(),
        getMembershipHistory()
      ]);
      setUser(profileRes.data);
      setMembership(membershipRes.data);
      setRegistrations(registrationsRes.data);
      setHistory(historyRes.data);
      
      // Initialize form
      setProfileForm({
        name: profileRes.data.name,
        phone: profileRes.data.phone || "",
      });
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

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e) => {
    if (e) e.preventDefault();
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", profileForm.name);
      formData.append("phone", profileForm.phone);
      
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      console.log("Updating profile...", { 
        name: profileForm.name, 
        phone: profileForm.phone,
        hasNewAvatar: !!avatarFile 
      });

      const res = await updateProfile(formData);
      
      if (res.success) {
        toast.success("Profile updated successfully!");
        setIsEditingProfile(false);
        
        // The res.data contains the updated user object from the server
        const updatedUserInfo = res.data;
        
        // Update both the local state and localStorage
        setUser(updatedUserInfo);
        localStorage.setItem("user", JSON.stringify(updatedUserInfo));
        setAvatarFile(null);
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setUpdating(false);
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

  const daysRemaining = membership ? differenceInDays(new Date(membership.expiryDate), new Date()) : 0;

  return (
    <div className="min-h-screen bg-[#060b16] text-white font-sans selection:bg-[#40e0d0]/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12 lg:py-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#40e0d0] to-[#2d61ff] overflow-hidden flex items-center justify-center text-3xl font-black text-[#060b16] shadow-[0_0_30px_rgba(64,224,208,0.3)]">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight">{user?.name}</h1>
                {membership && (
                  <span className="px-3 py-1 rounded-full bg-[#40e0d0]/10 border border-[#40e0d0]/20 text-[#40e0d0] text-[10px] font-bold uppercase tracking-widest">
                    {membership.membershipType} Member
                  </span>
                )}
              </div>
              <p className="mt-1 text-slate-400 font-medium">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={fetchData}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
              title="Refresh Data"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              onClick={handleLogout}
              className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition text-sm font-bold"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Membership & History */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Membership Details */}
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 lg:p-10">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <svg className="h-64 w-64" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#40e0d0] mb-2">Current Membership</h2>
                    <p className="text-4xl font-black">
                      {membership ? `${membership.membershipType} Tier` : "Guest Access"}
                    </p>
                  </div>
                  {membership && (
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                        membership.status === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {membership.status}
                      </span>
                    </div>
                  )}
                </div>

                {membership ? (
                  <>
                    <div className="grid sm:grid-cols-3 gap-8 mb-10 py-10 border-y border-white/5">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Active Since</p>
                        <p className="text-xl font-bold">{format(new Date(membership.startDate), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Expiry Date</p>
                        <p className="text-xl font-bold">{format(new Date(membership.expiryDate), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Days Remaining</p>
                        <p className={`text-xl font-bold ${daysRemaining < 7 ? 'text-red-400' : 'text-[#40e0d0]'}`}>
                          {daysRemaining > 0 ? daysRemaining : 0} Days
                        </p>
                      </div>
                    </div>

                    <div className="mb-10">
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Your Exclusive Benefits</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {membership.benefits.map((benefit, i) => (
                          <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition">
                            <div className="h-8 w-8 rounded-lg bg-[#40e0d0]/10 flex items-center justify-center text-[#40e0d0]">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4">
                      <Link to="/member/upgrade" className="flex-1 min-w-[200px] text-center px-8 py-4 rounded-2xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] text-[#061323] font-black hover:scale-[1.02] active:scale-95 transition shadow-[0_10px_30px_rgba(64,224,208,0.2)]">
                        Upgrade Membership
                      </Link>
                      <Link to="/member/upgrade?type=renewal" className="flex-1 min-w-[200px] text-center px-8 py-4 rounded-2xl bg-white/10 text-white border border-white/10 font-black hover:bg-white/20 active:scale-95 transition">
                        Renew Membership
                      </Link>
                    </div>
                  </>
                ) : (
                  <div className="py-10 text-center lg:text-left">
                    <p className="text-slate-400 mb-10 max-w-lg text-lg leading-relaxed">Join the society to unlock up to 20% discounts on all events, priority registrations, and exclusive member-only networking sessions.</p>
                    <Link to="/membership" className="px-10 py-5 rounded-2xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] text-[#061323] font-black hover:scale-[1.05] transition inline-block shadow-[0_10px_40px_rgba(64,224,208,0.3)]">
                      View Membership Plans
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Registered Events */}
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 lg:p-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-bold">Registered Events</h2>
                <span className="px-4 py-1 rounded-full bg-white/5 text-xs text-slate-400 font-bold">{registrations.length} Total</span>
              </div>

              {registrations.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-6">
                  {registrations.map((reg) => (
                    <div key={reg._id} className="group overflow-hidden rounded-3xl border border-white/5 bg-white/[0.03] hover:border-[#40e0d0]/30 transition-all duration-500">
                      <div className="relative aspect-video overflow-hidden">
                        <img 
                          src={reg.eventId?.image} 
                          alt={reg.eventId?.title}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#060b16] via-transparent to-transparent opacity-60" />
                        <div className="absolute bottom-4 left-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            reg.paymentStatus === 'completed' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'
                          }`}>
                            {reg.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="font-bold text-lg mb-2 line-clamp-1">{reg.eventId?.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-4">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(reg.eventId?.date || Date.now()), 'MMMM dd, yyyy')}
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs text-slate-500">Amount Paid</span>
                          <span className="font-black text-[#40e0d0]">₹{reg.discountedPrice}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center rounded-3xl border border-dashed border-white/10">
                  <p className="text-slate-500 font-medium">You haven't registered for any events yet.</p>
                  <Link to="/" className="mt-4 text-[#40e0d0] font-bold hover:underline inline-block">Explore Events</Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Profile & Stats */}
          <div className="lg:col-span-4 space-y-8">
            {/* Quick Profile Info */}
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#40e0d0]" />
                  Profile Info
                </h3>
                <button 
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-xs font-bold text-[#40e0d0] hover:underline"
                >
                  {isEditingProfile ? "Cancel" : "Edit"}
                </button>
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative group">
                      <div className="h-24 w-24 rounded-2xl overflow-hidden border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
                        {avatarPreview || user?.avatar ? (
                          <img 
                            src={avatarPreview || user?.avatar} 
                            alt="Avatar Preview" 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl font-black text-white/20">
                            {user?.name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition cursor-pointer rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Change</span>
                        <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Click photo to upload</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">Full Name</label>
                      <input 
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#40e0d0] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1 block">Phone Number</label>
                      <input 
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#40e0d0] outline-none"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={updating}
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] text-[#061323] font-black hover:scale-[1.02] transition disabled:opacity-50 shadow-[0_10px_30px_rgba(64,224,208,0.2)]"
                    >
                      {updating ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Avatar Display */}
                  <div className="flex justify-center mb-8">
                    <div className="h-24 w-24 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#40e0d0] to-[#2d61ff] flex items-center justify-center shadow-[0_0_30px_rgba(64,224,208,0.2)]">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-[#060b16]">
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Phone Number</p>
                    <p className="font-bold text-slate-200">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Member ID</p>
                    <p className="font-bold text-slate-200">#{user?._id?.slice(-8).toUpperCase()}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#40e0d0]/5 border border-[#40e0d0]/10">
                    <p className="text-[10px] text-[#40e0d0] uppercase tracking-widest font-black mb-1">Current Discount</p>
                    <p className="text-3xl font-black text-[#40e0d0]">
                      {membership?.membershipType === 'PRO' ? '20% OFF' : 
                       membership?.membershipType === 'ELITE' ? '10% OFF' : 
                       '0% OFF'}
                    </p>
                    <p className="text-[10px] text-[#40e0d0]/60 mt-1 uppercase font-bold">Auto-applied at checkout</p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8">
              <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-[#2d61ff]" />
                Payment Logs
              </h3>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {history.length > 0 ? history.map((log, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-bold">{log.planType} Plan</p>
                        <p className="text-[10px] text-slate-500 font-medium">ID: {log.razorpayPaymentId?.slice(-12) || 'N/A'}</p>
                      </div>
                      <span className="text-sm font-black text-[#40e0d0]">₹{log.amount}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{format(new Date(log.date), 'MMM dd, yyyy')}</span>
                      <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-wider border border-green-500/20">
                        SUCCESS
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-slate-500 text-sm text-center py-10">No payment logs found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;

