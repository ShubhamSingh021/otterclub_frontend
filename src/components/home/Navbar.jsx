import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Live Notifications Center States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const checkAuth = () => {
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
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("focus", checkAuth);
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("focus", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  // Poll notifications
  useEffect(() => {
    if (isUserLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // Every 20 seconds
      return () => clearInterval(interval);
    }
  }, [isUserLoggedIn]);

  const fetchNotifications = async () => {
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
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.data && res.data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#050b16]/80 backdrop-blur-xl">
      <Container className="py-3 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <a className="flex-shrink-0" href="/">
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
          </a>

          <button
            className="group flex flex-col items-center justify-center rounded-xl border border-white/20 bg-white/[0.04] p-2.5 text-white lg:hidden"
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            <span className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`mt-1.5 block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "opacity-0" : ""}`} />
            <span className={`mt-1.5 block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${isMenuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <a
                key={`${link.label}-${link.href}`}
                className="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                href={link.href}
              >
                {link.label}
              </a>
            ))}
            {isAdminLoggedIn && (
              <a
                className="whitespace-nowrap rounded-full border border-[#40e0d0]/20 bg-[#40e0d0]/5 px-3.5 py-2 text-sm font-bold text-[#40e0d0] transition hover:bg-[#40e0d0]/10"
                href="/admin/events"
              >
                Admin
              </a>
            )}
            {isUserLoggedIn ? (
              <div className="flex items-center gap-3 ml-2 relative">
                {/* Notification Bell Dropdown Button */}
                <div className="relative">
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

                  <AnimatePresence>
                    {isNotifOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-3 z-50 w-96 rounded-2xl border border-white/10 bg-[#0a1222]/95 backdrop-blur-xl p-4 shadow-2xl space-y-3 animate-fade-in"
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-white/10">
                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                              <span>Notifications</span>
                              {unreadCount > 0 && (
                                <span className="bg-[#40e0d0]/20 text-[#40e0d0] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {unreadCount} new
                                </span>
                              )}
                            </h4>
                            {unreadCount > 0 && (
                              <button
                                onClick={handleMarkAllRead}
                                className="text-xs font-bold text-[#40e0d0] hover:underline"
                              >
                                Mark all read
                              </button>
                            )}
                          </div>

                          {/* Beautiful Scrollable Tabs */}
                          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10 text-xs">
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
                                    ? "bg-[#40e0d0] text-[#051426]"
                                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 text-left scrollbar-thin scrollbar-thumb-white/10">
                            {filteredNotifications.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-8">No notifications in this category.</p>
                            ) : (
                              filteredNotifications.map((notif) => {
                                // Determine a vibrant color scheme based on notification type
                                let badgeColor = "bg-slate-500/10 text-slate-400 border-slate-500/20";
                                if (notif.type === "payment") badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                                else if (notif.type === "event") badgeColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                                else if (notif.type === "membership") badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                                
                                return (
                                  <div
                                    key={notif._id}
                                    onClick={() => handleMarkOneRead(notif._id)}
                                    className={`p-3 rounded-xl border transition cursor-pointer relative ${
                                      notif.isRead
                                        ? "bg-white/[0.01] border-white/5 opacity-60"
                                        : "bg-white/[0.04] border-[#40e0d0]/20 hover:border-[#40e0d0]/40"
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
                                        <span className="h-2 w-2 rounded-full bg-[#40e0d0] shrink-0 mt-1" />
                                      )}
                                    </div>
                                    <p className="text-slate-300 text-[11px] mt-1.5 leading-relaxed">{notif.message}</p>
                                    {notif.link && (
                                      <a
                                        href={notif.link}
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#40e0d0] hover:underline mt-2"
                                      >
                                        <span>View details</span>
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                      </a>
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

                <a
                  href="/dashboard"
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 p-1 pr-4 transition hover:bg-white/10"
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#40e0d0] to-[#2d61ff]">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-[#060b16]">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white">{user?.name?.split(" ")[0]}</span>
                </a>
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
                <a
                  className="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  href="/login"
                >
                  Login
                </a>
                {globalCta?.label && globalCta?.href ? (
                  <a
                    className="ml-2 whitespace-nowrap flex-shrink-0 rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] px-5 py-2.5 text-sm font-bold text-[#051426] transition hover:shadow-[0_0_20px_rgba(64,224,208,0.3)] hover:scale-[1.02]"
                    href={globalCta.href}
                  >
                    {globalCta.label}
                  </a>
                ) : null}
              </>
            )}
          </nav>
        </div>

        <AnimatePresence>
          {isMenuOpen ? (
            <motion.nav
              key="mobile-nav"
              animate={{ height: "auto", opacity: 1 }}
              className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1222]/95 p-2 backdrop-blur-xl lg:hidden"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="flex flex-col gap-1 p-2">
                {navLinks.map((link) => (
                  <a
                    key={`${link.label}-${link.href}-mobile`}
                    className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
                {isUserLoggedIn ? (
                  <>
                    <a
                      className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
                      href="/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Account
                    </a>
                    <button
                      onClick={handleLogout}
                      className="mt-2 block rounded-xl bg-red-500/10 px-5 py-3 text-center text-sm font-bold text-red-400"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      className="block rounded-xl px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 hover:text-white"
                      href="/login"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </a>
                    {globalCta?.label && globalCta?.href ? (
                      <a
                        className="mt-2 block rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] px-5 py-3 text-center text-sm font-bold text-[#051426]"
                        href={globalCta.href}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {globalCta.label}
                      </a>
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
