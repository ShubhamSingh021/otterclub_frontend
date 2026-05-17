import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// Static imports for core landing routes to ensure instantaneous first paint
import HomePage from "../pages/HomePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";

// Lazy-loaded pages for code splitting & smaller initial bundle size
const EventsPage = lazy(() => import("../pages/EventsPage.jsx"));
const EventDetailPage = lazy(() => import("../pages/EventDetailPage.jsx"));
const MembershipPage = lazy(() => import("../pages/MembershipPage.jsx"));
const AdminCMSPage = lazy(() => import("../pages/AdminCMSPage.jsx"));
const AdminReviewsPage = lazy(() => import("../pages/AdminReviewsPage.jsx"));
const AdminEventsPage = lazy(() => import("../pages/AdminEventsPage.jsx"));
const AdminRegistrationsPage = lazy(() => import("../pages/AdminRegistrationsPage.jsx"));
const AdminPaymentsPage = lazy(() => import("../pages/AdminPaymentsPage.jsx"));
const AdminMembershipsPage = lazy(() => import("../pages/AdminMembershipsPage.jsx"));
const AdminScannerPage = lazy(() => import("../pages/AdminScannerPage.jsx"));
const AdminAnalyticsPage = lazy(() => import("../pages/AdminAnalyticsPage.jsx"));
const AdminLoginPage = lazy(() => import("../pages/AdminLoginPage.jsx"));
const AdminEventFormPage = lazy(() => import("../pages/AdminEventFormPage.jsx"));
const UserDashboard = lazy(() => import("../pages/UserDashboard.jsx"));
const UpgradeMembership = lazy(() => import("../pages/UpgradeMembership.jsx"));
const TicketPage = lazy(() => import("../pages/TicketPage.jsx"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword.jsx"));
const ResetPassword = lazy(() => import("../pages/ResetPassword.jsx"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage.jsx"));
const CommunityFeed = lazy(() => import("../pages/community/CommunityFeed.jsx"));
const CommunityDetail = lazy(() => import("../pages/community/CommunityDetail.jsx"));
const AdminCommunityPage = lazy(() => import("../pages/AdminCommunityPage.jsx"));
const AdminPostFormPage = lazy(() => import("../pages/AdminPostFormPage.jsx"));
const AdminCouponsPage = lazy(() => import("../pages/AdminCouponsPage.jsx"));
const AdminBroadcastPage = lazy(() => import("../pages/AdminBroadcastPage.jsx"));

const RouteLoader = () => (
  <div className="flex h-screen items-center justify-center bg-[#060b16]">
    <div className="text-center">
      <div className="relative inline-flex">
        <div className="h-12 w-12 rounded-full border-2 border-t-transparent border-[#8ce5db] animate-spin" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-white/5" />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#8ce5db]/70 animate-pulse">Loading Page...</p>
    </div>
  </div>
);

const AppRouter = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:slug" element={<EventDetailPage />} />
        <Route path="/membership" element={<MembershipPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/community" element={<CommunityFeed />} />
        <Route path="/community/:slug" element={<CommunityDetail />} />

        {/* User Routes */}
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/member/upgrade" element={<UpgradeMembership />} />
        <Route path="/ticket/:id" element={<TicketPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<Navigate to="/admin/analytics" replace />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/events" element={<AdminEventsPage />} />
        <Route path="/admin/events/new" element={<AdminEventFormPage />} />
        <Route path="/admin/events/edit/:id" element={<AdminEventFormPage />} />
        <Route path="/admin/community" element={<AdminCommunityPage />} />
        <Route path="/admin/community/new" element={<AdminPostFormPage />} />
        <Route path="/admin/community/edit/:id" element={<AdminPostFormPage />} />
        <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
        <Route path="/admin/memberships" element={<AdminMembershipsPage />} />
        <Route path="/admin/cms" element={<AdminCMSPage />} />
        <Route path="/admin/reviews" element={<AdminReviewsPage />} />
        <Route path="/admin/scanner" element={<AdminScannerPage />} />
        <Route path="/admin/coupons" element={<AdminCouponsPage />} />
        <Route path="/admin/broadcast" element={<AdminBroadcastPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
