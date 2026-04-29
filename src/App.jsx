import ReactDOM from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : null;
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
