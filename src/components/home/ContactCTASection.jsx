import SectionWrapper from "../layout/SectionWrapper.jsx";

const defaultSection = {
  sectionLabel: "Get In Touch",
  title: "Ready to Elevate Your Game?",
  subtitle: "Join our community today or reach out for any inquiries. We're here to help you get started.",
  ctaLabel: "Join Otter Society",
  ctaHref: "/auth/register",
};

const defaultContact = {
  email: "hello@ottersociety.com",
  phone: "+1 (555) 000-0000",
  whatsapp: "+15550000000",
  address: "City Sports Complex, Downtown",
};

const ContactCTASection = ({ section: cmsSection, siteSettings }) => {
  const section = cmsSection || defaultSection;
  const contact = siteSettings?.contact || defaultContact;
  const contactCards = [
    { label: "Email", value: contact.email, href: contact.email ? `mailto:${contact.email}` : "" },
    { label: "Phone", value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : "" },
    { label: "WhatsApp", value: contact.whatsapp, href: contact.whatsapp ? `https://wa.me/${contact.whatsapp.replace(/[^\d]/g, "")}` : "" },
    { label: "Address", value: contact.address, href: contact.mapUrl || "" },
  ];

  return (
    <SectionWrapper id="contact">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0b1425] via-[#10233f] to-[#0a1322] p-6 text-white shadow-soft sm:p-10 lg:p-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-[#40e0d0]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-60 w-60 rounded-full bg-[#2a5aff]/30 blur-3xl" />

        <div className="relative">
          {section?.sectionLabel ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9deee4]">{section.sectionLabel}</p>
          ) : null}
          {section?.title ? (
            <h2 className="mt-3 max-w-3xl break-words font-display text-3xl font-semibold sm:text-4xl lg:text-5xl">
              {section.title}
            </h2>
          ) : null}
          {section?.subtitle || section?.body ? (
            <p className="mt-4 max-w-3xl break-words text-base text-slate-300 sm:text-lg">
              {section.subtitle || section.body}
            </p>
          ) : null}

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {contactCards
              .filter((card) => card.value)
              .map((card) => (
                <a
                  key={card.label}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-[#6fe1d3]/60 hover:bg-white/[0.08]"
                  href={card.href || undefined}
                >
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 group-hover:text-[#9deee4]">
                    {card.label}
                  </p>
                  <p className="mt-2 break-words font-semibold text-white sm:text-lg">{card.value}</p>
                </a>
              ))}
          </div>

          {section?.ctaLabel && section?.ctaHref ? (
            <a
              className="mt-10 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] px-8 py-3.5 text-sm font-bold text-[#061323] transition hover:shadow-[0_10px_25px_-5px_rgba(64,224,208,0.4)] hover:scale-[1.02] active:scale-95 sm:w-auto"
              href={section.ctaHref}
            >
              {section.ctaLabel}
            </a>
          ) : null}
        </div>
      </div>
    </SectionWrapper>
  );
};

export default ContactCTASection;
