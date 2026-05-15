import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRegistrations, updateRegistrationStatus, deleteRegistration } from "../api/registrationApi.js";
import { getEvents } from "../api/eventApi.js";
import Container from "../components/layout/Container.jsx";
import toast, { Toaster } from "react-hot-toast";
import { format } from "date-fns";

const AdminRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [regRes, eventRes] = await Promise.all([
        getRegistrations(selectedEvent ? { eventId: selectedEvent } : {}),
        getEvents()
      ]);
      setRegistrations(regRes.data);
      setEvents(eventRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
      if (error.response?.status === 401) navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEvent]);

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateRegistrationStatus(id, { registrationStatus: status });
      toast.success(`Registration ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handlePaymentUpdate = async (id, status) => {
    try {
      await updateRegistrationStatus(id, { paymentStatus: status });
      toast.success(`Payment status: ${status}`);
      fetchData();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will free up a slot in the event.")) return;
    try {
      await deleteRegistration(id);
      toast.success("Registration deleted");
      fetchData();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const filteredRegistrations = registrations.filter(reg => 
    reg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Toaster position="top-center" />
      <nav className="border-b border-white/10 bg-[#081429]/50 backdrop-blur-md">
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

      <main className="py-10">
        <Container>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold">Event Registrations</h2>
              <p className="mt-1 text-slate-400">View and manage participant registrations</p>
            </div>
            
            <div className="flex flex-col gap-4 sm:flex-row">
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm focus:border-[#40e0d0] focus:outline-none sm:w-64"
              />
              <select 
                value={selectedEvent} 
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0a1222] px-4 py-2 text-sm focus:border-[#40e0d0] focus:outline-none sm:w-64"
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event._id} value={event._id}>{event.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Participant</th>
                    <th className="px-6 py-4">Event</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr><td colSpan="6" className="px-6 py-20 text-center text-slate-500">Loading registrations...</td></tr>
                  ) : filteredRegistrations.length === 0 ? (
                    <tr><td colSpan="6" className="px-6 py-20 text-center text-slate-500">No registrations found</td></tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg._id} className="transition hover:bg-white/[0.01]">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-white">{reg.fullName}</p>
                            <p className="text-xs text-slate-500">Age: {reg.age} | {reg.gender}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-300">{reg.event?.title}</p>
                          <p className="text-[10px] text-slate-500">{reg.event?.eventDate && format(new Date(reg.event.eventDate), "MMM dd, yyyy")}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          <p>{reg.email}</p>
                          <p className="text-xs text-slate-500">{reg.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={reg.registrationStatus}
                            onChange={(e) => handleStatusUpdate(reg._id, e.target.value)}
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase bg-transparent border border-white/10 focus:outline-none ${
                              reg.registrationStatus === "approved" ? "text-green-400" : reg.registrationStatus === "cancelled" ? "text-red-400" : "text-yellow-400"
                            }`}
                          >
                            <option value="registered">Registered</option>
                            <option value="approved">Approved</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={reg.paymentStatus}
                            onChange={(e) => handlePaymentUpdate(reg._id, e.target.value)}
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase bg-transparent border border-white/10 focus:outline-none ${
                              reg.paymentStatus === "paid" ? "text-green-400" : reg.paymentStatus === "failed" ? "text-red-400" : "text-slate-400"
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDelete(reg._id)} className="text-red-400 hover:underline">Delete</button>
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

export default AdminRegistrationsPage;
