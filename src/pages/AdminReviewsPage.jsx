import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/layout/Container.jsx";
import AdminNavbar from "../components/layout/AdminNavbar.jsx";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { 
  getAdminReviews, 
  updateReviewStatus, 
  toggleReviewFeatured, 
  deleteReviewAdmin 
} from "../api/reviewApi.js";

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");

  const navigate = useNavigate();

  const fetchReviews = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10,
      };
      if (statusFilter !== "all") params.status = statusFilter;
      if (featuredFilter !== "all") params.featured = featuredFilter === "true";

      const res = await getAdminReviews(params);
      if (res.success) {
        setReviews(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
        setTotalCount(res.pagination?.total || 0);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load reviews");
      if (error.response?.status === 401) {
        navigate("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, statusFilter, featuredFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateReviewStatus(id, newStatus);
      if (res.success) {
        toast.success(`Review ${newStatus} successfully!`);
        fetchReviews();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const handleToggleFeatured = async (id, currentFeatured) => {
    try {
      const res = await toggleReviewFeatured(id, !currentFeatured);
      if (res.success) {
        toast.success(res.message || "Featured status updated!");
        fetchReviews();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to toggle featured status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this testimonial?")) return;
    try {
      const res = await deleteReviewAdmin(id);
      if (res.success) {
        toast.success("Review deleted successfully!");
        fetchReviews();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to delete review");
    }
  };

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <AdminNavbar />

      <main className="py-10">
        <Container>
          {/* Header */}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Review Moderation</h2>
              <p className="mt-1 text-slate-400">Moderate and feature authentic community reviews submitted by Otter Society members</p>
            </div>
            <div className="flex bg-white/5 border border-white/10 rounded-2xl p-4 shrink-0 gap-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Total Reviews</p>
                <p className="text-2xl font-black text-[#40e0d0]">{totalCount}</p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between p-6 rounded-2xl border border-white/10 bg-white/[0.02] mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1.5">Moderate Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#40e0d0] outline-none text-slate-200"
                >
                  <option value="all" className="bg-[#060b16] text-white">All Submissions</option>
                  <option value="pending" className="bg-[#060b16] text-white">Pending</option>
                  <option value="approved" className="bg-[#060b16] text-white">Approved</option>
                  <option value="rejected" className="bg-[#060b16] text-white">Rejected</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1.5">Featured</label>
                <select
                  value={featuredFilter}
                  onChange={(e) => { setFeaturedFilter(e.target.value); setCurrentPage(1); }}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:border-[#40e0d0] outline-none text-slate-200"
                >
                  <option value="all" className="bg-[#060b16] text-white">All</option>
                  <option value="true" className="bg-[#060b16] text-white">Featured Only</option>
                  <option value="false" className="bg-[#060b16] text-white">Standard Only</option>
                </select>
              </div>
            </div>
            
            <button 
              onClick={fetchReviews}
              className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-[#40e0d0] hover:bg-white/10 transition"
            >
              Refresh List
            </button>
          </div>

          {/* Table list */}
          <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">User Details</th>
                    <th className="px-6 py-4">Title & Review</th>
                    <th className="px-6 py-4 text-center">Rating</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Featured</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center text-slate-500">
                        <div className="flex justify-center items-center gap-3">
                          <div className="h-5 w-5 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
                          <span>Fetching reviews...</span>
                        </div>
                      </td>
                    </tr>
                  ) : reviews.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-20 text-center text-slate-500 font-medium">
                        No testimonials found matching filters.
                      </td>
                    </tr>
                  ) : (
                    reviews.map((rev) => (
                      <tr key={rev._id} className="transition hover:bg-white/[0.01] group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#40e0d0] to-[#2d61ff] overflow-hidden flex items-center justify-center font-bold text-[#061323] shrink-0">
                              {rev.avatar || rev.avatarUrl ? (
                                <img src={rev.avatar || rev.avatarUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                rev.userName?.[0]?.toUpperCase() || rev.personName?.[0]?.toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white truncate">{rev.userName || rev.personName}</p>
                              <p className="text-[10px] text-slate-500 truncate font-semibold uppercase">{rev.personRole}</p>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 max-w-sm">
                          <h4 className="font-bold text-slate-200 line-clamp-1">{rev.title || "Untitled Review"}</h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{rev.review || rev.quote}</p>
                          {rev.eventName && (
                            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-[#40e0d0]/10 border border-[#40e0d0]/20 text-[9px] font-bold text-[#40e0d0]">
                              Event: {rev.eventName}
                            </span>
                          )}
                          {rev.membershipType && !rev.eventId && (
                            <span className="inline-block mt-2 px-2 py-0.5 rounded bg-[#2d61ff]/10 border border-[#2d61ff]/20 text-[9px] font-bold text-[#2d61ff]">
                              {rev.membershipType} Member
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center text-yellow-400 text-xs">
                            {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                              <span key={i}>★</span>
                            ))}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            rev.status === "approved" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                            rev.status === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                          }`}>
                            {rev.status || (rev.isActive ? "approved" : "pending")}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleFeatured(rev._id, rev.featured || rev.isFeatured)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase border transition hover:scale-105 active:scale-95 ${
                              rev.featured || rev.isFeatured
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                : "bg-white/5 text-slate-500 border-white/5"
                            }`}
                          >
                            {(rev.featured || rev.isFeatured) ? "★ Featured" : "Regular"}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            {rev.status !== "approved" && (
                              <button
                                onClick={() => handleStatusChange(rev._id, "approved")}
                                className="text-xs font-black uppercase text-green-400 hover:underline"
                              >
                                Approve
                              </button>
                            )}
                            {rev.status !== "rejected" && (
                              <button
                                onClick={() => handleStatusChange(rev._id, "rejected")}
                                className="text-xs font-black uppercase text-yellow-500 hover:underline"
                              >
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(rev._id)}
                              className="text-xs font-black uppercase text-red-400 hover:underline ml-2"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-10">
              <button
                disabled={currentPage === 1 || loading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages || loading}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/10 transition"
              >
                Next
              </button>
            </div>
          )}
        </Container>
      </main>
    </div>
  );
};

export default AdminReviewsPage;
