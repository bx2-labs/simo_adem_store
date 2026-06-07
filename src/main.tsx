import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { inject } from "@vercel/analytics"; // 1. زدنا الاستدعاء هنا

// 2. شعلنا التحليلات
inject();

createRoot(document.getElementById("root")!).render(<App />);
