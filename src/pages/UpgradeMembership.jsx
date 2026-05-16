import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { getPlans, getMyMembership, createMembershipOrder, verifyMembershipPayment } from "../api/membershipApi";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";

const UpgradeMembership = () => {
  const [plans, setPlans] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  
  const isRenewal = location.search.includes("type=renewal");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [plansRes, memberRes] = await Promise.all([
        getPlans(),
        getMyMembership()
      ]);
      setPlans(plansRes.data);
      setMembership(memberRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (planType) => {
    try {
      setPurchasing(true);
      const orderRes = await createMembershipOrder(planType, {
        upgrade: !isRenewal,
        renew: isRenewal
      });
      
      if (orderRes.success) {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: orderRes.order.amount,
          currency: orderRes.order.currency,
          name: "Otter Society",
          description: isRenewal ? `Renew ${planType} Membership` : `Upgrade to ${planType} Membership`,
          order_id: orderRes.order.id,
          handler: async (response) => {
            try {
              toast.loading("Processing...", { id: "verify-toast" });
              const verifyRes = await verifyMembershipPayment({
                ...response,
                planType,
                isUpgrade: !isRenewal,
                isRenewal: isRenewal
              });

              if (verifyRes.success) {
                toast.success(isRenewal ? "Membership renewed successfully!" : "Membership upgraded! Enjoy your new perks.", { id: "verify-toast" });
                navigate("/dashboard");
              }
            } catch (err) {
              toast.error(err.response?.data?.message || "Verification failed.", { id: "verify-toast" });
            }
          },
          prefill: {
            name: membership?.userId?.name,
            email: membership?.userId?.email,
          },
          theme: { color: "#40e0d0" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initiate payment");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060b16]">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
      </div>
    );
  }

  const currentPlanIndex = plans ? plans.findIndex(p => p.name === membership?.membershipType) : -1;
  const availablePlans = plans ? plans.filter((plan, idx) => {
    if (isRenewal) return plan.name === membership?.membershipType;
    return idx > currentPlanIndex;
  }) : [];

  return (
    <div className="min-h-screen bg-[#060b16] text-white font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            {isRenewal ? "Renew Your Membership" : "Upgrade Your Status"}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            {isRenewal 
              ? `Extend your ${membership?.membershipType} membership for another 30 days.` 
              : "Step into a higher tier and unlock more exclusive benefits."}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 justify-center max-w-6xl mx-auto">
          {availablePlans.length > 0 ? availablePlans.map((plan) => (
            <div key={plan.name} className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-[#40e0d0]/50 transition">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#40e0d0]/10 rounded-full blur-2xl group-hover:bg-[#40e0d0]/20 transition" />
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold mb-6">
                ₹{plan.price}
                <span className="text-sm text-slate-500 font-normal"> / 30 days</span>
              </div>

              {!isRenewal && membership && (
                <div className="mb-6 p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Upgrade Price</p>
                  <p className="text-xl font-bold text-[#40e0d0]">
                    ₹{Math.max(0, plan.price - (plans.find(p => p.name === membership.membershipType)?.price || 0))}
                    <span className="text-xs text-slate-400 font-normal ml-2">(Difference)</span>
                  </p>
                </div>
              )}

              <ul className="space-y-4 mb-8">
                {plan.benefits.map((b, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-300">
                    <svg className="h-5 w-5 text-[#40e0d0] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleAction(plan.name)}
                disabled={purchasing}
                className="w-full py-4 rounded-xl bg-[#40e0d0] text-[#061323] font-bold hover:scale-[1.02] transition disabled:opacity-50"
              >
                {purchasing ? "Processing..." : isRenewal ? "Renew Now" : "Pay Difference & Upgrade"}
              </button>
            </div>
          )) : (
            <div className="col-span-full text-center py-20">
              <p className="text-slate-500">No {isRenewal ? "renewal" : "upgrade"} options available at this moment.</p>
              <button onClick={() => navigate("/dashboard")} className="mt-4 text-[#40e0d0] hover:underline">Back to Dashboard</button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UpgradeMembership;
