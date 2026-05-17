import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminGetPosts, adminDeletePost, adminUpdatePost } from "../api/communityApi.js";
import Container from "../components/layout/Container.jsx";
import toast from "react-hot-toast";
import { format } from "date-fns";

const AdminCommunityPage = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      const res = await adminGetPosts();
      setPosts(res.data || []);
    } catch (error) {
      console.error("Failed to load community posts:", error);
      toast.error("Failed to load community posts. Please verify admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this community post?")) {
      try {
        await adminDeletePost(id);
        toast.success("Community post removed successfully!");
        setPosts((prev) => prev.filter((p) => p._id !== id));
      } catch (error) {
        toast.error("Failed to delete the post.");
      }
    }
  };

  const handleToggleFeatured = async (post) => {
    try {
      const updatedFormData = new FormData();
      updatedFormData.append("featured", !post.featured);
      
      const res = await adminUpdatePost(post._id, updatedFormData);
      
      // Update local state list
      setPosts((prev) =>
        prev.map((p) => (p._id === post._id ? { ...p, featured: res.data.featured } : p))
      );
      toast.success(res.data.featured ? "Post highlighted as Spotlight!" : "Post removed from Spotlight.");
    } catch (error) {
      console.error("Toggle featured status error:", error);
      toast.error("Unable to update featured status.");
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (activeTab === "All") return true;
    return post.status === activeTab.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#050b16] text-white">

      {/* Admin Navbar */}
      <nav className="border-b border-white/10 bg-[#081429]/50 backdrop-blur-md sticky top-0 z-50">
        <Container className="flex h-20 items-center justify-between">
          <h1 className="font-display text-xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex gap-6 items-center">
            <button onClick={() => navigate("/admin/analytics")} className="text-sm font-medium text-slate-400 hover:text-white">Analytics</button>
            <button onClick={() => navigate("/admin/scanner")} className="text-sm font-medium text-slate-400 hover:text-white">Scanner</button>
            <button onClick={() => navigate("/admin/memberships")} className="text-sm font-medium text-slate-400 hover:text-white">Memberships</button>
            <button onClick={() => navigate("/admin/registrations")} className="text-sm font-medium text-slate-400 hover:text-white">Registrations</button>
            <button onClick={() => navigate("/admin/events")} className="text-sm font-medium text-slate-400 hover:text-white">Manage Events</button>
            <button onClick={() => navigate("/admin/community")} className="text-sm font-bold text-[#40e0d0]">Community</button>
            <button onClick={() => navigate("/admin/cms")} className="text-sm font-medium text-slate-400 hover:text-white">Manage CMS</button>
            <button onClick={() => navigate("/")} className="text-sm font-medium text-slate-400 hover:text-white">View Site</button>
            <button onClick={() => {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminUser");
              navigate("/admin/login");
            }} className="text-sm font-medium text-red-400 hover:text-red-300">Logout</button>
          </div>
        </Container>
      </nav>

      <main className="py-12">
        <Container>
          
          {/* Headline details */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">Manage Community Feed</h1>
              <p className="mt-1 text-slate-400">Create, edit, highlight, and moderate stories and snapshots for your community platform.</p>
            </div>
            
            <button
              onClick={() => navigate("/admin/community/new")}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#2d61ff] to-[#40e0d0] text-sm font-bold text-white hover:shadow-[0_0_15px_rgba(64,224,208,0.4)] transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create New Post
            </button>
          </div>

          {/* Filtering state tabs */}
          <div className="flex gap-2 border-b border-white/5 pb-4 mb-6">
            {["All", "Published", "Draft", "Scheduled"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition duration-300 ${
                  activeTab === tab
                    ? "bg-[#40e0d0]/10 text-[#40e0d0] border border-[#40e0d0]/25"
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Loading status wrapper */}
          {loading ? (
            <div className="flex justify-center items-center h-60 text-slate-400">
              <svg className="animate-spin h-8 w-8 text-[#40e0d0] mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Checking database logs...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col h-60 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0a1222]/20 p-8 text-center text-slate-400">
              <p className="font-display text-lg font-bold mb-1">No community posts found</p>
              <p className="text-xs">Create your first community spotlight post by clicking the button above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#0a1222]/40 backdrop-blur-md shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-5 px-6">Article</th>
                    <th className="py-5 px-6">Category</th>
                    <th className="py-5 px-6">Author</th>
                    <th className="py-5 px-6 text-center">Metrics</th>
                    <th className="py-5 px-6">Published At</th>
                    <th className="py-5 px-6 text-center">Status</th>
                    <th className="py-5 px-6 text-center">Spotlight</th>
                    <th className="py-5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-slate-200">
                  {filteredPosts.map((post) => {
                    const commentsCount = post.comments?.length || 0;

                    return (
                      <tr key={post._id} className="hover:bg-white/[0.01] transition duration-150">
                        {/* Cover Image + Title slug details */}
                        <td className="py-4 px-6 flex items-center gap-4 min-w-[280px]">
                          <img
                            src={post.coverImage || "https://via.placeholder.com/80"}
                            alt={post.title}
                            className="w-12 h-12 object-cover rounded-xl border border-white/10 bg-white/5 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[200px]" title={post.title}>
                              {post.title}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                              /{post.slug}
                            </p>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-6">
                          <span className="text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-slate-300">
                            {post.category}
                          </span>
                        </td>

                        {/* Author */}
                        <td className="py-4 px-6 text-slate-400 font-semibold">{post.author}</td>

                        {/* Metrics Panel */}
                        <td className="py-4 px-6">
                          <div className="flex gap-4 justify-center text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-1.5" title="Views">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {post.views}
                            </span>
                            <span className="flex items-center gap-1.5" title="Likes">
                              <svg className="w-3.5 h-3.5 text-red-500 fill-current" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                              </svg>
                              {post.likesCount || 0}
                            </span>
                            <span className="flex items-center gap-1.5" title="Comments">
                              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              {commentsCount}
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-6 text-xs text-slate-400 font-bold">
                          {format(new Date(post.publishedAt), "MMM dd, yyyy")}
                        </td>

                        {/* Status badge */}
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                              post.status === "published"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : post.status === "scheduled"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                            }`}
                          >
                            {post.status}
                          </span>
                        </td>

                        {/* Featured star icon toggle */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => handleToggleFeatured(post)}
                            className="focus:outline-none transition p-1 hover:scale-115 active:scale-95"
                            title={post.featured ? "Remove from highlights spotlight" : "Add to highlights spotlight"}
                          >
                            <svg
                              className={`w-5 h-5 ${post.featured ? "text-amber-400 fill-current" : "text-slate-600"}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        </td>

                        {/* Action buttons */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/community/edit/${post._id}`)}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#40e0d0]/30 hover:bg-[#40e0d0]/10 text-slate-300 hover:text-[#40e0d0] transition duration-200"
                              title="Edit post"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(post._id)}
                              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#ef4444]/30 hover:bg-[#ef4444]/10 text-slate-300 hover:text-[#ef4444] transition duration-200"
                              title="Delete post"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </Container>
      </main>
    </div>
  );
};

export default AdminCommunityPage;
