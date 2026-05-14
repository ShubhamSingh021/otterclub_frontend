const SectionHeader = ({ label, title, subtitle, align = "center", className = "" }) => (
  <div
    className={`mb-10 max-w-3xl sm:mb-14 ${
      align === "left" ? "mr-auto text-left" : "mx-auto text-center"
    } ${className}`}
  >
    {label ? (
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7ee0d3]">{label}</p>
    ) : null}
    {title ? (
      <h2 className="mt-4 break-words font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
    ) : null}
    {subtitle ? <p className="mt-5 break-words text-base leading-relaxed text-slate-300 sm:text-lg">{subtitle}</p> : null}
  </div>
);

export default SectionHeader;
