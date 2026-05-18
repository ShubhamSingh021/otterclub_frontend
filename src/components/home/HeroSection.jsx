import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Container from "../layout/Container.jsx";

const defaultContent = {
  eyebrow: "Welcome to Otter Society",
  title: "Empowering Your Passion for Sports",
  subtitle: "Join a vibrant community of athletes and enthusiasts. Discover premium events, connect with peers, and elevate your game.",
  primaryCta: { label: "Explore Events", href: "/#events" },
  secondaryCta: { label: "Learn More", href: "/#about" },
  stats: [
    { label: "Athletes & Members", value: "2,500+" },
    { label: "Coaching Sessions / Month", value: "320+" },
    { label: "Active Programs", value: "18" },
    { label: "Weekly Community Events", value: "12" },
  ],
};

const HeroSection = ({ content: cmsContent, stats: liveStats }) => {
  const content = cmsContent || defaultContent;
  
  // Seamlessly link live backend database/CMS stats to the Hero showcase cards!
  const stats = liveStats
    ? [
        { label: liveStats.stat1Label || "Athletes & Members", value: liveStats.stat1Value || "2,500+" },
        { label: liveStats.stat2Label || "Coaching Sessions / Month", value: liveStats.stat2Value || "320+" },
        { label: liveStats.stat3Label || "Active Programs", value: liveStats.stat3Value || "18" },
        { label: liveStats.stat4Label || "Weekly Community Events", value: liveStats.stat4Value || "12" },
      ]
    : (content.stats && content.stats.length > 0 ? content.stats : defaultContent.stats);

  return (
    <section id="home" className="relative pb-10 pt-7 sm:pt-10 lg:pt-12 lg:pb-16">
      <Container>
        <div
          className="relative overflow-hidden rounded-[1.8rem] sm:rounded-[2.2rem] lg:rounded-[2.8rem] border border-white/[0.08] bg-cover bg-[position:82%_center] md:bg-center shadow-[0_20px_60px_rgba(0,0,0,0.35),_inset_0_1px_1px_rgba(255,255,255,0.08),_0_0_50px_rgba(140,229,219,0.04)]"
          style={{
            backgroundImage: content.backgroundImageUrl
              ? `linear-gradient(115deg, rgba(2, 8, 24, 0.94), rgba(5, 18, 42, 0.78) 55%, rgba(64, 224, 208, 0.2)), url(${content.backgroundImageUrl})`
              : "linear-gradient(115deg, rgba(2, 8, 24, 0.96), rgba(5, 18, 42, 0.8) 55%, rgba(64, 224, 208, 0.24))",
          }}
        >
          <div className="absolute -right-16 -top-16 h-60 w-60 rounded-full bg-[#40e0d0]/15 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-[#2a5aff]/25 blur-3xl" />

          <div className="relative px-4 py-10 sm:px-10 sm:py-20 lg:px-14 lg:py-24 flex flex-col items-center justify-center">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto text-center flex flex-col items-center justify-center"
              initial={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.5 }}
            >
              {content.eyebrow ? (
                <p className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.26em] text-[#9eece2] sm:text-xs">
                  {content.eyebrow}
                </p>
              ) : null}

              <h1 className="mt-6 break-words font-display text-2xl xs:text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.1] tracking-tight text-white">
                {content.title}
              </h1>
              {content.subtitle ? (
                <p className="mt-4 sm:mt-6 max-w-2xl break-words text-sm xs:text-base sm:text-lg lg:text-xl leading-relaxed text-slate-200 text-center mx-auto">{content.subtitle}</p>
              ) : null}

              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-5 w-full max-w-md sm:max-w-none mx-auto">
                {content.primaryCta?.label && content.primaryCta?.href ? (
                  content.primaryCta.href.startsWith("/") ? (
                    <Link
                      className="h-14 px-10 rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] flex items-center justify-center text-sm font-bold text-[#041224] tracking-wide uppercase shadow-[0_0_20px_rgba(64,224,208,0.25)] hover:shadow-[0_0_30px_rgba(64,224,208,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-auto shrink-0"
                      to={content.primaryCta.href}
                    >
                      {content.primaryCta.label}
                    </Link>
                  ) : (
                    <a
                      className="h-14 px-10 rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] flex items-center justify-center text-sm font-bold text-[#041224] tracking-wide uppercase shadow-[0_0_20px_rgba(64,224,208,0.25)] hover:shadow-[0_0_30px_rgba(64,224,208,0.45)] hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-auto shrink-0"
                      href={content.primaryCta.href}
                    >
                      {content.primaryCta.label}
                    </a>
                  )
                ) : null}
                {content.secondaryCta?.label && content.secondaryCta?.href ? (
                  content.secondaryCta.href.startsWith("/") ? (
                    <Link
                      className="h-14 px-10 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur-md flex items-center justify-center text-sm font-bold text-white tracking-wide uppercase hover:bg-white/[0.08] hover:border-white/30 hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-auto shrink-0"
                      to={content.secondaryCta.href}
                    >
                      {content.secondaryCta.label}
                    </Link>
                  ) : (
                    <a
                      className="h-14 px-10 rounded-full border border-white/15 bg-white/[0.03] backdrop-blur-md flex items-center justify-center text-sm font-bold text-white tracking-wide uppercase hover:bg-white/[0.08] hover:border-white/30 hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-auto shrink-0"
                      href={content.secondaryCta.href}
                    >
                      {content.secondaryCta.label}
                    </a>
                  )
                ) : null}
              </div>
            </motion.div>

            {stats.length > 0 ? (
              <div className="mt-10 grid gap-2.5 xs:gap-3 grid-cols-2 lg:mt-16 lg:grid-cols-4 w-full">
                {stats.map((stat, index) => (
                  <motion.article
                    key={`${stat.label}-${index}`}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel rounded-2xl p-3 xs:p-4 sm:p-5"
                    initial={{ opacity: 0, y: 16 }}
                    transition={{ delay: index * 0.06, duration: 0.3 }}
                  >
                    <p className="break-words font-display text-lg xs:text-xl sm:text-3xl lg:text-4xl font-bold text-white">{stat.value}</p>
                    <p className="mt-1 break-words text-[10px] xs:text-xs font-medium uppercase tracking-wider text-slate-400 sm:text-sm">{stat.label}</p>
                  </motion.article>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
