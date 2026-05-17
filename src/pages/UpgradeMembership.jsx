import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { getPlans, getMyMembership } from "../api/membershipApi";
import { getProfile } from "../api/authApi";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";
import MembershipCheckoutModal from "../components/membership/MembershipCheckoutModal";

const UpgradeMembership = () => {
  const [plans, setPlans] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasingPlan, setPurchasingPlan] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  const isRenewal = location.search.includes("type=renewal");

  // Checkout modal states
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [isCheckoutUpgrade, setIsCheckoutUpgrade] = useState(false);
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const [plansRes, memberRes, profileRes] = await Promise.all([
        getPlans(),
        getMyMembership(),
        getProfile()
      ]);
      setPlans(plansRes.data);
      setMembership(memberRes.data);
      if (profileRes.success) {
        localStorage.setItem("user", JSON.stringify(profileRes.data));
        window.dispatchEvent(new Event("auth-change"));
      }
    } catch (error) {
      console.error("FETCH_DATA_ERROR:", error);
      toast.error("Failed to load membership data");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (planType) => {
    const targetPlan = plans?.find(p => p.name === planType);
    if (!targetPlan) return;

    setSelectedPlanDetails(targetPlan);
    setIsCheckoutUpgrade(!isRenewal);
    setCurrentPlanPrice(currentPlan ? currentPlan.price : 0);
    setCheckoutModalOpen(true);
  };

  const handleCheckoutSuccess = () => {
    // Sync profile
    fetchData();
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#060b16]">
        <div className="h-12 w-12 animate-spin rounded-full border-t-2 border-[#40e0d0]"></div>
      </div>
    );
  }

  // Safety checks for membership and plans
  const currentPlan = plans?.find(p => p.name === membership?.membershipType);
  const currentPlanIndex = plans ? plans.findIndex(p => p.name === membership?.membershipType) : -1;
  
  const availablePlans = plans ? plans.filter((plan, idx) => {
    if (isRenewal) return plan.name === membership?.membershipType;
    return idx > currentPlanIndex;
  }) : [];

  return (
    <div className="min-h-screen bg-[#060b16] text-white font-sans">
      <Navbar />
      
      <main className="container mx-auto px-4 py-20 pt-32">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 italic tracking-tight">
            {isRenewal ? "RENEW YOUR STATUS" : "UPGRADE YOUR STATUS"}
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto">
            {isRenewal 
              ? `Extend your ${membership?.membershipType || "current"} membership for another period.` 
              : "Step into a higher tier and unlock more exclusive club benefits."}
          </p>
        </div>

        {!membership && !loading && (
          <div className="max-w-2xl mx-auto mb-12 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 text-center">
            <p className="text-red-400 font-medium">No active membership found to {isRenewal ? "renew" : "upgrade"}.</p>
            <button onClick={() => navigate("/membership")} className="mt-4 text-white font-bold underline">View All Plans</button>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 justify-center max-w-6xl mx-auto">
          {availablePlans.length > 0 ? availablePlans.map((plan) => (
            <div key={plan.name} className="bg-white/[0.03] border border-white/10 p-8 rounded-3xl relative overflow-hidden group hover:border-[#40e0d0]/50 transition">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#40e0d0]/10 rounded-full blur-2xl group-hover:bg-[#40e0d0]/20 transition" />
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold mb-6">
                ₹{plan.price}
                <span className="text-sm text-slate-500 font-normal"> / {plan.validityDays || 365} days</span>
              </div>

              {!isRenewal && membership && (
                <div className="mb-6 p-4 rounded-2xl bg-[#40e0d0]/5 border border-[#40e0d0]/10">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Upgrade Difference</p>
                  <p className="text-xl font-bold text-[#40e0d0]">
                    ₹{Math.max(0, plan.price - (currentPlan?.price || 0))}
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
                disabled={purchasingPlan || !membership}
                className="w-full py-4 rounded-xl bg-[#40e0d0] text-[#061323] font-bold hover:scale-[1.02] transition disabled:opacity-50"
              >
                {purchasingPlan === plan.name ? "Processing..." : isRenewal ? "Renew Now" : "Pay Difference & Upgrade"}
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

      <MembershipCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        plan={selectedPlanDetails}
        isUpgrade={isCheckoutUpgrade}
        isRenewal={isRenewal}
        currentPlanPrice={currentPlanPrice}
        onSuccess={handleCheckoutSuccess}
      />

      <Footer />
    </div>
  );
};

export default UpgradeMembership;
