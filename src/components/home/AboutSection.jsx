import CMSImage from "../common/CMSImage.jsx";
import SectionHeader from "../common/SectionHeader.jsx";
import SectionWrapper from "../layout/SectionWrapper.jsx";

const defaultContent = {
  sectionLabel: "About Us",
  heading: "Driven by Sports, United by Community",
  description: "Otter Society is more than just a club; it's a movement. We bring together individuals who share a passion for athleticism, competition, and mutual growth.",
  mission: "To create an inclusive ecosystem where every member can thrive through high-quality sporting events and meaningful connections.",
  vision: "To become the premier destination for sports enthusiasts seeking both competitive excellence and a supportive community.",
  keyPoints: [
    "Professional Event Management",
    "Diverse Sporting Categories",
    "Exclusive Member Benefits",
    "Vibrant Networking Opportunities",
  ],
};

const AboutSection = ({ content: cmsContent, fallbackImageUrl }) => {
  const content = cmsContent || defaultContent;

  const primaryImage = content.imageUrl || fallbackImageUrl || "";

  return (
    <SectionWrapper id="about">
      <SectionHeader
        align="left"
        label={content.sectionLabel}
        title={content.heading}
        subtitle={content.description}
      />
      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[1.8rem] border border-white/10">
          <CMSImage
            alt={content.heading}
            src={primaryImage}
            fallbackSrc={fallbackImageUrl}
            wrapperClassName="h-full min-h-[320px]"
            className="h-full min-h-[320px] w-full object-cover"
            fallbackClassName="h-full min-h-[320px] w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040914] via-transparent to-transparent" />

          <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-[#0b1425]/85 p-4 backdrop-blur-md sm:p-5">
            {content.mission ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7ee0d3]">Mission</p>
                <p className="mt-2 break-words text-sm leading-relaxed text-slate-200 sm:text-base">{content.mission}</p>
              </>
            ) : null}
          </div>
        </div>

        <div className="glass-panel rounded-[1.8rem] p-5 sm:p-7 lg:p-8">
          {content.vision ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#7ee0d3]">Vision</p>
              <p className="mt-3 break-words text-sm leading-relaxed text-slate-200 sm:text-base">{content.vision}</p>
            </div>
          ) : null}

          <div className="mt-4 space-y-3 sm:mt-5">
            {(content.keyPoints || []).map((point, index) => (
              <div
                key={`${point}-${index}`}
                className="rounded-2xl border border-white/10 bg-[#0a1222] p-4 transition hover:border-[#4fd6cd]/40 hover:bg-[#0d172b]"
              >
                <p className="break-words text-sm leading-relaxed text-slate-200">{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};

export default AboutSection;
