import Container from "../layout/Container.jsx";

const defaultLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Contact", href: "#contact" },
];

const defaultSocials = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "X / Twitter", href: "https://twitter.com" },
  { label: "LinkedIn", href: "https://linkedin.com" },
];

const defaultSettings = {
  siteName: "Otter Society",
  siteTagline: "Building the future of community sports and athlete engagement.",
  contact: { address: "Global Presence | Premium Sports Club" },
};

const Footer = ({ settings: cmsSettings }) => {
  const settings = cmsSettings || defaultSettings;
  const socialLinks = settings?.socialLinks?.length ? settings.socialLinks : defaultSocials;
  const navLinks = settings?.navigationLinks?.length ? settings.navigationLinks : defaultLinks;

  return (
    <footer className="border-t border-white/10 bg-[#060b15] py-12">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_1fr]">
          <div className="space-y-4">
            <p className="font-display text-2xl font-semibold text-white">{settings?.siteName || "Club Platform"}</p>
            {settings?.siteTagline ? <p className="max-w-xs text-sm leading-relaxed text-slate-400">{settings.siteTagline}</p> : null}
            {settings?.contact?.address ? (
              <p className="max-w-xs text-sm leading-relaxed text-slate-500">{settings.contact.address}</p>
            ) : null}
          </div>

          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-200">Quick Links</p>
            <nav className="mt-6 flex flex-col gap-3 text-sm font-medium text-slate-400">
              {navLinks.map((link) => (
                <a key={`${link.label}-${link.href}-footer-nav`} className="transition hover:text-[#40e0d0]" href={link.href}>
                  {link.label}
                </a>
              ))}
              <a className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 transition hover:text-slate-400" href="/admin/login">
                Admin Portal
              </a>
            </nav>
          </div>

          <div className="flex flex-col gap-6 lg:items-end lg:text-right">
            <div className="space-y-1.5 text-sm font-medium text-slate-300">
              {settings?.contact?.email ? <p className="break-words">{settings.contact.email}</p> : null}
              {settings?.contact?.phone ? <p className="break-words">{settings.contact.phone}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {socialLinks.map((link) => (
                <a
                  key={`${link.label}-${link.href}-footer`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300 transition hover:border-[#40e0d0]/50 hover:bg-[#40e0d0]/10 hover:text-[#40e0d0]"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
