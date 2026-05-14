import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventBySlug } from "../api/eventApi.js";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";
import Container from "../components/layout/Container.jsx";
import { format } from "date-fns";

const EventDetailPage = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await getEventBySlug(slug);
        setEvent(res.data);
      } catch (error) {
        console.error("Failed to fetch event:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [slug]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#060b16] text-white">Loading...</div>;
  }

  if (!event) {
    return <div className="flex min-h-screen items-center justify-center bg-[#060b16] text-white">Event not found</div>;
  }

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Navbar />
      <main className="pb-20 pt-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
              <img src={event.eventImage} alt={event.title} className="aspect-square w-full object-cover" />
              {event.galleryImages?.length > 0 && (
                <div className="grid grid-cols-4 gap-2 p-2">
                  {event.galleryImages.map((img, i) => (
                    <img key={i} src={img} alt="" className="aspect-square rounded-xl object-cover" />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-8">
              <div>
                <span className="rounded-full border border-[#40e0d0]/30 bg-[#40e0d0]/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#40e0d0]">
                  {event.category}
                </span>
                <h1 className="mt-4 font-display text-4xl font-bold sm:text-5xl">{event.title}</h1>
                <p className="mt-6 text-lg leading-relaxed text-slate-300">{event.description}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard label="Date" value={format(new Date(event.eventDate), "EEEE, MMM dd, yyyy")} />
                <InfoCard label="Time" value={`${event.startTime} - ${event.endTime}`} />
                <InfoCard label="Venue" value={event.venue} />
                <InfoCard label="Registration Deadline" value={format(new Date(event.registrationDeadline), "MMM dd, yyyy")} />
                <InfoCard label="Fee" value={event.eventFee === 0 ? "Free" : `$${event.eventFee}`} />
                <InfoCard label="Skill Level" value={event.skillLevel} />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Important Information</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-300">
                  <p><strong>Age Restriction:</strong> {event.ageRestriction}</p>
                  <p><strong>Health Disclaimer:</strong> {event.healthDisclaimer}</p>
                  <p><strong>Availability:</strong> {event.maxParticipants - event.currentParticipants} spots left</p>
                </div>
              </div>

              <button className="w-full rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 text-lg font-bold text-[#061323] transition hover:scale-[1.02] active:scale-95 disabled:opacity-50" disabled={event.status !== "upcoming"}>
                {event.status === "upcoming" ? "Register Now" : `Event is ${event.status}`}
              </button>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-semibold text-white">{value}</p>
  </div>
);

export default EventDetailPage;
