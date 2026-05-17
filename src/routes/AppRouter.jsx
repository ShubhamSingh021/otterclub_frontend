import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import EventsPage from "../pages/EventsPage.jsx";
import EventDetailPage from "../pages/EventDetailPage.jsx";
import MembershipPage from "../pages/MembershipPage.jsx";
import AdminCMSPage from "../pages/AdminCMSPage.jsx";
import AdminEventsPage from "../pages/AdminEventsPage.jsx";
import AdminRegistrationsPage from "../pages/AdminRegistrationsPage.jsx";
import AdminPaymentsPage from "../pages/AdminPaymentsPage.jsx";
import AdminMembershipsPage from "../pages/AdminMembershipsPage.jsx";
import AdminScannerPage from "../pages/AdminScannerPage.jsx";
import AdminAnalyticsPage from "../pages/AdminAnalyticsPage.jsx";
import AdminLoginPage from "../pages/AdminLoginPage.jsx";
import AdminEventFormPage from "../pages/AdminEventFormPage.jsx";
import UserDashboard from "../pages/UserDashboard.jsx";
import UpgradeMembership from "../pages/UpgradeMembership.jsx";
import TicketPage from "../pages/TicketPage.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";
import CommunityFeed from "../pages/community/CommunityFeed.jsx";
import CommunityDetail from "../pages/community/CommunityDetail.jsx";
import AdminCommunityPage from "../pages/AdminCommunityPage.jsx";
import AdminPostFormPage from "../pages/AdminPostFormPage.jsx";

const AppRouter = () => {
  return (
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
      <Route path="/admin/scanner" element={<AdminScannerPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
