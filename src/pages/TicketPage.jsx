import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";
import toast from "react-hot-toast";
import html2canvas from "html2canvas";

const TicketPage = () => {
  const { id } = useParams();
  const [qrCode, setQrCode] = useState("");
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/registrations/ticket-qr/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCode(response.data.data.qrCode);
      setRegistration(response.data.data.registration);
    } catch (error) {
      toast.error("Failed to load ticket");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      // Tiny delay to settle state
      await new Promise((resolve) => setTimeout(resolve, 350));
      
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3, // Premium print quality
        useCORS: true, // Allow fetching Cloudinary images across origins
        backgroundColor: "#060b16",
        logging: false,
        allowTaint: true,
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.download = `OtterPass_${registration?.bookingId || "ticket"}.png`;
      link.href = image;
      link.click();
      toast.success("Premium Entry Pass downloaded!");
    } catch (error) {
      console.error("Pass Generation Error:", error);
      toast.error("Failed to generate premium pass image");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060b16]">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
      </div>
    );
  }

  const event = registration?.event;

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center">
        
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-br from-[#40e0d0]/10 to-[#2d61ff]/10 blur-3xl pointer-events-none" />

        {/* Premium Ticket Wrapper */}
        <div className="w-full max-w-sm mb-8 z-10">
          <div 
            ref={ticketRef}
            className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl p-6"
            style={{
              background: "linear-gradient(135deg, #0b1220 0%, #060a12 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 50px rgba(64, 224, 208, 0.1)"
            }}
          >
            {/* Top Cyan Glow Bar */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#40e0d0] to-transparent opacity-80" />

            {/* Glowing VIP Watermark Banner */}
            <div className="flex justify-between items-center mb-6">
              <span className="text-[10px] tracking-[0.25em] font-black uppercase text-[#40e0d0] bg-[#40e0d0]/10 px-3 py-1 rounded-full border border-[#40e0d0]/20 shadow-[0_0_15px_rgba(64,224,208,0.15)]">
                Exclusive Pass
              </span>
              <span className="text-xs font-bold text-slate-500 tracking-wider">
                {registration?.bookingId}
              </span>
            </div>

            {/* Event Cover Image Area */}
            {event?.eventImage && (
              <div className="relative w-full h-36 rounded-2xl overflow-hidden mb-6 border border-white/5 shadow-inner">
                <img 
                  src={event.eventImage} 
                  alt={event.title} 
                  className="w-full h-full object-cover" 
                  crossOrigin="anonymous" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060a12] via-transparent to-black/40" />
                
                {/* Event Category overlay */}
                {event?.category && (
                  <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase bg-[#2d61ff]/80 backdrop-blur-md px-2.5 py-1 rounded-lg tracking-widest">
                    {event.category}
                  </span>
                )}
              </div>
            )}

            {/* Ticket Info Section */}
            <div className="space-y-4 text-left px-2">
              <h2 className="text-2xl font-black tracking-tight leading-tight bg-gradient-to-r from-white to-slate-350 bg-clip-text text-transparent uppercase">
                {event?.title || "OTTER SOCIETY EVENT"}
              </h2>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Date</p>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{formatDate(event?.eventDate)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Time</p>
                  <p className="text-xs font-semibold text-slate-200 mt-0.5">{event?.startTime} - {event?.endTime}</p>
                </div>
              </div>

              <div>
                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Venue</p>
                <p className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">{event?.venue}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Attendee</p>
                  <p className="text-xs font-semibold text-white mt-0.5 truncate">{registration?.fullName || "Member"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Access Tier</p>
                  <p className="text-xs font-bold text-[#40e0d0] mt-0.5 uppercase tracking-wide">
                    {event?.eventFee === 0 ? "Free Entry" : "Paid Pass"}
                  </p>
                </div>
              </div>
            </div>

            {/* Realistic Tear-Stub Cutout Divider */}
            <div className="relative flex items-center py-6">
              {/* Left Circular Tear */}
              <div className="absolute left-0 -ml-9 h-6 w-6 rounded-full bg-[#060b16] border border-white/10" />
              {/* Dashed Tear Line */}
              <div className="w-full border-t border-dashed border-white/20 mx-1" />
              {/* Right Circular Tear */}
              <div className="absolute right-0 -mr-9 h-6 w-6 rounded-full bg-[#060b16] border border-white/10" />
            </div>

            {/* QR Code and Stub verification area */}
            <div className="flex flex-col items-center justify-center pb-2">
              <div className="relative group mb-4">
                {/* Glowing Aura under QR */}
                <div className="absolute -inset-2 bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] rounded-2xl opacity-20 blur-md group-hover:opacity-35 transition duration-500" />
                <div className="relative bg-white p-4 rounded-xl shadow-2xl inline-block border border-white/10">
                  <img src={qrCode} alt="Verification QR" className="h-40 w-40" />
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/25 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                  Valid Entry Pass
                </span>
              </div>
              
              <p className="text-[9px] text-slate-500 mt-3 font-semibold uppercase tracking-widest text-center">
                Scan QR at Entry point
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Controls / Interactive Buttons */}
        <div className="w-full max-w-sm space-y-4 px-2 z-10">
          
          {/* Download Premium Pass Button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="relative group overflow-hidden w-full py-4 rounded-2xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] text-[#061323] font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(64,224,208,0.25)] hover:shadow-[0_0_30px_rgba(64,224,208,0.5)] disabled:opacity-50"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center justify-center gap-2">
              {downloading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-[#061323]" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating Pass...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Premium Pass
                </>
              )}
            </span>
          </button>

          {/* Secondary Actions */}
          <div className="flex gap-4">
            <button 
              onClick={() => window.print()}
              className="flex-1 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-white font-bold text-xs hover:bg-white/15 transition uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm5-14V4a2 2 0 114 0v8" />
              </svg>
              Print Pass
            </button>
            
            <button 
              onClick={() => navigate("/dashboard")}
              className="flex-1 py-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 font-bold text-xs hover:bg-white/15 hover:text-white transition uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              My Dashboard
            </button>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TicketPage;
