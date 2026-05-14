const ErrorState = ({ message, onRetry }) => (
  <div className="flex min-h-screen items-center justify-center px-6">
    <div className="w-full max-w-xl rounded-3xl border border-rose-300/30 bg-[#2a1220]/90 p-8 text-center text-rose-100 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-300">Request Failed</p>
      <p className="mt-3 text-base">{message}</p>
      <button
        className="mt-6 rounded-full bg-rose-500 px-6 py-3 text-sm font-semibold text-[#2a0e1a] transition hover:bg-rose-400"
        type="button"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  </div>
);

export default ErrorState;
