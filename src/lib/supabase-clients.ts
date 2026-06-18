import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function requiredEnv(name: "SUPABASE_URL" | "SUPABASE_PUBLISHABLE_KEY" | "SUPABASE_SERVICE_ROLE_KEY") {
  const value = process.env[name];
  if (!value) throw new Error(`Missing backend environment variable: ${name}`);
  return value;
}

export function createServerPublicClient() {
  return createClient<Database>(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_PUBLISHABLE_KEY"),
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

let adminClient: ReturnType<typeof createClient<Database>> | undefined;

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      requiredEnv("SUPABASE_URL"),
      requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
  }
  return adminClient;
}