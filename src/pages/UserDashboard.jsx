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

const getAvatarUrl = (url, timestamp) => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${timestamp}`;
};

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());
  
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

  // Tabs, Dropdown & Sidebar States
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

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
      setAvatarTimestamp(Date.now());
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
        setAvatarTimestamp(Date.now());
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

  const totalDays = useMemo(() => {
    if (!membership || !membership.expiryDate || !membership.startDate) return 365;
    const diff = differenceInDays(new Date(membership.expiryDate), new Date(membership.startDate));
    return diff > 0 ? diff : 365;
  }, [membership]);

  const daysRemaining = useMemo(() => {
    return (membership && membership.expiryDate) ? differenceInDays(new Date(membership.expiryDate), new Date()) : 0;
  }, [membership]);

  const progressPercent = useMemo(() => {
    return Math.min(100, Math.max(0, (daysRemaining / totalDays) * 100));
  }, [daysRemaining, totalDays]);

  const totalPaid = useMemo(() => {
    return history.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [history]);

  const activeBreadcrumb = useMemo(() => {
    switch (activeTab) {
      case "dashboard": return "Dashboard / Overview";
      case "membership": return "Dashboard / Membership & Bookings";
      case "events": return "Dashboard / Registered Events";
      case "reviews": return "Dashboard / Reviews & Testimonials";
      case "notifications": return "Dashboard / Notifications Inbox";
      case "payments": return "Dashboard / Payment History";
      case "profile": return "Dashboard / Profile Settings";
      default: return "Dashboard";
    }
  }, [activeTab]);

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

  // Sidebar Menu Items Definition
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      id: "membership",
      label: "Membership",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.475 3.475 0 012.441 2.44 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.475 3.475 0 01-2.44 2.441 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.475 3.475 0 01-2.441-2.44 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.475 3.475 0 012.44-2.441z" />
        </svg>
      )
    },
    {
      id: "events",
      label: "Events",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: registrations.length
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.367 1.242.583 1.83l-3.978 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.978-2.89a1 1 0 00-1.176 0l-3.978 2.89c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      badge: notifications.filter(n => !n.isRead).length
    },
    {
      id: "payments",
      label: "Payments",
      icon: (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-[#060b16] text-white font-sans selection:bg-[#8ce5db]/30 flex overflow-hidden">
      
      {/* ==================================================
          1. FIXED LEFT SIDEBAR (DESKTOP)
          ================================================== */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#0a0f1d]/95 border-r border-white/5 h-screen sticky top-0 shrink-0 z-30 justify-between select-none">
        <div>
          {/* Sidebar Brand Header */}
          <div className="h-16 px-6 border-b border-white/5 flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-[#8ce5db]/20 bg-gradient-to-tr from-[#2d61ff]/20 to-[#8ce5db]/20 flex items-center justify-center">
                <img src="/logo.jpg" alt="Otter Logo" className="h-6 w-6 rounded-full object-cover transition-transform duration-500 group-hover:scale-110" />
              </div>
              <span className="font-display font-black text-sm tracking-tight text-white transition-colors group-hover:text-[#8ce5db]">
                Otter Society
              </span>
            </Link>
          </div>

          {/* Navigation Links List */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs font-bold transition-all duration-300 group ${
                    isActive
                      ? "bg-gradient-to-r from-[#2d61ff]/10 to-[#8ce5db]/10 border border-[#8ce5db]/20 text-[#8ce5db] shadow-glow-accent"
                      : "border border-transparent text-slate-400 hover:text-white hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-[#8ce5db]" : "text-slate-500 group-hover:text-slate-300"}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                      isActive ? "bg-[#8ce5db] text-[#061323]" : "bg-white/10 text-slate-300"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Quick Admin Navigation Badge if User is Admin */}
            {(user?.role === "admin" || user?.role === "superadmin") && (
              <div className="pt-4 mt-4 border-t border-white/5">
                <Link
                  to="/admin"
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-300 text-xs font-black uppercase tracking-wider"
                >
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Admin Panel</span>
                  </div>
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                </Link>
              </div>
            )}
          </nav>
        </div>
      </aside>

      {/* ==================================================
          2. COLLAPSIBLE MOBILE SIDEDRAWER (TABLET/MOBILE)
          ================================================== */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Clickable Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" onClick={() => setIsSidebarOpen(false)} />
          
          {/* Drawer Panel Container */}
          <aside className="relative flex flex-col w-64 bg-[#0a0f1d]/98 border-r border-white/5 h-full p-5 justify-between animate-in slide-in-from-left duration-300">
            <div>
              {/* Brand Header */}
              <div className="flex items-center justify-between pb-5 border-b border-white/5 mb-5">
                <Link to="/" className="flex items-center gap-2" onClick={() => setIsSidebarOpen(false)}>
                  <img src="/logo.jpg" alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
                  <span className="font-display font-black text-sm tracking-tight text-white">Otter Club</span>
                </Link>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l18 18" />
                  </svg>
                </button>
              </div>

              {/* Navigation List */}
              <nav className="space-y-1.5">
                {menuItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs font-bold transition-all duration-300 group ${
                        isActive
                          ? "bg-[#2d61ff]/10 border border-[#8ce5db]/20 text-[#8ce5db] shadow-glow-accent"
                          : "border border-transparent text-slate-400 hover:text-white hover:bg-white/[0.03]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? "text-[#8ce5db]" : "text-slate-500"}>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                          isActive ? "bg-[#8ce5db] text-[#061323]" : "bg-white/10 text-slate-300"
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <Link
                      to="/admin"
                      className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-wider"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Admin Panel</span>
                      </div>
                    </Link>
                  </div>
                )}
              </nav>
            </div>

          </aside>
        </div>
      )}

      {/* ==================================================
          3. MAIN CONTENT WRAPPER & WORKSPACE
          ================================================== */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-y-auto">
        
        {/* TOP UTILITY HEADER BAR */}
        <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#060b16]/80 backdrop-blur-md h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 select-none shrink-0">
          {/* Left Corner: Hamburger */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 active:scale-95 transition-all duration-300"
              title="Open Navigation"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          {/* Center Space: Empty */}
          <div className="flex-1" />

          {/* Right Corner: Quick Action Bell & Dropdown */}
          <div className="flex items-center gap-3.5">
            
            {/* Live Notification Indicator */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifDropdownOpen(!isNotifDropdownOpen);
                  setIsDropdownOpen(false);
                }}
                className={`relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all duration-300 group shrink-0 ${
                  isNotifDropdownOpen ? "border-[#8ce5db]/30 text-white bg-white/10" : ""
                }`}
                title="Alert Notifications"
              >
                <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-black text-white border-2 border-[#060b16] shadow-glow-accent animate-pulse">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </button>

              {/* Notification Quick Preview Dropdown */}
              {isNotifDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-72 sm:w-80 rounded-2xl border border-white/10 bg-[#0a0f1d]/95 p-3 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-2 py-1.5 border-b border-white/5 mb-2 flex items-center justify-between">
                      <span className="text-xs font-black text-white uppercase tracking-wider">Recent Alerts</span>
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#8ce5db]/10 border border-[#8ce5db]/20 text-[9px] font-black text-[#8ce5db]">
                          {notifications.filter(n => !n.isRead).length} New
                        </span>
                      )}
                    </div>
                    {notifications.filter(n => !n.isRead).length > 0 ? (
                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                        {notifications.filter(n => !n.isRead).slice(0, 4).map((notif) => (
                          <div 
                            key={notif._id} 
                            onClick={() => {
                              handleMarkOneRead(notif._id);
                              setIsNotifDropdownOpen(false);
                            }}
                            className="p-2.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-[#8ce5db]/20 transition-all duration-200 text-left cursor-pointer group"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-200 group-hover:text-[#8ce5db] transition-colors truncate">{notif.title}</span>
                              <span className="text-[8px] text-slate-500 shrink-0 font-medium">
                                {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-500 text-xs">
                        <span className="text-xl block mb-1">✨</span>
                        All caught up! No unread notifications.
                      </div>
                    )}
                    <div className="pt-2 border-t border-white/5 mt-2">
                      <button
                        onClick={() => {
                          setActiveTab("notifications");
                          setIsNotifDropdownOpen(false);
                        }}
                        className="w-full text-center py-2 text-[#8ce5db] hover:text-[#8ce5db]/80 text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1 hover:underline"
                      >
                        <span>View all notifications</span>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar Click Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsNotifDropdownOpen(false);
                }}
                className="relative flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 shrink-0"
              >
                <div className="h-7 w-7 rounded-lg bg-[#060b16] overflow-hidden flex items-center justify-center text-xs font-black text-white shrink-0 border border-white/10">
                  {user?.avatar ? (
                    <img src={getAvatarUrl(user.avatar, avatarTimestamp)} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    user?.name?.[0]?.toUpperCase()
                  )}
                </div>
                <span className="hidden sm:inline-block text-xs font-bold text-slate-300 max-w-[80px] truncate">
                  {user?.name?.split(" ")[0]}
                </span>
                <svg className={`h-3 w-3 text-slate-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Float Dialog */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-56 rounded-2xl border border-white/10 bg-[#0a0f1d]/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                      <p className="text-xs font-black text-white truncate">{user?.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold truncate mt-0.5" title={user?.email}>{user?.email}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setActiveTab("membership");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                    >
                      <svg className="h-4 w-4 text-[#8ce5db]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Membership Plan</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                    >
                      <svg className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile Settings</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setActiveTab("payments");
                        setIsDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                    >
                      <svg className="h-4 w-4 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <span>Payment Logs</span>
                    </button>

                    <button
                      onClick={async () => {
                        await handleRefresh();
                        setIsDropdownOpen(false);
                      }}
                      disabled={isRefreshing}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all duration-200 group ${
                        isRefreshing 
                          ? "bg-[#8ce5db]/5 text-white shadow-glow-accent animate-pulse" 
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <svg 
                        className={`h-4 w-4 text-[#8ce5db] ${
                          isRefreshing 
                            ? "animate-spin" 
                            : "group-hover:rotate-180 transition-transform duration-700 ease-in-out"
                        }`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                      <span>Refresh Dashboard</span>
                    </button>

                    <div className="h-px bg-white/5 my-1.5" />
                    
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-black uppercase text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                    >
                      <svg className="h-4 w-4 text-red-400 group-hover:text-red-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA SCENE CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8 overflow-y-auto">
          
          {/* ==================================================
              TAB VIEW 1: DASHBOARD OVERVIEW HOME
              ================================================== */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Dynamic Welcome Premium Welcome Hero Card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-6 backdrop-blur-xl shadow-soft">
                {/* Glow Spotlights */}
                <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-[#2d61ff]/10 blur-[80px] pointer-events-none" />
                <div className="absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-[#8ce5db]/10 blur-[80px] pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  {/* Left Section: User info and Tier Badge */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl p-[1px] bg-gradient-to-tr from-[#2d61ff] via-[#8ce5db]/50 to-[#8ce5db] flex items-center justify-center shadow-glow-accent">
                      <div className="h-full w-full rounded-2xl bg-[#060b16] overflow-hidden flex items-center justify-center text-xl font-black text-white">
                        {user?.avatar ? (
                          <img src={getAvatarUrl(user.avatar, avatarTimestamp)} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xl font-black">{user?.name?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-xl sm:text-2xl font-display font-black text-white leading-tight">
                          Welcome back, {user?.name?.split(" ")[0]}!
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#8ce5db]/10 border border-[#8ce5db]/20 text-[9px] font-black uppercase tracking-widest text-[#8ce5db] shadow-glow-accent">
                          {membership?.membershipType ? `${membership.membershipType} Tier` : "GUEST"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-medium">
                        {membership?.membershipStatus === 'active' 
                          ? `Your membership is active and secures you maximum discounts. Next renewal on ${format(new Date(membership.expiryDate), 'MMM dd, yyyy')}.`
                          : "Unlock premium features, exclusive events passes, and discount benefits by upgrading to premium membership today."}
                      </p>
                    </div>
                  </div>

                  {/* Right Section: Core upgrade / actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Link 
                      to="/member/upgrade" 
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] text-[#061323] font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-glow-accent"
                    >
                      Upgrade Plan
                    </Link>
                    <Link 
                      to="/member/upgrade?type=renewal" 
                      className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all duration-300"
                    >
                      Renew
                    </Link>
                  </div>
                </div>
              </div>

              {/* SaaS Metrics 4-Stats Grid Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Stat 1: Status */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 shadow-soft hover:border-[#8ce5db]/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                    <span>Membership Status</span>
                    <span className="h-5 w-5 rounded-lg bg-[#2d61ff]/10 text-[#2d61ff] flex items-center justify-center">👑</span>
                  </div>
                  <div className="text-xl font-black font-display text-white">
                    {membership?.membershipStatus === 'active' ? "Active Member" : "Guest Access"}
                  </div>
                  <div className="text-[9px] text-[#8ce5db] font-black mt-1 uppercase tracking-wider">
                    {membership?.membershipType ? `${membership.membershipType} Tier Level` : "No active package"}
                  </div>
                </div>

                {/* Stat 2: Validity */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 shadow-soft hover:border-[#8ce5db]/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                    <span>Validity Remaining</span>
                    <span className="h-5 w-5 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">🕒</span>
                  </div>
                  <div className="text-xl font-black font-display text-white">
                    {daysRemaining > 0 ? `${daysRemaining} Days` : "Expired / N/A"}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                    Out of {totalDays} total days
                  </div>
                </div>

                {/* Stat 3: Total registrations */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 shadow-soft hover:border-[#8ce5db]/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                    <span>Events Registered</span>
                    <span className="h-5 w-5 rounded-lg bg-[#8ce5db]/10 text-[#8ce5db] flex items-center justify-center">🎫</span>
                  </div>
                  <div className="text-xl font-black font-display text-white">
                    {registrations.length} Passes
                  </div>
                  <div className="text-[9px] text-[#8ce5db] font-black mt-1 uppercase tracking-wider hover:underline cursor-pointer" onClick={() => setActiveTab("events")}>
                    View registered list →
                  </div>
                </div>

                {/* Stat 4: Total sum paid */}
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 shadow-soft hover:border-[#8ce5db]/20 transition-all duration-300">
                  <div className="flex items-center justify-between mb-3 text-slate-500 uppercase tracking-widest text-[9px] font-black">
                    <span>Capital Invested</span>
                    <span className="h-5 w-5 rounded-lg bg-yellow-500/10 text-yellow-400 flex items-center justify-center">💳</span>
                  </div>
                  <div className="text-xl font-black font-display text-white">
                    ₹{totalPaid}
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                    {history.length} active transactions
                  </div>
                </div>

              </div>

              {/* Mini Row Summary Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Side: Recent Active Bookings */}
                <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.01] p-6 shadow-soft space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
                      Recent Passes Overview
                    </h3>
                    <button onClick={() => setActiveTab("events")} className="text-[10px] font-black text-[#8ce5db] uppercase hover:underline">
                      See All
                    </button>
                  </div>

                  {registrations.length > 0 ? (
                    <div className="space-y-4">
                      {registrations.slice(0, 3).map((reg) => (
                        <div key={reg._id} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.02] transition">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
                              <img src={reg.event?.eventImage} alt="" className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <h4 className="text-xs font-black truncate max-w-[150px] sm:max-w-[250px]">{reg.event?.title}</h4>
                              <p className="text-[9px] text-slate-500 font-semibold mt-0.5">
                                {format(new Date(reg.event?.eventDate || Date.now()), 'MMMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase border ${
                            reg.paymentStatus === 'completed' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {reg.paymentStatus}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-xs text-center py-6">You have no registered upcoming sessions.</p>
                  )}
                </div>

                {/* Right Side: Society Shortcuts */}
                <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-white/[0.01] p-6 shadow-soft space-y-4">
                  <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-200">
                    SaaS Quick Jumps
                  </h3>
                  <div className="grid gap-3.5">
                    <button 
                      onClick={() => setActiveTab("membership")}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.03] text-left text-xs font-bold transition"
                    >
                      <span>💎 View My Plan Details</span>
                      <span className="text-slate-500">→</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab("profile")}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.03] text-left text-xs font-bold transition"
                    >
                      <span>👤 Manage Profile Settings</span>
                      <span className="text-slate-500">→</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab("notifications")}
                      className="w-full flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.03] text-left text-xs font-bold transition"
                    >
                      <span>🔔 View Alerts Inbox</span>
                      <span className="text-slate-500">→</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==================================================
              TAB VIEW 2: MEMBERSHIP PANEL
              ================================================== */}
          {activeTab === "membership" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Main Membership Panel details */}
                <div className="lg:col-span-8 rounded-2xl border border-white/10 bg-white/[0.01] p-6 sm:p-8 backdrop-blur-xl shadow-soft relative overflow-hidden">
                  
                  {/* Decorative card background overlay */}
                  <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-[#8ce5db]/5 blur-[80px] pointer-events-none" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-white/5">
                    <div>
                      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8ce5db] mb-1">Current Plan</h2>
                      <p className="text-3xl font-display font-black tracking-tight">
                        {membership ? `${membership.membershipType} Tier` : "Guest Member"}
                      </p>
                    </div>
                    {membership && (
                      <div className="text-left sm:text-right">
                        <span className={`px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          membership.membershipStatus === 'active' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {membership.membershipStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  {membership ? (
                    <>
                      {/* Validity scale widget */}
                      <div className="mb-8 p-5 rounded-2xl bg-white/[0.01] border border-white/5 shadow-soft">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Days Validity Remaining</span>
                          <span className="text-xs font-black text-[#8ce5db]">{daysRemaining > 0 ? daysRemaining : 0} Days</span>
                        </div>
                        <div className="relative h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] shadow-glow-accent transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2.5 text-[9px] text-slate-500 font-black uppercase tracking-wider">
                          <span>Expired</span>
                          <span>{totalDays} Days</span>
                        </div>
                      </div>

                      {/* Info Table row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 py-5 border-y border-white/5">
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Active Since</p>
                          <p className="text-sm font-bold">{membership.startDate ? format(new Date(membership.startDate), 'MMM dd, yyyy') : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Expiry Date</p>
                          <p className="text-sm font-bold">{membership.expiryDate ? format(new Date(membership.expiryDate), 'MMM dd, yyyy') : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-black mb-1">Plan Price</p>
                          <p className="text-sm font-black text-[#8ce5db]">₹{membership.price}</p>
                        </div>
                      </div>

                      {/* Plan Benefits */}
                      <div className="mb-8">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4">Plan Benefits</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {membership.benefits?.map((benefit, i) => (
                            <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.005] border border-white/5 hover:border-white/10 transition group">
                              <div className="h-6 w-6 rounded-lg bg-[#8ce5db]/10 flex items-center justify-center text-[#8ce5db] shrink-0 transition-transform group-hover:scale-105">
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                              <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4">
                        <Link to="/member/upgrade" className="flex-1 text-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] text-[#061323] font-black text-xs uppercase tracking-wider hover:scale-[1.02] transition shadow-glow-accent">
                          Upgrade Plan
                        </Link>
                        <Link to="/member/upgrade?type=renewal" className="flex-1 text-center px-6 py-3.5 rounded-xl bg-white/5 text-white border border-white/10 font-black text-xs uppercase tracking-wider hover:bg-white/10 transition">
                          Renew Plan
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center sm:text-left">
                      <p className="text-slate-400 mb-8 max-w-lg text-sm sm:text-base leading-relaxed">
                        Join the society to unlock up to 20% discounts on all events, priority registrations, and exclusive member-only networking sessions.
                      </p>
                      <Link to="/membership" className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] text-[#061323] font-black text-xs uppercase tracking-wider hover:scale-[1.03] transition shadow-glow-accent inline-block">
                        View Membership Plans
                      </Link>
                    </div>
                  )}

                </div>

                {/* Sidebar Widget widgets strictly inside membership tab */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Mini profile metadata sidebar */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-5 shadow-soft space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#8ce5db]" />
                      Society Metadata
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-white/[0.005] border border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Phone Number</p>
                        <p className="text-xs font-bold text-slate-200">{user?.phone || 'Not provided'}</p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-white/[0.005] border border-white/5">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Member ID</p>
                        <p className="text-xs font-bold text-slate-200 select-all">#{user?._id?.slice(-8).toUpperCase()}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gradient-to-br from-[#8ce5db]/10 to-[#2d61ff]/5 border border-[#8ce5db]/20">
                        <p className="text-[8px] text-[#8ce5db] uppercase tracking-widest font-black mb-0.5">Active Discount Percentage</p>
                        <p className="text-xl font-black font-display text-[#8ce5db]">
                          {membership?.membershipType === 'PRO' ? '20% OFF' : 
                           membership?.membershipType === 'ELITE' ? '10% OFF' : 
                           '0% OFF'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick recent payments widget */}
                  <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-5 shadow-soft space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2d61ff]" />
                      Recent Payments
                    </h3>
                    <div className="space-y-3">
                      {history.slice(0, 3).map((log, i) => (
                        <div key={i} className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.005] border border-white/5">
                          <div>
                            <p className="text-xs font-bold font-display uppercase tracking-wider">{log.membershipType}</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">
                              {log.createdAt ? format(new Date(log.createdAt), 'MMM dd, yyyy') : 'N/A'}
                            </p>
                          </div>
                          <span className="text-xs font-black text-[#8ce5db]">₹{log.price}</span>
                        </div>
                      ))}
                      {history.length === 0 && (
                        <p className="text-slate-500 text-xs text-center py-4">No payments recorded.</p>
                      )}
                      {history.length > 3 && (
                        <button 
                          onClick={() => setActiveTab("payments")}
                          className="w-full text-center py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-wider transition-all duration-300"
                        >
                          View All Payments ({history.length})
                        </button>
                      )}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ==================================================
              TAB VIEW 3: EVENTS PANEL
              ================================================== */}
          {activeTab === "events" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white">Registered Events</h2>
                    <p className="text-xs text-slate-400 mt-1">Manage and access tickets for your registered sports sessions.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-black uppercase tracking-wider shrink-0">
                    {registrations.length} Total Passes
                  </span>
                </div>

                {registrations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registrations.map((reg) => (
                      <div key={reg._id} className="group overflow-hidden rounded-2xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.02] hover:border-[#8ce5db]/30 transition-all duration-300 shadow-soft">
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
                          <h3 className="font-display font-bold text-base mb-1.5 line-clamp-1 group-hover:text-[#8ce5db] transition-colors">
                            {reg.event?.title}
                          </h3>
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold mb-4">
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
                                  className="px-3.5 py-1.5 rounded-xl bg-[#8ce5db]/10 border border-[#8ce5db]/20 text-[#8ce5db] text-[9px] font-black uppercase tracking-wider hover:bg-[#8ce5db]/20 hover:border-[#8ce5db]/30 transition-all duration-300 shadow-glow-accent"
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
                    <Link to="/" className="mt-3 text-[#8ce5db] text-xs font-bold hover:underline inline-block">Explore society events →</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              TAB VIEW 4: REVIEWS PANEL
              ================================================== */}
          {activeTab === "reviews" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white">Reviews & Testimonials</h2>
                    <p className="text-xs text-slate-400 mt-1">Review your society experiences and past event participations.</p>
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold shrink-0">
                    {myReviews.length} Submitted
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Write review Form */}
                  <div className="md:col-span-5 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-[#8ce5db]">
                      {editingReviewId ? "Edit Your Review" : "Write a Testimonial"}
                    </h3>
                    
                    {!eligibility.isEligible ? (
                      <div className="p-5 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 text-yellow-500/90 text-xs sm:text-sm shadow-soft">
                        <p className="font-bold mb-1">Review Submission Restrained</p>
                        <p className="leading-relaxed text-xs">
                          To maintain community authenticity, only premium active members or verified event attendees are permitted to post reviews.
                        </p>
                        <div className="mt-4 flex flex-col gap-2">
                          <Link to="/membership" className="text-[11px] font-black uppercase tracking-wider text-[#8ce5db] hover:underline">
                            → Obtain Membership Plan
                          </Link>
                          <Link to="/" className="text-[11px] font-black uppercase tracking-wider text-[#8ce5db] hover:underline">
                            → Browse society events
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

                  {/* Past submissions list */}
                  <div className="md:col-span-7 border-t border-white/5 pt-6 md:border-t-0 md:border-l md:border-white/5 md:pt-0 md:pl-6">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 mb-4">Your Past Reviews</h3>
                    {reviewLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="h-6 w-6 animate-spin rounded-full border-t-2 border-[#8ce5db]"></div>
                      </div>
                    ) : myReviews.length > 0 ? (
                      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                        {myReviews.map((rev) => (
                          <div key={rev._id} className="p-4 rounded-xl bg-white/[0.005] border border-white/5 hover:border-white/10 transition group shadow-soft">
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
            </div>
          )}

          {/* ==================================================
              TAB VIEW 5: NOTIFICATIONS PANEL
              ================================================== */}
          {activeTab === "notifications" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white">Alert Notifications Inbox</h2>
                    <p className="text-xs text-slate-400 mt-1">Unified channel for system broadcasts, invoice events and membership alerts.</p>
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
            </div>
          )}

          {/* ==================================================
              TAB VIEW 6: PAYMENTS PANEL
              ================================================== */}
          {activeTab === "payments" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white">Payment & Bills</h2>
                    <p className="text-xs text-slate-400 mt-1">Review active membership transaction records and Razorpay receipts.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-bold shrink-0">
                    {history.length} Transactions
                  </span>
                </div>

                <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                  {history.length > 0 ? (
                    history.map((log, i) => (
                      <div 
                        key={i} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.02] transition-all duration-300 shadow-soft"
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
            </div>
          )}

          {/* ==================================================
              TAB VIEW 7: PROFILE SETTINGS PANEL
              ================================================== */}
          {activeTab === "profile" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.01] p-6 sm:p-8 backdrop-blur-xl shadow-soft">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-display font-black text-white">Profile Settings</h2>
                    <p className="text-xs text-slate-400 mt-1">Manage private avatar profiles, phone bindings and public credentials.</p>
                  </div>
                  <button 
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all duration-300 text-xs font-black uppercase tracking-wider"
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
                              src={avatarPreview || getAvatarUrl(user.avatar, avatarTimestamp)} 
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
                            <img src={getAvatarUrl(user.avatar, avatarTimestamp)} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-3xl font-black">
                              {user?.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="p-4 rounded-2xl bg-white/[0.005] border border-white/5 shadow-soft">
                        <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black mb-0.5">Phone Number</p>
                        <p className="text-sm font-bold text-slate-200">{user?.phone || 'Not provided'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/[0.005] border border-white/5 shadow-soft">
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
            </div>
          )}

        </main>
      </div>

    </div>
  );
};

export default UserDashboard;
