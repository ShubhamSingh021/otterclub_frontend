import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-panel p-8 text-center shadow-soft">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted">
          Page Not Found
        </p>
        <h1 className="mt-3 text-3xl font-semibold">This route is not available.</h1>
        <Link
          className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white"
          to="/"
        >
          Return To Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
