import { useState, useEffect, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getPlans } from "../api/membershipApi";
import { getProfile } from "../api/authApi";
import Navbar from "../components/home/Navbar";
import Footer from "../components/home/Footer";
import MembershipCheckoutModal from "../components/membership/MembershipCheckoutModal";
import { SkeletonCard } from "../components/common/SkeletonLoader";

// Memoized PricingCard component for fine-grained render isolation
const PricingCard = memo(({ plan, index, plans, user, purchasingPlan, handlePurchase }) => {
  const isActive = user.activeMembership && user.activeMembership.membershipStatus === "active";
  const currentPlan = plans?.find(p => p.name === user.activeMembership?.membershipType);
  const isCurrent = user.activeMembership?.membershipType === plan.name;
  const isDowngrade = isActive && currentPlan && plan.price < currentPlan.price;
  const isUpgrade = isActive && currentPlan && plan.price > currentPlan.price;

  let buttonText = "Select Plan";
  let isDisabled = purchasingPlan === plan.name;

  if (user?.role === 'admin') {
    buttonText = "Admin Account";
    isDisabled = true;
  } else if (isCurrent) {
    buttonText = "Current Plan";
    isDisabled = true;
  } else if (isDowngrade) {
    buttonText = "Downgrade Blocked";
    isDisabled = true;
  } else if (isUpgrade) {
    buttonText = "Upgrade Plan";
    isDisabled = false;
  } else if (purchasingPlan === plan.name) {
    buttonText = "Processing...";
  }

  const isElite = plan.name === "ELITE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative group rounded-3xl border ${
        isElite ? "border-[#8ce5db] bg-[#8ce5db]/5 shadow-[0_0_40px_rgba(140,229,219,0.15)]" : "border-white/10 bg-white/[0.02]"
      } p-8 flex flex-col transition hover:border-[#8ce5db]/50`}
    >
      {isElite && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] px-4 py-1 rounded-full text-xs font-bold text-[#060b16] uppercase tracking-widest">
          Most Popular
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-xl font-bold tracking-widest text-slate-400 uppercase">{plan.name}</h3>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-bold tracking-tight">₹{plan.price}</span>
          <span className="text-slate-500">/ {plan.validityDays || 30} days</span>
        </div>
      </div>

      <ul className="space-y-4 mb-10 flex-grow text-sm text-slate-300">
        {plan.benefits.map((benefit, i) => (
          <li key={i} className="flex items-start gap-3">
            <svg className="h-5 w-5 text-[#8ce5db] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {benefit}
          </li>
        ))}
      </ul>

      <button
        onClick={() => handlePurchase(plan.name)}
        disabled={isDisabled}
        className={`w-full py-4 rounded-xl font-bold transition-all duration-300 ${
          isDisabled 
            ? 'bg-white/5 text-slate-500 cursor-not-allowed opacity-50'
            : isUpgrade
              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:scale-[1.02] shadow-[0_0_15px_rgba(245,158,11,0.4)]'
              : isElite
                ? 'bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] text-[#061323] hover:scale-[1.02]'
                : 'bg-white/10 hover:bg-white/20 text-white shadow-lg'
        }`}
      >
        {buttonText}
      </button>
    </motion.div>
  );
});

PricingCard.displayName = "PricingCard";

