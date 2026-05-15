import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import SectionHeader from "../common/SectionHeader.jsx";
import SectionWrapper from "../layout/SectionWrapper.jsx";

const windowSize = 3;

const defaultSection = {
  sectionLabel: "Testimonials",
  title: "What Our Members Say",
  subtitle: "Real stories from athletes and community members who have found their home with us.",
};

const defaultTestimonials = [
  {
    _id: "default-1",
    quote: "Otter Society has completely changed how I approach my sport. The community is supportive and the events are top-notch.",
    personName: "Alex Rivera",
    personRole: "Member since 2024",
  },
  {
    _id: "default-2",
    quote: "I've made lifelong friends here. The atmosphere is always positive and energetic. Highly recommend joining!",
    personName: "Sarah Jenkins",
    personRole: "Community Lead",
  },
  {
    _id: "default-3",
    quote: "The best platform for competitive sports in the region. The organization is seamless and the level of play is excellent.",
    personName: "Michael Chen",
    personRole: "Professional Athlete",
  },
];

const TestimonialsSection = ({ testimonials: cmsTestimonials, section: cmsSection }) => {
  const testimonials = (cmsTestimonials?.length ? cmsTestimonials : defaultTestimonials);
  const section = cmsSection || defaultSection;

  const [startIndex, setStartIndex] = useState(0);
  const canSlide = testimonials.length > windowSize;

  const visibleItems = useMemo(() => {
    if (!canSlide) {
      return testimonials;
    }

    const items = [];
    for (let i = 0; i < windowSize; i += 1) {
      items.push(testimonials[(startIndex + i) % testimonials.length]);
    }
    return items;
  }, [canSlide, startIndex, testimonials]);

  return (
    <SectionWrapper id="testimonials">
      <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:mb-12 sm:flex-row sm:items-end">
        <SectionHeader
          label={section?.sectionLabel}
          title={section?.title}
          subtitle={section?.subtitle || section?.body}
          align="left"
          className="mb-0"
        />
        {canSlide ? (
          <div className="flex gap-2 self-end">
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/[0.03] text-xl text-white transition hover:border-[#6ee0d2] hover:bg-white/5 active:scale-95"
              type="button"
              onClick={() => setStartIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              aria-label="Previous testimonials"
            >
              ‹
            </button>
            <button
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-white/[0.03] text-xl text-white transition hover:border-[#6ee0d2] hover:bg-white/5 active:scale-95"
              type="button"
              onClick={() => setStartIndex((prev) => (prev + 1) % testimonials.length)}
              aria-label="Next testimonials"
            >
              ›
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item, index) => (
          <motion.article
            key={item._id}
            animate={{ opacity: 1, y: 0 }}
            className={`group flex h-full flex-col rounded-[1.6rem] border border-white/10 bg-gradient-to-b from-[#101b31] to-[#0b1427] p-6 shadow-soft transition hover:border-[#6ee0d2]/45 ${index >= 1 ? "hidden md:flex" : "flex"} ${index >= 2 ? "hidden lg:flex" : ""}`}
            initial={{ opacity: 0, y: 16 }}
            transition={{ delay: index * 0.06, duration: 0.25 }}
          >
            <p className="font-display text-4xl leading-none text-[#66dcd0]">“</p>
            <p className="mt-3 flex-grow break-words text-sm leading-relaxed text-slate-200 sm:text-base">{item.quote}</p>
            <div className="mt-6 flex items-center gap-3 border-t border-white/5 pt-5">
              {item.avatarUrl ? (
                <img
                  alt={item.personName}
                  className="h-11 w-11 rounded-full border-2 border-[#7be0d5] object-cover"
                  src={item.avatarUrl}
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.08] text-xs font-semibold text-slate-200">
                  {(item.personName || "N").slice(0, 1)}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{item.personName}</p>
                {item.personRole ? <p className="truncate text-xs text-slate-400">{item.personRole}</p> : null}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </SectionWrapper>
  );
};

export default TestimonialsSection;
