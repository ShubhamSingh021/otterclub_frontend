import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { getAllPayments } from "../api/paymentApi";

const AdminPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin/login");
        return;
      }
      const res = await getAllPayments(token);
      setPayments(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return "text-emerald-400 bg-emerald-400/10";
      case "pending": return "text-amber-400 bg-amber-400/10";
      case "failed": return "text-red-400 bg-red-400/10";
      default: return "text-slate-400 bg-slate-400/10";
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {["all", "paid", "pending", "failed"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition ${
                    filter === f ? "bg-[#40e0d0] text-[#061323]" : "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="text-sm text-slate-400">Total Transactions: {filteredPayments.length}</p>
          </div>

          <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Transaction ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Participant</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Event</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="6" className="px-6 py-4 h-16 bg-white/[0.01]"></td>
                    </tr>
                  ))
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-slate-500 italic">No transactions found</td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={p._id} 
                      className="hover:bg-white/[0.02] transition"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-[#40e0d0]">{p.razorpayPaymentId || p.razorpayOrderId}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold">{p.registration?.fullName || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{p.registration?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{p.event?.title}</td>
                      <td className="px-6 py-4">
                        <span className="font-display font-bold text-[#40e0d0]">₹{p.amount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards Layout */}
          <div className="mt-8 space-y-4 md:hidden">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 h-40 animate-pulse" />
              ))
            ) : filteredPayments.length === 0 ? (
              <div className="py-10 text-center text-slate-500 italic">No transactions found</div>
            ) : (
              filteredPayments.map((p) => (
                <div key={p._id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <p className="font-bold text-white text-base">{p.registration?.fullName || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{p.registration?.email}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Transaction ID</p>
                      <p className="mt-1 font-mono text-[#40e0d0] truncate">{p.razorpayPaymentId || p.razorpayOrderId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Amount</p>
                      <p className="mt-1 font-bold text-white">₹{p.amount}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs border-t border-white/5 pt-3">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Event</p>
                      <p className="mt-1 font-medium text-slate-300 truncate">{p.event?.title}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Date</p>
                      <p className="mt-1 text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
  );
};

export default AdminPaymentsPage;
