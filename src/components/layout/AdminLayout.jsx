import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  getNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  deleteNotification 
} from "../../api/notificationApi";
import { getProfile, updateProfile } from "../../api/authApi";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Dynamic adminUser state
  const [adminUser, setAdminUser] = useState(() => {
    return JSON.parse(localStorage.getItem("adminUser") || '{"name":"System Admin","email":"admin@ottersociety.com"}');
  });

  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);

  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Profile Modal State
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState("view");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security accordion states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  // Fetch admin profile to synchronize with backend
  const fetchAdminProfile = async () => {
    try {
      const res = await getProfile();
      if (res.success && res.data) {
        setAdminUser(res.data);
        localStorage.setItem("adminUser", JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Failed to sync admin profile:", err);
    }
  };

  // Real notifications fetch
  const fetchNotificationsOnly = useCallback(async () => {
    try {
      const res = await getNotifications();
      if (res.data && res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch admin notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Sync profile & notifications on mount and update events
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      toast.error("Access denied. Please authenticate.");
      navigate("/admin/login");
      return;
    }

    fetchAdminProfile();
    fetchNotificationsOnly();

    const handleNotificationsUpdate = () => {
      fetchNotificationsOnly();
    };

    const handleAuthChange = () => {
      fetchAdminProfile();
    };

    window.addEventListener("notifications-updated", handleNotificationsUpdate);
    window.addEventListener("auth-change", handleAuthChange);
    
    return () => {
      window.removeEventListener("notifications-updated", handleNotificationsUpdate);
      window.removeEventListener("auth-change", handleAuthChange);
    };
  }, [navigate, location.pathname, fetchNotificationsOnly]);

  // Sync profile form states
  useEffect(() => {
    if (adminUser) {
      setName(adminUser.name || "");
      setPhone(adminUser.phone || "");
      setAvatarPreview(adminUser.avatar || null);
      setPassword("");
      setConfirmPassword("");
      setAvatarFile(null);
      
      // Reset security accordion states
      setShowPasswordSection(false);
      setCurrentPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [adminUser, profileModalOpen]);

  // Handle body scroll locking on mobile
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    toast.success("Successfully logged out.");
    navigate("/admin/login");
  };

  // Notification Operations
  const handleMarkRead = async (id) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        toast.success("Notification marked as read");
        window.dispatchEvent(new Event("notifications-updated"));
      }
    } catch (err) {
      toast.error("Failed to update notification");
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

  const handleDismissAll = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success("All notifications marked as read");
        window.dispatchEvent(new Event("notifications-updated"));
      }
    } catch (err) {
      toast.error("Failed to dismiss notifications");
    }
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    if (showPasswordSection) {
      if (!currentPassword) {
        toast.error("Please enter your current password");
        return;
      }
      if (!password) {
        toast.error("Please enter a new password");
        return;
      }
      if (password.length < 6) {
        toast.error("New password must be at least 6 characters long");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    }

    setIsSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("phone", phone);
      if (showPasswordSection && password) {
        formData.append("password", password);
      }
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const res = await updateProfile(formData);
      if (res.success && res.data) {
        setAdminUser(res.data);
        localStorage.setItem("adminUser", JSON.stringify(res.data));
        toast.success("Profile updated successfully");
        setProfileModalOpen(false);
        window.dispatchEvent(new Event("auth-change"));
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Smooth Refresh Action
  const handleRefreshDashboard = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    toast.success("Refreshing workspace...");
    
    // Trigger local updates
    fetchNotificationsOnly();
    fetchAdminProfile();
    
    // Dispatch refresh event for components listening
    window.dispatchEvent(new Event("refresh-dashboard"));
    
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 1000);
  };

  const navLinks = [
    {
      name: "Overview",
      path: "/admin/overview",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      )
    },
    {
      name: "Analytics",
      path: "/admin/analytics",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2" />
        </svg>
      )
    },
    {
      name: "Event Management",
      path: "/admin/events",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      name: "Registrations",
      path: "/admin/registrations",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      )
    },
    {
      name: "Membership Plans",
      path: "/admin/memberships",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: "QR Scanner",
      path: "/admin/scanner",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      )
    },
    {
      name: "Coupons",
      path: "/admin/coupons",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      )
    },
    {
      name: "Broadcast Center",
      path: "/admin/broadcast",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      name: "Community Feed",
      path: "/admin/community",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      )
    },
    {
      name: "CMS Manager",
      path: "/admin/cms",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      name: "Reviews Moderation",
      path: "/admin/reviews",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.246.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.385-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
      )
    },
    {
      name: "Payments",
      path: "/admin/payments",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    }
  ];

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const getPageTitle = () => {
    const activeLink = navLinks.find(link => isActive(link.path));
    if (activeLink) return activeLink.name;
    if (location.pathname.includes("/admin/events/new")) return "Create Event";
    if (location.pathname.includes("/admin/events/edit")) return "Edit Event";
    if (location.pathname.includes("/admin/community/new")) return "Create Post";
    if (location.pathname.includes("/admin/community/edit")) return "Edit Post";
    return "Admin Panel";
  };

  return (
    <div className="min-h-screen bg-[#060b16] font-sans text-slate-100 flex">
      
      {/* ----------------- DESKTOP SIDEBAR ----------------- */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-[#080f1d] shrink-0 z-40 relative h-screen sticky top-0">
        {/* Brand identity header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/10">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/admin/overview")}>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#40e0d0] to-[#2d61ff] flex items-center justify-center font-black text-slate-900 text-lg shadow-lg shadow-[#40e0d0]/20">
              O
            </div>
            <div>
              <h1 className="font-extrabold text-white tracking-tight text-sm uppercase leading-none">Otter Society</h1>
              <span className="text-[10px] font-bold text-[#40e0d0] uppercase tracking-widest leading-none mt-1">Admin Workspace</span>
            </div>
          </div>
        </div>

        {/* Links Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 group ${
                isActive(link.path)
                  ? "bg-gradient-to-r from-[#40e0d0]/10 to-[#2d61ff]/5 border border-[#40e0d0]/20 text-[#40e0d0]"
                  : "text-slate-400 border border-transparent hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              <span className={`transition-transform duration-300 group-hover:scale-110 ${isActive(link.path) ? "text-[#40e0d0]" : "text-slate-400 group-hover:text-slate-200"}`}>
                {link.icon}
              </span>
              <span className="truncate">{link.name}</span>
            </button>
          ))}
        </div>

        {/* User profile bubble and bottom links */}
        <div className="p-4 border-t border-white/10 bg-[#050b15]/40">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View Site
          </button>
        </div>
      </aside>

      {/* ----------------- MOBILE BACKDROP & DRAWER ----------------- */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm lg:hidden transition-opacity duration-300"
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 z-[9999] w-72 bg-[#080f1d] border-r border-white/10 p-5 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col justify-between ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#40e0d0] to-[#2d61ff] flex items-center justify-center font-black text-slate-900 text-sm">
                O
              </div>
              <h2 className="font-extrabold text-white tracking-tight text-sm uppercase">Otter Society</h2>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 text-slate-400 hover:text-white transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[calc(100vh-160px)] pr-2 custom-scrollbar">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => {
                  setMobileOpen(false);
                  navigate(link.path);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition ${
                  isActive(link.path)
                    ? "bg-gradient-to-r from-[#40e0d0]/10 to-[#2d61ff]/5 border border-[#40e0d0]/20 text-[#40e0d0]"
                    : "text-slate-400 border border-transparent hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={isActive(link.path) ? "text-[#40e0d0]" : "text-slate-400"}>
                  {link.icon}
                </span>
                <span className="truncate">{link.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4 mt-auto">
          <button
            onClick={() => {
              setMobileOpen(false);
              navigate("/");
            }}
            className="w-full text-center py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition"
          >
            View Site
          </button>
        </div>
      </div>

      {/* ----------------- WORKSPACE INNER PANEL ----------------- */}
      <div className="flex-grow flex flex-col min-h-screen min-w-0 relative">
        
        {/* STICKY TOP UTILITY BAR */}
        <header className="h-20 border-b border-white/10 bg-[#060b16]/75 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 lg:px-10 shrink-0">
          
          {/* Mobile hamburger trigger + page title path */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition focus:outline-none"
              aria-label="Open sidebar"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex flex-col">
              <h2 className="text-lg font-black text-white tracking-tight leading-none uppercase">{getPageTitle()}</h2>
            </div>
          </div>

          {/* Controls: Search, notifications, and settings dropdown */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Notification System popover */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileDropdownOpen(false);
                }}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-[#40e0d0] hover:bg-white/10 transition relative"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#40e0d0] ring-4 ring-[#060b16] animate-pulse" />
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/10 bg-[#080f1d]/95 backdrop-blur-xl p-4 shadow-2xl z-50 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-[#40e0d0]">Notifications ({notifications.filter(n => !n.read).length})</span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={handleDismissAll}
                          className="text-[10px] font-bold text-slate-400 hover:text-white uppercase transition"
                        >
                          Dismiss all
                        </button>
                      )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                      {notifLoading ? (
                        <div className="py-6 text-center text-xs text-slate-500">Loading notifications...</div>
                      ) : notifications.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500">No notifications found.</div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif._id} 
                            className={`p-2.5 rounded-xl border flex gap-2.5 items-start transition-all relative group ${
                              notif.read 
                                ? "bg-white/[0.02] border-white/5" 
                                : "bg-[#40e0d0]/5 border-[#40e0d0]/20"
                            }`}
                          >
                            <div className={`h-2 w-2 rounded-full shrink-0 mt-1.5 ${
                              notif.read ? "bg-slate-600" : "bg-[#40e0d0] animate-pulse"
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-200 leading-tight break-words">{notif.message}</p>
                              <span className="text-[9px] text-slate-500 mt-1 block">
                                {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              {!notif.read && (
                                <button
                                  onClick={() => handleMarkRead(notif._id)}
                                  title="Mark as Read"
                                  className="p-1 rounded bg-white/5 hover:bg-[#40e0d0]/20 hover:text-[#40e0d0] transition text-slate-400"
                                >
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteNotif(notif._id)}
                                title="Delete"
                                className="p-1 rounded bg-white/5 hover:bg-red-500/20 hover:text-red-400 transition text-slate-400"
                              >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Admin identity menu dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-2.5 focus:outline-none group p-1 rounded-xl hover:bg-white/5 transition"
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#40e0d0] to-[#2d61ff] flex items-center justify-center font-extrabold text-[#061323] text-sm shrink-0 border border-white/10 shadow-md overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={adminUser.name} className="h-full w-full object-cover" />
                  ) : (
                    adminUser.name?.[0]?.toUpperCase() || "A"
                  )}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-none text-left">
                  <span className="text-xs font-bold text-white group-hover:text-[#40e0d0] transition-colors">{adminUser.name || "Administrator"}</span>
                  <span className="text-[9px] font-bold text-[#40e0d0] uppercase tracking-wider mt-0.5">Admin</span>
                </div>
                <svg className={`h-4 w-4 text-slate-400 group-hover:text-white transition-transform duration-300 ${profileDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-3 w-60 rounded-2xl border border-white/10 bg-[#080f1d]/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-white/5 mb-1.5">
                      <p className="text-xs font-bold text-white leading-tight">{adminUser.name}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{adminUser.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModalOpen(true);
                        setActiveModalTab("view");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                    >
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Admin Profile
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setProfileModalOpen(true);
                        setActiveModalTab("edit");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                    >
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>

                    <button
                      onClick={handleRefreshDashboard}
                      disabled={isRefreshing}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all duration-200 group ${
                        isRefreshing 
                          ? "bg-[#40e0d0]/5 text-white shadow-glow-accent animate-pulse" 
                          : "text-slate-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <svg 
                        className={`h-4 w-4 text-[#40e0d0] ${
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
                      Refresh Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition"
                    >
                      <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View Site
                    </button>

                    <div className="border-t border-white/5 my-1.5" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition"
                    >
                      <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* WORKSPACE CONTENT AREA WITH GLASSMORPHISM OVERLAYS */}
        <main className="flex-grow px-6 py-8 lg:px-10 relative bg-[#060b16] select-text">
          <Outlet />
        </main>
      </div>

      {/* Admin Profile Details / Edit Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-white/10 bg-[#0d1527]/95 shadow-2xl p-6 overflow-hidden">
            {/* Glow Effects */}
            <div className="absolute right-0 top-0 h-40 w-40 bg-[#40e0d0]/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute left-0 bottom-0 h-40 w-40 bg-[#2d61ff]/5 rounded-full blur-[80px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 shrink-0">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Admin Profile</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage administrative credentials and preferences.</p>
              </div>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1.5 bg-white/5 border border-white/5 rounded-2xl mb-6 shrink-0">
              <button
                onClick={() => setActiveModalTab("view")}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  activeModalTab === "view"
                    ? "bg-[#40e0d0] text-[#061323] shadow-md shadow-[#40e0d0]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveModalTab("edit")}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                  activeModalTab === "edit"
                    ? "bg-[#40e0d0] text-[#061323] shadow-md shadow-[#40e0d0]/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Edit Profile
              </button>
            </div>

            {/* Content */}
            {activeModalTab === "view" ? (
              <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-6 custom-scrollbar">
                <div className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-[#050b15]/40 text-center relative">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-[#40e0d0] to-[#2d61ff] flex items-center justify-center font-black text-slate-900 text-3xl shadow-lg border border-white/10 overflow-hidden mb-4">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      name?.[0]?.toUpperCase() || "A"
                    )}
                  </div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight">{adminUser.name}</h4>
                  <span className="mt-1 px-3 py-1 rounded-full bg-[#40e0d0]/10 border border-[#40e0d0]/20 text-[#40e0d0] text-[9px] font-black uppercase tracking-widest">
                    {adminUser.role || "Administrator"}
                  </span>
                </div>

                <div className="space-y-3.5">
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl border border-white/5 bg-[#050b15]/20">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Email Address</span>
                    <span className="text-xs font-bold text-slate-300">{adminUser.email}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl border border-white/5 bg-[#050b15]/20">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Phone Number</span>
                    <span className="text-xs font-bold text-slate-300">{adminUser.phone || "Not Configured"}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 rounded-xl border border-white/5 bg-[#050b15]/20">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black">System Authority</span>
                    <span className="text-[10px] font-mono text-[#40e0d0] font-black uppercase">FULL_ACCESS</span>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-4 custom-scrollbar">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-5 p-4 rounded-2xl border border-white/5 bg-[#050b15]/30">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-tr from-[#40e0d0] to-[#2d61ff] flex items-center justify-center font-black text-slate-900 text-2xl shadow-lg border border-white/10 shrink-0 overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        name?.[0]?.toUpperCase() || "A"
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">Profile Photo</span>
                      <label className="inline-block px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-300 hover:bg-white/10 cursor-pointer transition">
                        Upload New Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setAvatarFile(file);
                              setAvatarPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#40e0d0]/60 transition"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">Email (Identity Index)</label>
                      <input
                        type="email"
                        disabled
                        value={adminUser.email}
                        className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-xs text-slate-500 cursor-not-allowed focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#40e0d0]/60 transition"
                      />
                    </div>

                    {/* Collapsible Password Section */}
                    {!showPasswordSection ? (
                      <div className="border-t border-white/5 my-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setShowPasswordSection(true)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-black text-slate-300 uppercase tracking-wider transition-all duration-300"
                        >
                          <span className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-[#40e0d0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Credentials & Password
                          </span>
                          <span className="text-[#40e0d0] hover:underline">[ Change Password ]</span>
                        </button>
                      </div>
                    ) : (
                      <div className="border-t border-white/5 my-4 pt-4 animate-fadeIn">
                        <div className="flex items-center justify-between mb-3.5">
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-[#40e0d0]">Security: Change Password</h5>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPasswordSection(false);
                              setCurrentPassword("");
                              setPassword("");
                              setConfirmPassword("");
                            }}
                            className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase transition"
                          >
                            Cancel Change
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {/* Current Password */}
                          <div>
                            <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">Current Password</label>
                            <div className="relative">
                              <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#40e0d0]/60 transition"
                              />
                              <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                              >
                                {showCurrentPassword ? (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                  </svg>
                                ) : (
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* New Password */}
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">New Password</label>
                              <div className="relative">
                                <input
                                  type={showNewPassword ? "text" : "password"}
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#40e0d0]/60 transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                  {showNewPassword ? (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                              <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">Confirm New Password</label>
                              <div className="relative">
                                <input
                                  type={showConfirmPassword ? "text" : "password"}
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="••••••••"
                                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#40e0d0]/60 transition"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                  {showConfirmPassword ? (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                    </svg>
                                  ) : (
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Validation Feedback */}
                          {password && password.length < 6 && (
                            <p className="text-[10px] text-yellow-400 font-bold flex items-center gap-1.5 mt-1.5">
                              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Password should be at least 6 characters.
                            </p>
                          )}

                          {password && confirmPassword && password !== confirmPassword && (
                            <p className="text-[10px] text-red-400 font-bold flex items-center gap-1.5 mt-1.5">
                              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Passwords do not match.
                            </p>
                          )}

                          {password && confirmPassword && password === confirmPassword && password.length >= 6 && (
                            <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5 mt-1.5">
                              <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Secure passwords configured.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Action Buttons */}
                <div className="flex gap-3 justify-end pt-4 border-t border-white/10 mt-4 shrink-0 bg-[#0d1527]/95">
                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[10px] font-extrabold uppercase tracking-wider text-slate-300 hover:bg-white/10 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-tr from-[#40e0d0] to-[#2d61ff] text-slate-900 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-[#40e0d0]/20 hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <div className="h-3 w-3 animate-spin rounded-full border border-t-transparent border-slate-900" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminLayout;
