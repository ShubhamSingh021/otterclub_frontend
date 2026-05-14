const LoadingState = () => (
  <div className="flex min-h-screen items-center justify-center px-6">
    <div className="glass-panel w-full max-w-md rounded-3xl p-7 text-center shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ce5db]">Loading Experience</p>
      <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#40e0d0] to-[#2d61ff]" />
      </div>
      <p className="mt-4 text-sm text-slate-300">Fetching dynamic homepage content from CMS APIs.</p>
    </div>
  </div>
);

export default LoadingState;
