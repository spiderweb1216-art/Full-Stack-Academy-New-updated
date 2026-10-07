FSA Accent Sync V41

Replace the included files using the same folders.

What changed
- Backend Theme > Brand color is now the single public accent source.
- Current default/fallback is #852937.
- app.js applies catalog.site.theme directly; it no longer depends on CMS page functionality.
- Cookie banner, newsletter popup, buttons, tabs, badges, hover/focus states, reviews, accessibility/AI controls, footer and premium UI use the same accent variable.
- Standalone Branch pages also read the backend theme and update their accent.
- Light pink UI surfaces are derived from the same accent.
- Semantic success/warning/rating colors remain semantic and are not treated as site accent colors.

After replacement
1. Open api/index.php?action=catalog and confirm site.theme.brand is #852937.
2. Hard refresh with Ctrl+F5.
3. If you change Theme > Brand later, refresh the public site and the frontend will use the new backend color.
