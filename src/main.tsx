import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/onest/index.css";
import "./index.css";
import App from "./App.tsx";
import { cleanupDemoStudents } from "@/lib/devCleanup"; // ⚠️ TEMPORAL (test)

cleanupDemoStudents(); // ⚠️ TEMPORAL: elimina los alumnos demo del test

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
