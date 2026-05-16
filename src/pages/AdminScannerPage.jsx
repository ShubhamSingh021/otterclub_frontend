import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import toast from "react-hot-toast";
import axios from "axios";

const AdminScannerPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastScannedId, setLastScannedId] = useState(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    const scanner = new Html5QrcodeScanner("reader", {
      qrbox: {
        width: 250,
        height: 250,
      },
      fps: 5,
    });

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(result) {
      try {
        const data = JSON.parse(result);
        if (data.type === "event_ticket" && data.registrationId) {
          if (data.registrationId !== lastScannedId) {
            scanner.pause();
            setScanResult(data);
            setLastScannedId(data.registrationId);
            await verifyTicket(data.registrationId, scanner);
          }
        } else {
          toast.error("Invalid QR Code: Not an Otter Club ticket");
        }
      } catch (err) {
        // Not a JSON or invalid ticket
        console.error("Scan error:", err);
      }
    }

    function onScanError(err) {
      // console.warn(err);
    }

    return () => {
      scanner.clear();
    };
  }, [navigate, lastScannedId]);

  const verifyTicket = async (registrationId, scanner) => {
    setIsVerifying(true);
    const token = localStorage.getItem("adminToken");
    
    try {
      const response = await axios.post(
        `${API_URL}/registrations/admin/verify-qr`,
        { registrationId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message, { duration: 5000 });
        // Play success sound if possible
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Verification failed";
      toast.error(msg, { duration: 5000 });
    } finally {
      setIsVerifying(false);
      // Resume scanning after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setLastScannedId(null);
        scanner.resume();
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#060b16] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2 tracking-tight">ATTENDANCE SCANNER</h1>
          <p className="text-slate-400 text-sm font-medium">Scan visitor QR tickets to mark attendance</p>
        </div>

        <div className="relative rounded-[2.5rem] border border-white/10 bg-white/[0.02] p-6 overflow-hidden shadow-2xl">
          {isVerifying && (
            <div className="absolute inset-0 z-20 bg-[#060b16]/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-[#40e0d0] mb-4"></div>
              <p className="text-[#40e0d0] font-black uppercase tracking-widest text-xs">Verifying Ticket...</p>
            </div>
          )}

          <div id="reader" className="overflow-hidden rounded-3xl border border-white/5"></div>

          {scanResult && !isVerifying && (
            <div className="mt-6 p-4 rounded-2xl bg-[#40e0d0]/10 border border-[#40e0d0]/20 animate-pulse">
              <p className="text-[10px] text-[#40e0d0] font-black uppercase tracking-widest mb-1">Last Scanned</p>
              <p className="font-bold text-white">{scanResult.userName}</p>
              <p className="text-xs text-slate-400">{scanResult.eventTitle}</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate("/admin/events")}
          className="mt-8 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 transition"
        >
          Back to Events
        </button>
      </div>
      
      <style>{`
        #reader {
          border: none !important;
        }
        #reader__dashboard_section_csr button {
          background-color: #40e0d0 !important;
          color: #060b16 !important;
          border: none !important;
          padding: 8px 20px !important;
          border-radius: 12px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 12px !important;
          cursor: pointer !important;
        }
        #reader__scan_region video {
          border-radius: 20px !important;
        }
      `}</style>
    </div>
  );
};

export default AdminScannerPage;
