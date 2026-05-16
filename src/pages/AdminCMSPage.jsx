import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { useHomepage } from "../hooks/useHomepage";
import { 
  updateHero, 
  updateAbout, 
  updateSection, 
  updateStats, 
  updateSettings,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial 
} from "../api/cmsApi";
import { 
  getAdminPlans, 
  createPlan, 
  updatePlan, 
  deletePlan 
} from "../api/planApi";
import AdminNavbar from "../components/layout/AdminNavbar";
import Container from "../components/layout/Container";

const AdminCMSPage = () => {
  const { data, isLoading, refetch } = useHomepage();
  const [activeTab, setActiveTab] = useState("hero");
  const navigate = useNavigate();

  const tabs = [
    { id: "hero", label: "Hero" },
    { id: "stats", label: "Stats" },
    { id: "about", label: "About" },
    { id: "whyJoin", label: "Why Join" },
    { id: "testimonials", label: "Testimonials" },
    { id: "contact", label: "Contact & Socials" },
    { id: "plans", label: "Membership Plans" },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#060b16] text-white">
        <div className="animate-pulse text-lg italic">Loading CMS data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060b16] text-white pb-20">
      <Toaster position="top-center" />
      <AdminNavbar />

      <main className="py-10">
        <Container>
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeTab === tab.id 
                    ? "bg-[#40e0d0] text-[#061323]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "hero" && <HeroForm initialData={data?.heroContent} onUpdate={refetch} />}
                {activeTab === "stats" && <StatsForm initialData={data?.stats} onUpdate={refetch} />}
                {activeTab === "about" && <AboutForm initialData={data?.aboutContent} onUpdate={refetch} />}
                {activeTab === "whyJoin" && <WhyJoinForm initialData={data?.homepageSections?.whyJoinUs} onUpdate={refetch} />}
                {activeTab === "testimonials" && <TestimonialsManager initialData={data?.testimonials} onUpdate={refetch} />}
                {activeTab === "contact" && <ContactSocialsForm initialData={data?.siteSettings} onUpdate={refetch} />}
                {activeTab === "plans" && <PlansManager />}
              </motion.div>
            </AnimatePresence>
          </div>
        </Container>
      </main>
    </div>
  );
};

// --- Sub-components (Forms) ---

