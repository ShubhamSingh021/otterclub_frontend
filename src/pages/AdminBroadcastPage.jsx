import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import {
  broadcastAnnouncement,
  getNotifications,
  deleteNotification,
} from "../api/notificationApi.js";

const AdminBroadcastPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [type, setType] = useState("announcement");
  const [link, setLink] = useState("");

  const fetchRecentNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.data && res.data.success) {
        // Filter notifications to only show those that are announcements/broadcasts
        const broadcasts = (res.data.data || []).filter(
          (n) => n.type === "announcement" || n.type === "alert" || n.type === "event" || n.type === "membership"
        );
        setNotifications(broadcasts);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      if (err.response?.status === 401) {
        navigate("/admin/login");
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchRecentNotifications();
      setLoading(false);
    };
    init();
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Please enter a notification title");
    if (!message.trim()) return toast.error("Please enter a notification message");

    const payload = {
      title: title.trim(),
      message: message.trim(),
      target,
      type,
      link: link.trim() || undefined,
    };

    try {
      setSending(true);
      const res = await broadcastAnnouncement(payload);
      if (res.data && res.data.success) {
        toast.success(res.data.message || "Announcement broadcasted successfully!");
        
        // Reset form
        setTitle("");
        setMessage("");
        setLink("");
        setTarget("all");
        setType("announcement");

        // Refresh log
        await fetchRecentNotifications();
      }
    } catch (err) {
      console.error("Broadcast failed:", err);
      toast.error(err.response?.data?.message || "Failed to broadcast notification");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification record?")) return;
    try {
      const res = await deleteNotification(id);
      if (res.data && res.data.success) {
        toast.success("Notification record deleted");
        fetchRecentNotifications();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
      toast.error("Failed to delete notification");
    }
  };

  const getTargetBadgeColor = (targetName) => {
    switch (targetName) {
      case "all":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "members":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "admins":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const getTypeIcon = (nType) => {
    switch (nType) {
      case "alert":
        return "⚠️";
      case "event":
        return "🎫";
      case "membership":
        return "👑";
      case "announcement":
      default:
        return "📢";
    }
  };

  return (
    <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Admin Notification Broadcast Center
              </h2>
              <p className="mt-1 text-slate-400">
                Compose and send real-time system alerts, updates, and announcements to selected demographics
              </p>
            </div>
          </div>

          {/* Demographic Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="relative overflow-hidden p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg group hover:border-[#40e0d0]/30 transition duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition duration-300">👥</div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Global Reach</p>
              <h3 className="text-2xl font-bold mt-2 text-white">All Registered Users</h3>
              <p className="text-xs text-slate-400 mt-2">Delivers popup alerts and email updates to all registered accounts</p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Active Audience
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg group hover:border-amber-500/30 transition duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition duration-300">👑</div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Premium Demographic</p>
              <h3 className="text-2xl font-bold mt-2 text-amber-400">Club Members</h3>
              <p className="text-xs text-slate-400 mt-2">Targeted specifically to active Basic, Elite, and Pro tier members</p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Premium Tier Filter
              </div>
            </div>

            <div className="relative overflow-hidden p-6 rounded-2xl bg-white/[0.02] border border-white/10 shadow-lg group hover:border-purple-500/30 transition duration-300">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition duration-300">🛡️</div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Staff Communications</p>
              <h3 className="text-2xl font-bold mt-2 text-purple-400">System Administrators</h3>
              <p className="text-xs text-slate-400 mt-2">Restricted channel for broadcast communications to administrative staff</p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                Staff Only
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left side: Composer Form */}
            <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#0a1222]/80 backdrop-blur-xl p-8 shadow-2xl relative">
              <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                <span className="text-2xl">📝</span> Create Broadcast Message
              </h3>

              <form onSubmit={handleBroadcast} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">
                      Target Audience *
                    </label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#060b16] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none transition"
                    >
                      <option value="all">👥 All Users (Global)</option>
                      <option value="members">👑 Members Only (Basic, Elite, Pro)</option>
                      <option value="admins">🛡️ Admins Only (Administrative Staff)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">
                      Notification Category *
                    </label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#060b16] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none transition"
                    >
                      <option value="announcement">📢 Announcement / Broadcast</option>
                      <option value="alert">⚠️ Warning / System Alert</option>
                      <option value="event">🎫 Event Update / Registration</option>
                      <option value="membership">👑 Membership Exclusive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">
                    Notification Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Maintenance window or Exclusive Membership discount code inside!"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none transition placeholder:text-slate-600 font-sans"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-slate-500">Keep it clear and actionable</span>
                    <span className="text-[10px] text-slate-500 font-mono">{title.length}/100</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">
                    Message Body *
                  </label>
                  <textarea
                    rows="4"
                    required
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the full details of this announcement. Be friendly, structured, and clear..."
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none transition placeholder:text-slate-600 resize-none font-sans"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] text-slate-500">Supports text only (max 500 chars)</span>
                    <span className="text-[10px] text-slate-500 font-mono">{message.length}/500</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-slate-400 font-bold block mb-2">
                    Redirect Action Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="e.g., /events or /membership (Users will redirect here on click)"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none transition placeholder:text-slate-600 font-sans"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Provide internal app paths to drive engagement (e.g. `/events/64f1d...`)
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] font-bold text-[#061323] transition hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(64,224,208,0.3)] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {sending ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-[#061323]" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Broadcasting...
                    </>
                  ) : (
                    <>🚀 Send Real-Time Broadcast</>
                  )}
                </button>
              </form>
            </div>

            {/* Right side: Real-time Live Preview */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <div className="rounded-3xl border border-white/10 bg-[#0a1222]/50 backdrop-blur-xl p-6 shadow-2xl">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#40e0d0] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#40e0d0]"></span>
                  </span>
                  Live Notification UI Preview
                </h3>

                <p className="text-xs text-slate-500 mb-4 font-sans">
                  This simulates how the notification will look in the user navbar tray and inbox.
                </p>

                {/* Simulated Notification Box */}
                <div className="p-5 rounded-2xl border border-white/10 bg-[#060b16]/90 relative overflow-hidden transition shadow-xl min-h-[140px] flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#40e0d0]/5 blur-2xl rounded-full" />
                  
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg bg-white/5 p-1.5 rounded-lg border border-white/10 select-none">
                          {getTypeIcon(type)}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight break-words max-w-[200px] font-display">
                            {title.trim() || "Notification Title Placeholder"}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">Just Now</span>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getTargetBadgeColor(target)}`}>
                        {target}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-3 whitespace-pre-wrap break-words leading-relaxed font-sans">
                      {message.trim() || "Type a message in the composer form on the left to see it updated here in real time. Announcements are sent instantly to targeted audiences."}
                    </p>
                  </div>

                  {link.trim() && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-[#40e0d0] font-semibold hover:underline cursor-pointer">
                      <span>🔗 Click to view event/membership</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Validation checklist */}
                <div className="mt-6 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 font-display">Broadcast Readiness Checklist:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className={title.trim().length >= 5 ? "text-emerald-400" : "text-slate-600"}>
                        {title.trim().length >= 5 ? "✅" : "❌"}
                      </span>
                      <span className="text-slate-400">Title (min 5 chars)</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className={message.trim().length >= 10 ? "text-emerald-400" : "text-slate-600"}>
                        {message.trim().length >= 10 ? "✅" : "❌"}
                      </span>
                      <span className="text-slate-400">Message (min 10 chars)</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="text-emerald-400">✅</span>
                      <span className="text-slate-400">Category Configured</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className="text-emerald-400">✅</span>
                      <span className="text-slate-400">Target Selected</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips & Best Practices card */}
              <div className="rounded-3xl border border-[#2d61ff]/20 bg-[#2d61ff]/5 p-6">
                <h4 className="text-sm font-bold text-[#40e0d0] flex items-center gap-1.5 font-display">
                  💡 Tips for Effective Broadcasts
                </h4>
                <ul className="text-xs text-slate-300 space-y-2.5 mt-3 list-disc pl-4 leading-relaxed font-sans">
                  <li><strong>Target Wisely:</strong> Send membership discounts strictly to `members` and global announcements to `all`.</li>
                  <li><strong>Add Action Links:</strong> Directing users immediately to checkout or community feeds boosts overall user conversion.</li>
                  <li><strong>Keep it Punchy:</strong> Short, specific headings grab user attention in the navbar notification tray.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Broadcast History Table */}
          <div className="mt-12">
            <h3 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
              <span>📅</span> Sent Notification Log
            </h3>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl">
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <tr>
                      <th className="px-6 py-4">Title & Context</th>
                      <th className="px-6 py-4">Message Body</th>
                      <th className="px-6 py-4">Target Demographic</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4 text-right">Recall Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {loading ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                          Loading notification logs...
                        </td>
                      </tr>
                    ) : notifications.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                          No notifications broadcasted yet. Try creating one using the form above.
                        </td>
                      </tr>
                    ) : (
                      notifications.map((n) => (
                        <tr key={n._id} className="hover:bg-white/[0.01] transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg bg-white/5 p-1 rounded border border-white/10 select-none">
                                {getTypeIcon(n.type)}
                              </span>
                              <div>
                                <div className="font-bold text-white">{n.title}</div>
                                {n.link && (
                                  <div className="text-[10px] text-[#40e0d0] font-mono mt-0.5">Link: {n.link}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 max-w-sm break-words leading-relaxed text-xs">
                            {n.message}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                              n.userId ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            }`}>
                              {n.userId ? "Individual / Filtered" : "Global Target"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(n._id)}
                              className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition font-bold cursor-pointer"
                            >
                              Recall Alert
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="grid grid-cols-1 gap-3 p-3 sm:p-4 md:hidden">
                {loading ? (
                  <div className="py-10 text-center text-slate-500 text-sm">
                    Loading notification logs...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-sm">
                    No notifications broadcasted yet. Try creating one using the form above.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={`mobile-${n._id}`} className="rounded-xl border border-white/5 bg-[#0a1222] p-4 flex flex-col gap-3 shadow-sm relative overflow-hidden transition-all hover:border-[#40e0d0]/30">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl bg-white/5 p-2 rounded-lg border border-white/10 select-none shrink-0 flex items-center justify-center">
                            {getTypeIcon(n.type)}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-white text-sm line-clamp-1 break-words">{n.title}</div>
                            <span className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-slate-300 text-xs leading-relaxed line-clamp-3 bg-white/[0.02] p-3 rounded-lg border border-white/5">
                        {n.message}
                      </div>

                      <div className="pt-1 flex items-center justify-between mt-1">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide ${
                          n.userId ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        }`}>
                          {n.userId ? "Individual" : "Global"}
                        </span>
                        
                        <button
                          onClick={() => handleDelete(n._id)}
                          className="rounded-md bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-[10px] uppercase tracking-wider text-red-400 hover:bg-red-500/20 transition font-bold"
                        >
                          Recall
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
      </div>
  );
};

export default AdminBroadcastPage;
