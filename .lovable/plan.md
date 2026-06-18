The publish error is a generic bundler stack trace. The useful part is in the dev logs: the build cannot resolve this import:

`@/assets/alphastack-logo.png.asset.json`

It is imported by `/`, `/play`, and `/leaderboard`. The file exists in the preview workspace, but this `.asset.json` import style is not being resolved reliably during the production publish build, so Rolldown stops and publish fails.

Plan to fix:
1. Replace direct imports of `alphastack-logo.png.asset.json` in route files with a small app-owned logo constant/module, or inline the asset URL string in one shared place.
2. Update the three routes that use the logo to reference that shared value instead of importing the asset metadata JSON directly.
3. Check for any remaining `.asset.json` imports so publish cannot fail on the same issue.
4. Re-run the production build verification after the edit.

This does not change gameplay or backend behavior; it only removes the fragile asset import that is blocking publishing.