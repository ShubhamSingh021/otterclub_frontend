const EmptyHomepageState = () => (
  <div className="mx-auto my-16 w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a1222]/95 shadow-soft">
    <div className="border-b border-white/10 bg-gradient-to-r from-[#132947] to-[#0c1a33] px-6 py-6 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#89e8dd]">Preparing Homepage</p>
      <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">No Published CMS Content Yet</h2>
      <p className="mt-3 max-w-3xl text-sm text-slate-300 sm:text-base">
        Add and activate records in your CMS collections to render the premium landing experience dynamically.
      </p>
    </div>

    <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
      <div className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]" />
      <div className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05]" />
      <div className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/[0.05] sm:col-span-2 lg:col-span-1" />
    </div>
  </div>
);

export default EmptyHomepageState;
