import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminGetPosts, adminCreatePost, adminUpdatePost } from "../api/communityApi.js";
import Container from "../components/layout/Container.jsx";
import toast from "react-hot-toast";

const AdminPostFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    category: "Announcement",
    author: "Otter Society Admin",
    status: "draft",
    publishedAt: "",
    videoUrl: "",
    commentsEnabled: true,
    featured: false,
    tags: "",
  });

  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [previewCoverImage, setPreviewCoverImage] = useState("");
  const [previewGallery, setPreviewGallery] = useState([]);

  useEffect(() => {
    if (id) {
      const fetchPostDetails = async () => {
        try {
          const res = await adminGetPosts();
          const post = res.data?.find((p) => p._id === id);

          if (post) {
            // Reformat tags array to comma-separated string
            const tagsStr = Array.isArray(post.tags) ? post.tags.join(", ") : "";
            
            // Format publishedAt date to HTML input datetime value
            let pubDate = "";
            if (post.publishedAt) {
              const d = new Date(post.publishedAt);
              // Format: YYYY-MM-DDTHH:MM
              pubDate = d.toISOString().slice(0, 16);
            }

            setFormData({
              title: post.title || "",
              description: post.description || "",
              content: post.content || "",
              category: post.category || "Announcement",
              author: post.author || "Otter Society Admin",
              status: post.status || "draft",
              publishedAt: pubDate,
              videoUrl: post.videoUrl || "",
              commentsEnabled: post.commentsEnabled !== false,
              featured: post.featured === true,
              tags: tagsStr,
            });

            if (post.coverImage) setPreviewCoverImage(post.coverImage);
            if (post.galleryImages && Array.isArray(post.galleryImages)) {
              setPreviewGallery(post.galleryImages);
            }
          } else {
            toast.error("Could not find the requested community post.");
            navigate("/admin/community");
          }
        } catch (error) {
          console.error("Failed to load post data:", error);
          toast.error("An error occurred while loading post details.");
        } finally {
          setInitialLoading(false);
        }
      };

      fetchPostDetails();
    }
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.name === "coverImage") {
      const file = e.target.files[0];
      setCoverImage(file);
      if (file) {
        setPreviewCoverImage(URL.createObjectURL(file));
      }
    } else {
      const files = Array.from(e.target.files);
      const currentCount = previewGallery.length;

      if (currentCount >= 10) {
        toast.error("You have already reached the maximum limit of 10 gallery photos.");
        return;
      }

      let filesToAdd = files;
      if (currentCount + files.length > 10) {
        const allowedCount = 10 - currentCount;
        toast.error(`You can only select up to 10 photos. Adding first ${allowedCount} selected images.`);
        filesToAdd = files.slice(0, allowedCount);
      }

      if (filesToAdd.length === 0) return;

      setGalleryImages((prev) => [...prev, ...filesToAdd]);
      const newPreviews = filesToAdd.map((file) => ({
        url: URL.createObjectURL(file),
        isNew: true,
        file: file,
      }));
      setPreviewGallery((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryImage = (index) => {
    const itemToRemove = previewGallery[index];

    // Clean blob preview memory
    if (itemToRemove.isNew && itemToRemove.url?.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.url);
    }

    setPreviewGallery((prev) => prev.filter((_, i) => i !== index));

    if (itemToRemove.isNew) {
      setGalleryImages((prev) => prev.filter((file) => file !== itemToRemove.file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Please provide a title.");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("Please provide a short description summary.");
      return;
    }
    if (!formData.content.trim()) {
      toast.error("Please write the post body content.");
      return;
    }
    if (!id && !coverImage) {
      toast.error("A cover banner image is required for new posts.");
      return;
    }
    if (previewGallery.length > 10) {
      toast.error("A maximum of 10 gallery photos are allowed.");
      return;
    }

    setLoading(true);

    const submissionData = new FormData();
    Object.keys(formData).forEach((key) => {
      submissionData.append(key, formData[key]);
    });

    if (coverImage) {
      submissionData.append("coverImage", coverImage);
    }

    // Add multiple files to same Multer field
    galleryImages.forEach((file) => {
      submissionData.append("galleryImages", file);
    });

    // Send the list of preserved existing images
    const existingGallery = previewGallery.filter((img) => typeof img === "string" || !img.isNew);
    submissionData.append("existingGallery", JSON.stringify(existingGallery));

    try {
      if (id) {
        await adminUpdatePost(id, submissionData);
        toast.success("Community post updated successfully!");
      } else {
        await adminCreatePost(submissionData);
        toast.success("Community post created successfully!");
      }
      setTimeout(() => navigate("/admin/community"), 1500);
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error(error.response?.data?.message || "An unexpected error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b16] text-white">
        Loading community editor assets...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050b16] text-white">

      {/* Admin Header Navbar */}
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

      <main className="py-20">
        <Container className="max-w-4xl">
          
          {/* Form Header */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{id ? "Edit Community Post" : "Create Community Post"}</h1>
              <p className="mt-1 text-slate-400">Compose and publish spotlight stories, achieve announcements, and club highlights.</p>
            </div>
            
            <button
              onClick={() => navigate("/admin/community")}
              className="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
            
            {/* Left side card: basic story detail fields */}
            <div className="space-y-6 rounded-3xl border border-white/5 bg-[#0a1222]/40 p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#40e0d0]">Story Details</h3>

              <div className="space-y-4">
                
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Post Title</label>
                  <input
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0]"
                    placeholder="e.g. Otter Athletics Gold Cup Win"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0] cursor-pointer"
                  >
                    {["Announcement", "Event Recap", "Achievement", "Member Spotlight", "Sponsor Update"].map((cat) => (
                      <option key={cat} value={cat} className="bg-[#081429]">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Author Name</label>
                  <input
                    name="author"
                    value={formData.author}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Short Summary</label>
                  <textarea
                    name="description"
                    required
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0] resize-none"
                    placeholder="Brief 1-2 sentence preview that appears in card lists..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Full Content Body (HTML friendly)</label>
                  <textarea
                    name="content"
                    required
                    rows="8"
                    value={formData.content}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0]"
                    placeholder="Tell your complete story here. You can use standard <p>, <b>, <ul>, <br> tags."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tags (Comma-separated)</label>
                  <input
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0]"
                    placeholder="e.g. champion, relay, sports, athletics"
                  />
                </div>

              </div>
            </div>

            {/* Right side: Media assets & scheduling release options */}
            <div className="space-y-8">
              
              {/* Media Card */}
              <div className="rounded-3xl border border-white/5 bg-[#0a1222]/40 p-8 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#40e0d0]">Media Assets</h3>

                <div className="space-y-4">
                  
                  {/* Cover banner image */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Cover Banner Image</label>
                    {previewCoverImage && (
                      <div className="mt-2 mb-4 relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                        <img src={previewCoverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                        <div className="absolute top-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-200">Current Banner</div>
                      </div>
                    )}
                    <input
                      type="file"
                      name="coverImage"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mt-2 w-full text-xs text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-white/20 cursor-pointer"
                    />
                  </div>

                  {/* Video URL */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Highlight Video URL (YouTube link)</label>
                    <input
                      name="videoUrl"
                      value={formData.videoUrl}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0]"
                      placeholder="e.g. https://www.youtube.com/watch?v=..."
                    />
                  </div>

                  {/* Snapshot gallery uploads */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Story Gallery Snapshots</label>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${previewGallery.length >= 10 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-[#40e0d0]'}`}>
                        {previewGallery.length}/10
                      </span>
                    </div>
                    
                    {previewGallery && previewGallery.length > 0 && (
                      <div className="mt-3 mb-4 grid grid-cols-4 gap-2">
                        {previewGallery.map((item, idx) => {
                          const url = typeof item === "string" ? item : item.url;
                          const isNewFile = typeof item === "object" && item.isNew;
                          return (
                            <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5">
                              <img src={url} alt={`Gallery Preview ${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeGalleryImage(idx)}
                                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition duration-150"
                              >
                                ×
                              </button>
                              {isNewFile && (
                                <div className="absolute bottom-1 left-1 rounded bg-[#40e0d0] px-1 py-0.5 text-[8px] font-black text-black uppercase">NEW</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {previewGallery.length >= 10 ? (
                      <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400 font-medium">
                        ⚠️ Maximum limit of 10 gallery photos reached. Remove existing ones to upload new snapshots.
                      </div>
                    ) : (
                      <input
                        type="file"
                        multiple
                        name="galleryImages"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="mt-2 w-full text-xs text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-white/20 cursor-pointer"
                      />
                    )}
                  </div>

                </div>
              </div>

              {/* Release Configuration Settings card */}
              <div className="rounded-3xl border border-white/5 bg-[#0a1222]/40 p-8 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#40e0d0]">Publication Status</h3>

                <div className="space-y-4">
                  
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0] cursor-pointer"
                    >
                      <option value="draft" className="bg-[#081429]">Draft (Hidden)</option>
                      <option value="published" className="bg-[#081429]">Published (Live Immediately)</option>
                      <option value="scheduled" className="bg-[#081429]">Scheduled (Released Later)</option>
                    </select>
                  </div>

                  {formData.status === "scheduled" && (
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Release Timestamp</label>
                      <input
                        type="datetime-local"
                        name="publishedAt"
                        required
                        value={formData.publishedAt}
                        onChange={handleChange}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:outline-none focus:border-[#40e0d0] cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="pt-2 space-y-3">
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        name="featured"
                        checked={formData.featured}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-white/10 bg-[#050b16] text-[#40e0d0] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-300">Add to Spotlight trays</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        name="commentsEnabled"
                        checked={formData.commentsEnabled}
                        onChange={handleChange}
                        className="h-5 w-5 rounded border-white/10 bg-[#050b16] text-[#40e0d0] focus:ring-0 cursor-pointer"
                      />
                      <span className="text-sm font-bold text-slate-300">Enable user comments board</span>
                    </label>
                  </div>

                </div>
              </div>

              {/* Submit trigger button */}
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 text-lg font-bold text-[#061323] shadow-lg shadow-[#40e0d0]/10 hover:shadow-[0_0_20px_rgba(64,224,208,0.4)] transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? "Uploading Media Assets..." : id ? "Update Post" : "Publish Post"}
              </button>

            </div>

          </form>
        </Container>
      </main>
    </div>
  );
};

export default AdminPostFormPage;
