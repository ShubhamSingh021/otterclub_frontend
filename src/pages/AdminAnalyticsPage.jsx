import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import toast from "react-hot-toast";

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060b16]">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
      </div>
    );
  }

  const COLORS = ['#40e0d0', '#2d61ff', '#ff4d4d', '#ffcc00'];

  return (
    <div className="min-h-screen bg-[#060b16] text-white p-8">
      <div className="container mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-black mb-2 tracking-tight uppercase">Platform Analytics</h1>
          <p className="text-slate-400 font-medium">Real-time performance metrics and trends</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Users" value={data?.stats.totalUsers} icon="👥" color="#40e0d0" />
          <StatCard title="Total Members" value={data?.stats.totalMembers} icon="⭐" color="#2d61ff" />
          <StatCard title="Total Revenue" value={`₹${data?.stats.totalRevenue}`} icon="💰" color="#40e0d0" />
          <StatCard title="Event Registrations" value={data?.stats.totalRegistrations} icon="🎟️" color="#2d61ff" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Revenue Chart */}
          <ChartCard title="Revenue Growth (Last 6 Months)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.monthlyRevenue.map(m => ({ name: `Month ${m._id.month}`, revenue: m.revenue }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#40e0d0' }}
                />
                <Bar dataKey="revenue" fill="#40e0d0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Registration Trends */}
          <ChartCard title="Event Registration Trends">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.eventTrends.map(t => ({ name: `Month ${t._id.month}`, count: t.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                  itemStyle={{ color: '#2d61ff' }}
                />
                <Line type="monotone" dataKey="count" stroke="#2d61ff" strokeWidth={3} dot={{ r: 6, fill: '#2d61ff' }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Membership Distribution */}
          <ChartCard title="Membership Distribution" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data?.membershipDistribution.map(m => ({ name: m._id, value: m.count }))}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.membershipDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Table of Distribution */}
          <div className="lg:col-span-2 rounded-[2rem] border border-white/10 bg-white/[0.02] p-8">
            <h3 className="text-lg font-bold mb-6">Revenue Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                    <th className="pb-4">Category</th>
                    <th className="pb-4">Transactions</th>
                    <th className="pb-4">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data?.membershipDistribution.map((m, i) => (
                    <tr key={i} className="group hover:bg-white/[0.02] transition">
                      <td className="py-4 font-bold">{m._id} Membership</td>
                      <td className="py-4 text-slate-400">{m.count}</td>
                      <td className="py-4 font-black text-[#40e0d0]">₹{m.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 group hover:border-white/20 transition-all duration-300">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-2xl bg-white/5 text-2xl">{icon}</div>
      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </div>
    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">{title}</p>
    <p className="text-3xl font-black">{value}</p>
  </div>
);

const ChartCard = ({ title, children, className = "" }) => (
  <div className={`rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 ${className}`}>
    <h3 className="text-lg font-bold mb-8 flex items-center gap-3">
      <div className="h-2 w-2 rounded-full bg-[#40e0d0]" />
      {title}
    </h3>
    {children}
  </div>
);

export default AdminAnalyticsPage;
