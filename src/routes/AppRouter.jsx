import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import EventDetailPage from "../pages/EventDetailPage.jsx";
import AdminLoginPage from "../pages/AdminLoginPage.jsx";
import AdminEventsPage from "../pages/AdminEventsPage.jsx";
import AdminEventFormPage from "../pages/AdminEventFormPage.jsx";
import AdminCMSPage from "../pages/AdminCMSPage.jsx";
import AdminRegistrationsPage from "../pages/AdminRegistrationsPage.jsx";
import AdminPaymentsPage from "../pages/AdminPaymentsPage.jsx";
import MembershipPage from "../pages/MembershipPage.jsx";
import LoginPage from "../pages/LoginPage.jsx";
import RegisterPage from "../pages/RegisterPage.jsx";
import UserDashboard from "../pages/UserDashboard.jsx";
import UpgradeMembership from "../pages/UpgradeMembership.jsx";
import AdminMembershipsPage from "../pages/AdminMembershipsPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events/:slug" element={<EventDetailPage />} />
      <Route path="/membership" element={<MembershipPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<UserDashboard />} />
      <Route path="/member/dashboard" element={<UserDashboard />} />
      <Route path="/member/upgrade" element={<UpgradeMembership />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/events" element={<AdminEventsPage />} />
      <Route path="/admin/events/new" element={<AdminEventFormPage />} />
      <Route path="/admin/events/edit/:id" element={<AdminEventFormPage />} />
      <Route path="/admin/cms" element={<AdminCMSPage />} />
      <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />
      <Route path="/admin/payments" element={<AdminPaymentsPage />} />
      <Route path="/admin/memberships" element={<AdminMembershipsPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
