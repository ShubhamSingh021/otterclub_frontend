import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents, deleteEvent, toggleEventVisibility, toggleEventFeatured } from "../api/eventApi.js";
import toast from "react-hot-toast";
import { format } from "date-fns";

const AdminEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchEvents = async () => {
    try {
      const res = await getEvents();
      setEvents(res.data);
    } catch (error) {
      toast.error("Failed to fetch events");
      if (error.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    try {
      await deleteEvent(id);
      toast.success("Event deleted");
      fetchEvents();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleToggleVisibility = async (id) => {
    try {
      await toggleEventVisibility(id);
      toast.success("Visibility updated");
      fetchEvents();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await toggleEventFeatured(id);
      toast.success("Featured status updated");
      fetchEvents();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Create, edit and manage your club events</p>
        </div>
        <button
          onClick={() => navigate("/admin/events/new")}
          className="rounded-xl bg-[#40e0d0] px-6 py-3 text-sm font-bold text-[#061323] transition hover:scale-[1.02]"
        >
          + Create New Event
        </button>
      </div>

          <div className="mt-10 hidden md:block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Visibility</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="6" className="px-6 py-20 text-center text-slate-500">Loading events...</td></tr>
                  ) : events.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-20 text-center text-slate-500">No events found</td></tr>
                  ) : (
                    events.map((event) => (
                      <tr key={event._id} className="transition hover:bg-white/[0.01]">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <img src={event.eventImage} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-bold text-white">{event.title}</p>
                              <p className="text-xs text-slate-500">/{event.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                            {event.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {format(new Date(event.eventDate), "MMM dd, yyyy")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                            event.status === "upcoming" ? "bg-green-500/10 text-green-400" : "bg-slate-500/10 text-slate-400"
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex gap-2">
                             <button onClick={() => handleToggleVisibility(event._id)} className={`px-2 py-1 rounded text-[10px] font-bold border ${event.isVisible ? "border-green-500/30 text-green-400" : "border-red-500/30 text-red-400"}`}>
                               {event.isVisible ? "Visible" : "Hidden"}
                             </button>
                             <button onClick={() => handleToggleFeatured(event._id)} className={`px-2 py-1 rounded text-[10px] font-bold border ${event.isFeatured ? "border-yellow-500/30 text-yellow-400" : "border-slate-500/30 text-slate-400"}`}>
                               {event.isFeatured ? "Featured" : "Regular"}
                             </button>
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => navigate(`/admin/events/edit/${event._id}`)} className="text-[#40e0d0] hover:underline">Edit</button>
                            <button onClick={() => handleDelete(event._id)} className="text-red-400 hover:underline">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards Layout */}
          <div className="mt-8 space-y-4 md:hidden">
            {loading ? (
              <div className="py-10 text-center text-slate-500">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No events found</div>
            ) : (
              events.map((event) => (
                <div key={event._id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex items-start gap-4">
                    <img src={event.eventImage} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-white text-base truncate">{event.title}</p>
                      <p className="text-xs text-slate-500 truncate">/{event.slug}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-300">
                          {event.category}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                          event.status === "upcoming" ? "bg-green-500/10 text-green-400" : "bg-slate-500/10 text-slate-400"
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-3 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Event Date</p>
                      <p className="mt-1 font-semibold text-slate-300">
                        {format(new Date(event.eventDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Status Controls</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <button onClick={() => handleToggleVisibility(event._id)} className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${event.isVisible ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-red-500/30 text-red-400 bg-red-500/5"}`}>
                          {event.isVisible ? "Visible" : "Hidden"}
                        </button>
                        <button onClick={() => handleToggleFeatured(event._id)} className={`px-2 py-0.5 rounded text-[9px] font-bold border transition ${event.isFeatured ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5" : "border-slate-500/30 text-slate-400 bg-white/5"}`}>
                          {event.isFeatured ? "★ Featured" : "Regular"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 text-xs font-bold pt-1">
                    <button onClick={() => navigate(`/admin/events/edit/${event._id}`)} className="rounded-lg bg-white/5 border border-white/10 px-4 py-2 text-[#40e0d0] hover:bg-white/10 transition">
                      Edit Event
                    </button>
                    <button onClick={() => handleDelete(event._id)} className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-red-400 hover:bg-red-500/20 transition">
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
  );
};

export default AdminEventsPage;
