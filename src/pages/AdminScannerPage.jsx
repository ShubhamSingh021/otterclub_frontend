import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import toast from "react-hot-toast";
import axios from "axios";

const AdminScannerPage = () => {
  const [scanResult, setScanResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastScannedId, setLastScannedId] = useState(null);
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    // Delay initialization slightly to prevent React 18 double-mount issues
    const timer = setTimeout(() => {
      if (!scannerRef.current) {
        const scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            videoConstraints: {
              facingMode: "environment"
            }
          },
          false
        );

        scanner.render(onScanSuccess, onScanError);
        scannerRef.current = scanner;
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error("Scanner cleanup error:", err);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  async function onScanSuccess(result) {
    if (!result) return;
    
    let registrationId = null;
    let scanData = null;

    // 1. Try parsing as JSON first
    try {
      const data = JSON.parse(result);
      if (data && data.registrationId) {
        registrationId = data.registrationId;
        scanData = data;
      }
    } catch (err) {
      // Not a JSON string
    }

    // 2. Fallback: Extract 24-char hex ObjectId if present (e.g. raw ID or ticket URL)
    if (!registrationId) {
      const match = result.match(/[0-9a-fA-F]{24}/);
      if (match) {
        registrationId = match[0];
        scanData = {
          type: "event_ticket",
          registrationId: registrationId,
          bookingId: "Extracted from scan",
          userName: "Ticket Holder"
        };
      }
    }

    // 3. If registration ID found, verify
    if (registrationId) {
      if (registrationId !== lastScannedId) {
        if (scannerRef.current) {
          try {
            scannerRef.current.pause();
          } catch (e) {}
        }
        setScanResult(scanData);
        setLastScannedId(registrationId);
        await verifyTicket(registrationId);
      }
    } else {
      toast.error("Invalid QR Code: Could not find a valid registration ID", { id: "invalid-qr" });
    }
  }

  function onScanError(err) {
    // Ignore frequent scan errors from the library
  }

  const verifyTicket = async (registrationId) => {
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
        toast.success(response.data.message || "Attendance marked successfully!", { duration: 5000 });
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
        if (scannerRef.current) {
          try {
            scannerRef.current.resume();
          } catch (e) {}
        }
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

          <div id="reader" className="overflow-hidden rounded-3xl border border-white/5 bg-[#0a1222]"></div>

          {scanResult && !isVerifying && (
            <div className="mt-6 p-4 rounded-2xl bg-[#40e0d0]/10 border border-[#40e0d0]/20">
              <p className="text-[10px] text-[#40e0d0] font-black uppercase tracking-widest mb-1">Checking Record...</p>
              <p className="font-bold text-white">Please wait while we verify the ticket</p>
            </div>
          )}
        </div>

        <button 
          onClick={() => navigate("/admin/events")}
          className="mt-8 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold hover:bg-white/10 transition flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
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
          padding: 10px 24px !important;
          border-radius: 12px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 12px !important;
          cursor: pointer !important;
          transition: all 0.2s !important;
        }
        #reader__dashboard_section_csr button:hover {
          transform: scale(1.05) !important;
          opacity: 0.9 !important;
        }
        #reader__scan_region video {
          border-radius: 20px !important;
          object-fit: cover !important;
        }
        #reader img[alt="Info icon"], #reader img[alt="Camera icon"] {
          display: none !important;
        }
      `}</style>
    </div>
  );
};

export default AdminScannerPage;