const MembershipPage = () => {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasingPlan, setPurchasingPlan] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Checkout modal states
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [selectedPlanDetails, setSelectedPlanDetails] = useState(null);
  const [isCheckoutUpgrade, setIsCheckoutUpgrade] = useState(false);
  const [currentPlanPrice, setCurrentPlanPrice] = useState(0);

  const syncUserProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await getProfile();
      if (res.success) {
        localStorage.setItem("user", JSON.stringify(res.data));
        window.dispatchEvent(new Event("auth-change"));
      }
    } catch (err) {
      console.error("Failed to sync profile on membership page mount:", err);
    }
  }, [token]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await getPlans();
      setPlans(res.data);
    } catch (error) {
      toast.error("Failed to load membership plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
    if (token) {
      syncUserProfile();
    }
  }, [token, fetchPlans, syncUserProfile]);

  const handlePurchase = useCallback((planType) => {
    if (!token) {
      toast.error("Please login to purchase a membership");
      navigate("/login", { state: { from: "/membership" } });
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const targetPlan = plans?.find(p => p.name === planType);
    if (!targetPlan) return;

    const hasActive = currentUser.activeMembership && currentUser.activeMembership.membershipStatus === "active";
    const currentPlan = plans?.find(p => p.name === currentUser.activeMembership?.membershipType);
    const isUpgrade = hasActive && targetPlan && currentPlan && (targetPlan.price > currentPlan.price);

    setSelectedPlanDetails(targetPlan);
    setIsCheckoutUpgrade(isUpgrade);
    setCurrentPlanPrice(currentPlan ? currentPlan.price : 0);
    setCheckoutModalOpen(true);
  }, [plans, token, navigate]);

  const handleCheckoutSuccess = useCallback(() => {
    syncUserProfile();
    setTimeout(() => {
      navigate("/dashboard");
    }, 1000);
  }, [syncUserProfile, navigate]);

  return (
    <div className="min-h-screen bg-[#060b16] text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 lg:py-32">
        <div className="absolute top-0 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8ce5db]/10 blur-[120px]" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-5xl md:text-7xl font-bold tracking-tight"
          >
            Level Up Your <span className="bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] bg-clip-text text-transparent text-shadow-glow">Experience</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Join the inner circle of Otter Society. Get exclusive access, premium support, and massive discounts on all events.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 pb-32">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {loading ? (
              <SkeletonCard count={3} />
            ) : (
              plans && plans.map((plan, index) => (
                <PricingCard 
                  key={plan.name}
                  plan={plan}
                  index={index}
                  plans={plans}
                  user={user}
                  purchasingPlan={purchasingPlan}
                  handlePurchase={handlePurchase}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      {!loading && plans && plans.length > 0 && (
        <section className="py-24 bg-white/[0.02]">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-16">Compare Benefits</h2>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-6 text-slate-400 font-medium">Features</th>
                    {plans.map(plan => (
                      <th key={plan.name} className={`py-6 text-center font-bold ${plan.name === "ELITE" ? "text-[#8ce5db]" : plan.name === "PRO" ? "text-[#2d61ff]" : ""}`}>
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="py-6 text-slate-300 font-medium">Price / Duration</td>
                    {plans.map(plan => (
                      <td key={plan.name} className="py-6 text-center font-bold text-lg">₹{plan.price} <span className="text-xs font-normal text-slate-500">({plan.validityDays || 30} days)</span></td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="py-6 text-slate-300 font-medium">Benefits Count</td>
                    {plans.map(plan => (
                      <td key={plan.name} className="py-6 text-center text-slate-400">{plan.benefits.length} Perks</td>
                    ))}
                  </tr>
                  <tr className="border-b border-white/5 hover:bg-white/[0.02] transition">
                    <td className="py-6 text-slate-300 font-medium">Key Features</td>
                    {plans.map(plan => (
                      <td key={plan.name} className="py-6 text-center text-xs text-slate-400">
                        <ul className="inline-block text-left">
                          {plan.benefits.slice(0, 3).map((b, i) => (
                            <li key={i}>• {b}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Plan Comparison Cards */}
            <div className="block md:hidden space-y-6">
              {plans.map(plan => {
                const isElite = plan.name === "ELITE";
                const isPro = plan.name === "PRO";
                return (
                  <div
                    key={plan.name}
                    className={`rounded-2xl border ${
                      isElite 
                        ? "border-[#8ce5db] bg-[#8ce5db]/5 shadow-lg shadow-[#8ce5db]/5" 
                        : isPro 
                          ? "border-[#2d61ff]/30 bg-[#2d61ff]/5" 
                          : "border-white/10 bg-white/[0.02]"
                    } p-6 flex flex-col`}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className={`text-base font-bold tracking-widest uppercase ${isElite ? "text-[#8ce5db]" : isPro ? "text-[#2d61ff]" : "text-slate-400"}`}>
                        {plan.name}
                      </h3>
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300">
                        {plan.benefits.length} Perks
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-3xl font-bold tracking-tight">₹{plan.price}</span>
                      <span className="text-xs text-slate-500 ml-1">/ {plan.validityDays || 30} days</span>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Plan Benefits Included:</p>
                      <ul className="space-y-2 text-xs text-slate-300">
                        {plan.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <svg className="h-4 w-4 text-[#8ce5db] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button
                      onClick={() => handlePurchase(plan.name)}
                      className={`mt-6 w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-95 ${
                        isElite
                          ? 'bg-gradient-to-r from-[#8ce5db] to-[#2d61ff] text-[#061323]'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      Select {plan.name}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <MembershipCheckoutModal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        plan={selectedPlanDetails}
        isUpgrade={isCheckoutUpgrade}
        isRenewal={false}
        currentPlanPrice={currentPlanPrice}
        onSuccess={handleCheckoutSuccess}
      />

      <Footer />
    </div>
  );
};

const ComparisonRow = ({ label, basic, elite, pro }) => (
  <tr className="border-b border-white/5 hover:bg-white/[0.02] transition">
    <td className="py-6 text-slate-300 font-medium">{label}</td>
    <td className="py-6 text-center text-slate-400">{basic}</td>
    <td className="py-6 text-center font-semibold">{elite}</td>
    <td className="py-6 text-center font-semibold">{pro}</td>
  </tr>
);

export default MembershipPage;
