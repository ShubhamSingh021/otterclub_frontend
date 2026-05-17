import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppShell from "../../components/layout/AppShell.jsx";
import SectionWrapper from "../../components/layout/SectionWrapper.jsx";
import LoadingState from "../../components/common/LoadingState.jsx";
import ErrorState from "../../components/common/ErrorState.jsx";
import { getCommunityPostBySlug, likePost, commentOnPost, deleteComment } from "../../api/communityApi.js";
import { format } from "date-fns";
import toast from "react-hot-toast";

const CommunityDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [heartAnim, setHeartAnim] = useState(false);

  // Authentication configuration
  const userToken = localStorage.getItem("token") || localStorage.getItem("adminToken");
  const userStr = localStorage.getItem("user") || localStorage.getItem("adminUser");
  let currentUser = null;
  if (userStr) {
    try {
      currentUser = JSON.parse(userStr);
    } catch (e) {
      console.error(e);
    }
  }

  const fetchPostDetails = async () => {
    try {
      const res = await getCommunityPostBySlug(slug);
      setPost(res.data);
    } catch (err) {
      console.error("Failed to load post details:", err);
      setError("Unable to find the requested community post. It may have been deleted or archived.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [slug]);

  const handleLikeToggle = async () => {
    if (!userToken) {
      toast.error("Please log in to like this story!");
      return;
    }

    try {
      const res = await likePost(post._id);
      setPost((prev) => ({
        ...prev,
        likedBy: res.data.likedBy,
        likesCount: res.data.likesCount,
      }));

      if (res.liked) {
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 800);
        toast.success("Added to your favorites!");
      } else {
        toast.success("Removed from your favorites.");
      }
    } catch (err) {
      console.error("Error liking post:", err);
      toast.error("Unable to update like. Please try again.");
    }
  };

  const handleDoubleTap = () => {
    if (post && currentUser) {
      const isLiked = post.likedBy?.includes(currentUser._id);
      if (!isLiked) {
        handleLikeToggle();
      } else {
        setHeartAnim(true);
        setTimeout(() => setHeartAnim(false), 800);
      }
    } else {
      handleLikeToggle();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!userToken) {
      toast.error("Please log in to leave a comment!");
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await commentOnPost(post._id, newComment);
      
      // Update local comment list state
      setPost((prev) => ({
        ...prev,
        comments: res.comments,
      }));
      setNewComment("");
      toast.success("Comment added!");
    } catch (err) {
      console.error("Failed to add comment:", err);
      toast.error(err.response?.data?.message || "Could not publish your comment. Try again.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const res = await deleteComment(post._id, commentId);
        setPost((prev) => ({
          ...prev,
          comments: res.comments,
        }));
        toast.success("Comment deleted successfully.");
      } catch (err) {
        console.error("Failed to delete comment:", err);
        toast.error("Failed to delete comment. Please try again.");
      }
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  // Helper to extract YouTube ID
  const getEmbedVideoUrl = (url) => {
    if (!url) return null;
    let videoId = "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        videoId = match[2];
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return url; // Fallback to raw string
  };

  if (loading) return <LoadingState />;
  if (error || !post) return <ErrorState message={error || "Post not found"} onRetry={fetchPostDetails} />;

  const isLiked = currentUser && post.likedBy?.includes(currentUser._id);
  const isVideoEmbeddable = post.videoUrl && (post.videoUrl.includes("youtube.com") || post.videoUrl.includes("youtu.be"));
  const embedUrl = getEmbedVideoUrl(post.videoUrl);

  return (
    <AppShell>
      <div className="pt-24 pb-20 min-h-screen bg-[#050b16] text-white">
        
        {/* Glowing backdrop designs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#40e0d0]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#2d61ff]/5 rounded-full blur-[120px] pointer-events-none" />

        <SectionWrapper id="community-post-detail">
          
          {/* Top navigation row */}
          <div className="mb-8 flex items-center justify-between">
            <button
              onClick={() => navigate("/community")}
              className="group inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-[#40e0d0] transition duration-300"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back to Feed
            </button>

            {/* Social Share list */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">Share Story:</span>
              <button
                onClick={copyShareLink}
                className="p-2 rounded-full bg-white/5 border border-white/10 hover:border-[#40e0d0]/30 hover:bg-[#40e0d0]/10 text-slate-300 hover:text-[#40e0d0] transition duration-300"
                title="Copy Link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l-2.777 1.111a4.89 4.89 0 00-2.622 3.81 4.89 4.89 0 002.622 3.81l2.777 1.111m0-9.842a4.89 4.89 0 002.622-3.81 4.89 4.89 0 00-2.622-3.81l-2.777-1.111m8 11.586a4.89 4.89 0 002.622-3.81 4.89 4.89 0 00-2.622-3.81l-2.777-1.111" />
                </svg>
              </button>
            </div>
          </div>

          {/* Immersive Cover Image backdrop with Heart Double Tap Animation */}
          <div 
            onDoubleClick={handleDoubleTap}
            className="relative h-[480px] w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a1222] shadow-2xl cursor-pointer"
          >
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover transition duration-700 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0c1b38] to-[#050b16]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050b16] via-[#050b16]/30 to-transparent opacity-95" />

            {/* Immersive Heart-Pop Animation Overlay */}
            {heartAnim && (
              <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none animate-ping">
                <svg className="w-24 h-24 text-red-500 fill-current drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            )}

            {/* Float Info Bar inside image */}
            <div className="absolute bottom-8 left-8 right-8 z-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#40e0d0] text-black px-4 py-1 text-xs font-black uppercase tracking-wider">
                  {post.category}
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest bg-white/10 px-3.5 py-1 rounded-full backdrop-blur-md">
                  {format(new Date(post.publishedAt), "MMMM dd, yyyy")}
                </span>
              </div>
              
              <h1 className="mt-4 font-display text-3xl md:text-5xl font-extrabold leading-tight text-white drop-shadow-md">
                {post.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-6 text-sm text-slate-300 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#2d61ff] flex items-center justify-center text-xs font-black text-black">
                    OS
                  </div>
                  <span className="font-bold text-slate-200">{post.author}</span>
                </div>

                <div className="h-4 w-px bg-white/20" />

                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{post.views} views</span>
                </div>
              </div>
            </div>

          </div>

          {/* Main Layout Structure (Body + Sidebar) */}
          <div className="mt-12 grid gap-10 lg:grid-cols-3">
            
            {/* Left Content Area (Body Description + HTML + Gallery + Video) */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Short Intro */}
              <div className="rounded-3xl border border-white/5 bg-[#0a1222]/40 p-8 leading-relaxed text-lg font-medium text-slate-300 italic">
                {post.description}
              </div>

              {/* Rich Body Content */}
              <article 
                className="prose prose-invert max-w-none text-slate-200 leading-relaxed text-base space-y-6"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Multi-Image Gallery */}
              {post.galleryImages && post.galleryImages.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-display text-2xl font-bold border-l-4 border-[#40e0d0] pl-4 text-white">
                    Event Snapshot Gallery
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {post.galleryImages.map((image, i) => (
                      <div
                        key={i}
                        onClick={() => setLightboxImage(image)}
                        className="group relative h-40 overflow-hidden rounded-2xl border border-white/10 bg-[#0a1222] cursor-pointer hover:border-[#40e0d0]/50 transition duration-300"
                      >
                        <img src={image} alt={`Gallery ${i}`} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-[#050b16]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <svg className="w-8 h-8 text-[#40e0d0]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Auto Embedded Video Media Frame */}
              {post.videoUrl && (
                <div className="space-y-4">
                  <h3 className="font-display text-2xl font-bold border-l-4 border-[#2d61ff] pl-4 text-white">
                    Featured Video Highlight
                  </h3>
                  
                  {isVideoEmbeddable ? (
                    <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black shadow-lg">
                      <iframe
                        src={embedUrl}
                        title="Embedded Video Player"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="p-6 rounded-3xl border border-[#2d61ff]/30 bg-[#2d61ff]/5 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-200">Watch full external media clip</p>
                        <p className="text-xs text-slate-400 mt-1">This video is hosted on an external video network</p>
                      </div>
                      <a
                        href={post.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-full bg-[#2d61ff] text-xs font-bold text-white hover:shadow-[0_0_12px_rgba(45,97,255,0.4)] transition"
                      >
                        Play Video Clip ↗
                      </a>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Right Side Panel (Interaction Card - Like and Comments) */}
            <div className="space-y-8">
              
              {/* Engagement metrics card */}
              <div className="rounded-3xl border border-white/5 bg-[#0a1222]/70 p-6 backdrop-blur-md space-y-6">
                <h3 className="font-display text-xl font-bold text-white">Show Your Love</h3>
                
                <div className="flex gap-4 items-center">
                  <button
                    onClick={handleLikeToggle}
                    className={`flex-grow flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold border transition duration-300 ${
                      isLiked
                        ? "bg-[#ef4444] border-[#ef4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:bg-[#ef4444]/90"
                        : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-white"
                    }`}
                  >
                    <svg className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>{isLiked ? "Favorited" : "Like This Story"}</span>
                  </button>

                  <div className="rounded-full bg-white/5 border border-white/10 px-4 py-3 text-center min-w-16">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Likes</p>
                    <p className="text-sm font-bold text-slate-100">{post.likesCount || 0}</p>
                  </div>
                </div>

                {/* Virtual Tags Display */}
                {post.tags && post.tags.length > 0 && (
                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Story Tags</p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold bg-white/5 text-slate-400 border border-white/10 px-2.5 py-1 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Comments moderation wrapper */}
              <div className="rounded-3xl border border-white/5 bg-[#0a1222]/70 p-6 backdrop-blur-md space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-display text-xl font-bold text-white">Comments ({post.comments?.length || 0})</h3>
                  {!post.commentsEnabled && (
                    <span className="text-[10px] font-bold text-[#ef4444] uppercase bg-[#ef4444]/10 border border-[#ef4444]/20 px-2 py-0.5 rounded-full">
                      Locked
                    </span>
                  )}
                </div>

                {/* Add new comment form */}
                {post.commentsEnabled && (
                  <div>
                    {userToken ? (
                      <form onSubmit={handleAddComment} className="space-y-3">
                        <textarea
                          placeholder="Join the discussion! Keep it active and clean..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          maxLength={350}
                          className="w-full h-24 p-4 rounded-2xl border border-white/10 bg-[#050b16] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#40e0d0] transition duration-300 resize-none"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-500">{350 - newComment.length} characters left</span>
                          <button
                            type="submit"
                            disabled={submittingComment || !newComment.trim()}
                            className="px-5 py-2 rounded-full bg-[#40e0d0] text-black text-xs font-black uppercase hover:shadow-[0_0_10px_rgba(64,224,208,0.3)] transition duration-300 disabled:opacity-50 disabled:hover:shadow-none"
                          >
                            {submittingComment ? "Posting..." : "Post Comment"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 rounded-2xl border border-dashed border-[#2d61ff]/20 bg-[#2d61ff]/5 text-center space-y-3">
                        <p className="text-xs text-slate-400">Join the discussion by verifying your society account.</p>
                        <div className="flex gap-2 justify-center">
                          <a href="/login" className="px-4 py-1.5 rounded-full bg-[#2d61ff] text-[10px] font-black uppercase text-white hover:bg-[#2d61ff]/90 transition">Login</a>
                          <a href="/register" className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase text-white hover:bg-white/10 transition">Sign Up</a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Comments feed list */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {post.comments && post.comments.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 italic py-4">Be the first to share your thoughts!</p>
                  ) : (
                    post.comments?.map((comment) => {
                      const isOwner = currentUser && comment.userId?.toString() === currentUser._id?.toString();
                      const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");
                      const isModType = comment.userModel === "Admin";

                      return (
                        <div key={comment._id} className="p-4 rounded-2xl border border-white/5 bg-[#050b16]/60 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {comment.userAvatar ? (
                                <img src={comment.userAvatar} alt={comment.userName} className="w-5 h-5 rounded-full object-cover" />
                              ) : (
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-black ${isModType ? "bg-[#40e0d0]" : "bg-[#2d61ff]"}`}>
                                  {comment.userName.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <span className={`text-xs font-black flex items-center gap-1.5 ${isModType ? "text-[#40e0d0]" : "text-slate-200"}`}>
                                  {comment.userName}
                                  {isModType && (
                                    <span className="text-[7px] font-black uppercase tracking-widest bg-[#40e0d0]/10 px-1.5 py-0.5 rounded-full border border-[#40e0d0]/25">
                                      Mod
                                    </span>
                                  )}
                                </span>
                                <p className="text-[9px] text-slate-500">{format(new Date(comment.createdAt), "MMM dd, yyyy h:mm a")}</p>
                              </div>
                            </div>

                            {/* Deletion triggers */}
                            {(isOwner || isAdmin) && (
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="text-slate-600 hover:text-[#ef4444] transition p-1"
                                title="Delete comment"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>

                          <p className="text-xs leading-relaxed text-slate-300 pl-7 break-words whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>

            </div>

          </div>

        </SectionWrapper>

        {/* GLORIOUS IMMERSIVE FULL-SCREEN LIGHTBOX MODAL */}
        {lightboxImage && (
          <div 
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-fade-in backdrop-blur-lg"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition text-3xl font-light"
            >
              ×
            </button>
            <img
              src={lightboxImage}
              alt="Lightbox Snapshot"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/10 shadow-2xl"
            />
          </div>
        )}

      </div>
    </AppShell>
  );
};

export default CommunityDetail;
