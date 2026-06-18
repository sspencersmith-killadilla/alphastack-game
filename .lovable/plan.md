The publish error shown is the generic build wrapper, not the real root cause. The latest concrete error in the app logs is:

```text
Invalid server function ID: src_lib_leaderboard_functions_ts--getLeaderboard_createServerFn_handler
plugin: tanstack-start-core:validate-server-fn-id
```

This means the published/dev build is trying to call a server-function endpoint that the current server-function manifest does not recognize. In practical terms, the app’s client bundle and server-function registration are out of sync around `getLeaderboard` in `src/lib/leaderboard.functions.ts`. Earlier logs also showed a now-addressed unresolved logo asset import, but the remaining signal is the invalid server-function ID.

Plan to fix:

1. **Capture the current build error in build mode**
   - Run the project build once to get the full untruncated error output.
   - Confirm whether publish is still failing on the invalid server-function ID or on a newer compile error.

2. **Stabilize server-function registration**
   - Inspect `src/lib/leaderboard.functions.ts`, `src/components/game/TopScoresPanel.tsx`, `src/routes/leaderboard.tsx`, and `src/components/game/GameOverModal.tsx` call sites.
   - If needed, adjust calls to use the canonical TanStack Start server-function pattern so the server-function transformer can register `getLeaderboard`, `submitScore`, and `qualifiesForLeaderboard` consistently.

3. **Remove/generated-file risk**
   - Do not hand-edit `src/routeTree.gen.ts`; it is generated and can be overwritten during publish.
   - If any required type registration was previously placed there, move it into a user-owned file such as `src/router.tsx` or `src/start.ts`.

4. **Clean up remaining publish risks**
   - Keep the shared `ALPHASTACK_LOGO_URL` approach so publish no longer depends on fragile direct `.asset.json` imports.
   - Move any custom backend client logic out of auto-generated integration files if it is still required, so future backend refreshes do not silently break production.

5. **Verify**
   - Re-run the production build.
   - Check the app no longer emits `Invalid server function ID` for leaderboard calls.
   - Then publish again once the build passes.