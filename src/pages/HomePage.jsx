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
  const featuredEvents = data?.featuredEvents || [];

  console.log("FRONTEND_HOMEPAGE_DEBUG: featuredEvents count:", featuredEvents.length);
  if (featuredEvents.length > 0) {
    console.log("FRONTEND_HOMEPAGE_DEBUG: First event:", featuredEvents[0].title);
  }

  return (
    <AppShell siteSettings={siteSettings}>
      <HeroSection content={heroContent} />
      <AboutSection
        content={aboutContent}
        fallbackImageUrl={heroContent?.backgroundImageUrl || siteSettings?.logoUrl || ""}
      />
      <WhyJoinSection section={homepageSections.whyJoinUs} />
      <EventsPreviewSection 
        section={homepageSections.eventsPreview} 
        featuredEvents={featuredEvents}
      />
      <TestimonialsSection section={homepageSections.testimonials} testimonials={testimonials} />
      <ContactCTASection section={homepageSections.contactCta} siteSettings={siteSettings} />
    </AppShell>
  );
};

export default HomePage;
