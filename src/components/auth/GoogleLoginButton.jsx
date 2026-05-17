import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { googleLogin } from "../../api/authApi";

const GoogleLoginButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const from = location.state?.from || "/dashboard";

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    try {
      console.log("[GOOGLE_OAUTH] Google Pop-up authorization successful. Initiating API verification.");
      const res = await googleLogin(response.credential);
      
      if (res.success) {
        // Clear standard session data to prevent state mix
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Save new session data
        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.data));
        
        toast.success(`Successfully authenticated! Welcome, ${res.data.name}!`);
        
        // Dispatch custom storage event to instantly update active headers/navbars
        window.dispatchEvent(new Event("storage"));
        
        navigate(from);
      }
    } catch (error) {
      console.error("[GOOGLE_OAUTH_ERROR]:", error);
      const errorMsg = error.response?.data?.message || error.message || "Google Authentication failed";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If script is already loaded, initialize directly
    if (window.google?.accounts?.id) {
      initializeGoogle();
      return;
    }

    // Inject Google Identity Services script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => initializeGoogle();
    script.onerror = () => {
      console.error("Failed to load Google Identity Services client script.");
      toast.error("Failed to load Google Sign-In helper. Please refresh.");
    };
    document.body.appendChild(script);

    return () => {
      // Clean up script on unmount safely
      const scriptNode = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (scriptNode && scriptNode.parentNode) {
        scriptNode.parentNode.removeChild(scriptNode);
      }
    };
  }, []);

  const initializeGoogle = () => {
    if (!window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: "1079579645907-d5qs7g5010tf4j6puqtbi077mq7c0t8d.apps.googleusercontent.com",
        callback: handleCredentialResponse,
        auto_select: false, // Prevents automatic intrusive sign-in prompts
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        {
          theme: "outline", // Matches premium dark glassmorphism card theme perfectly
          size: "large",
          width: "382", // Fits login and signup pages beautifully
          shape: "pill", // Matches round premium aesthetic
          text: "continue_with",
          logo_alignment: "center",
        }
      );
    } catch (err) {
      console.error("Error initializing Google Identity Services:", err);
    }
  };

  return (
    <div className="w-full">
      <div className="relative my-6 flex items-center justify-center">
        <hr className="w-full border-white/10" />
        <span className="absolute bg-[#0b1329] px-3 text-xs font-bold uppercase tracking-widest text-slate-500">
          OR
        </span>
      </div>

      <div className="flex w-full flex-col items-center justify-center">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
            <svg className="h-5 w-5 animate-spin text-[#40e0d0]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Verifying Google account...</span>
          </div>
        ) : (
          <div 
            id="google-signin-btn" 
            className="w-full flex justify-center hover:scale-[1.01] transition-transform duration-200" 
            style={{ minHeight: "44px" }}
          />
        )}
      </div>
    </div>
  );
};

export default GoogleLoginButton;
