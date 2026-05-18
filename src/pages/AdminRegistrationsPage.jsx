import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRegistrations, updateRegistrationStatus, deleteRegistration } from "../api/registrationApi.js";
import { getEvents } from "../api/eventApi.js";
import toast from "react-hot-toast";
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
    <div className="space-y-8">
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

          <div className="mt-10 hidden md:block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
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
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase bg-transparent border border-white/10 focus:outline-none cursor-pointer ${
                              reg.registrationStatus === "approved" ? "text-green-400" : reg.registrationStatus === "cancelled" ? "text-red-400" : "text-yellow-400"
                            }`}
                          >
                            <option value="registered" className="bg-[#081429] text-white">Registered</option>
                            <option value="approved" className="bg-[#081429] text-white">Approved</option>
                            <option value="cancelled" className="bg-[#081429] text-white">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={reg.paymentStatus}
                            onChange={(e) => handlePaymentUpdate(reg._id, e.target.value)}
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase bg-transparent border border-white/10 focus:outline-none cursor-pointer ${
                              reg.paymentStatus === "paid" ? "text-green-400" : reg.paymentStatus === "failed" ? "text-red-400" : "text-slate-400"
                            }`}
                          >
                            <option value="pending" className="bg-[#081429] text-white">Pending</option>
                            <option value="paid" className="bg-[#081429] text-white">Paid</option>
                            <option value="failed" className="bg-[#081429] text-white">Failed</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => handleDelete(reg._id)} className="text-red-400 hover:underline font-bold text-xs uppercase">Delete</button>
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
              <div className="py-10 text-center text-slate-500">Loading registrations...</div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="py-10 text-center text-slate-500">No registrations found</div>
            ) : (
              filteredRegistrations.map((reg) => (
                <div key={reg._id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4">
                  <div className="flex justify-between items-start border-b border-white/5 pb-3">
                    <div>
                      <p className="font-bold text-white text-base">{reg.fullName}</p>
                      <p className="text-xs text-slate-500">Age: {reg.age} | {reg.gender}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 items-end">
                      <select 
                        value={reg.registrationStatus}
                        onChange={(e) => handleStatusUpdate(reg._id, e.target.value)}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase bg-transparent border border-white/10 focus:outline-none ${
                          reg.registrationStatus === "approved" ? "text-green-400" : reg.registrationStatus === "cancelled" ? "text-red-400" : "text-yellow-400"
                        }`}
                      >
                        <option value="registered" className="bg-[#081429] text-white">Registered</option>
                        <option value="approved" className="bg-[#081429] text-white">Approved</option>
                        <option value="cancelled" className="bg-[#081429] text-white">Cancelled</option>
                      </select>
                      <select 
                        value={reg.paymentStatus}
                        onChange={(e) => handlePaymentUpdate(reg._id, e.target.value)}
                        className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase bg-transparent border border-white/10 focus:outline-none ${
                          reg.paymentStatus === "paid" ? "text-green-400" : reg.paymentStatus === "failed" ? "text-red-400" : "text-slate-400"
                        }`}
                      >
                        <option value="pending" className="bg-[#081429] text-white">Pending</option>
                        <option value="paid" className="bg-[#081429] text-white">Paid</option>
                        <option value="failed" className="bg-[#081429] text-white">Failed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Contact Info</p>
                      <p className="mt-1 font-semibold text-slate-300 truncate">{reg.email}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{reg.phone}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Registered Event</p>
                      <p className="mt-1 font-medium text-[#40e0d0] truncate">{reg.event?.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {reg.event?.eventDate && format(new Date(reg.event.eventDate), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3 flex justify-end">
                    <button
                      onClick={() => handleDelete(reg._id)}
                      className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition"
                    >
                      Delete Registration
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
  );
};

export default AdminRegistrationsPage;
