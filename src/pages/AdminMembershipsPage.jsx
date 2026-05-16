import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import AdminNavbar from "../components/layout/AdminNavbar";
import Container from "../components/layout/Container";
import { 
  getAllMemberships, 
  updateMembershipStatus, 
  extendMembership, 
  deleteMembership,
  refundMembership,
  resendConfirmationEmail
} from "../api/membershipApi";

const AdminMembershipsPage = () => {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    fetchMemberships();
  }, [filterType, filterStatus]);

  const fetchMemberships = async () => {
    try {
      setLoading(true);
      const res = await getAllMemberships(token, {
        type: filterType,
        status: filterStatus,
        search: searchTerm
      });
      setMemberships(res.data);
    } catch (error) {
      toast.error("Failed to load memberships");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateMembershipStatus(id, status, token);
      toast.success(`Status updated to ${status}`);
      fetchMemberships();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleExtend = async (id) => {
    const days = prompt("Enter number of days to extend:", "30");
    if (!days) return;

    try {
      await extendMembership(id, days, token);
      toast.success(`Extended by ${days} days`);
      fetchMemberships();
    } catch (error) {
      toast.error("Failed to extend membership");
    }
  };

  const handleRefund = async (id) => {
    if (!window.confirm("Are you sure you want to refund and cancel this membership?")) return;
    try {
      await refundMembership(id, token);
      toast.success("Membership refunded and cancelled");
      fetchMemberships();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to refund membership");
    }
  };

  const handleResendEmail = async (id) => {
    try {
      await resendConfirmationEmail(id, token);
      toast.success("Confirmation email resent");
    } catch (error) {
      toast.error("Failed to resend email");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this membership?")) return;

    try {
      await deleteMembership(id, token);
      toast.success("Membership deleted");
      fetchMemberships();
    } catch (error) {
      toast.error("Failed to delete membership");
    }
  };

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Toaster position="top-center" />
      <AdminNavbar />

      <main className="py-10">
        <Container>
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Membership Management</h1>
              <p className="mt-1 text-slate-400">View and manage club members.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8 grid gap-4 md:grid-cols-4">
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchMemberships()}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#40e0d0] focus:outline-none"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#40e0d0] focus:outline-none"
            >
              <option value="">All Plans</option>
              <option value="BASIC">Basic</option>
              <option value="ELITE">Elite</option>
              <option value="PRO">Pro</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-[#40e0d0] focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={fetchMemberships}
              className="rounded-xl bg-[#40e0d0] px-6 py-2 font-bold text-[#061323] hover:scale-105 transition"
            >
              Search
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-xs font-bold uppercase tracking-widest text-slate-400">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Expiry Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-slate-500">Loading memberships...</td>
                  </tr>
                ) : memberships.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-slate-500">No memberships found.</td>
                  </tr>
                ) : (
                  memberships.map((m) => (
                    <tr key={m._id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{m.userName}</div>
                        <div className="text-xs text-slate-400">{m.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                          m.membershipType === 'PRO' ? 'bg-[#2d61ff]/20 text-[#2d61ff]' : 
                          m.membershipType === 'ELITE' ? 'bg-[#40e0d0]/20 text-[#40e0d0]' : 
                          'bg-slate-700/50 text-slate-300'
                        }`}>
                          {m.membershipType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`capitalize ${
                          m.membershipStatus === 'active' ? 'text-green-400' : 
                          m.membershipStatus === 'expired' ? 'text-red-400' : 
                          'text-slate-400'
                        }`}>
                          {m.membershipStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {format(new Date(m.expiryDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          {m.membershipStatus === 'active' ? (
                            <button onClick={() => handleStatusUpdate(m._id, 'cancelled')} className="text-red-400 hover:underline text-xs font-bold uppercase">Cancel</button>
                          ) : (
                            <button onClick={() => handleStatusUpdate(m._id, 'active')} className="text-green-400 hover:underline text-xs font-bold uppercase">Activate</button>
                          )}
                          <button onClick={() => handleExtend(m._id)} className="text-[#40e0d0] hover:underline text-xs font-bold uppercase">Extend</button>
                          <button onClick={() => handleRefund(m._id)} className="text-orange-400 hover:underline text-xs font-bold uppercase">Refund</button>
                          <button onClick={() => handleResendEmail(m._id)} className="text-blue-400 hover:underline text-xs font-bold uppercase" title="Resend Email">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button onClick={() => handleDelete(m._id)} className="text-slate-500 hover:text-red-500 transition">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Container>
      </main>
    </div>
  );
};

export default AdminMembershipsPage;
