import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createRegistration } from "../../api/registrationApi.js";
import { createOrder, verifyPayment } from "../../api/paymentApi.js";

const RegistrationModal = ({ event, isOpen, onClose, onShowSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    age: "",
    gender: "prefer not to say",
    previousParticipation: false,
    healthCondition: "",
    emergencyContact: "",
    additionalNotes: "",
  });
  const [loading, setLoading] = useState(false);
  const [discountInfo, setDiscountInfo] = useState({ discount: 0, finalFee: event.eventFee });

  // Prefill user data if logged in
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("user") || "null");
    if (userInfo && isOpen) {
      setFormData(prev => ({
        ...prev,
        fullName: userInfo.name || "",
        email: userInfo.email || "",
        phone: userInfo.phone || "",
      }));

      // Calculate discount for UI display
      let discount = 0;
      const membership = userInfo.activeMembership?.membershipType;
      if (membership === "ELITE") discount = 0.1;
      else if (membership === "PRO") discount = 0.2;
      
      const finalFee = event.eventFee * (1 - discount);
      setDiscountInfo({ discount: discount * 100, finalFee });
    } else {
      setDiscountInfo({ discount: 0, finalFee: event.eventFee });
    }
  }, [isOpen, event.eventFee]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePayment = async (orderData, eventTitle) => {
    try {
      const { order } = orderData;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency,
        name: "Otter Society",
        description: `Registration for ${eventTitle}`,
        order_id: order.id,
        handler: async (response) => {
          console.log("PAYMENT_DEBUG: Razorpay success callback triggered", response);
          try {
            setLoading(true);
            toast.loading("Verifying payment...", { id: "verify-toast" });
            const verifyRes = await verifyPayment({
              ...response
            });

            console.log("PAYMENT_DEBUG: Verification response:", verifyRes.data);

            if (verifyRes.data.success) {
              toast.success("Payment successful! Registration confirmed.", { id: "verify-toast" });
              onShowSuccess();
              onClose();
            } else {
              throw new Error(verifyRes.data.message || "Verification failed");
            }
          } catch (err) {
            console.error("PAYMENT_DEBUG: Verification failed:", err);
            toast.error(err.response?.data?.message || err.message || "Payment verification failed. Please contact support.", { id: "verify-toast" });
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: formData.fullName,
          email: formData.email,
          contact: formData.phone,
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        theme: {
          color: "#40e0d0",
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment cancelled. Registration not complete.");
          }
        }
      };

      console.log("PAYMENT_DEBUG: Opening Razorpay popup...");
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
          console.error("PAYMENT_DEBUG: Payment failed popup event", response.error);
          toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp.open();
    } catch (error) {
      console.error("PAYMENT_DEBUG: Payment initialization failed:", error);
      toast.error("Failed to initialize payment. Please try again.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      
      if (event.eventFee > 0) {
        toast.loading("Initiating payment...", { duration: 2000 });
        
        const orderRes = await createOrder({
          eventId: event._id,
          registrationData: formData
        }, token); // Pass token for membership check

        if (orderRes.data.success) {
          await handlePayment(orderRes.data, event.title);
        }
      } else {
        // FREE EVENT: Use direct registration
        const res = await createRegistration({
          ...formData,
          eventId: event._id,
        });

        if (res.success) {
          toast.success("Registration successful!");
          onShowSuccess();
          onClose();
        } else {
          throw new Error(res.message || "Registration failed");
        }
      }
    } catch (error) {
      console.error("Registration/Order Error:", error);
      const errorMsg = error.response?.data?.message || "Action failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#060b16]/90 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0a1222] shadow-2xl">
        <div className="max-h-[90vh] overflow-y-auto">
          <div className="border-b border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-white">Event Registration</h2>
                <p className="mt-1 text-sm text-slate-400">Registering for: <span className="text-[#40e0d0]">{event.title}</span></p>
              </div>
              <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required placeholder="Enter your full name" />
              <FormField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" />
              <FormField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+1 234 567 890" />
              <FormField label="Age" name="age" type="number" value={formData.age} onChange={handleChange} required placeholder="Min 18+" />

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <FormField label="Emergency Contact" name="emergencyContact" value={formData.emergencyContact} onChange={handleChange} required placeholder="Name / Phone Number" />
            </div>

            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="previousParticipation"
                  name="previousParticipation"
                  checked={formData.previousParticipation}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-white/10 bg-white/5 text-[#40e0d0] focus:ring-[#40e0d0]"
                />
                <label htmlFor="previousParticipation" className="text-sm font-medium text-slate-300">
                  Have you joined previous events?
                </label>
              </div>

              <FormField label="Health Condition / Medical Notes" name="healthCondition" value={formData.healthCondition} onChange={handleChange} placeholder="Allergies, chronic conditions, etc." />
              <FormField label="Additional Notes" name="additionalNotes" value={formData.additionalNotes} onChange={handleChange} isTextArea placeholder="Anything else we should know?" />
            </div>

            <div className="mt-10">
              {discountInfo.discount > 0 && (
                <div className="mb-4 rounded-xl bg-[#40e0d0]/10 p-4 border border-[#40e0d0]/20">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-[#40e0d0] font-medium">Member Discount Applied ({discountInfo.discount}%)</span>
                    <span className="text-xs text-slate-400 line-through">₹{event.eventFee}</span>
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] py-4 text-lg font-bold text-[#061323] transition hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                {loading ? "Processing..." : event.eventFee > 0 ? `Pay ₹${discountInfo.finalFee} & Register` : "Confirm Registration"}
              </button>
              <p className="mt-4 text-center text-[11px] text-slate-500 uppercase tracking-widest">
                By registering, you agree to our terms and safety guidelines.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const FormField = ({ label, name, type = "text", value, onChange, required, placeholder, isTextArea }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {isTextArea ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-[#40e0d0] focus:outline-none focus:ring-1 focus:ring-[#40e0d0]"
      />
    )}
  </div>
);

export default RegistrationModal;
