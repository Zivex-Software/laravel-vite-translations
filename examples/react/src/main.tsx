import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("app");

if (!container) {
  throw new Error("App root element not found");
}

createRoot(container).render(<App />);
