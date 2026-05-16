import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./routes/AppRouter.jsx";
import "./index.css";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster position="top-center" />
      <AppRouter />
    </BrowserRouter>
  </React.StrictMode>
);
