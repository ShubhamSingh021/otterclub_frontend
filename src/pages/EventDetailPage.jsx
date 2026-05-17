import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getEventBySlug } from "../api/eventApi.js";
import { getMyMembership } from "../api/membershipApi.js";
import Navbar from "../components/home/Navbar.jsx";
import Footer from "../components/home/Footer.jsx";
import Container from "../components/layout/Container.jsx";
import { format } from "date-fns";
import RegistrationModal from "../components/events/RegistrationModal.jsx";
import toast from "react-hot-toast";

const EventDetailPage = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);

  const checkDeadline = (deadlineDate) => {
    const now = new Date();
    const deadline = new Date(deadlineDate);
    // Set deadline to the end of the day (23:59:59) for better user experience
    deadline.setHours(23, 59, 59, 999);
    return now > deadline;
  };

  const fetchEvent = async () => {
    try {
      const res = await getEventBySlug(slug);
      setEvent(res.data);
      setIsDeadlinePassed(checkDeadline(res.data.registrationDeadline));
      
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const memberRes = await getMyMembership();
          if (memberRes.success) {
            setMembership(memberRes.data);
          }
        } catch (memberErr) {
          console.error("Failed to fetch membership on event page:", memberErr);
        }
      }
    } catch (error) {
      console.error("Failed to fetch event:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
              {event.galleryImages && Array.isArray(event.galleryImages) && event.galleryImages.length > 0 && (
                <div className="grid grid-cols-5 gap-2 p-3 bg-black/20">
                  {event.galleryImages.map((img, i) => {
                    const imgSrc = typeof img === 'string' ? img : img.url;
                    if (!imgSrc) return null;
                    return (
                      <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 transition hover:border-[#40e0d0]/50">
                        <img 
                          src={imgSrc} 
                          alt={`Gallery ${i}`} 
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.style.display = 'none';
                          }}
                        />
                      </div>
                    );
                  })}
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Fee</p>
                  <div className="flex items-center gap-3">
                    {event.eventFee === 0 ? (
                      <p className="mt-1 text-sm font-semibold text-white">Free</p>
                    ) : (
                      <>
                        {(() => {
                          const user = JSON.parse(localStorage.getItem("user") || "{}");
                          const membership = user.activeMembership?.membershipType;
                          let discount = 0;
                          if (membership === 'PRO') discount = 0.2;
                          else if (membership === 'ELITE') discount = 0.1;
                          
                          if (discount > 0) {
                            const discountedPrice = event.eventFee * (1 - discount);
                            return (
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-sm font-semibold text-[#40e0d0]">₹{discountedPrice}</span>
                                <span className="text-xs text-slate-500 line-through">₹{event.eventFee}</span>
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">Member Perk</span>
                              </div>
                            );
                          }
                          return <p className="mt-1 text-sm font-semibold text-white">₹{event.eventFee}</p>;
                        })()}
                      </>
                    )}
                  </div>
                </div>
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

              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 text-lg font-bold text-[#061323] transition hover:scale-[1.02] active:scale-95 disabled:opacity-50" 
                disabled={event.status !== "upcoming" || event.currentParticipants >= event.maxParticipants || isDeadlinePassed}
              >
                {event.status !== "upcoming" 
                  ? `Event is ${event.status}` 
                  : event.currentParticipants >= event.maxParticipants 
                    ? "Full Capacity" 
                    : isDeadlinePassed 
                      ? "Deadline Passed"
                      : "Register Now"
                }
              </button>
            </div>
          </div>
        </Container>
      </main>
      <RegistrationModal 
        event={event} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onShowSuccess={fetchEvent}
        membership={membership}
      />

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
