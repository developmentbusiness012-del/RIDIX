import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sjzrexjaftgrmhrighzt.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqenJleGphZnRncm1ocmlnaHp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNTcxNDksImV4cCI6MjEwMDkzMzE0OX0.ZoB0ta3y4meEEhgYyOFOu8hevK2veJt_tn_msnoKbh8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
