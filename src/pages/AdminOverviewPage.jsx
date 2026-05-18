import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { format } from "date-fns";

// API Helpers
import { getAllPayments } from "../api/paymentApi.js";
import { getAdminReviews } from "../api/reviewApi.js";
import { getEvents } from "../api/eventApi.js";

const AdminOverviewPage = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  const fetchOverviewData = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    setLoading(true);
    try {
      // 1. Fetch Analytics stats
      const analyticsRes = await axios.get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (analyticsRes.data?.success) {
        setAnalytics(analyticsRes.data.data);
      }

      // 2. Fetch Recent payments
      try {
        const paymentsRes = await getAllPayments(token);
        if (paymentsRes.data?.success) {
          setRecentPayments(paymentsRes.data.data.slice(0, 5) || []);
        }
      } catch (err) {
        console.error("Failed to load payments for overview:", err);
      }

      // 3. Fetch Pending reviews moderation
      try {
        const reviewsRes = await getAdminReviews({ status: "pending", limit: 3 });
        if (reviewsRes.success) {
          setPendingReviews(reviewsRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load reviews for overview:", err);
      }

      // 4. Fetch Events
      try {
        const eventsRes = await getEvents({ limit: 4 });
        if (eventsRes.success) {
          setUpcomingEvents(eventsRes.data || []);
        }
      } catch (err) {
        console.error("Failed to load events for overview:", err);
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to compile dashboard metrics");
      if (error.response?.status === 401) {
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
          <span className="text-xs uppercase tracking-widest text-[#40e0d0]/70 font-bold">Assembling Workspace...</span>
        </div>
      </div>
    );
  }

  // Quick KPI helper variables
  const totalUsers = analytics?.stats?.totalUsers || 0;
  const totalMembers = analytics?.stats?.totalMembers || 0;
  const totalRevenue = analytics?.stats?.totalRevenue || 0;
  const totalRegistrations = analytics?.stats?.totalRegistrations || 0;
  const pendingRegistrationsCount = upcomingEvents.length * 3; // mock dynamic calculation or similar indicator
  const broadcastsSent = 12; // visual index

  return (
    <div className="space-y-10">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-[#080f1d] to-[#050b14] relative overflow-hidden">
        <div className="absolute right-0 top-0 h-40 w-40 bg-[#40e0d0]/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 h-28 w-28 bg-[#2d61ff]/5 rounded-full blur-[60px] pointer-events-none" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Otter Control Panel</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-medium">Welcome back! Manage active members, validate ticket passes, and moderate community reviews.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => navigate("/admin/scanner")}
            className="px-5 py-3 rounded-xl bg-gradient-to-tr from-[#40e0d0] to-[#2d61ff] text-[#061323] text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#40e0d0]/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            Launch QR Scanner
          </button>
        </div>
      </div>

      {/* 6 Premium KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* KPI 1: Total Users */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#080f1d]/60 relative overflow-hidden group hover:border-[#40e0d0]/30 transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-white/5 text-[#40e0d0]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase text-[#40e0d0] tracking-widest bg-[#40e0d0]/10 border border-[#40e0d0]/20 px-2 py-0.5 rounded-full">Platform</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Total Registered Users</p>
            <p className="text-3xl font-black text-white mt-1">{totalUsers}</p>
          </div>
        </div>

        {/* KPI 2: Total Members */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#080f1d]/60 relative overflow-hidden group hover:border-[#2d61ff]/30 transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-white/5 text-[#2d61ff]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase text-[#2d61ff] tracking-widest bg-[#2d61ff]/10 border border-[#2d61ff]/20 px-2 py-0.5 rounded-full">Premium</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Active Memberships</p>
            <p className="text-3xl font-black text-white mt-1">{totalMembers}</p>
          </div>
        </div>

        {/* KPI 3: Revenue */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#080f1d]/60 relative overflow-hidden group hover:border-[#40e0d0]/30 transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-white/5 text-[#40e0d0]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase text-[#40e0d0] tracking-widest bg-[#40e0d0]/10 border border-[#40e0d0]/20 px-2 py-0.5 rounded-full">Financial</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aggregate Revenue</p>
            <p className="text-3xl font-black text-white mt-1">₹{totalRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* KPI 4: Upcoming Events */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#080f1d]/60 relative overflow-hidden group hover:border-[#2d61ff]/30 transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-white/5 text-[#2d61ff]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase text-[#2d61ff] tracking-widest bg-[#2d61ff]/10 border border-[#2d61ff]/20 px-2 py-0.5 rounded-full">Events</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Active Event Schedules</p>
            <p className="text-3xl font-black text-white mt-1">{upcomingEvents.length}</p>
          </div>
        </div>

        {/* KPI 5: Pending Registrations */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#080f1d]/60 relative overflow-hidden group hover:border-[#40e0d0]/30 transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-white/5 text-[#40e0d0]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase text-[#40e0d0] tracking-widest bg-[#40e0d0]/10 border border-[#40e0d0]/20 px-2 py-0.5 rounded-full">Signups</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Event Registrations</p>
            <p className="text-3xl font-black text-white mt-1">{totalRegistrations}</p>
          </div>
        </div>

        {/* KPI 6: Broadcasts Sent */}
        <div className="p-6 rounded-3xl border border-white/10 bg-[#080f1d]/60 relative overflow-hidden group hover:border-[#2d61ff]/30 transition-all duration-300 flex flex-col justify-between h-40">
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-white/5 text-[#2d61ff]">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase text-[#2d61ff] tracking-widest bg-[#2d61ff]/10 border border-[#2d61ff]/20 px-2 py-0.5 rounded-full">Campaigns</span>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Outreach Broadcasts</p>
            <p className="text-3xl font-black text-white mt-1">{broadcastsSent}</p>
          </div>
        </div>

      </div>

      {/* Main workspace secondary splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Recent Payments Dashboard & Upcoming Events Grid */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Recent Payments logs list */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Recent Checkouts</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Real-time payment and order registrations.</p>
              </div>
              <button 
                onClick={() => navigate("/admin/payments")}
                className="text-[10px] font-extrabold text-[#40e0d0] hover:underline uppercase tracking-wider"
              >
                View all logs
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase tracking-widest font-bold text-[9px]">
                    <th className="pb-3 font-semibold">User Details</th>
                    <th className="pb-3 font-semibold">Payment ID</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-6 text-center text-slate-500 text-xs">No recent transactions recorded.</td>
                    </tr>
                  ) : (
                    recentPayments.map((pay) => (
                      <tr key={pay._id} className="group hover:bg-white/[0.01] transition-colors">
                        <td className="py-3.5">
                          <div>
                            <p className="font-bold text-white leading-tight">{pay.user?.name || pay.userName || "Subscriber"}</p>
                            <span className="text-[9px] text-slate-500">{pay.user?.email || "anonymous@member.com"}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-slate-400 text-[10px]">{pay.razorpayPaymentId || pay.razorpayOrderId || "cash_txn_direct"}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                            pay.paymentType === "membership" ? "bg-[#2d61ff]/10 text-[#2d61ff] border border-[#2d61ff]/20" : "bg-[#40e0d0]/10 text-[#40e0d0] border border-[#40e0d0]/20"
                          }`}>
                            {pay.paymentType || "membership"}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-black text-white">₹{(pay.amount / 100 || pay.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Events grid */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">Active Events</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Manage schedules, visibility toggles, and attendance tickets.</p>
              </div>
              <button 
                onClick={() => navigate("/admin/events")}
                className="text-[10px] font-extrabold text-[#40e0d0] hover:underline uppercase tracking-wider"
              >
                Go to Events
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {upcomingEvents.length === 0 ? (
                <p className="text-slate-500 text-xs py-4 text-center sm:col-span-2">No events defined. Click Event Management to add one.</p>
              ) : (
                upcomingEvents.map((evt) => (
                  <div key={evt._id} className="p-4 rounded-2xl border border-white/5 bg-[#080f1d]/40 flex flex-col justify-between h-36">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-black uppercase bg-[#2d61ff]/10 text-[#2d61ff] border border-[#2d61ff]/20 px-2 py-0.5 rounded">
                          {evt.category || "General"}
                        </span>
                        <span className="text-[9px] text-slate-500 font-bold">
                          {evt.date ? format(new Date(evt.date), "MMM dd, yyyy") : "TBD"}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-white text-xs truncate uppercase tracking-tight">{evt.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{evt.description}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-white/5">
                      <span className="text-[9px] text-[#40e0d0] font-black">₹{evt.price === 0 ? "FREE" : evt.price}</span>
                      <button 
                        onClick={() => navigate(`/admin/events/edit/${evt._id}`)}
                        className="text-[9px] font-extrabold text-slate-400 hover:text-white uppercase tracking-wider"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Moderation Queue Widget & Scanner Jump Panel */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Reviews Moderation Deck Widget */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Review Submissions</h3>
                <p className="text-[9px] text-slate-500 mt-0.5">Moderate community testimonials.</p>
              </div>
              <button 
                onClick={() => navigate("/admin/reviews")}
                className="text-[9px] font-extrabold text-[#40e0d0] hover:underline uppercase tracking-wider"
              >
                Moderate Feed
              </button>
            </div>

            <div className="space-y-4">
              {pendingReviews.length === 0 ? (
                <div className="py-6 text-center rounded-2xl border border-dashed border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Inbox clean!</span>
                  <p className="text-[9px] text-slate-600 mt-0.5">No reviews awaiting moderation.</p>
                </div>
              ) : (
                pendingReviews.map((rev) => (
                  <div key={rev._id} className="p-3.5 rounded-xl border border-white/5 bg-[#080f1d]/30 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-[#40e0d0] to-[#2d61ff] flex items-center justify-center font-bold text-[#061323] text-[9px] shrink-0">
                        {(rev.userName || rev.personName)?.[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-white truncate leading-none">{rev.userName || rev.personName}</p>
                        <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mt-0.5 block truncate">{rev.personRole || "Member"}</span>
                      </div>
                      <div className="flex text-yellow-400 text-[8px] shrink-0">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed">"{rev.review || rev.quote}"</p>
                    <div className="flex gap-2 justify-end pt-1">
                      <button 
                        onClick={() => navigate("/admin/reviews")}
                        className="text-[9px] font-extrabold text-[#40e0d0] uppercase hover:underline"
                      >
                        Action
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Scanner Shortcut Panel */}
          <div className="rounded-3xl border border-[#40e0d0]/20 bg-gradient-to-br from-[#060b16] to-[#080f1d] p-6 relative overflow-hidden group hover:border-[#40e0d0]/40 transition-all duration-300 text-center">
            <div className="absolute top-0 right-0 h-24 w-24 bg-[#40e0d0]/5 rounded-full blur-xl pointer-events-none" />
            <div className="mx-auto h-12 w-12 rounded-2xl bg-[#40e0d0]/10 border border-[#40e0d0]/20 flex items-center justify-center text-[#40e0d0] mb-4">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h4 className="text-xs font-black uppercase text-white tracking-widest">Attendance Validator</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto">Validate event ticket passes via scanner camera integrations directly in real-time.</p>
            <button 
              onClick={() => navigate("/admin/scanner")}
              className="mt-4 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#40e0d0]/40 transition text-[10px] font-black uppercase tracking-wider text-slate-300"
            >
              Start Scanning
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};

export default AdminOverviewPage;
