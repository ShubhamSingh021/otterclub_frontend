import { useState, useEffect, useCallback, useMemo } from "react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const fetchNotificationsOnly = useCallback(async () => {
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
    }
  }, []);

  const fetchData = useCallback(async () => {
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
        await fetchNotificationsOnly();
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
  }, [navigate, fetchNotificationsOnly]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token, navigate, fetchData]);

  useEffect(() => {
    const handleNotificationsUpdate = () => {
      fetchNotificationsOnly();
    };

    window.addEventListener("notifications-updated", handleNotificationsUpdate);
    return () => {
      window.removeEventListener("notifications-updated", handleNotificationsUpdate);
    };
  }, [fetchNotificationsOnly]);

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

      const res = await updateProfile(formData);
      
      if (res.success) {
        toast.success(res.message || "Profile updated successfully!");
        
        const updatedUser = res.data;
        const newToken = res.token;
        
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        if (updatedUser.role === "admin" || updatedUser.role === "superadmin") {
          localStorage.setItem("adminUser", JSON.stringify(updatedUser));
        }
        
        if (newToken) {
          localStorage.setItem("token", newToken);
          if (updatedUser.role === "admin" || updatedUser.role === "superadmin") {
            localStorage.setItem("adminToken", newToken);
          }
        }

        window.dispatchEvent(new Event("auth-change"));

        setProfileForm({
          name: updatedUser.name,
          phone: updatedUser.phone || "",
        });
        setAvatarFile(null);
        setAvatarPreview(null);
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      toast.success("Dashboard data refreshed successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setIsRefreshing(false);
    }
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
        const res = await updateMyReview(editingReviewId, reviewForm);
        if (res.success) {
          toast.success("Review updated successfully!");
          setEditingReviewId(null);
        }
      } else {
        const res = await submitReview(reviewForm);
        if (res.success) {
          toast.success("Review submitted for moderation!");
        }
      }
      
      setReviewForm({ rating: 5, title: "", review: "", eventId: "" });
      
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
        window.dispatchEvent(new Event("notifications-updated"));
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
        window.dispatchEvent(new Event("notifications-updated"));
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
        window.dispatchEvent(new Event("notifications-updated"));
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

  const daysRemaining = useMemo(() => {
    return (membership && membership.expiryDate) ? differenceInDays(new Date(membership.expiryDate), new Date()) : 0;
  }, [membership]);

  const progressPercent = useMemo(() => {
    return Math.min(100, Math.max(0, (daysRemaining / 365) * 100));
  }, [daysRemaining]);

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#060b16] gap-4">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#8ce5db]/20 border-t-[#8ce5db]" />
          <img src="/logo.jpg" alt="Logo" className="absolute h-9 w-9 rounded-full object-cover animate-pulse" />
        </div>
        <p className="text-sm font-semibold tracking-widest uppercase text-slate-400 animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b16] text-white font-sans selection:bg-[#8ce5db]/30">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 max-w-7xl">
        {/* Full-Width Premium Profile Header Card - Compact & Elegant */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-4 sm:p-5 backdrop-blur-xl mb-8 shadow-soft">
          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#2d61ff]/10 blur-[80px] pointer-events-none" />
          <div className="absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-[#8ce5db]/10 blur-[80px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              {/* Glow Avatar */}
              <div className="relative h-12 w-12 rounded-full p-[2px] bg-gradient-to-tr from-[#2d61ff] via-[#8ce5db]/50 to-[#8ce5db] shadow-glow-accent shrink-0 mx-auto sm:mx-0">
                <div className="h-full w-full rounded-full bg-[#060b16] overflow-hidden flex items-center justify-center text-lg font-black text-white">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase()
                  )}
                </div>
              </div>
              
              {/* Vertically Centered Name and Email details */}
              <div className="space-y-1 flex flex-col items-center sm:items-start w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <h1 className="text-xl font-display font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent text-center sm:text-left">
                    {user?.name}
                  </h1>
                  {membership && (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#8ce5db]/10 border border-[#8ce5db]/25 text-[#8ce5db] text-[8px] font-black uppercase tracking-widest mx-auto sm:mx-0">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8ce5db] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#8ce5db]"></span>
                      </span>
                      {membership.membershipType} MEMBER
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium font-body select-all text-center sm:text-left">{user?.email}</p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex gap-2.5 w-full sm:w-auto shrink-0 justify-center sm:justify-end">
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-[10px] font-black uppercase tracking-wider group"
                title="Refresh Data"
              >
                <svg className={`h-3.5 w-3.5 shrink-0 transition-transform duration-700 ${isRefreshing ? 'animate-spin text-[#8ce5db]' : 'group-hover:rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </button>
              
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 active:scale-95 transition-all duration-300 text-[10px] font-black uppercase tracking-wider"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Premium Dashboard Tabs Navigation - Segmented Grid & Scrollable Mobile */}
        <div className="w-full flex md:grid md:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-white/[0.02] border border-white/5 mb-8 overflow-x-auto md:overflow-visible max-w-full scrollbar-none flex-nowrap shadow-soft">
          {[
            { id: "membership", label: "Membership & Bookings", icon: "💎" },
            { id: "reviews", label: "Reviews", icon: "★" },
            { id: "notifications", label: "Notifications", icon: "🔔", badge: notifications.filter(n => !n.isRead).length },
            { id: "profile", label: "Profile Settings", icon: "👤" },
            { id: "payments", label: "Payment History", icon: "💳" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-display font-black text-xs transition-all duration-300 whitespace-nowrap shrink-0 md:shrink w-auto md:w-full select-none ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-[#2d61ff]/15 to-[#8ce5db]/10 border border-[#8ce5db]/30 text-[#8ce5db] shadow-glow-accent text-shadow-glow"
                  : "border border-transparent text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="ml-1.5 px-2 py-0.5 rounded-full bg-red-500 text-[9px] text-white font-black animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard Content Split Layout */}
        <div className="grid gap-8 lg:grid-cols-12 items-start">
          
          {/* Left Main Content Column - 70% Width */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Membership Tab */}
            {activeTab === "membership" && (
              <div className="space-y-8">
                
                {/* Premium Membership details card */}
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none select-none">
                    <svg className="h-48 w-48 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>

                  <div className="relative z-10">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                      <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8ce5db] mb-1">Current Subscription</h2>
                        <p className="text-3xl font-display font-black tracking-tight">
                          {membership ? `${membership.membershipType} Tier` : "Guest Access"}
                        </p>
                      </div>
                      {membership && (
                        <div className="text-left sm:text-right">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Status</p>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                            membership.membershipStatus === 'active' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${membership.membershipStatus === 'active' ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                            {membership.membershipStatus}
                          </span>
                        </div>
                      )}
                    </div>

                    {membership ? (
                      <>
                        {/* Days Remaining Visual Progress Bar */}
                        <div className="mb-8 p-5 rounded-2xl bg-white/[0.01] border border-white/5 shadow-soft">
                          <div className="flex justify-between items-center mb-2.5">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Membership Validity</span>
                            <span className="text-xs font-black text-[#8ce5db]">{daysRemaining > 0 ? daysRemaining : 0} Days Left</span>
                          </div>
                          <div className="relative h-3 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] shadow-glow-accent transition-all duration-1000 ease-out"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2 text-[9px] text-slate-500 font-bold uppercase tracking-wide">
                            <span>Expired</span>
                            <span>365 Days</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 py-6 border-y border-white/5">
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Active Since</p>
                            <p className="text-base sm:text-lg font-bold font-display">{membership.startDate ? format(new Date(membership.startDate), 'MMM dd, yyyy') : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Expiry Date</p>
                            <p className="text-base sm:text-lg font-bold font-display">{membership.expiryDate ? format(new Date(membership.expiryDate), 'MMM dd, yyyy') : 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Plan Cost</p>
                            <p className="text-base sm:text-lg font-bold text-[#8ce5db] font-display">₹{membership.price}</p>
                          </div>
                        </div>

                        <div className="mb-8">
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Your Exclusive Benefits</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {membership.benefits?.map((benefit, i) => (
                              <div key={i} className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.01] border border-white/5 group hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                                <div className="h-7 w-7 rounded-xl bg-[#8ce5db]/10 flex items-center justify-center text-[#8ce5db] shrink-0 transition-all duration-300 group-hover:bg-[#8ce5db]/20 group-hover:scale-110">
                                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs sm:text-sm font-medium text-slate-300 group-hover:text-white transition-colors duration-300">{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link to="/member/upgrade" className="flex-1 text-center px-6 py-4 rounded-xl bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] text-[#061323] font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-glow-accent">
                            Upgrade Membership
                          </Link>
                          <Link to="/member/upgrade?type=renewal" className="flex-1 text-center px-6 py-4 rounded-xl bg-white/5 text-white border border-white/10 font-black text-xs uppercase tracking-wider hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all duration-300">
                            Renew Membership
                          </Link>
                        </div>
                      </>
                    ) : (
                      <div className="py-6 text-center sm:text-left">
                        <p className="text-slate-400 mb-8 max-w-lg text-sm sm:text-base leading-relaxed">Join the society to unlock up to 20% discounts on all events, priority registrations, and exclusive member-only networking sessions.</p>
                        <Link to="/membership" className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] text-[#061323] font-black text-xs uppercase tracking-wider hover:scale-[1.03] transition-all duration-300 inline-block shadow-glow-accent">
                          View Membership Plans
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Registered Events */}
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl sm:text-2xl font-display font-bold">Registered Events</h2>
                    <span className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold">{registrations.length} Total</span>
                  </div>

                  {registrations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {registrations.map((reg) => (
                        <div key={reg._id} className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-[#8ce5db]/30 transition-all duration-300 shadow-soft">
                          <div className="relative aspect-video overflow-hidden">
                            <img 
                              src={reg.event?.eventImage} 
                              alt={reg.event?.title}
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#060b16] via-transparent to-transparent opacity-60" />
                            <div className="absolute top-3 left-3">
                              <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider border shadow-sm ${
                                reg.paymentStatus === 'completed' 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }`}>
                                {reg.paymentStatus}
                              </span>
                            </div>
                          </div>
                          <div className="p-5">
                            <h3 className="font-display font-bold text-base mb-1.5 line-clamp-1 group-hover:text-[#8ce5db] transition-colors">{reg.event?.title}</h3>
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-4">
                              <svg className="h-3.5 w-3.5 text-[#8ce5db]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {format(new Date(reg.event?.eventDate || Date.now()), 'MMMM dd, yyyy')}
                            </div>
                            <div className="pt-3.5 border-t border-white/5 flex items-center justify-between gap-4">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase tracking-widest font-black">Amount Paid</span>
                                <span className="font-display font-black text-[#8ce5db] text-sm">₹{reg.discountedPrice}</span>
                              </div>
                              <div className="flex gap-2">
                                {reg.attendanceStatus === 'attended' ? (
                                  <a 
                                    href={`${API_URL}/registrations/certificate/${reg._id}?token=${localStorage.getItem("token")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-3.5 py-1.5 rounded-xl bg-[#8ce5db]/10 border border-[#8ce5db]/20 text-[#8ce5db] text-[9px] font-black uppercase tracking-wider hover:bg-[#8ce5db]/20 hover:border-[#8ce5db]/30 transition-all duration-300"
                                  >
                                    Certificate
                                  </a>
                                ) : (
                                  <button 
                                    onClick={() => navigate(`/ticket/${reg._id}`)}
                                    className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-wider hover:bg-white/10 hover:border-white/20 hover:text-[#8ce5db] transition-all duration-300"
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
                    <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.005]">
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">You haven't registered for any events yet.</p>
                      <Link to="/" className="mt-3 text-[#8ce5db] text-xs font-bold hover:underline inline-block">Explore Events</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Testimonials & Reviews Tab */}
            {activeTab === "reviews" && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl sm:text-2xl font-display font-bold">Reviews & Testimonials</h2>
                  <span className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold">
                    {myReviews.length} Submitted
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Form */}
                  <div className="md:col-span-5 space-y-4">
                    <h3 className="text-base font-bold text-[#8ce5db]">
                      {editingReviewId ? "Edit Your Review" : "Write a Testimonial"}
                    </h3>
                    
                    {!eligibility.isEligible ? (
                      <div className="p-5 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 text-yellow-500/90 text-xs sm:text-sm shadow-soft">
                        <p className="font-bold mb-1">Review Access Restricted</p>
                        <p className="leading-relaxed text-xs">
                          To prevent spam and keep our community reviews authentic, only members with active subscriptions or attendees of past events can submit reviews. 
                        </p>
                        <div className="mt-3 flex flex-col gap-1.5">
                          <Link to="/membership" className="text-[11px] font-bold text-[#8ce5db] hover:underline">
                            → Get a Membership Plan
                          </Link>
                          <Link to="/" className="text-[11px] font-bold text-[#8ce5db] hover:underline">
                            → Explore Upcoming Events
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-2.5 block">
                            How would you rate your experience?
                          </label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                                className="text-2xl transition-all duration-300 hover:scale-125 hover:text-yellow-300 active:scale-90"
                              >
                                <span className={reviewForm.rating >= num ? "text-yellow-400 text-shadow-glow" : "text-slate-600"}>★</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5 block">
                            Reference Event (Optional)
                          </label>
                          <select
                            value={reviewForm.eventId}
                            onChange={(e) => setReviewForm({ ...reviewForm, eventId: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none transition-all duration-300 focus:border-[#8ce5db]"
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
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5 block">
                            Review Title (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Life-changing sports club!"
                            value={reviewForm.title}
                            onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none transition-all duration-300 focus:border-[#8ce5db]"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5 block">
                            Your Review / Quote (Min 10 characters)
                          </label>
                          <textarea
                            rows={4}
                            placeholder="Tell us what you love about the club, the community, or your coach..."
                            value={reviewForm.review}
                            onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 text-xs text-slate-200 outline-none transition-all duration-300 focus:border-[#8ce5db] resize-none"
                            required
                          />
                          <span className="text-[9px] text-slate-500 mt-1 block text-right font-medium">
                            {reviewForm.review.trim().length} chars
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="flex-grow py-3.5 rounded-xl bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] text-[#061323] font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 shadow-glow-accent"
                          >
                            {submittingReview ? "Submitting..." : editingReviewId ? "Save Changes" : "Submit Review"}
                          </button>
                          {editingReviewId && (
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 active:scale-95 transition text-xs"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Right Column: Past Submissions */}
                  <div className="md:col-span-7 border-t border-white/5 pt-6 md:border-t-0 md:border-l md:border-white/5 md:pt-0 md:pl-6">
                    <h3 className="text-base font-bold mb-4">Your Past Reviews</h3>
                    {reviewLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-[#8ce5db]"></div>
                      </div>
                    ) : myReviews.length > 0 ? (
                      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                        {myReviews.map((rev) => (
                          <div key={rev._id} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition group shadow-soft">
                            <div className="flex justify-between items-start mb-2 gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{rev.title || "Untitled Review"}</h4>
                                {rev.eventName && (
                                  <span className="text-[8px] text-[#8ce5db] uppercase tracking-wider font-bold block mt-0.5">
                                    Event: {rev.eventName}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex text-yellow-400 text-[10px]">
                                  {Array.from({ length: rev.rating }).map((_, i) => (
                                    <span key={i}>★</span>
                                  ))}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${
                                  rev.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                  rev.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                                  "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                }`}>
                                  {rev.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2.5 leading-relaxed break-words">{rev.review}</p>
                            
                            {rev.status === "pending" && (
                              <div className="flex justify-end gap-3 mt-3 pt-2.5 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button
                                  onClick={() => handleEditClick(rev)}
                                  className="text-[9px] font-black uppercase text-[#8ce5db] hover:underline"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(rev._id)}
                                  className="text-[9px] font-black uppercase text-red-400 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-10 text-center rounded-xl border border-dashed border-white/5 bg-white/[0.005]">
                        <p className="text-slate-500 text-xs font-medium">You haven't written any testimonials yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Inbox Tab Panel */}
            {activeTab === "notifications" && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold">Your Notifications</h2>
                    <p className="text-slate-400 text-xs mt-1">Stay updated with broadcast announcements and membership alerts.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {notifications.some(n => !n.isRead) && (
                      <button
                        onClick={handleMarkAllRead}
                        className="px-3.5 py-1.5 rounded-xl bg-[#8ce5db]/10 border border-[#8ce5db]/20 text-[#8ce5db] text-[9px] font-black uppercase tracking-wider hover:bg-[#8ce5db]/20 hover:border-[#8ce5db]/30 transition-all duration-300 shadow-soft"
                      >
                        Mark All Read
                      </button>
                    )}
                  </div>
                </div>

                {notifLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-[#8ce5db]"></div>
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => !notif.isRead && handleMarkOneRead(notif._id)}
                        className={`group relative p-5 rounded-2xl border transition-all duration-300 cursor-pointer text-left shadow-soft ${
                          notif.isRead
                            ? "bg-white/[0.005] border-white/5 hover:bg-white/[0.01] opacity-75"
                            : "bg-[#8ce5db]/[0.02] border-[#8ce5db]/20 border-l-[4px] border-l-[#8ce5db] hover:border-[#8ce5db]/40 shadow-glow-accent"
                        }`}
                      >
                        <div className="flex justify-between items-start gap-4 pr-8">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-display font-bold text-sm sm:text-base text-white">{notif.title}</h3>
                              {!notif.isRead && (
                                <span className="px-1.5 py-0.5 rounded bg-[#8ce5db]/10 border border-[#8ce5db]/30 text-[#8ce5db] text-[8px] font-black uppercase tracking-wider">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-slate-500 block mt-2.5 font-medium">
                              {format(new Date(notif.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotif(notif._id);
                          }}
                          className="absolute top-5 right-5 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-300 opacity-0 group-hover:opacity-100 shadow-soft"
                          title="Delete notification"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.005]">
                    <span className="text-3xl">🔔</span>
                    <h3 className="font-bold text-base text-white mt-3">Inbox is clean</h3>
                    <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">No notifications or announcements at the moment. We'll alert you when something exciting happens!</p>
                  </div>
                )}
              </div>
            )}

            {/* Profile Settings Tab Panel */}
            {activeTab === "profile" && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl sm:text-2xl font-display font-bold">Profile Info</h2>
                  <button 
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all duration-300 text-xs font-black uppercase tracking-wider"
                  >
                    {isEditingProfile ? "Cancel" : "Edit Profile"}
                  </button>
                </div>

                {isEditingProfile ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    {/* Avatar Upload Container */}
                    <div className="flex flex-col items-center gap-3 mb-6">
                      <div className="relative group">
                        <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 p-1">
                          {avatarPreview || user?.avatar ? (
                            <img 
                              src={avatarPreview || user?.avatar} 
                              alt="Avatar Preview" 
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-3xl font-black text-white/25">
                              {user?.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer rounded-full">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white">Change</span>
                          <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                        </label>
                      </div>
                      <p className="text-[9px] text-[#8ce5db] font-black uppercase tracking-widest">Click photo to replace</p>
                    </div>

                    <div className="space-y-4 max-w-lg mx-auto">
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5 block">Full Name</label>
                        <input 
                          type="text"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none transition-all duration-300 focus:border-[#8ce5db] focus:ring-1 focus:ring-[#8ce5db] focus:bg-white/[0.08]"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1.5 block">Phone Number</label>
                        <input 
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-200 outline-none transition-all duration-300 focus:border-[#8ce5db] focus:ring-1 focus:ring-[#8ce5db] focus:bg-white/[0.08]"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={updating}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] text-[#061323] font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition disabled:opacity-50 shadow-glow-accent"
                      >
                        {updating ? "Saving Changes..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6 max-w-lg mx-auto">
                    {/* Avatar Display */}
                    <div className="flex justify-center mb-8">
                      <div className="h-24 w-24 rounded-full p-[2px] bg-gradient-to-tr from-[#2d61ff] via-[#8ce5db]/50 to-[#8ce5db] flex items-center justify-center shadow-glow-accent">
                        <div className="h-full w-full rounded-full bg-[#060b16] overflow-hidden flex items-center justify-center text-3xl font-black text-white">
                          {user?.avatar ? (
                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-3xl font-black">
                              {user?.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 shadow-soft">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Phone Number</p>
                        <p className="text-sm font-bold text-slate-200">{user?.phone || 'Not provided'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 shadow-soft">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Member ID</p>
                        <p className="text-sm font-bold text-slate-200 select-all">#{user?._id?.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-[#8ce5db]/10 to-[#2d61ff]/5 border border-[#8ce5db]/25 shadow-glow-accent">
                      <p className="text-[8px] text-[#8ce5db] uppercase tracking-widest font-black mb-0.5">Current Active Discount</p>
                      <p className="text-2xl font-black font-display text-[#8ce5db]">
                        {membership?.membershipType === 'PRO' ? '20% OFF' : 
                         membership?.membershipType === 'ELITE' ? '10% OFF' : 
                         '0% OFF'}
                      </p>
                      <p className="text-[9px] text-[#8ce5db]/70 mt-1 uppercase font-bold tracking-wider">Applicable to all society events</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Logs Tab Panel - Elegant Row List */}
            {activeTab === "payments" && (
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl sm:text-2xl font-display font-bold flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-[#8ce5db]" />
                    Payment History
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold">
                    {history.length} Transactions
                  </span>
                </div>
                
                <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                  {history.length > 0 ? (
                    history.map((log, i) => (
                      <div 
                        key={i} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 shadow-soft"
                      >
                        {/* Left Info: Plan Name & Razorpay ID */}
                        <div className="flex items-center gap-3.5">
                          <div className="h-10 w-10 rounded-xl bg-[#8ce5db]/10 flex items-center justify-center text-[#8ce5db] shrink-0">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-black font-display uppercase tracking-wider text-slate-200">
                              {log.membershipType} Plan
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium select-all mt-0.5">
                              ID: {log.razorpayPaymentId || "N/A"}
                            </p>
                          </div>
                        </div>

                        {/* Right Info: Amount & Metadata */}
                        <div className="flex sm:flex-row items-start sm:items-center justify-between sm:justify-end gap-4 border-t border-white/5 pt-3.5 sm:border-t-0 sm:pt-0">
                          <div className="flex flex-col sm:items-end text-left sm:text-right">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Date</span>
                            <span className="text-xs text-slate-300 font-bold mt-0.5">
                              {log.createdAt ? format(new Date(log.createdAt), "MMM dd, yyyy") : "N/A"}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 shrink-0">
                            <span className="text-lg font-black font-display text-[#8ce5db]">
                              ₹{log.price}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[8px] font-black uppercase tracking-widest border border-green-500/20">
                              SUCCESS
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.005]">
                      <span className="text-3xl">💳</span>
                      <h3 className="font-bold text-base text-white mt-3">No payments recorded</h3>
                      <p className="text-slate-500 text-xs mt-1 max-w-xs mx-auto">All your membership transaction logs will be listed here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Widgets - Visible on Desktop Only */}
          <div className="hidden lg:block lg:col-span-4 space-y-8">
            
            {/* Quick Profile Details */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl shadow-soft">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8ce5db] animate-pulse" />
                Profile Details
              </h3>
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-soft">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Phone Number</p>
                  <p className="text-xs font-bold text-slate-200">{user?.phone || 'Not provided'}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-soft">
                  <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Member ID</p>
                  <p className="text-xs font-bold text-slate-200 select-all">#{user?._id?.slice(-8).toUpperCase()}</p>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#8ce5db]/10 to-[#2d61ff]/5 border border-[#8ce5db]/20 shadow-glow-accent">
                  <p className="text-[8px] text-[#8ce5db] uppercase tracking-widest font-black mb-0.5">Active Discount</p>
                  <p className="text-xl font-black font-display text-[#8ce5db]">
                    {membership?.membershipType === 'PRO' ? '20% OFF' : 
                     membership?.membershipType === 'ELITE' ? '10% OFF' : 
                     '0% OFF'}
                  </p>
                  <p className="text-[8px] text-[#8ce5db]/70 mt-1.5 uppercase font-bold tracking-wider">Auto-applied at checkout</p>
                </div>
              </div>
            </div>

            {/* Quick Payments Summary */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-xl shadow-soft">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2d61ff]" />
                Recent Payments
              </h3>
              <div className="space-y-3">
                {history.slice(0, 3).map((log, i) => (
                  <div key={i} className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all duration-300 shadow-soft">
                    <div>
                      <p className="text-xs font-bold font-display uppercase tracking-wider">{log.membershipType}</p>
                      <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy') : 'N/A'}</p>
                    </div>
                    <span className="text-xs font-black text-[#8ce5db]">₹{log.price}</span>
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-4">No payment logs found.</p>
                )}
                {history.length > 3 && (
                  <button 
                    onClick={() => setActiveTab("payments")}
                    className="w-full text-center py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-[10px] font-black uppercase tracking-wider transition-all duration-300 shadow-soft"
                  >
                    View All Payments ({history.length})
                  </button>
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
