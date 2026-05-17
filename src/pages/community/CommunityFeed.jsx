import { useEffect, useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import SectionHeader from "../../components/common/SectionHeader.jsx";
import SectionWrapper from "../../components/layout/SectionWrapper.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import { getCommunityPosts, likePost } from "../../api/communityApi.js";
import { SkeletonCard } from "../../components/common/SkeletonLoader.jsx";
import { format } from "date-fns";

const CATEGORIES = ["All", "Announcement", "Event Recap", "Achievement", "Member Spotlight", "Sponsor Update"];

// Memoized CommunityPostCard for optimized list rendering and individual render isolation
const CommunityPostCard = memo(({ post, currentUser, userToken, handleLikeToggle }) => {
  const isFeatured = post.featured;
  const isUserLiked = currentUser && post.likedBy?.includes(currentUser._id);

  return (
    <Link
      to={`/community/${post.slug}`}
      className={`group relative flex flex-col overflow-hidden rounded-[2rem] border transition duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(0,0,0,0.4)] ${
        isFeatured
          ? "border-[#8ce5db]/40 bg-[#0c1b38] shadow-[0_0_20px_rgba(140,229,219,0.15)]"
          : "border-white/10 bg-[#0a1222]/80 backdrop-blur-md"
      } hover:border-[#8ce5db]/50`}
    >
      
      {/* Featured label tag */}
      {isFeatured && (
        <div className="absolute left-6 top-6 z-10 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] px-3.5 py-1 text-[10px] font-black uppercase tracking-widest text-black shadow-lg">
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Spotlight
        </div>
      )}

      {/* Cover media section */}
      <div className="relative h-60 overflow-hidden">
        {post.coverImage ? (
          <img
            alt={post.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            src={post.coverImage}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1b2f54] to-[#0f223e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050b16] via-transparent to-transparent opacity-90" />
        
        {/* Top Right category tag */}
        {!isFeatured && (
          <div className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200 backdrop-blur-md">
            {post.category}
          </div>
        )}
      </div>

      {/* Metadata body content */}
      <div className="flex flex-grow flex-col p-6 lg:p-8">
        
        {/* Date and Views metadata indicators */}
        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          <span>{format(new Date(post.publishedAt), "MMM dd, yyyy")}</span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {post.views} views
          </span>
        </div>

        <h3 className="font-display text-2xl font-bold leading-tight text-white group-hover:text-[#8ce5db] transition-colors line-clamp-1">
          {post.title}
        </h3>
        
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400 flex-grow">
          {post.description}
        </p>

        {/* Author badge */}
        <div className="mt-5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] flex items-center justify-center text-[9px] font-black text-black">
            OS
          </div>
          <span className="text-xs text-slate-300 font-medium">{post.author}</span>
        </div>

        {/* Interactive metrics footer bar */}
        <div className="mt-6 pt-5 border-t border-white/5 flex justify-between items-center">
          <button
            onClick={(e) => handleLikeToggle(post._id, e)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition duration-300 ${
              isUserLiked 
                ? "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20" 
                : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
            }`}
          >
            <svg className={`w-4 h-4 ${isUserLiked ? "fill-current" : ""}`} fill={isUserLiked ? "#ef4444" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{post.likesCount || 0}</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs font-semibold bg-white/5 px-3 py-1.5 rounded-full text-slate-300">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>{post.comments?.length || 0}</span>
          </div>
        </div>

      </div>
    </Link>
  );
});

CommunityPostCard.displayName = "CommunityPostCard";

const CommunityFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Get current user info from local storage
  const userToken = localStorage.getItem("token") || localStorage.getItem("adminToken");
  const currentUser = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (activeCategory !== "All") filters.category = activeCategory;
      if (searchQuery.trim()) filters.search = searchQuery;
      if (sortBy) filters.sort = sortBy;

      const res = await getCommunityPosts(filters);
      setPosts(res.data || []);
    } catch (err) {
      console.error("Failed to load community feed:", err);
      setError("Unable to load the community feed. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [activeCategory, searchQuery, sortBy]);

  useEffect(() => {
    fetchPosts();
  }, [activeCategory, sortBy]);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    fetchPosts();
  }, [fetchPosts]);

  const handleLikeToggle = useCallback(async (postId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userToken) {
      toast.error("Please log in to like posts and engage with the community!");
      return;
    }

    try {
      const res = await likePost(postId);
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likedBy: res.data.likedBy,
                likesCount: res.data.likesCount,
              }
            : post
        )
      );
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  }, [userToken]);

  return (
    <AppShell>
      <div className="pt-24 pb-20 min-h-screen bg-[#050b16] text-white">
        
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#8ce5db]/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#2d61ff]/10 rounded-full blur-[120px] pointer-events-none" />

        <SectionWrapper id="community-feed">
          <SectionHeader
            label="Otter Community"
            title="Club Highlights & Spotlights"
            subtitle="Catch up on event recaps, member achievements, updates, and vibrant snapshots from the Otter Society."
          />

          {/* Search and Sort Control Panel */}
          <div className="mt-10 p-6 rounded-3xl border border-white/5 bg-[#0a1222]/60 backdrop-blur-md shadow-xl">
            <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 justify-between items-center">
              
              {/* Search Field */}
              <div className="relative w-full md:max-w-md">
                <input
                  type="text"
                  placeholder="Search stories, highlights, achievements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-full border border-white/10 bg-[#050b16]/80 text-white focus:outline-none focus:border-[#8ce5db] transition duration-300"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(""); setTimeout(() => fetchPosts(), 0); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Action row (Sort and Button) */}
              <div className="flex w-full md:w-auto items-center gap-4 justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="py-2.5 px-4 rounded-full border border-white/10 bg-[#050b16] text-sm text-slate-200 focus:outline-none focus:border-[#8ce5db] cursor-pointer"
                  >
                    <option value="newest">Newest</option>
                    <option value="popular">Popular (Likes)</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#2d61ff] to-[#8ce5db] text-sm font-bold text-[#060b16] hover:shadow-[0_0_15px_rgba(140,229,219,0.4)] transition duration-300 font-display"
                >
                  Search
                </button>
              </div>

            </form>
          </div>

          {/* Category Filters capsules */}
          <div className="mt-8 flex flex-wrap gap-2.5 pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition duration-300 ${
                  activeCategory === cat
                    ? "bg-[#8ce5db] text-[#060b16] shadow-[0_0_12px_rgba(140,229,219,0.3)]"
                    : "border border-white/10 bg-[#0a1222]/30 text-slate-300 hover:bg-[#0a1222] hover:border-white/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Feed Content Grid */}
          {loading ? (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <SkeletonCard count={6} />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={fetchPosts} />
          ) : posts.length === 0 ? (
            <div className="mt-12 flex flex-col h-80 items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0a1222]/20 p-8 text-center">
              <svg className="w-16 h-16 text-slate-600 mb-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
              <h3 className="font-display text-xl font-bold mb-1">No Spotlight Stories Found</h3>
              <p className="text-sm text-slate-400 max-w-sm">No highlights are available matching this filter. Try a different category or search term.</p>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <CommunityPostCard
                  key={post._id}
                  post={post}
                  currentUser={currentUser}
                  userToken={userToken}
                  handleLikeToggle={handleLikeToggle}
                />
              ))}
            </div>
          )}

        </SectionWrapper>
      </div>
    </AppShell>
  );
};

export default CommunityFeed;
