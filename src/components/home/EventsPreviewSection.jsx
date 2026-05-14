import { useEffect, useState } from "react";
import SectionHeader from "../common/SectionHeader.jsx";
import SectionWrapper from "../layout/SectionWrapper.jsx";
import { getUpcomingEvents } from "../../api/eventApi.js";
import { format } from "date-fns";

const fieldList = [
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "location", label: "Location" },
  { key: "price", label: "Price" },
  { key: "slots", label: "Slots" },
];

const EventsPreviewSection = ({ section }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await getUpcomingEvents();
        setEvents(res.data);
      } catch (error) {
        console.error("Failed to fetch upcoming events:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (!section) {
    return null;
  }

  return (
    <SectionWrapper id="events">
      <SectionHeader label={section.sectionLabel} title={section.title} subtitle={section.subtitle || section.body} />
      
      {loading ? (
        <div className="flex h-40 items-center justify-center text-slate-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-slate-400">No upcoming events at the moment.</div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {events.map((event) => (
            <article
              key={event._id}
              className="group flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0a1222] transition duration-300 hover:-translate-y-1 hover:border-[#61dbcf]/40 hover:shadow-soft"
            >
              <div className="relative flex-shrink-0">
                {event.eventImage ? (
                  <img alt={event.title} className="h-52 w-full object-cover" src={event.eventImage} />
                ) : (
                  <div className="h-52 w-full bg-gradient-to-br from-[#1b2f54] to-[#0f223e]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060b16] via-[#060b16]/40 to-transparent" />
                {event.isFeatured && (
                  <div className="absolute left-4 top-4 rounded-full border border-white/25 bg-[#081429]/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#9deee4] backdrop-blur-md">
                    Featured
                  </div>
                )}
                <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-sm">
                  {event.category}
                </div>
              </div>

              <div className="flex flex-grow flex-col p-5 sm:p-6">
                <h3 className="break-words font-display text-2xl font-semibold leading-tight text-white">{event.title}</h3>
                <p className="mt-3 line-clamp-2 flex-grow break-words text-sm leading-relaxed text-slate-300">
                  {event.description}
                </p>

                <dl className="mt-5 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Date</dt>
                    <dd className="mt-1 break-words text-xs font-semibold text-slate-200 sm:text-sm">
                      {format(new Date(event.eventDate), "MMM dd, yyyy")}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Time</dt>
                    <dd className="mt-1 break-words text-xs font-semibold text-slate-200 sm:text-sm">
                      {event.startTime}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Venue</dt>
                    <dd className="mt-1 truncate text-xs font-semibold text-slate-200 sm:text-sm" title={event.venue}>
                      {event.venue}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fee</dt>
                    <dd className="mt-1 break-words text-xs font-semibold text-slate-200 sm:text-sm">
                      {event.eventFee === 0 ? "Free" : `$${event.eventFee}`}
                    </dd>
                  </div>
                </dl>

                <a
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] px-5 py-2.5 text-sm font-bold text-[#061323] transition hover:scale-[1.02] sm:w-auto sm:self-start"
                  href={`/events/${event.slug}`}
                >
                  View Details
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionWrapper>
  );
};

export default EventsPreviewSection;
