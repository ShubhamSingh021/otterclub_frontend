import Footer from "../home/Footer.jsx";
import Navbar from "../home/Navbar.jsx";

const AppShell = ({ siteSettings, children }) => (
  <div className="relative min-h-screen overflow-x-hidden bg-surface">
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[700px] bg-[radial-gradient(circle_at_15%_0%,rgba(64,224,208,0.12),transparent_40%),radial-gradient(circle_at_85%_0%,rgba(28,94,255,0.18),transparent_45%)]" />
    <Navbar settings={siteSettings} />
    <main className="relative flex-grow">{children}</main>
    <Footer settings={siteSettings} />
  </div>
);

export default AppShell;
