import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createEvent, updateEvent, getEventBySlug, getEvents, getEventById } from "../api/eventApi.js";
import Container from "../components/layout/Container.jsx";
import toast, { Toaster } from "react-hot-toast";

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
      setGalleryImages(files);
      if (files.length > 0) {
        setPreviewGallery(files.map(file => URL.createObjectURL(file)));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });
    if (eventImage) data.append("eventImage", eventImage);
    galleryImages.forEach(img => data.append("galleryImages", img));

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
      <Toaster position="top-center" />
      <nav className="border-b border-white/10 bg-[#081429]/50 backdrop-blur-md sticky top-0 z-50">
        <Container className="flex h-20 items-center justify-between">
          <h1 className="font-display text-xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex gap-6 items-center">
            <button onClick={() => navigate("/admin/registrations")} className="text-sm font-medium text-slate-400 hover:text-white">Registrations</button>
            <button onClick={() => navigate("/admin/events")} className="text-sm font-medium text-slate-400 hover:text-white">Manage Events</button>
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
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Fee ($)</label>
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
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Gallery (Multiple)</label>
                  {previewGallery && previewGallery.length > 0 && (
                    <div className="mt-2 mb-4 grid grid-cols-4 gap-2">
                      {previewGallery.map((url, idx) => (
                        <div key={idx} className="relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5">
                          <img 
                            src={url} 
                            alt={`Gallery ${idx}`} 
                            className="h-full w-full object-cover"
                            onError={(e) => e.target.closest('.relative').style.display = 'none'} 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <input type="file" multiple name="galleryImages" accept="image/*" onChange={handleFileChange} className="mt-2 w-full text-sm text-slate-400 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-white/20" />
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
