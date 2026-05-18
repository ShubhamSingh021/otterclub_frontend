import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import Container from "../layout/Container.jsx";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../api/notificationApi.js";

const sortLinks = (links = []) =>
  [...links].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

const defaultLinks = [
  { label: "Home", href: "/", order: 1 },
  { label: "Membership", href: "/membership", order: 2 },
  { label: "Events", href: "/events", order: 3 },
  { label: "Community", href: "/community", order: 4 },
  { label: "About", href: "/about", order: 5 },
  { label: "Testimonials", href: "/testimonials", order: 6 },
  { label: "Contact", href: "/contact", order: 7 },
];

const defaultSettings = {
  siteName: "Otter Society",
  siteTagline: "Premium Sports Community",
  globalCta: { label: "Get Started", href: "/register" },
};

const getAvatarUrl = (url, timestamp) => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}t=${timestamp}`;
};

const Navbar = ({ settings: cmsSettings }) => {
  const settings = cmsSettings || defaultSettings;
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarTimestamp, setAvatarTimestamp] = useState(Date.now());

  // Dropdown States
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Live Notifications Center States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");
    const userData = localStorage.getItem("user");
    const adminData = localStorage.getItem("adminUser");
    
    const isTokenValid = !!token;
    const isAdminTokenValid = !!adminToken;
    
    let currentUser = null;
    if (userData) {
      try {
        currentUser = JSON.parse(userData);
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }

    let currentAdmin = null;
    if (adminData) {
      try {
        currentAdmin = JSON.parse(adminData);
      } catch (e) {
        console.error("Failed to parse admin data", e);
      }
    }

    setIsUserLoggedIn(isTokenValid);
    setUser(currentUser);
    setAvatarTimestamp(Date.now());

    const hasAdminRole = (currentUser?.role === "admin" || currentUser?.role === "superadmin") || 
                        (currentAdmin?.role === "admin" || currentAdmin?.role === "superadmin");
    
    setIsAdminLoggedIn(isAdminTokenValid && hasAdminRole);
  }, []);

  useEffect(() => {
    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("focus", checkAuth);
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("focus", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, [checkAuth]);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getNotifications();
      const rawNotifications = res.data?.notifications || res.data?.data || [];
      
      const mappedNotifications = Array.isArray(rawNotifications)
        ? rawNotifications.map(n => ({
            ...n,
            isRead: n.isRead !== undefined ? n.isRead : !!n.read
          }))
        : [];

      setNotifications(mappedNotifications);
      
      const unread = mappedNotifications.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications in Navbar:", err);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, []);

  // Poll notifications
  useEffect(() => {
    if (isUserLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // Every 20 seconds

      const handleNotificationsUpdate = () => {
        fetchNotifications();
      };

      window.addEventListener("notifications-updated", handleNotificationsUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener("notifications-updated", handleNotificationsUpdate);
      };
    }
  }, [isUserLoggedIn, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
        window.dispatchEvent(new Event("notifications-updated"));
      }
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      const res = await markNotificationAsRead(id);
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        window.dispatchEvent(new Event("notifications-updated"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (!Array.isArray(notifications)) return [];
    if (activeTab === "all") return notifications;
    if (activeTab === "system") {
      return notifications.filter(n => ["admin", "announcement", "reminder", "review"].includes(n.type));
    }
    return notifications.filter(n => n.type === activeTab);
  }, [notifications, activeTab]);

  const navLinks = useMemo(() => {
    const rawLinks = settings?.navigationLinks?.length ? settings.navigationLinks : defaultLinks;
    const mapped = rawLinks.map(link => {
      let href = link.href;
      if (href === "/#home" || href === "#home" || href === "") {
        href = "/";
      } else if (href === "/#events" || href === "#events") {
        href = "/events";
      } else if (href === "/#about" || href === "#about") {
        href = "/about";
      } else if (href === "/#testimonials" || href === "#testimonials") {
        href = "/testimonials";
      } else if (href === "/#contact" || href === "#contact") {
        href = "/contact";
      }
      return { ...link, href };
    });
    return sortLinks(mapped);
  }, [settings]);

  const globalCta = useMemo(() => {
    const rawCta = settings?.globalCta || defaultSettings.globalCta;
    if (rawCta?.label === "Become a Member") {
      return {
        label: "Get Started",
        href: "/register"
      };
    }
    return rawCta;
  }, [settings]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsUserLoggedIn(false);
    setUser(null);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-4 z-50 w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 rounded-full border border-white/10 bg-[#050b16]/75 backdrop-blur-xl py-1.5 sm:py-2 px-3 sm:px-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] shadow-cyan-500/5 hover:border-[#8ce5db]/30 hover:shadow-[0_8px_32px_rgba(140,229,219,0.08)] transition-all duration-500 w-full">
        
        {/* LEFT SECTION - Branding */}
        <Link className="flex items-center gap-2.5 transition-opacity hover:opacity-90 flex-shrink-0" to="/">
          <img 
            src="/logo.jpg" 
            alt="Otter Society" 
            className="h-8 w-8 rounded-full object-cover border border-white/10 shadow-sm" 
          />
          <div className="min-w-0 text-left">
            <p className="font-display text-xs sm:text-sm font-semibold tracking-tight text-white leading-tight">
              {settings?.siteName || "Otter Society"}
            </p>
            <p className="hidden xs:block text-[7.5px] font-semibold uppercase tracking-[0.18em] text-slate-400/80 leading-none mt-0.5">
              {settings?.siteTagline || "PREMIUM SPORTS COMMUNITY"}
            </p>
          </div>
        </Link>

        {/* CENTER SECTION - Navigation Links */}
        <nav className="hidden lg:flex items-center justify-center gap-1 rounded-full border border-white/5 bg-white/[0.02] px-2 py-1">
          {navLinks.map((link) => (
            <NavLink
              key={`${link.label}-${link.href}`}
              to={link.href}
              end={link.href === "/"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-[#8ce5db]/10 text-[#8ce5db] border border-[#8ce5db]/20 shadow-[0_0_15px_rgba(140,229,219,0.1)]"
                    : "text-slate-300 hover:bg-white/10 hover:text-white border border-transparent hover:scale-105"
                } active:scale-95`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* RIGHT SECTION - Actions & User Info */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Admin Panel Button */}
          {isAdminLoggedIn && (
            <Link
              className="hidden md:inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#8ce5db]/30 bg-[#8ce5db]/10 px-3.5 py-1.5 text-xs font-bold text-[#8ce5db] transition-all duration-300 hover:bg-[#8ce5db]/20 hover:shadow-[0_0_15px_rgba(140,229,219,0.2)]"
              to="/admin/events"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#8ce5db] animate-pulse" />
              Admin
            </Link>
          )}

          {/* Notification Bell Dropdown */}
          {isUserLoggedIn && (
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsProfileOpen(false);
                }}
                className="relative flex items-center justify-center h-9 w-9 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white hover:border-[#8ce5db]/20 transition-all duration-300"
                title="Notifications"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#050b16]">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              <AnimatePresence>
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="fixed top-20 right-4 left-4 sm:absolute sm:top-auto sm:right-0 sm:left-auto sm:w-96 w-auto mt-3 z-50 rounded-2xl border border-white/10 bg-[#0d1527]/95 backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-3"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-white/10">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <span>Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-[#8ce5db]/20 text-[#8ce5db] text-[10px] font-bold px-2 py-0.5 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </h4>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs font-bold text-[#8ce5db] hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification Wrap Tabs */}
                      <div className="flex flex-wrap gap-2 pb-1.5 text-xs">
                        {[
                          { id: "all", label: "All" },
                          { id: "event", label: "Events" },
                          { id: "membership", label: "Memberships" },
                          { id: "payment", label: "Payments" },
                          { id: "system", label: "System" },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-full px-3 py-1 font-semibold transition shrink-0 ${
                              activeTab === tab.id
                                ? "bg-[#8ce5db] text-[#051426]"
                                : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Scrollable notifications list */}
                      <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-left">
                        {filteredNotifications.length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-8">No notifications in this category.</p>
                        ) : (
                          filteredNotifications.map((notif) => {
                            let badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                            if (notif.type === "payment") badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                            else if (notif.type === "event") badgeColor = "bg-[#8ce5db]/10 text-[#8ce5db] border-[#8ce5db]/20";
                            else if (notif.type === "membership") badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                            
                            return (
                              <div
                                key={notif._id}
                                onClick={() => handleMarkOneRead(notif._id)}
                                className={`p-3 rounded-xl border transition cursor-pointer relative ${
                                  notif.isRead
                                    ? "bg-white/[0.01] border-white/5 opacity-60"
                                    : "bg-white/[0.04] border-[#8ce5db]/20 hover:border-[#8ce5db]/40"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                      {notif.type}
                                    </span>
                                    <h5 className="font-bold text-xs text-white leading-tight">{notif.title}</h5>
                                  </div>
                                  {!notif.isRead && (
                                    <span className="h-2 w-2 rounded-full bg-[#8ce5db] shrink-0 mt-1" />
                                  )}
                                </div>
                                <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">{notif.message}</p>
                                {notif.link && (
                                  <Link
                                    to={notif.link}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setIsNotifOpen(false);
                                    }}
                                    className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8ce5db] hover:underline mt-2"
                                  >
                                    <span>View details</span>
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </Link>
                                )}
                                <span className="text-[9px] text-slate-500 block mt-1 text-right">
                                  {notif.createdAt ? (() => {
                                    try {
                                      return format(new Date(notif.createdAt), "MMM d, h:mm a");
                                    } catch (e) {
                                      return "";
                                    }
                                  })() : ""}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Profile Dropdown / Auth CTA Section */}
          {isUserLoggedIn ? (
            <div className="relative">
              <button
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 sm:pr-3.5 transition-all duration-300 hover:bg-white/10 hover:border-[#8ce5db]/30 group"
              >
                <div className="h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#8ce5db] to-[#2d61ff]">
                  {user?.avatar ? (
                    <img src={getAvatarUrl(user.avatar, avatarTimestamp)} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#060b16]">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-slate-200 group-hover:text-white transition">
                  {user?.name?.split(" ")[0]}
                </span>
                <svg
                  className={`h-3 w-3 text-slate-400 group-hover:text-white transition-transform duration-300 ${isProfileOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2.5 z-50 w-48 rounded-2xl border border-white/10 bg-[#0d1527]/95 backdrop-blur-xl p-2 shadow-[0_8px_32px_rgba(0,0,0,0.5)] space-y-0.5 text-left"
                    >
                      <div className="px-3 py-2 border-b border-white/5">
                        <p className="text-[10px] font-semibold text-slate-400">Signed in as</p>
                        <p className="text-xs font-bold text-white truncate mt-0.5">{user?.name || "User"}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition-all hover:bg-white/5 hover:text-white"
                      >
                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Account
                      </Link>
                      {isAdminLoggedIn && (
                        <Link
                          to="/admin/events"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-[#8ce5db] transition-all hover:bg-[#8ce5db]/10"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="hidden sm:inline-flex whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                to="/login"
              >
                Login
              </Link>
              {globalCta?.label && globalCta?.href ? (
                <Link
                  className="whitespace-nowrap flex-shrink-0 rounded-full bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] px-4 sm:px-5 py-2 text-xs font-bold text-[#051426] transition-all duration-300 hover:shadow-[0_0_20px_rgba(140,229,219,0.3)] hover:scale-[1.03] active:scale-95"
                  to={globalCta.href}
                >
                  {globalCta.label}
                </Link>
              ) : null}
            </div>
          )}

          {/* Hamburger Menu Button (Mobile & Tablet) */}
          <button
            className="group flex lg:hidden flex-col items-center justify-center h-9 w-9 rounded-full border border-white/20 bg-white/[0.04] text-white transition-all duration-300 hover:bg-white/10 hover:border-white/30"
            type="button"
            onClick={() => {
              setIsMenuOpen((prev) => !prev);
              setIsNotifOpen(false);
              setIsProfileOpen(false);
            }}
            aria-label="Toggle navigation menu"
          >
            <span className={`block h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "translate-y-1.5 rotate-45" : ""}`} />
            <span className={`mt-1 block h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`} />
            <span className={`mt-1 block h-0.5 w-4 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "-translate-y-1.5 -rotate-45" : ""}`} />
          </button>

        </div>
      </div>

      {/* MOBILE DRAWER NAVIGATION PANEL */}
      <AnimatePresence>
        {isMenuOpen ? (
          <motion.nav
            key="mobile-nav"
            animate={{ height: "auto", opacity: 1 }}
            className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1527]/95 backdrop-blur-xl p-2 shadow-2xl lg:hidden pointer-events-auto"
            exit={{ height: 0, opacity: 0 }}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="flex flex-col gap-1 p-2">
              {navLinks.map((link) => (
                <NavLink
                  key={`${link.label}-${link.href}-mobile`}
                  to={link.href}
                  end={link.href === "/"}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-[#8ce5db]/10 text-[#8ce5db] border border-[#8ce5db]/20"
                        : "text-slate-200 hover:bg-white/5 hover:text-white"
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              {isAdminLoggedIn && (
                <Link
                  className="block rounded-xl px-4 py-3 text-sm font-bold text-[#8ce5db] transition hover:bg-white/5"
                  to="/admin/events"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}
              {isUserLoggedIn ? (
                <>
                  <Link
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="mt-2 block rounded-xl bg-red-500/10 px-5 py-3 text-center text-sm font-bold text-red-400 hover:bg-red-500/20 transition-all duration-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  {globalCta?.label && globalCta?.href ? (
                    <Link
                      className="mt-2 block rounded-xl bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] px-5 py-3 text-center text-sm font-bold text-[#051426] transition-all duration-300 hover:shadow-[0_0_20px_rgba(140,229,219,0.3)]"
                      to={globalCta.href}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {globalCta.label}
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </motion.nav>
        ) : null}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
