import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Container from "../components/layout/Container.jsx";
import AdminNavbar from "../components/layout/AdminNavbar.jsx";
import toast from "react-hot-toast";
import { format } from "date-fns";
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCoupon,
} from "../api/couponApi.js";
import { getEvents } from "../api/eventApi.js";

const safeFormatDate = (dateVal) => {
  if (!dateVal) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return format(d, "yyyy-MM-dd");
  } catch (e) {
    return "";
  }
};

const AdminCouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  
  const navigate = useNavigate();

  // Form states
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState("");
  const [minPurchaseAmount, setMinPurchaseAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [limitPerUser, setLimitPerUser] = useState("1");
  const [applicableTo, setApplicableTo] = useState("all");
  const [selectedMemberships, setSelectedMemberships] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [isActive, setIsActive] = useState(true);

  const fetchCoupons = async () => {
    try {
      const res = await getAdminCoupons();
      if (res.data && res.data.success) {
        setCoupons(res.data.data || []);
      }
    } catch (err) {
      toast.error("Failed to fetch coupons");
      if (err.response?.status === 401) navigate("/admin/login");
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await getEvents();
      if (res.data) {
        setEvents(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch events for selector:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCoupons(), fetchEvents()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode("");
    setDescription("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMaxDiscountAmount("");
    setMinPurchaseAmount("");
    setStartDate("");
    setEndDate("");
    setUsageLimit("");
    setLimitPerUser("1");
    setApplicableTo("all");
    setSelectedMemberships([]);
    setSelectedEvents([]);
    setIsActive(true);
    setShowModal(true);
  };

  const handleOpenEdit = (coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || "");
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue);
    setMaxDiscountAmount(coupon.maxDiscountAmount || "");
    setMinPurchaseAmount(coupon.minPurchaseAmount || "");
    setStartDate("");
    setEndDate(coupon.expiryDate ? safeFormatDate(coupon.expiryDate) : "");
    setUsageLimit(coupon.usageLimit || "");
    setLimitPerUser(coupon.perUserLimit || "1");
    setApplicableTo(coupon.appliesTo === "both" ? "all" : (coupon.appliesTo || "all"));
    setSelectedMemberships(coupon.applicablePlans || []);
    setSelectedEvents(coupon.applicableEvents || []);
    setIsActive(coupon.isActive);
    setShowModal(true);
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await toggleCoupon(id);
      if (res.data && res.data.success) {
        toast.success("Coupon status updated!");
        fetchCoupons();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to toggle status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon code?")) return;
    try {
      const res = await deleteCoupon(id);
      if (res.data && res.data.success) {
        toast.success("Coupon deleted successfully!");
        fetchCoupons();
      }
    } catch (err) {
      toast.error("Failed to delete coupon");
    }
  };

  const handleMembershipChange = (membershipName) => {
    if (selectedMemberships.includes(membershipName)) {
      setSelectedMemberships(prev => prev.filter(m => m !== membershipName));
    } else {
      setSelectedMemberships(prev => [...prev, membershipName]);
    }
  };

  const handleEventChange = (eventId) => {
    if (selectedEvents.includes(eventId)) {
      setSelectedEvents(prev => prev.filter(id => id !== eventId));
    } else {
      setSelectedEvents(prev => [...prev, eventId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code) return toast.error("Coupon code is required");
    if (!description) return toast.error("Description is required");
    if (!discountValue) return toast.error("Discount value is required");
    if (!endDate) return toast.error("Expiry (End) date is required");

    const payload = {
      code: code.toUpperCase().trim(),
      description,
      discountType,
      discountValue: Number(discountValue),
      expiryDate: new Date(endDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perUserLimit: limitPerUser ? Number(limitPerUser) : 1,
      appliesTo: applicableTo === "all" ? "both" : applicableTo,
      applicablePlans: applicableTo === "membership" ? selectedMemberships : [],
      applicableEvents: applicableTo === "event" ? selectedEvents : [],
      isActive,
    };

    try {
      let res;
      if (editingCoupon) {
        res = await updateCoupon(editingCoupon._id, payload);
      } else {
        res = await createCoupon(payload);
      }

      if (res.data && res.data.success) {
        toast.success(editingCoupon ? "Coupon updated successfully!" : "Coupon created successfully!");
        setShowModal(false);
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save coupon");
    }
  };

  // Stats calculation
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive).length;
  const totalUsage = coupons.reduce((acc, curr) => acc + (curr.usedCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <AdminNavbar />

      <main className="py-10">
        <Container>
          {/* Header */}
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Manage Promo Codes & Coupons</h2>
              <p className="mt-1 text-slate-400">Create, edit, toggle, and view usage statistics for active coupons</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="rounded-xl bg-[#40e0d0] px-6 py-3 text-sm font-bold text-[#061323] transition hover:scale-[1.02] shadow-[0_0_15px_rgba(64,224,208,0.2)]"
            >
              + Create Promo Code
            </button>
          </div>

          {/* Quick stats grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Coupons</p>
              <h3 className="text-3xl font-bold mt-2 text-white">{totalCoupons}</h3>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Active Coupons</p>
              <h3 className="text-3xl font-bold mt-2 text-[#40e0d0]">{activeCoupons}</h3>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Total Usages</p>
              <h3 className="text-3xl font-bold mt-2 text-[#2d61ff]">{totalUsage} times</h3>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Code / Type</th>
                    <th className="px-6 py-4">Discount</th>
                    <th className="px-6 py-4">Applies To</th>
                    <th className="px-6 py-4">Usage (Limit)</th>
                    <th className="px-6 py-4">Expiry Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center text-slate-500">
                        Loading coupons list...
                      </td>
                    </tr>
                  ) : coupons.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center text-slate-500">
                        No coupon codes created yet. Click "Create Promo Code" to add your first discount.
                      </td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr key={coupon._id} className="hover:bg-white/[0.01] transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-white font-mono">{coupon.code}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{coupon.description || "No description"}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">
                            {coupon.discountType === "percentage"
                              ? `${coupon.discountValue}% Off`
                              : `₹${coupon.discountValue} Off`}
                          </div>
                          {coupon.maxDiscountAmount && (
                            <div className="text-xs text-slate-500">Max discount: ₹{coupon.maxDiscountAmount}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            coupon.appliesTo === "both"
                              ? "bg-slate-500/10 text-slate-300 border border-slate-500/20"
                              : coupon.appliesTo === "membership"
                                ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                : "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                          }`}>
                            {coupon.appliesTo}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">
                            {coupon.usedCount || 0}
                            <span className="text-xs font-normal text-slate-500">
                              {" "}
                              / {coupon.usageLimit || "∞"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">
                          {coupon.expiryDate ? safeFormatDate(coupon.expiryDate) : "Never Expires"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleActive(coupon._id)}
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border transition ${
                              coupon.isActive
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                            }`}
                          >
                            {coupon.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEdit(coupon)}
                            className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/10 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </main>

      {/* Modal dialog */}
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#060b16]/90 backdrop-blur-md" onClick={() => setShowModal(false)} />

          <div className="relative w-full max-w-2xl overflow-y-auto max-h-[90vh] rounded-3xl border border-white/10 bg-[#0a1222] shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <h3 className="font-display text-xl font-bold text-white">
                {editingCoupon ? "Edit Coupon Details" : "Create New Discount Coupon"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Promo Code & Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. OTTER50"
                    disabled={editingCoupon}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 50% discount for Elite members"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  />
                </div>
              </div>

              {/* Discount Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Discount Type *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0a1222] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Value *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="e.g. 10 or 150"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Max Discount Amount (₹)</label>
                  <input
                    type="number"
                    value={maxDiscountAmount}
                    onChange={(e) => setMaxDiscountAmount(e.target.value)}
                    placeholder="Leave blank if unlimited"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  />
                </div>
              </div>

              {/* Purchase threshold & Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Min Purchase Amount (₹)</label>
                  <input
                    type="number"
                    value={minPurchaseAmount}
                    onChange={(e) => setMinPurchaseAmount(e.target.value)}
                    placeholder="Leave blank for ₹0"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Overall Usage Limit</label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Leave blank for infinite"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Usage Limit Per User</label>
                  <input
                    type="number"
                    value={limitPerUser}
                    onChange={(e) => setLimitPerUser(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  />
                </div>
              </div>

              {/* Activation dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  />
                </div>
              </div>

              {/* Applicable targets selection */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-500 block mb-1">Applicable To</label>
                  <select
                    value={applicableTo}
                    onChange={(e) => setApplicableTo(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0a1222] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none"
                  >
                    <option value="all">Entire Club Checkout (Events + Memberships)</option>
                    <option value="membership">Memberships Only</option>
                    <option value="event">Specific Events Only</option>
                  </select>
                </div>

                {applicableTo === "membership" && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                      Select Target Membership Plans
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {["BASIC", "ELITE", "PRO"].map((planName) => (
                        <label key={planName} className="flex items-center gap-2 text-sm text-slate-300 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMemberships.includes(planName)}
                            onChange={() => handleMembershipChange(planName)}
                            className="rounded border-white/10 text-[#40e0d0] focus:ring-0 focus:ring-offset-0 bg-transparent h-4 w-4 cursor-pointer"
                          />
                          {planName}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {applicableTo === "event" && (
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                      Select Eligible Events
                    </label>
                    <div className="max-h-40 overflow-y-auto space-y-2 rounded-xl border border-white/10 bg-white/[0.01] p-3">
                      {events.length === 0 ? (
                        <p className="text-xs text-slate-500">No events found. Please create events first.</p>
                      ) : (
                        events.map((evt) => (
                          <label key={evt._id} className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedEvents.includes(evt._id)}
                              onChange={() => handleEventChange(evt._id)}
                              className="rounded border-white/10 text-[#40e0d0] focus:ring-0 focus:ring-offset-0 bg-transparent h-4 w-4 cursor-pointer"
                            />
                            {evt.title}
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-white/10 text-[#40e0d0] focus:ring-0 focus:ring-offset-0 bg-transparent h-4 w-4 cursor-pointer"
                />
                <label htmlFor="isActiveToggle" className="text-sm font-semibold text-slate-300 cursor-pointer select-none">
                  Activate this promo code immediately
                </label>
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 text-sm font-bold text-[#061323] transition hover:scale-[1.01] active:scale-95"
              >
                {editingCoupon ? "Save Changes" : "Generate Promo Code"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
