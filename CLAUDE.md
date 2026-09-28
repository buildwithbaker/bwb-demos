# CLAUDE.md - bwb-demos

The four public demonstration sites built from the `bwb-templates` kit: `trades`,
`eat-drink`, `stay-play`, `shop-office`, plus a `shared/` layer and an index page.

## Structure
- One folder per demo, each a full multi-page static site (no build step).
- `shared/tokens.css` - design tokens, mirrored from `bwb-templates/shared/`.
- `shared/demo-theme.js` - the theme-swap widget (8 presets, picker, auto-contrast guard)
  loaded on every demo page. **Demo-only. Never add it to `bwb-templates`.**
- `<meta name="robots" content="noindex">` is on every page and stays there. These are
  sales props, not sites that should rank. **Demo-only. Never add it to `bwb-templates`.**
- `shared/site.js` - the page script, mirrored from `bwb-templates/shared/` like tokens.css.
- The demo disclosure bar's CSS is **inlined** in each page's `<head>` (a second `<style>`
  block after the template's), so it costs no render-blocking request. Demo-only.
- **Demo forms never send anything.** Each demo's one form posts `get` to its own
  `<demo>/thanks/` page and none of its controls has a `name`, so even with JavaScript off
  nothing typed reaches a server or the URL. The demo CSP says `form-action 'self'`. Do not
  restore the template's Formspree action here. `thanks/` is demo-only, built from the
  demo's privacy page.
- Each demo has its own `favicon.svg` (its initial on its accent colour), not the kit
  placeholder.

## Deploy
- GitHub Pages serves this repo as a project site. There is no CNAME and no build step -
  merging a PR into `main` publishes the repo root as-is.
- Demo photos are AI-generated and used for demos only.

## Relationship to bwb-templates
A demo is a filled copy of a template plus the two demo-only additions above. When a
template changes, the matching demo has to be rebuilt from the new template - not
hand-patched - or the two drift apart.

## Branching (main is protected - PR only)

`main` is protected: direct pushes are rejected. **Never run `git push origin main`.**

1. `git checkout main && git pull origin main` - start from an up-to-date main
2. `git checkout -b <type>/<slug>` - branch BEFORE staging, so local `main` never diverges
3. edit, then `git add -- <explicit paths>` - never `git add -A`
4. `git commit -m "<message>"`
5. `git push -u origin <branch>`
6. `gh pr create --base main --fill`
7. `gh pr checks <branch> --watch` - wait for the required checks
8. `gh pr merge <branch> --squash --delete-branch`
9. `git checkout main && git pull origin main`

Never merge while a required check is failing or pending, and never disable a check to
force a merge through - stop and report instead.
