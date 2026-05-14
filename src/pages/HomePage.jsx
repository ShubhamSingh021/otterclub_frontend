import EmptyHomepageState from "../components/common/EmptyHomepageState.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import LoadingState from "../components/common/LoadingState.jsx";
import AboutSection from "../components/home/AboutSection.jsx";
import ContactCTASection from "../components/home/ContactCTASection.jsx";
import EventsPreviewSection from "../components/home/EventsPreviewSection.jsx";
import HeroSection from "../components/home/HeroSection.jsx";
import TestimonialsSection from "../components/home/TestimonialsSection.jsx";
import WhyJoinSection from "../components/home/WhyJoinSection.jsx";
import AppShell from "../components/layout/AppShell.jsx";
import { useHomepage } from "../hooks/useHomepage";

const HomePage = () => {
  const { data, isLoading, error, refetch } = useHomepage();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const siteSettings = data?.siteSettings || null;
  const heroContent = data?.heroContent || null;
  const aboutContent = data?.aboutContent || null;
  const testimonials = data?.testimonials || [];
  const homepageSections = data?.homepageSections || {};

  const hasRenderableContent =
    Boolean(heroContent) ||
    Boolean(aboutContent) ||
    Boolean(homepageSections.whyJoinUs) ||
    Boolean(homepageSections.eventsPreview) ||
    Boolean(homepageSections.contactCta) ||
    testimonials.length > 0;

  return (
    <AppShell siteSettings={siteSettings}>
      {!hasRenderableContent ? <EmptyHomepageState /> : null}
      <HeroSection content={heroContent} />
      <AboutSection
        content={aboutContent}
        fallbackImageUrl={heroContent?.backgroundImageUrl || siteSettings?.logoUrl || ""}
      />
      <WhyJoinSection section={homepageSections.whyJoinUs} />
      <EventsPreviewSection section={homepageSections.eventsPreview} />
      <TestimonialsSection section={homepageSections.testimonials} testimonials={testimonials} />
      <ContactCTASection section={homepageSections.contactCta} siteSettings={siteSettings} />
    </AppShell>
  );
};

export default HomePage;