const HeroForm = ({ initialData, onUpdate }) => {
  const [formData, setFormData] = useState({
    heroTitle: initialData?.title || "",
    heroSubtitle: initialData?.subtitle || "",
    primaryCtaLabel: initialData?.primaryCta?.label || "",
    primaryCtaHref: initialData?.primaryCta?.href || "",
    secondaryCtaLabel: initialData?.secondaryCta?.label || "",
    secondaryCtaHref: initialData?.secondaryCta?.href || "",
  });
  const [heroImage, setHeroImage] = useState(null);
  const [preview, setPreview] = useState(initialData?.imageUrl || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        heroTitle: initialData.title || "",
        heroSubtitle: initialData.subtitle || "",
        primaryCtaLabel: initialData.primaryCta?.label || "",
        primaryCtaHref: initialData.primaryCta?.href || "",
        secondaryCtaLabel: initialData.secondaryCta?.label || "",
        secondaryCtaHref: initialData.secondaryCta?.href || "",
      });
      setPreview(initialData.imageUrl || "");
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting Hero update:", formData);
    try {
      const dataToSubmit = { ...formData };
      if (heroImage) dataToSubmit.heroImage = heroImage;
      const res = await updateHero(dataToSubmit);
      console.log("Hero update success:", res.data);
      toast.success("Hero section updated!");
      onUpdate();
    } catch (err) {
      console.error("Hero update error:", err);
      toast.error(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Hero Title</label>
          <input 
            type="text" 
            value={formData.heroTitle}
            onChange={(e) => setFormData({...formData, heroTitle: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Hero Subtitle</label>
          <textarea 
            rows="3"
            value={formData.heroSubtitle}
            onChange={(e) => setFormData({...formData, heroSubtitle: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Hero Image (Max 10MB)</label>
          
          {preview && (
            <div className="mb-4 relative group w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <img 
                src={preview} 
                alt="Hero Preview" 
                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-xs text-white/70 font-medium">Current Hero Image</p>
              </div>
            </div>
          )}

          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && file.size > 10 * 1024 * 1024) {
                toast.error("File is too large! Please choose an image under 10MB.");
                e.target.value = null;
                return;
              }
              if (file) {
                setHeroImage(file);
                const objectUrl = URL.createObjectURL(file);
                setPreview(objectUrl);
              }
            }}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Primary CTA Label</label>
          <input 
            type="text" 
            value={formData.primaryCtaLabel}
            onChange={(e) => setFormData({...formData, primaryCtaLabel: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Primary CTA Link</label>
          <input 
            type="text" 
            value={formData.primaryCtaHref}
            onChange={(e) => setFormData({...formData, primaryCtaHref: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Secondary CTA Label</label>
          <input 
            type="text" 
            value={formData.secondaryCtaLabel}
            onChange={(e) => setFormData({...formData, secondaryCtaLabel: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Secondary CTA Link</label>
          <input 
            type="text" 
            value={formData.secondaryCtaHref}
            onChange={(e) => setFormData({...formData, secondaryCtaHref: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
      </div>
      <button 
        disabled={loading}
        className="rounded-xl bg-[#40e0d0] px-8 py-3 font-bold text-[#061323] transition hover:scale-[1.02] disabled:opacity-50"
      >
        {loading ? "Updating..." : "Save Changes"}
      </button>
    </form>
  );
};

const StatsForm = ({ initialData, onUpdate }) => {
  const [formData, setFormData] = useState({
    clubCount: initialData?.clubCount || 0,
    stateCount: initialData?.stateCount || 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        clubCount: initialData.clubCount || 0,
        stateCount: initialData.stateCount || 0,
      });
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Updating stats with:", formData);
      const res = await updateStats(formData);
      console.log("Stats update response:", res.data);
      toast.success("Stats updated!");
      onUpdate();
    } catch (err) {
      console.error("Stats update error:", err);
      toast.error(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Auto-Calculated Stats</p>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Members:</span>
              <span className="font-display font-bold text-[#40e0d0]">{initialData?.totalMembers || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Events:</span>
              <span className="font-display font-bold text-[#40e0d0]">{initialData?.totalEvents || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Club Count (Manual)</label>
            <input 
              type="number" 
              value={formData.clubCount}
              onChange={(e) => setFormData({...formData, clubCount: parseInt(e.target.value)})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">State Count (Manual)</label>
            <input 
              type="number" 
              value={formData.stateCount}
              onChange={(e) => setFormData({...formData, stateCount: parseInt(e.target.value)})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
            />
          </div>
        </div>
        <button 
          disabled={loading}
          className="rounded-xl bg-[#40e0d0] px-8 py-3 font-bold text-[#061323] transition hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? "Updating..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

const AboutForm = ({ initialData, onUpdate }) => {
  const [formData, setFormData] = useState({
    heading: initialData?.heading || "",
    description: initialData?.description || "",
    mission: initialData?.mission || "",
    vision: initialData?.vision || "",
  });
  const [aboutImage, setAboutImage] = useState(null);
  const [preview, setPreview] = useState(initialData?.imageUrl || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        heading: initialData.heading || "",
        description: initialData.description || "",
        mission: initialData.mission || "",
        vision: initialData.vision || "",
      });
      setPreview(initialData.imageUrl || "");
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting About update:", formData);
    try {
      const dataToSubmit = { ...formData };
      if (aboutImage) dataToSubmit.aboutImage = aboutImage;
      const res = await updateAbout(dataToSubmit);
      console.log("About update success:", res.data);
      toast.success("About section updated!");
      onUpdate();
    } catch (err) {
      console.error("About update error:", err);
      toast.error(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Heading</label>
          <input 
            type="text" 
            value={formData.heading}
            onChange={(e) => setFormData({...formData, heading: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Description</label>
          <textarea 
            rows="4"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Mission</label>
          <textarea 
            rows="2"
            value={formData.mission}
            onChange={(e) => setFormData({...formData, mission: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Vision</label>
          <textarea 
            rows="2"
            value={formData.vision}
            onChange={(e) => setFormData({...formData, vision: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">About Image (Max 10MB)</label>
          
          {preview && (
            <div className="mb-4 relative group w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-white/5">
              <img 
                src={preview} 
                alt="About Preview" 
                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <p className="text-xs text-white/70 font-medium">Current About Image</p>
              </div>
            </div>
          )}

          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file && file.size > 10 * 1024 * 1024) {
                toast.error("File is too large! Please choose an image under 10MB.");
                e.target.value = null;
                return;
              }
              if (file) {
                setAboutImage(file);
                const objectUrl = URL.createObjectURL(file);
                setPreview(objectUrl);
              }
            }}
            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
          />
        </div>
      </div>
      <button 
        disabled={loading}
        className="rounded-xl bg-[#40e0d0] px-8 py-3 font-bold text-[#061323] transition hover:scale-[1.02] disabled:opacity-50"
      >
        {loading ? "Updating..." : "Save Changes"}
      </button>
    </form>
  );
};

const WhyJoinForm = ({ initialData, onUpdate }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    cards: initialData?.cards?.length === 3 ? initialData.cards : [
      { title: "", description: "", meta: "trophy" },
      { title: "", description: "", meta: "users" },
      { title: "", description: "", meta: "calendar" },
    ]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        subtitle: initialData.subtitle || "",
        cards: initialData.cards?.length === 3 ? initialData.cards : [
          { title: "", description: "", meta: "trophy" },
          { title: "", description: "", meta: "users" },
          { title: "", description: "", meta: "calendar" },
        ]
      });
    }
  }, [initialData]);

  const handleCardChange = (index, field, value) => {
    const newCards = [...formData.cards];
    newCards[index][field] = value;
    setFormData({ ...formData, cards: newCards });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting WhyJoin update:", formData);
    try {
      const res = await updateSection("whyJoinUs", formData);
      console.log("WhyJoin update success:", res.data);
      toast.success("Why Join section updated!");
      onUpdate();
    } catch (err) {
      console.error("WhyJoin update error:", err);
      toast.error(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="max-w-2xl space-y-6">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Section Title</label>
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Section Subtitle</label>
          <input 
            type="text" 
            value={formData.subtitle}
            onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-[#40e0d0] outline-none transition"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {formData.cards.map((card, idx) => (
          <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#40e0d0]">Feature Card {idx + 1}</p>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Title</label>
              <input 
                type="text" 
                value={card.title}
                onChange={(e) => handleCardChange(idx, "title", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#40e0d0]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description</label>
              <textarea 
                rows="3"
                value={card.description}
                onChange={(e) => handleCardChange(idx, "description", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#40e0d0]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Icon Key (e.g. trophy, users, calendar)</label>
              <input 
                type="text" 
                value={card.meta}
                onChange={(e) => handleCardChange(idx, "meta", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-[#40e0d0]"
              />
            </div>
          </div>
        ))}
      </div>

      <button 
        disabled={loading}
        className="rounded-xl bg-[#40e0d0] px-8 py-3 font-bold text-[#061323] transition hover:scale-[1.02] disabled:opacity-50"
      >
        {loading ? "Updating..." : "Save Changes"}
      </button>
    </form>
  );
};

const TestimonialsManager = ({ initialData, onUpdate }) => {
  const [items, setItems] = useState(initialData || []);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    personName: "",
    personRole: "",
    quote: "",
    rating: 5,
  });
  const [avatarImage, setAvatarImage] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setItems(initialData);
    }
  }, [initialData]);

  const resetForm = () => {
    setFormData({ personName: "", personRole: "", quote: "", rating: 5 });
    setAvatarImage(null);
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      personName: item.personName,
      personRole: item.personRole,
      quote: item.quote,
      rating: item.rating,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting Testimonial:", { editingId, formData });
    try {
      const dataToSubmit = { ...formData };
      if (avatarImage) dataToSubmit.avatarUrl = avatarImage;
      
      let res;
      if (editingId) {
        res = await updateTestimonial(editingId, dataToSubmit);
        toast.success("Testimonial updated");
      } else {
        res = await createTestimonial(dataToSubmit);
        toast.success("Testimonial added");
      }
      console.log("Testimonial op success:", res.data);
      resetForm();
      onUpdate();
    } catch (err) {
      console.error("Testimonial update error:", err);
      toast.error(err.response?.data?.message || err.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;
    try {
      await deleteTestimonial(id);
      toast.success("Deleted");
      onUpdate();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="space-y-12">
      <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
        <h3 className="text-lg font-bold">{editingId ? "Edit Testimonial" : "Add New Testimonial"}</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Name</label>
            <input 
              type="text" 
              required
              value={formData.personName}
              onChange={(e) => setFormData({...formData, personName: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Role</label>
            <input 
              type="text" 
              value={formData.personRole}
              onChange={(e) => setFormData({...formData, personRole: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Review / Quote</label>
            <textarea 
              rows="3"
              required
              value={formData.quote}
              onChange={(e) => setFormData({...formData, quote: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Rating (1-5)</label>
            <input 
              type="number" 
              min="1" max="5"
              value={formData.rating}
              onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Profile Image (Max 5MB)</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  toast.error("Avatar is too large! Please choose an image under 5MB.");
                  e.target.value = null;
                  return;
                }
                setAvatarImage(file);
              }}
              className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            disabled={loading}
            className="rounded-xl bg-[#40e0d0] px-8 py-3 font-bold text-[#061323] transition hover:scale-[1.02] disabled:opacity-50"
          >
            {editingId ? "Update" : "Add Testimonial"}
          </button>
          {editingId && (
            <button 
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-white/10 px-8 py-3 font-bold text-white transition hover:bg-white/20"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <img src={item.avatarUrl || "https://via.placeholder.com/100"} alt="" className="h-12 w-12 rounded-full object-cover" />
              <div>
                <p className="font-bold">{item.personName}</p>
                <p className="text-xs text-slate-500">{item.personRole}</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 line-clamp-3">"{item.quote}"</p>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => handleEdit(item)} className="text-xs font-bold text-[#40e0d0] hover:underline">Edit</button>
              <button onClick={() => handleDelete(item._id)} className="text-xs font-bold text-red-400 hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ContactSocialsForm = ({ initialData, onUpdate }) => {
  const [formData, setFormData] = useState({
    contact: {
      email: initialData?.contact?.email || "",
      phone: initialData?.contact?.phone || "",
      whatsapp: initialData?.contact?.whatsapp || "",
      address: initialData?.contact?.address || "",
    },
    socialLinks: initialData?.socialLinks?.length > 0 ? initialData.socialLinks : [
      { label: "instagram", href: "" },
      { label: "facebook", href: "" },
      { label: "twitter", href: "" },
      { label: "linkedin", href: "" },
    ]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        contact: {
          email: initialData.contact?.email || "",
          phone: initialData.contact?.phone || "",
          whatsapp: initialData.contact?.whatsapp || "",
          address: initialData.contact?.address || "",
        },
        socialLinks: initialData.socialLinks?.length > 0 ? initialData.socialLinks : [
          { label: "instagram", href: "" },
          { label: "facebook", href: "" },
          { label: "twitter", href: "" },
          { label: "linkedin", href: "" },
        ]
      });
    }
  }, [initialData]);

  const handleContactChange = (field, value) => {
    setFormData({
      ...formData,
      contact: { ...formData.contact, [field]: value }
    });
  };

  const handleSocialChange = (index, value) => {
    const newSocials = [...formData.socialLinks];
    newSocials[index].href = value;
    setFormData({ ...formData, socialLinks: newSocials });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Submitting ContactSocials update:", formData);
    try {
      const res = await updateSettings(formData);
      console.log("ContactSocials update success:", res.data);
      toast.success("Contact & Socials updated!");
      onUpdate();
    } catch (err) {
      console.error("ContactSocials update error:", err);
      toast.error(err.response?.data?.message || err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">
      <div className="max-w-2xl space-y-6">
        <h3 className="text-lg font-bold">Contact Information</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Email</label>
            <input 
              type="email" 
              value={formData.contact.email}
              onChange={(e) => handleContactChange("email", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Phone</label>
            <input 
              type="text" 
              value={formData.contact.phone}
              onChange={(e) => handleContactChange("phone", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">WhatsApp</label>
            <input 
              type="text" 
              value={formData.contact.whatsapp}
              onChange={(e) => handleContactChange("whatsapp", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Address</label>
            <input 
              type="text" 
              value={formData.contact.address}
              onChange={(e) => handleContactChange("address", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <h3 className="text-lg font-bold">Social Media Links</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          {formData.socialLinks.map((link, idx) => (
            <div key={idx}>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-2 capitalize">{link.label}</label>
              <input 
                type="text" 
                placeholder={`https://${link.label}.com/...`}
                value={link.href}
                onChange={(e) => handleSocialChange(idx, e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
              />
            </div>
          ))}
        </div>
      </div>

      <button 
        disabled={loading}
        className="rounded-xl bg-[#40e0d0] px-8 py-3 font-bold text-[#061323] transition hover:scale-[1.02] disabled:opacity-50"
      >
        {loading ? "Updating..." : "Save Changes"}
      </button>
    </form>
  );
};

const PlansManager = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    benefits: "",
    discountPercent: 0,
    displayOrder: 1,
    active: true
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await getAdminPlans();
      setPlans(res.data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setEditingId(plan._id);
    setFormData({
      name: plan.name,
      price: plan.price,
      benefits: plan.benefits.join("\n"),
      discountPercent: plan.discountPercent,
      displayOrder: plan.displayOrder,
      active: plan.active
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      price: "",
      benefits: "",
      discountPercent: 0,
      displayOrder: 1,
      active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        benefits: formData.benefits.split("\n").filter(b => b.trim() !== "")
      };

      if (editingId) {
        await updatePlan(editingId, dataToSubmit);
        toast.success("Plan updated");
      } else {
        await createPlan(dataToSubmit);
        toast.success("Plan created");
      }
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save plan");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This may affect existing memberships.")) return;
    try {
      await deletePlan(id);
      toast.success("Plan deleted");
      fetchPlans();
    } catch (error) {
      toast.error("Failed to delete plan");
    }
  };

  return (
    <div className="space-y-12">
      <form onSubmit={handleSubmit} className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
        <h3 className="text-lg font-bold">{editingId ? "Edit Membership Plan" : "Add New Membership Plan"}</h3>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Plan Name (e.g. BASIC, ELITE)</label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value.toUpperCase()})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Price (₹)</label>
            <input 
              type="number" 
              required
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Benefits (One per line)</label>
            <textarea 
              rows="5"
              required
              value={formData.benefits}
              onChange={(e) => setFormData({...formData, benefits: e.target.value})}
              placeholder="Benefit 1\nBenefit 2..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Discount % (on events)</label>
            <input 
              type="number" 
              value={formData.discountPercent}
              onChange={(e) => setFormData({...formData, discountPercent: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Display Order</label>
            <input 
              type="number" 
              value={formData.displayOrder}
              onChange={(e) => setFormData({...formData, displayOrder: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-[#40e0d0]"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({...formData, active: e.target.checked})}
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#40e0d0] focus:ring-[#40e0d0]"
            />
            <label htmlFor="active" className="text-xs font-bold uppercase text-slate-500">Active / Visible</label>
          </div>
        </div>
        <div className="flex gap-4">
          <button className="rounded-xl bg-[#40e0d0] px-8 py-3 font-bold text-[#061323] transition hover:scale-[1.02]">
            {editingId ? "Update Plan" : "Create Plan"}
          </button>
          {editingId && (
            <button 
              type="button"
              onClick={resetForm}
              className="rounded-xl bg-white/10 px-8 py-3 font-bold text-white transition hover:bg-white/20"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center text-slate-500">Loading plans...</p>
        ) : plans.map((plan) => (
          <div key={plan._id} className={`rounded-2xl border ${plan.active ? 'border-white/10' : 'border-red-900/50 grayscale'} bg-white/5 p-6 space-y-4`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{plan.name}</p>
                <h4 className="text-2xl font-bold mt-1">₹{plan.price}</h4>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold ${plan.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {plan.active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <ul className="text-xs text-slate-400 space-y-1">
              {plan.benefits.slice(0, 3).map((b, i) => <li key={i}>• {b}</li>)}
              {plan.benefits.length > 3 && <li>+ {plan.benefits.length - 3} more</li>}
            </ul>
            <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
              <button onClick={() => handleEdit(plan)} className="text-xs font-bold text-[#40e0d0] hover:underline uppercase">Edit</button>
              <button onClick={() => handleDelete(plan._id)} className="text-xs font-bold text-red-400 hover:underline uppercase">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCMSPage;
