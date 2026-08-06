import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sjzrexjaftgrmhrighzt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqenJleGphZnRncm1ocmlnaHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTcxNDksImV4cCI6MjEwMDkzMzE0OX0.ZoB0ta3y4meEEhgYyOFOu8hevK2veJt_tn_msnoKbh8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Garde la session dans le stockage local de l'appareil (essentiel pour une PWA :
    // sans ça, ou en cas d'échec réseau transitoire, l'utilisateur peut se retrouver
    // déconnecté à chaque ouverture de l'app).
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: "ridix-auth",
  },
});

