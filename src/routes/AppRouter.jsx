import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage.jsx";
import EventDetailPage from "../pages/EventDetailPage.jsx";
import AdminLoginPage from "../pages/AdminLoginPage.jsx";
import AdminEventsPage from "../pages/AdminEventsPage.jsx";
import AdminEventFormPage from "../pages/AdminEventFormPage.jsx";
import NotFoundPage from "../pages/NotFoundPage.jsx";

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/events/:slug" element={<EventDetailPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin/events" element={<AdminEventsPage />} />
      <Route path="/admin/events/new" element={<AdminEventFormPage />} />
      <Route path="/admin/events/edit/:id" element={<AdminEventFormPage />} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
