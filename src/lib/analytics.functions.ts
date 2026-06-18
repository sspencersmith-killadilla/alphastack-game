import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const eventInput = z.object({
  event: z.string().min(1).max(64),
  sessionId: z.string().uuid(),
  props: z.record(z.unknown()).optional(),
});

export const logEvent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => eventInput.parse(data))
  .handler(async ({ data }) => {
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabase-clients");
      const supabaseAdmin = getSupabaseAdmin();
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