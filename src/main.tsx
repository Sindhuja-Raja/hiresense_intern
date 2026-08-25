import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// One-time migration: clear old tokens (only runs once per version)
const MIGRATION_VERSION = 'v2';
if (localStorage.getItem('token_migrated') !== MIGRATION_VERSION) {
  localStorage.removeItem('hiresense_token');
  localStorage.removeItem('recruitment_token');
  localStorage.removeItem('demo_user');
  localStorage.setItem('token_migrated', MIGRATION_VERSION);
}

createRoot(document.getElementById("root")!).render(<App />);
