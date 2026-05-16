import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import Container from "../layout/Container.jsx";

const sortLinks = (links = []) =>
  [...links].sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

const defaultLinks = [
  { label: "Home", href: "/#home", order: 1 },
  { label: "Membership", href: "/membership", order: 2 },
  { label: "Events", href: "/#events", order: 3 },
  { label: "About", href: "/#about", order: 4 },
  { label: "Testimonials", href: "/#testimonials", order: 5 },
  { label: "Contact", href: "/#contact", order: 6 },
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

  useEffect(() => {
    setIsUserLoggedIn(!!localStorage.getItem("token"));
    setIsAdminLoggedIn(!!localStorage.getItem("adminToken"));
  }, []);

  const navLinks = useMemo(() => sortLinks(settings?.navigationLinks?.length ? settings.navigationLinks : defaultLinks), [settings]);
  const globalCta = settings?.globalCta || defaultSettings.globalCta;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
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
                  {settings?.siteName || "Club Platform"}
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
              <div className="flex items-center gap-1">
                <a
                  className="whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
                  href="/dashboard"
                >
                  My Account
                </a>
                <button
                  onClick={handleLogout}
                  className="ml-2 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20"
                >
                  Logout
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
                    className="ml-2 rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] px-5 py-2.5 text-sm font-bold text-[#051426] transition hover:shadow-[0_0_20px_rgba(64,224,208,0.3)] hover:scale-[1.02]"
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
