import SectionHeader from "../common/SectionHeader.jsx";
import SectionWrapper from "../layout/SectionWrapper.jsx";

const palette = [
  "from-[#2d61ff]/30 to-[#163884]/30",
  "from-[#40e0d0]/25 to-[#0d6d87]/25",
  "from-[#8f65ff]/25 to-[#2b2f7f]/25",
];

const WhyJoinSection = ({ section }) => {
  if (!section) {
    return null;
  }

  return (
    <SectionWrapper id="why-join" className="relative">
      <div className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-56 max-w-5xl bg-[radial-gradient(circle,rgba(64,224,208,0.18),transparent_70%)] blur-2xl" />
      <SectionHeader label={section.sectionLabel} title={section.title} subtitle={section.subtitle || section.body} />
      <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(section.cards || []).map((card, index) => (
          <article
            key={`${card.title}-${index}`}
            className="group relative flex h-full flex-col overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#081122] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#72d9cf]/40"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${palette[index % palette.length]} opacity-80`} />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_0_0,rgba(255,255,255,0.14),transparent_40%)] opacity-80" />
            <div className="relative flex h-full flex-col">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-white">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 break-words font-display text-2xl font-semibold text-white">{card.title}</h3>
              {card.description ? <p className="mt-3 flex-grow break-words text-sm leading-relaxed text-slate-200">{card.description}</p> : null}
              {card.meta ? (
                <p className="mt-5 self-start rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#a3efe6]">
                  {card.meta}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default WhyJoinSection;
