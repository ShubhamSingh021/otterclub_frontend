import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createEvent, updateEvent, getEventBySlug, getEvents, getEventById } from "../api/eventApi.js";
import Container from "../components/layout/Container.jsx";
import AdminNavbar from "../components/layout/AdminNavbar.jsx";
import toast from "react-hot-toast";

const AdminEventFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "football",
    eventDate: "",
    startTime: "",
    endTime: "",
    venue: "",
    maxParticipants: 50,
    eventFee: 0,
    membershipDiscount: 0,
    skillLevel: "all levels",
    ageRestriction: "open for all",
    healthDisclaimer: "By participating, you agree that you are in good health.",
    registrationDeadline: "",
    status: "upcoming",
    isFeatured: false,
  });

  const [eventImage, setEventImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [previewEventImage, setPreviewEventImage] = useState("");
  const [previewGallery, setPreviewGallery] = useState([]);

  useEffect(() => {
    if (id) {
      const fetchEvent = async () => {
        try {
          const res = await getEventById(id);
          const event = res.data;
          if (event) {
            setFormData({
              ...event,
              eventDate: event.eventDate?.split("T")[0] || "",
              registrationDeadline: event.registrationDeadline?.split("T")[0] || "",
            });
            // Set existing image URLs for preview
            if (event.eventImage) setPreviewEventImage(event.eventImage);
            if (event.galleryImages && Array.isArray(event.galleryImages)) {
              const validImages = event.galleryImages.filter(img => img && typeof img === 'string');
              setPreviewGallery(validImages);
            }
          }
        } catch (error) {
          toast.error("Failed to load event");
        } finally {
          setInitialLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.name === "eventImage") {
      const file = e.target.files[0];
      setEventImage(file);
      if (file) {
        setPreviewEventImage(URL.createObjectURL(file));
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

      setGalleryImages(prev => [...prev, ...filesToAdd]);
      const newPreviews = filesToAdd.map(file => ({
        url: URL.createObjectURL(file),
        isNew: true,
        file: file
      }));
      setPreviewGallery(prev => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryImage = (index) => {
    const itemToRemove = previewGallery[index];
    
    // Revoke object URL if it's a new preview
    if (itemToRemove.isNew && itemToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(itemToRemove.url);
    }

    setPreviewGallery(prev => prev.filter((_, i) => i !== index));
    
    // If it was a new file, remove it from galleryImages array too
    if (itemToRemove.isNew) {
      setGalleryImages(prev => prev.filter(file => file !== itemToRemove.file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (previewGallery.length > 10) {
      toast.error("A maximum of 10 gallery photos are allowed.");
      return;
    }
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (eventImage) data.append("eventImage", eventImage);
    galleryImages.forEach(img => data.append("galleryImages", img));

    // Send the list of preserved existing images
    const existingGallery = previewGallery.filter(img => typeof img === 'string' || !img.isNew);
    data.append("existingGallery", JSON.stringify(existingGallery));

    try {
      if (id) {
        await updateEvent(id, data);
        toast.success("Event updated successfully!");
      } else {
        await createEvent(data);
        toast.success("Event created successfully!");
      }
      setTimeout(() => navigate("/admin/events"), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="flex min-h-screen items-center justify-center bg-[#060b16] text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <AdminNavbar />

      <main className="py-20">
      <Container className="max-w-4xl">
        <div className="mb-10">
          <h1 className="text-3xl font-bold">{id ? "Edit Event" : "Create Event"}</h1>
          <p className="mt-1 text-slate-400">Fill in the details below to {id ? "update" : "list"} the event.</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-2">
          {/* Main Info */}
          <div className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.02] p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-[#40e0d0]">Basic Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Event Title</label>
                <input name="title" required value={formData.title} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" placeholder="e.g. Sunday Football League" />
              </div>
              
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Category</label>
                <select name="category" value={formData.category} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]">
                  {["football", "cricket", "badminton", "yoga", "trekking", "pickleball", "gokarting", "other"].map(cat => (
                    <option key={cat} value={cat} className="bg-[#081429]">{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Description</label>
                <textarea name="description" required value={formData.description} onChange={handleChange} rows="4" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" placeholder="Detailed event description..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Event Date</label>
                  <input type="date" name="eventDate" required value={formData.eventDate} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Deadline</label>
                  <input type="date" name="registrationDeadline" required value={formData.registrationDeadline} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Start Time</label>
                  <input type="time" name="startTime" required value={formData.startTime} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">End Time</label>
                  <input type="time" name="endTime" required value={formData.endTime} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" />
                </div>
              </div>
            </div>
          </div>

          {/* Logistics & Rules */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#40e0d0]">Rules & Requirements</h3>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Skill Level</label>
                  <input name="skillLevel" value={formData.skillLevel} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" placeholder="e.g. Beginners, Pro, All Levels" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Age Restriction</label>
                  <input name="ageRestriction" value={formData.ageRestriction} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" placeholder="e.g. 18+, Open for all" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Health Disclaimer</label>
                  <textarea name="healthDisclaimer" value={formData.healthDisclaimer} onChange={handleChange} rows="2" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" placeholder="Health related rules..." />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#40e0d0]">Logistics & Pricing</h3>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Venue</label>
                  <input name="venue" required value={formData.venue} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" placeholder="Main Stadium, Court 4, etc." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Fee (₹)</label>
                    <input type="number" name="eventFee" value={formData.eventFee} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Max Participants</label>
                    <input type="number" name="maxParticipants" value={formData.maxParticipants} onChange={handleChange} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white focus:border-[#40e0d0]" />
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2">
                   <label className="flex cursor-pointer items-center gap-3">
                     <input type="checkbox" name="isFeatured" checked={formData.isFeatured} onChange={handleChange} className="h-5 w-5 rounded border-white/10 bg-white/10 text-[#40e0d0] focus:ring-0" />
                     <span className="text-sm font-bold text-slate-300">Feature this event on homepage</span>
                   </label>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#40e0d0]">Media Assets</h3>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Cover Image</label>
                  {previewEventImage && (
                    <div className="mt-2 mb-4 relative aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                      <img src={previewEventImage} alt="Preview" className="h-full w-full object-cover" />
                      <div className="absolute top-2 left-2 rounded-md bg-black/50 px-2 py-1 text-[10px] font-bold uppercase text-white backdrop-blur-sm">Current Image</div>
                    </div>
                  )}
                  <input type="file" name="eventImage" accept="image/*" onChange={handleFileChange} className="mt-2 w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-white/20" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Gallery (Multiple)</label>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${previewGallery.length >= 10 ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-[#40e0d0]'}`}>
                      {previewGallery.length}/10
                    </span>
                  </div>
                  {previewGallery && previewGallery.length > 0 && (
                    <div className="mt-3 mb-4 grid grid-cols-5 gap-2">
                      {previewGallery.map((item, idx) => {
                        const url = typeof item === 'string' ? item : item.url;
                        return (
                          <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5">
                            <img 
                              src={url} 
                              alt={`Gallery ${idx}`} 
                              className="h-full w-full object-cover transition group-hover:scale-110"
                              onError={(e) => {
                                // Instead of hiding, show an error placeholder
                                e.target.src = "https://via.placeholder.com/150?text=Error";
                                e.target.classList.add('opacity-50');
                              }} 
                            />
                            <button 
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
                            >
                              <span className="text-xs font-bold">×</span>
                            </button>
                            {(!item.isNew && typeof item !== 'string') === false && item.isNew && (
                              <div className="absolute bottom-1 left-1 rounded bg-[#40e0d0]/80 px-1 py-0.5 text-[8px] font-bold text-black uppercase">New</div>
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
                    <input type="file" multiple name="galleryImages" accept="image/*" onChange={handleFileChange} className="mt-2 w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-white/20" />
                  )}
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 text-lg font-bold text-[#061323] shadow-lg shadow-[#40e0d0]/10 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? "Processing..." : id ? "Update Event" : "Create Event"}
            </button>
          </div>
        </form>
      </Container>
      </main>
    </div>
  );
};

export default AdminEventFormPage;
