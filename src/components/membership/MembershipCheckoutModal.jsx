import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createMembershipOrder, verifyMembershipPayment } from "../../api/membershipApi.js";
import { validateCoupon } from "../../api/couponApi.js";
import { getProfile } from "../../api/authApi.js";

const MembershipCheckoutModal = ({ isOpen, onClose, plan, isUpgrade, isRenewal, currentPlanPrice = 0, onSuccess }) => {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [pricing, setPricing] = useState({
    originalPrice: plan ? plan.price : 0,
    upgradeDiscount: 0,
    couponDiscount: 0,
    finalTotal: plan ? plan.price : 0,
  });

  useEffect(() => {
    if (isOpen && plan) {
      const upgradeDiscount = isUpgrade ? Math.min(plan.price, currentPlanPrice) : 0;
      const baseTotal = plan.price - upgradeDiscount;
      setPricing({
        originalPrice: plan.price,
        upgradeDiscount,
        couponDiscount: 0,
        finalTotal: Math.max(0, baseTotal),
      });

      // Reset coupon states
      setCouponCode("");
      setAppliedCoupon(null);
      setCouponError("");
    }
  }, [isOpen, plan, isUpgrade, currentPlanPrice]);

  if (!isOpen || !plan) return null;

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await validateCoupon(couponCode, "membership", plan.name, pricing.originalPrice);
      if (res.data.success) {
        const coupon = res.data.coupon;
        setAppliedCoupon(coupon);

        const baseTotal = pricing.originalPrice - pricing.upgradeDiscount;
        let couponDiscount = 0;
        if (coupon.discountType === "percentage") {
          couponDiscount = Math.round((baseTotal * coupon.discountValue) / 100);
        } else {
          couponDiscount = Math.min(coupon.discountValue, baseTotal);
        }

        setPricing(prev => ({
          ...prev,
          couponDiscount,
          finalTotal: Math.max(0, baseTotal - couponDiscount)
        }));

        toast.success(`Coupon "${coupon.code}" applied!`);
      }
    } catch (err) {
      console.error(err);
      setCouponError(err.response?.data?.message || "Invalid coupon code");
      toast.error(err.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");

    const baseTotal = pricing.originalPrice - pricing.upgradeDiscount;
    setPricing(prev => ({
      ...prev,
      couponDiscount: 0,
      finalTotal: baseTotal
    }));
    toast.success("Coupon removed.");
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const orderRes = await createMembershipOrder(plan.name, {
        isUpgrade,
        isRenewal,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      });

      if (orderRes && orderRes.success) {
        if (orderRes.isFree) {
          toast.success("Membership activated! (Free Promo Checkout)");
          onSuccess();
          onClose();
          return;
        }

        // Razorpay integration
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount: orderRes.order.amount,
          currency: orderRes.order.currency,
          name: "Otter Society",
          description: isUpgrade ? `Upgrade to ${plan.name} Membership` : `${plan.name} Membership`,
          order_id: orderRes.order.id,
          handler: async (response) => {
            try {
              toast.loading("Verifying payment...", { id: "verify-ms" });
              const verifyRes = await verifyMembershipPayment({
                ...response,
                planType: plan.name,
                isUpgrade,
                isRenewal,
                couponCode: appliedCoupon ? appliedCoupon.code : undefined
              });
              if (verifyRes.success) {
                // Sync user profile immediately
                try {
                  const profileRes = await getProfile();
                  if (profileRes.success) {
                    localStorage.setItem("user", JSON.stringify(profileRes.data));
                    window.dispatchEvent(new Event("auth-change"));
                  }
                } catch (profileErr) {
                  console.error("Profile sync error after purchase:", profileErr);
                }
                toast.success(verifyRes.message || "Membership activated successfully!", { id: "verify-ms" });
                onSuccess();
                onClose();
              }
            } catch (err) {
              console.error("Verification error:", err);
              toast.error(err.response?.data?.message || "Payment verification failed", { id: "verify-ms" });
            }
          },
          prefill: {
            name: currentUser.name || "",
            email: currentUser.email || "",
            contact: currentUser.phone || "",
          },
          theme: {
            color: "#40e0d0",
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error(orderRes?.message || "Failed to create order");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#060b16]/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0a1222] shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-white/[0.03] flex justify-between items-center">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Membership Checkout</h2>
            <p className="text-xs text-slate-400">Review your payment details and activate</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Plan overview */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex justify-between items-center">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Name</p>
              <h3 className="text-lg font-bold text-white mt-0.5">{plan.name}</h3>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Validity</p>
              <h3 className="text-lg font-bold text-[#40e0d0] mt-0.5">{plan.validityDays || 30} Days</h3>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Promo Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value);
                  setCouponError("");
                }}
                placeholder="Enter Coupon Code"
                disabled={appliedCoupon}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-[#40e0d0] focus:outline-none uppercase"
              />
              {appliedCoupon ? (
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="px-4 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/30 transition duration-200"
                >
                  Remove
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode}
                  className="px-5 py-3 rounded-xl bg-[#40e0d0] text-[#061323] text-sm font-bold hover:scale-[1.02] active:scale-95 transition duration-200 disabled:opacity-50"
                >
                  {couponLoading ? "Applying..." : "Apply"}
                </button>
              )}
            </div>
            {couponError && <p className="text-xs text-red-400 font-medium">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-xs text-emerald-400 font-medium">
                Code <span className="font-bold">{appliedCoupon.code}</span> applied! Discount:{" "}
                {appliedCoupon.discountType === "percentage"
                  ? `${appliedCoupon.discountValue}%`
                  : `₹${appliedCoupon.discountValue}`}
              </p>
            )}
          </div>

          {/* Summary pricing list */}
          <div className="border-t border-white/10 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-slate-400">
              <span>Plan Fee</span>
              <span>₹{pricing.originalPrice}</span>
            </div>
            {isUpgrade && (
              <div className="flex justify-between text-sm text-amber-400">
                <span>Upgrade Credit</span>
                <span>-₹{pricing.upgradeDiscount}</span>
              </div>
            )}
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-emerald-400">
                <span>Promo Discount</span>
                <span>-₹{pricing.couponDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-white border-t border-white/10 pt-2">
              <span>Total Payable</span>
              <span className="text-[#40e0d0]">₹{pricing.finalTotal}</span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 text-base font-bold text-[#061323] transition hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            {loading ? "Processing..." : pricing.finalTotal === 0 ? "Activate Membership for Free" : `Pay ₹${pricing.finalTotal} & Activate`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipCheckoutModal;
