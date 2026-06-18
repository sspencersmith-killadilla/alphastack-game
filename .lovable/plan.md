## What is going on

This does not look like a random Lovable publishing outage from the message alone. The text you keep seeing is the generic build wrapper from Vite/Rolldown. It hides the actual failing module unless we inspect the full local build/dev logs.

From the project history, the last concrete root cause was around TanStack server-function extraction/registration for the leaderboard and analytics code. The app then had multiple attempted fixes, but the code still contains a high-risk pattern for this stack: server-function files dynamically importing a shared backend-client module that reads server environment variables and creates backend clients. That can pass preview/runtime checks but still fail during publish bundling.

## Goal

Make publishing boring again by removing the fragile server-function/bundler patterns and validating against the same kind of production build that publish runs.

## Plan

1. **Capture the actual build error**
   - Run the production build locally and save the full output instead of relying on the truncated publish dialog.
   - Check the newest server/dev logs for the specific module, import, or server-function ID that fails.

2. **Simplify server-function modules**
   - Keep `*.functions.ts` files as thin server-function declarations.
   - Move validation constants, profanity checks, scoring checks, and backend client creation into imported helper modules where the TanStack server-function splitter can handle them reliably.
   - Avoid dynamic imports from inside handlers unless they are strictly needed.

3. **Fix backend client usage for publish**
   - Replace the custom shared `src/lib/supabase-clients.ts` pattern if it is implicated by the build.
   - For public leaderboard reads, create the publishable backend client directly inside the server-side helper/function path using server env vars.
   - For score submission and analytics writes, load privileged backend access only inside server-only code, not from modules that can enter the client/router graph.

4. **Stabilize call sites**
   - Keep component calls using `useServerFn(...)` for `getLeaderboard`, `qualifiesForLeaderboard`, `submitScore`, and analytics logging.
   - Ensure no loaders or client modules call protected/privileged backend logic during SSR prerender.

5. **Remove stale/generated risks**
   - Do not edit `src/routeTree.gen.ts`.
   - Remove any stale references to deleted `.asset.json` files or old server-client helper paths.

6. **Validate before calling it fixed**
   - Re-run the production build and confirm it exits successfully.
   - Open `/` and `/leaderboard` in the preview and verify no server-function ID errors or failed leaderboard requests.
   - Only after that, publish again.

## Expected result

The publish failure should resolve once the full build passes locally. If the full build still fails with only an internal Rolldown stack and no project file, then we will escalate it as a platform/bundler issue with the captured full log. Right now, the evidence points more strongly to a project-level bundling/server-function extraction issue than a general Lovable outage.