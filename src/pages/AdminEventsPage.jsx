import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getEvents, deleteEvent, toggleEventVisibility, toggleEventFeatured } from "../api/eventApi.js";
import Container from "../components/layout/Container.jsx";
import toast, { Toaster } from "react-hot-toast";
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

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Toaster position="top-center" />
      <nav className="border-b border-white/10 bg-[#081429]/50 backdrop-blur-md">
        <Container className="flex h-20 items-center justify-between">
          <h1 className="font-display text-xl font-bold tracking-tight">Admin Dashboard</h1>
          <div className="flex gap-4">
            <button onClick={() => navigate("/")} className="text-sm font-medium text-slate-400 hover:text-white">View Site</button>
            <button onClick={handleLogout} className="text-sm font-medium text-red-400 hover:text-red-300">Logout</button>
          </div>
        </Container>
      </nav>

      <main className="py-10">
        <Container>
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Manage Events</h2>
              <p className="mt-1 text-slate-400">Create, edit and manage your club events</p>
            </div>
            <button
              onClick={() => navigate("/admin/events/new")}
              className="rounded-xl bg-[#40e0d0] px-6 py-3 text-sm font-bold text-[#061323] transition hover:scale-[1.02]"
            >
              + Create New Event
            </button>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
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
        </Container>
      </main>
    </div>
  );
};

export default AdminEventsPage;
