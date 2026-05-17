import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { format, differenceInDays } from "date-fns";
import { getProfile, updateProfile } from "../api/authApi";
import { getMyMembership, getMembershipHistory } from "../api/membershipApi";
import { getMyRegistrations } from "../api/registrationApi";
import { 
  getReviewEligibility, 
  submitReview, 
  getMyReviews, 
  updateMyReview, 
  deleteMyReview 
} from "../api/reviewApi";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from "../api/notificationApi";
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

  // Review & Testimonials state
  const [eligibility, setEligibility] = useState({ isEligible: false, eligibleEvents: [] });
  const [myReviews, setMyReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  
  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    review: "",
    eventId: ""
  });
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Tabs and Notifications state
  const [activeTab, setActiveTab] = useState("membership");
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

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
      setRegistrations(registrationsRes.data || []);
      setHistory(historyRes.data || []);
      
      // Initialize form
      setProfileForm({
        name: profileRes.data.name,
        phone: profileRes.data.phone || "",
      });

      // Try fetching review/testimonial data
      try {
        const [eligRes, reviewsRes] = await Promise.all([
          getReviewEligibility(),
          getMyReviews()
        ]);
        setEligibility(eligRes.data);
        setMyReviews(reviewsRes.data || []);
      } catch (err) {
        console.error("Failed to load review details", err);
      } finally {
        setReviewLoading(false);
      }

      // Fetch user notifications
      try {
        const notifRes = await getNotifications();
        if (notifRes.data && notifRes.data.success) {
          const fetchedNotifs = (notifRes.data.data || []).map((n) => ({
            ...n,
            isRead: n.read ?? false,
          }));
          setNotifications(fetchedNotifs);
        }
      } catch (err) {
        console.error("Failed to load notifications in dashboard", err);
      } finally {
        setNotifLoading(false);
      }
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
        toast.success(res.message || "Profile updated successfully!");
        
        // The res.data contains the updated user object, res.token contains new token
        const updatedUser = res.data;
        const newToken = res.token;
        
        // Update local state
        setUser(updatedUser);
        
        // Update localStorage (use consistent keys)
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Only update admin keys if the user actually has an admin role
        if (updatedUser.role === "admin" || updatedUser.role === "superadmin") {
          localStorage.setItem("adminUser", JSON.stringify(updatedUser));
        }
        
        if (newToken) {
          localStorage.setItem("token", newToken);
          if (updatedUser.role === "admin" || updatedUser.role === "superadmin") {
            localStorage.setItem("adminToken", newToken);
          }
        }

        // Trigger a custom event to sync other components (like Navbar)
        window.dispatchEvent(new Event("auth-change"));

        // Sync form and reset avatar states
        setProfileForm({
          name: updatedUser.name,
          phone: updatedUser.phone || "",
        });
        setAvatarFile(null);
        setAvatarPreview(null);
        
        // Exit edit mode
        setIsEditingProfile(false);
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      const errorMessage = error.response?.data?.message || "Failed to update profile. Please try again.";
      toast.error(errorMessage);
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

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.review.trim().length < 10) {
      toast.error("Review must be at least 10 characters long");
      return;
    }
    setSubmittingReview(true);
    try {
      if (editingReviewId) {
        // Edit review
        const res = await updateMyReview(editingReviewId, reviewForm);
        if (res.success) {
          toast.success("Review updated successfully!");
          setEditingReviewId(null);
        }
      } else {
        // Submit new review
        const res = await submitReview(reviewForm);
        if (res.success) {
          toast.success("Review submitted for moderation!");
        }
      }
      
      // Reset form
      setReviewForm({ rating: 5, title: "", review: "", eventId: "" });
      
      // Refresh list
      const reviewsRes = await getMyReviews();
      setMyReviews(reviewsRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleEditClick = (rev) => {
    setEditingReviewId(rev._id);
    setReviewForm({
      rating: rev.rating,
      title: rev.title || "",
      review: rev.review || "",
      eventId: rev.eventId || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setReviewForm({ rating: 5, title: "", review: "", eventId: "" });
  };

  const handleMarkOneRead = async (id) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        toast.success("Notification marked as read");
      }
    } catch (err) {
      toast.error("Failed to update notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      }
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDeleteNotif = async (id) => {
    try {
      const res = await deleteNotification(id);
      if (res.data && res.data.success) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        toast.success("Notification deleted");
      }
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const res = await deleteMyReview(id);
      if (res.success) {
        toast.success("Review deleted successfully");
        setMyReviews(prev => prev.filter(r => r._id !== id));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060b16]">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
      </div>
    );
  }

  const daysRemaining = (membership && membership.expiryDate) ? differenceInDays(new Date(membership.expiryDate), new Date()) : 0;

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
            
            {/* Navigation Tabs */}
            <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/10 mb-6 overflow-x-auto max-w-full scrollbar-none">
              {[
                { id: "membership", label: "Membership & Bookings", icon: "💎" },
                { id: "reviews", label: "Reviews & Testimonials", icon: "★" },
                { id: "notifications", label: "Notification Inbox", icon: "🔔", badge: notifications.filter(n => !n.isRead).length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[#40e0d0]/10 border border-[#40e0d0]/30 text-[#40e0d0] shadow-[0_0_20px_rgba(64,224,208,0.1)]"
                      : "border border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-500 text-[9px] text-white font-black">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Membership Details */}
            {activeTab === "membership" && (
              <div className="space-y-10">
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
                        membership.membershipStatus === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {membership.membershipStatus}
                      </span>
                    </div>
                  )}
                </div>

                {membership ? (
                  <>
                    <div className="grid sm:grid-cols-3 gap-8 mb-10 py-10 border-y border-white/5">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Active Since</p>
                        <p className="text-xl font-bold">{membership.startDate ? format(new Date(membership.startDate), 'MMM dd, yyyy') : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Expiry Date</p>
                        <p className="text-xl font-bold">{membership.expiryDate ? format(new Date(membership.expiryDate), 'MMM dd, yyyy') : 'N/A'}</p>
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
                        {membership.benefits?.map((benefit, i) => (
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
                          src={reg.event?.eventImage} 
                          alt={reg.event?.title}
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
                        <h3 className="font-bold text-lg mb-2 line-clamp-1">{reg.event?.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-4">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {format(new Date(reg.event?.eventDate || Date.now()), 'MMMM dd, yyyy')}
                        </div>
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Amount Paid</span>
                            <span className="font-black text-[#40e0d0]">₹{reg.discountedPrice}</span>
                          </div>
                          <div className="flex gap-2">
                            {reg.attendanceStatus === 'attended' ? (
                              <a 
                                href={`${API_URL}/registrations/certificate/${reg._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2 rounded-xl bg-[#40e0d0]/10 border border-[#40e0d0]/20 text-[#40e0d0] text-[10px] font-black uppercase tracking-widest hover:bg-[#40e0d0]/20 transition"
                              >
                                Certificate
                              </a>
                            ) : (
                              <button 
                                onClick={() => navigate(`/ticket/${reg._id}`)}
                                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition"
                              >
                                View Ticket
                              </button>
                            )}
                          </div>
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
            )}

            {/* Testimonials & Reviews Section */}
            {activeTab === "reviews" && (
            <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 lg:p-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-bold">Community Testimonials & Reviews</h2>
                <span className="px-4 py-1 rounded-full bg-white/5 text-xs text-slate-400 font-bold">
                  {myReviews.length} Submitted
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Sub-column: Submission Form */}
                <div>
                  <h3 className="text-lg font-bold mb-6 text-[#40e0d0]">
                    {editingReviewId ? "Edit Your Review" : "Write a Testimonial"}
                  </h3>
                  
                  {!eligibility.isEligible ? (
                    <div className="p-6 rounded-3xl bg-yellow-500/5 border border-yellow-500/20 text-yellow-500/90 text-sm">
                      <p className="font-bold mb-2">Review Access Restricted</p>
                      <p className="leading-relaxed">
                        To prevent spam and keep our community reviews authentic, only members with active subscriptions or attendees of past events can submit reviews. 
                      </p>
                      <div className="mt-4 flex flex-col gap-2">
                        <Link to="/membership" className="text-xs font-bold text-[#40e0d0] hover:underline">
                          → Get a Membership Plan
                        </Link>
                        <Link to="/" className="text-xs font-bold text-[#40e0d0] hover:underline">
                          → Explore Upcoming Events
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleReviewSubmit} className="space-y-5">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-2 block">
                          How would you rate your experience?
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                              className="text-3xl transition hover:scale-110 active:scale-90"
                            >
                              <span className={reviewForm.rating >= num ? "text-yellow-400" : "text-slate-600"}>★</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1.5 block">
                          Reference Event (Optional)
                        </label>
                        <select
                          value={reviewForm.eventId}
                          onChange={(e) => setReviewForm({ ...reviewForm, eventId: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#40e0d0] outline-none text-slate-200"
                        >
                          <option value="" className="bg-[#060b16] text-white">General Otter Society Review</option>
                          {eligibility.eligibleEvents?.map((ev) => (
                            <option key={ev._id} value={ev._id} className="bg-[#060b16] text-white">
                              {ev.title} ({ev.attendanceStatus === "attended" ? "Attended" : "Registered"})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1.5 block">
                          Review Title (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Life-changing sports club!"
                          value={reviewForm.title}
                          onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#40e0d0] outline-none placeholder:text-slate-600"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1.5 block">
                          Your Review / Quote (Min 10 characters)
                        </label>
                        <textarea
                          rows={4}
                          placeholder="Tell us what you love about the club, the community, or your coach..."
                          value={reviewForm.review}
                          onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#40e0d0] outline-none placeholder:text-slate-600 resize-none"
                          required
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block text-right font-medium">
                          {reviewForm.review.trim().length} chars
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="flex-grow py-3.5 rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] text-[#061323] font-black hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 text-sm shadow-[0_10px_30px_rgba(64,224,208,0.2)]"
                        >
                          {submittingReview ? "Submitting..." : editingReviewId ? "Save Changes" : "Submit Review"}
                        </button>
                        {editingReviewId && (
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 active:scale-95 transition text-sm"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>

                {/* Right Sub-column: List of Past Submissions */}
                <div className="border-t border-white/5 pt-8 md:border-t-0 md:border-l md:border-white/5 md:pt-0 md:pl-8">
                  <h3 className="text-lg font-bold mb-6">Your Past Reviews</h3>
                  {reviewLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
                    </div>
                  ) : myReviews.length > 0 ? (
                    <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                      {myReviews.map((rev) => (
                        <div key={rev._id} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition group">
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <div>
                              <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{rev.title || "Untitled Review"}</h4>
                              {rev.eventName && (
                                <span className="text-[9px] text-[#40e0d0] uppercase tracking-wider font-bold block mt-0.5">
                                  Event: {rev.eventName}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <div className="flex text-yellow-400 text-xs">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <span key={i}>★</span>
                                ))}
                              </div>
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                                rev.status === "approved" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                rev.status === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              }`}>
                                {rev.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-400 mt-3 leading-relaxed break-words">{rev.review}</p>
                          
                          {rev.status === "pending" && (
                            <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEditClick(rev)}
                                className="text-[10px] font-black uppercase text-[#40e0d0] hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteReview(rev._id)}
                                className="text-[10px] font-black uppercase text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-14 text-center rounded-2xl border border-dashed border-white/5 bg-white/[0.01]">
                      <p className="text-slate-500 text-sm font-medium">You haven't written any testimonials yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Notification Inbox Tab Panel */}
            {activeTab === "notifications" && (
              <div className="rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-8 lg:p-10">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                  <div>
                    <h2 className="text-2xl font-bold">Your Notifications</h2>
                    <p className="text-slate-400 text-sm mt-1">Stay updated with broadcast announcements and membership alerts.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {notifications.some(n => !n.isRead) && (
                      <button
                        onClick={handleMarkAllRead}
                        className="px-4 py-2 rounded-xl bg-[#40e0d0]/10 border border-[#40e0d0]/20 text-[#40e0d0] text-xs font-black uppercase tracking-wider hover:bg-[#40e0d0]/20 transition"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                </div>

                {notifLoading ? (
                  <div className="flex justify-center py-20">
                    <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => !notif.isRead && handleMarkOneRead(notif._id)}
                        className={`group relative p-6 rounded-3xl border transition-all duration-300 cursor-pointer text-left ${
                          notif.isRead
                            ? "bg-white/[0.01] border-white/5 hover:bg-white/[0.02] opacity-75"
                            : "bg-white/[0.04] border-[#40e0d0]/20 hover:border-[#40e0d0]/40 shadow-[0_4px_20px_rgba(64,224,208,0.05)]"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 pr-10">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base text-white">{notif.title}</h3>
                              {!notif.isRead && (
                                <span className="px-2 py-0.5 rounded-md bg-[#40e0d0]/10 border border-[#40e0d0]/30 text-[#40e0d0] text-[9px] font-black uppercase tracking-wider">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 text-sm mt-2 leading-relaxed">{notif.message}</p>
                            <span className="text-xs text-slate-500 block mt-3 font-medium">
                              {format(new Date(notif.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotif(notif._id);
                          }}
                          className="absolute top-6 right-6 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition opacity-0 group-hover:opacity-100"
                          title="Delete notification"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-24 text-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01]">
                    <span className="text-4xl">🔔</span>
                    <h3 className="font-bold text-lg text-white mt-4">Inbox is clean</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">No notifications or announcements at the moment. We'll alert you when something exciting happens!</p>
                  </div>
                )}
              </div>
            )}
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
                        <p className="text-sm font-bold">{log.membershipType} Plan</p>
                        <p className="text-[10px] text-slate-500 font-medium">ID: {log.razorpayPaymentId?.slice(-12) || 'N/A'}</p>
                      </div>
                      <span className="text-sm font-black text-[#40e0d0]">₹{log.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">{log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy') : 'N/A'}</span>
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

