import React from "react";

const LoadingState = () => (
  <div className="flex min-h-screen items-center justify-center px-6 bg-[#060b16] text-white animate-fade-in select-none">
    <div className="flex flex-col items-center max-w-xs text-center animate-pulse duration-[3000ms]">
      {/* Premium glowing double ring spinner */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Outer Ring - slow rotation with gradient */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#40e0d0] border-r-[#2d61ff] animate-spin duration-1000" />
        
        {/* Inner Ring - fast counter-rotation with gradient */}
        <div className="absolute h-10 w-10 rounded-full border-2 border-transparent border-b-[#8ce5db] border-l-[#40e0d0] animate-spin duration-700 [animation-direction:reverse]" />
        
        {/* Core glowing dot */}
        <div className="h-3 w-3 rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff] shadow-[0_0_12px_rgba(64,224,208,0.8)]" />
      </div>

      <h3 className="mt-8 font-display text-base font-bold tracking-wider text-slate-100 text-shadow-glow">
        Otter Society
      </h3>
      <p className="mt-2 text-xs font-semibold tracking-[0.2em] text-[#8ce5db]/80 uppercase">
        Loading experience...
      </p>
    </div>
  </div>
);

export default LoadingState;

