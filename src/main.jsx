import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./routes/AppRouter.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
