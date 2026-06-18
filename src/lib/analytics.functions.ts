import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

const eventInput = z.object({
  event: z.string().min(1).max(64),
  sessionId: z.string().uuid(),
  props: z.record(z.unknown()).optional(),
});

export const logEvent = createServerFn({ method: "POST" })
  .validator((data: unknown) => eventInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const supabaseAdmin = createClient<Database>(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
      );
      await supabaseAdmin.from("analytics_events").insert({
        event: data.event,
        session_id: data.sessionId,
        props: (data.props ?? {}) as never,
      });
    } catch {
      // analytics is fire-and-forget; never fail the user's flow
    }
    return { ok: true };
  });