## Goal
Prevent false confidence from local builds by evaluating the app with the same production mode and diagnostics needed to catch publish-time Rolldown/Vite failures before clicking Publish.

## Plan
1. **Capture the real build error**
   - Run the production build with verbose logging and output redirection so the full Rolldown `errors` payload is preserved instead of truncated.
   - Inspect the full log for the first actionable module/import/plugin error above the generic Rolldown stack.

2. **Add a repeatable validation command**
   - Create a project script such as `validate:publish` that runs the production build in a clean, publish-like mode and writes logs to a predictable diagnostics file.
   - Include environment details and dependency versions in the log so future failures can be compared against the publishing environment.

3. **Add a production smoke test**
   - After a successful production build, boot the built app locally and request the key routes: `/`, `/play`, and `/leaderboard`.
   - Fail the validation if any route returns a server error or if the app does not start.

4. **Document the workflow**
   - Add concise instructions to the project plan/docs explaining: run `validate:publish`, inspect the saved log if it fails, then publish only after the build and smoke test pass.

## Technical notes
- The screenshot shows the publish system still failing at the generic Rolldown wrapper, which means we need the *full* build log, not just the final stack.
- The previous local `bun run build` result may not be sufficient if it did not preserve the full diagnostic payload or did not smoke-test the production output.
- I will not change app behavior; this plan only adds diagnostics/validation unless the captured full error points to a specific code fix.

## Publish validation workflow

Before using the Publish button, run:

```bash
bun run validate:publish
```

This command runs the production build, saves the full non-truncated output to `.lovable/diagnostics/publish-validation.log`, starts a local production preview, and checks `/`, `/play`, and `/leaderboard`. If publishing fails with the generic Rolldown/Vite wrapper again, use the saved diagnostics log to find the first project-level error above the wrapper stack.