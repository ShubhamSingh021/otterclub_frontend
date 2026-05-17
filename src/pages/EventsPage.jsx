import { useEffect, useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { getEvents } from "../api/eventApi.js";
import AppShell from "../components/layout/AppShell.jsx";
import SectionHeader from "../components/common/SectionHeader.jsx";
import SectionWrapper from "../components/layout/SectionWrapper.jsx";
import ErrorState from "../components/common/ErrorState.jsx";
import { SkeletonCard } from "../components/common/SkeletonLoader.jsx";
import { format } from "date-fns";

// Memoized EventCard Component for fine-grained re-render optimization
const EventCard = memo(({ event }) => {
  return (
    <article
      className="group flex flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1222]/80 backdrop-blur-md transition duration-300 hover:-translate-y-2 hover:border-[#8ce5db]/40 hover:shadow-2xl"
    >
      <div className="relative h-60 overflow-hidden">
        {event.eventImage ? (
          <img 
            alt={event.title} 
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110" 
            src={event.eventImage} 
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1b2f54] to-[#0f223e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#060b16] via-transparent to-transparent" />
        <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
          {event.category}
        </div>
      </div>

      <div className="flex flex-grow flex-col p-6 lg:p-8">
        <h3 className="font-display text-2xl font-bold leading-tight text-white group-hover:text-[#8ce5db] transition-colors">
          {event.title}
        </h3>
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-slate-400">
          {event.description}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Date</p>
            <p className="mt-1 text-xs font-bold text-slate-200">
              {format(new Date(event.eventDate), "MMM dd, yyyy")}
            </p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fee</p>
            <p className="mt-1 text-xs font-bold text-slate-200">
              {event.eventFee === 0 ? "Free" : `₹${event.eventFee}`}
            </p>
          </div>
        </div>

        <Link
          className="mt-8 inline-flex items-center justify-center rounded-full bg-white/5 border border-white/10 px-8 py-3 text-sm font-bold text-white transition hover:bg-white/10 hover:border-[#8ce5db]/50"
          to={`/events/${event.slug}`}
        >
          Explore Event
        </Link>
      </div>
    </article>
  );
});

EventCard.displayName = "EventCard";

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEvents({ status: "upcoming" });
      setEvents(res.data || []);
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setError("Unable to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  if (error) return <ErrorState message={error} onRetry={fetchEvents} />;

  return (
    <AppShell>
      <div className="pt-24 pb-20 min-h-screen bg-[#060b16]">
        <SectionWrapper id="all-events">
          <SectionHeader 
            label="Events Calendar" 
            title="All Upcoming Action" 
            subtitle="Explore our full list of events and register for your favorites." 
          />

          {loading ? (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard count={3} />
            </div>
          ) : events.length === 0 ? (
            <div className="flex h-60 items-center justify-center text-slate-400 italic">
              No upcoming events found.
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </SectionWrapper>
      </div>
    </AppShell>
  );
};

export default EventsPage;
