import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";
import toast from "react-hot-toast";

const TicketPage = () => {
  const { id } = useParams();
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
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
      setQrCode(response.data.data);
    } catch (error) {
      toast.error("Failed to load ticket");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060b16]">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <div className="max-w-md w-full rounded-[3rem] border border-white/10 bg-white/[0.02] p-10 text-center relative overflow-hidden">
          {/* Glass background effects */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#40e0d0] to-transparent" />
          
          <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">Your Entry Pass</h1>
          <p className="text-slate-500 text-sm mb-10 font-medium tracking-wide">Present this QR code at the event entrance</p>
          
          <div className="relative mb-10 group">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#40e0d0] to-[#2d61ff] rounded-[2.5rem] opacity-20 blur-xl group-hover:opacity-40 transition duration-1000" />
            <div className="relative bg-white p-6 rounded-[2rem] shadow-2xl inline-block">
              <img src={qrCode} alt="Ticket QR" className="h-48 w-48" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Pass Status</p>
              <div className="flex items-center justify-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-sm font-bold text-green-500 uppercase tracking-widest">Valid Entry</p>
              </div>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black hover:bg-white/10 transition uppercase tracking-widest text-xs"
            >
              Print Ticket
            </button>
            
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-slate-500 text-sm font-bold hover:text-white transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TicketPage;
