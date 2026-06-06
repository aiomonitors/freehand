# AGENTS.md

This folder is the product wiki for Freehand.

Use it to understand what the app does before changing behavior. The wiki is intentionally feature-oriented: each major user-facing capability has its own page, and `product.md` ties the feature set together.

## How to explore

1. Start with `product.md` for the product overview and feature map.
2. Read the feature page most relevant to your task.
3. Cross-check source specs in `docs/specs/` when you need deeper historical context.
4. Cross-check implementation plans in `docs/plans/` when you need intended implementation sequencing.
5. Inspect code only after understanding the product behavior expected by the wiki/specs.

## Maintenance rules

- Keep feature pages focused on what the feature is and why it exists.
- Do not turn wiki pages into step-by-step implementation plans.
- Keep every file in this folder under 200 lines, except `product.md`.
- When adding a major feature, add or update a dedicated feature page and update `product.md`.
- Preserve the forward-only writing model unless the user explicitly changes product direction.
