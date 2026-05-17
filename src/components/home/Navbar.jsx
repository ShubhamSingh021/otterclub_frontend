import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
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
  { label: "Home", href: "/#home", order: 1 },
  { label: "Membership", href: "/membership", order: 2 },
  { label: "Events", href: "/#events", order: 3 },
  { label: "Community", href: "/community", order: 4 },
  { label: "About", href: "/#about", order: 5 },
  { label: "Testimonials", href: "/#testimonials", order: 6 },
  { label: "Contact", href: "/#contact", order: 7 },
];

const defaultSettings = {
  siteName: "Otter Society",
  siteTagline: "Premium Sports Community",
  globalCta: { label: "Get Started", href: "/register" },
};

const Navbar = ({ settings: cmsSettings }) => {
  const settings = cmsSettings || defaultSettings;
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

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

  const navLinks = useMemo(() => sortLinks(settings?.navigationLinks?.length ? settings.navigationLinks : defaultLinks), [settings]);
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

  // Helper component to conditionally render SPA Link or external <a> tag
  const SmartLink = ({ href, className, children, onClick }) => {
    const isHash = href.startsWith("#") || href.includes("/#");
    if (isHash) {
      return (
        <a href={href} className={className} onClick={onClick}>
          {children}
        </a>
      );
    }
    return (
      <Link to={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#050b16]/80 backdrop-blur-xl">
      <Container className="py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link className="flex-shrink-0" to="/">
            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1.5 sm:rounded-2xl sm:px-2.5">
              <img src="/logo.jpg" alt="Otter Society" className="h-7 w-7 rounded-lg object-cover sm:h-8 sm:w-8" />
              <div className="min-w-0">
                <p className="max-w-[120px] truncate font-display text-sm font-semibold text-white sm:max-w-none sm:text-base">
                  {settings?.siteName || "Otter Society"}
                </p>
                {settings?.siteTagline ? (
                  <p className="truncate text-[9px] uppercase tracking-[0.14em] text-slate-400 sm:text-[10px]">
                    {settings.siteTagline}
                  </p>
                ) : null}
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-2 lg:hidden">
            {/* Notification Bell on Mobile Header (Visible if logged in) */}
            {isUserLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
                  title="Notifications"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-[#050b16]">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}

            <button
              className="group flex flex-col items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] p-2.5 text-white"
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              <span className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`mt-1.5 block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`} />
              <span className={`mt-1.5 block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </button>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <SmartLink
                key={`${link.label}-${link.href}`}
                className="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                href={link.href}
              >
                {link.label}
              </SmartLink>
            ))}
            {isAdminLoggedIn && (
              <Link
                className="whitespace-nowrap rounded-full border border-[#8ce5db]/20 bg-[#8ce5db]/5 px-3.5 py-2 text-sm font-bold text-[#8ce5db] transition hover:bg-[#8ce5db]/10"
                to="/admin/events"
              >
                Admin
              </Link>
            )}
            {isUserLoggedIn ? (
              <div className="flex items-center gap-3 ml-2 relative">
                {/* Notification Bell Dropdown Button (Desktop) */}
                <div className="relative hidden lg:block">
                  <button
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
                    title="Notifications"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#050b16]">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                </div>

                <Link
                  to="/dashboard"
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1 pr-4 transition hover:bg-white/10"
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#8ce5db] to-[#2d61ff]">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#060b16]">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">{user?.name?.split(" ")[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-400 transition hover:bg-red-500/20"
                  title="Logout"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <Link
                  className="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  to="/login"
                >
                  Login
                </Link>
                {globalCta?.label && globalCta?.href ? (
                  <SmartLink
                    className="ml-2 whitespace-nowrap flex-shrink-0 rounded-full bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] px-5 py-2.5 text-sm font-bold text-[#051426] transition hover:shadow-[0_0_20px_rgba(140,229,219,0.3)] hover:scale-[1.02]"
                    href={globalCta.href}
                  >
                    {globalCta.label}
                  </SmartLink>
                ) : null}
              </>
            )}
          </nav>
        </div>

        {/* Global Notification Dropdown Overlay Container (Shared Desktop & Mobile) */}
        <AnimatePresence>
          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
              
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-4 sm:right-12 mt-3 z-50 w-[calc(100vw-32px)] sm:w-96 rounded-2xl border border-white/10 bg-[#0d1527] p-4 shadow-2xl space-y-3 animate-fade-in"
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

                {/* Scrollable Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 text-xs">
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
                            <SmartLink
                              href={notif.link}
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
                            </SmartLink>
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

        {/* Mobile Menu Dropdown Panel */}
        <AnimatePresence>
          {isMenuOpen ? (
            <motion.nav
              key="mobile-nav"
              animate={{ height: "auto", opacity: 1 }}
              className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1527] p-2 backdrop-blur-xl lg:hidden"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex flex-col gap-1 p-2">
                {navLinks.map((link) => (
                  <SmartLink
                    key={`${link.label}-${link.href}-mobile`}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </SmartLink>
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
                      className="mt-2 block rounded-xl bg-red-500/10 px-5 py-3 text-center text-sm font-bold text-red-400"
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
                      <SmartLink
                        className="mt-2 block rounded-xl bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] px-5 py-3 text-center text-sm font-bold text-[#051426]"
                        href={globalCta.href}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {globalCta.label}
                      </SmartLink>
                    ) : null}
                  </>
                )}
              </div>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </Container>
    </header>
  );
};

export default Navbar;
