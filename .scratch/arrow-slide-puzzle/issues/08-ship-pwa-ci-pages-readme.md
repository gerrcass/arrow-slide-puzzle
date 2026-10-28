# 08: Ship — PWA, CI, GitHub Pages, README evidence

**What to build:** The game installs and loads offline after one visit, every push is checked, `main` deploys automatically to GitHub Pages, and the README shows the live link plus a representative screenshot. Browser E2E covers the full happy path, collision, persistence, keyboard, and mobile.

**Blocked by:** 04, 05, 06, 07.

**Status:** ready-for-agent

- [ ] Manifest, theme colour, favicon, 192/512 icons, apple touch icon, and service worker precache the shell; production build loads offline after first visit.
- [ ] CI runs typecheck, unit tests (including solver verification), production build, and Playwright E2E on pushes and PRs.
- [ ] GitHub Pages deployment from `main` succeeds and the live URL serves the game at the project subpath.
- [ ] Playwright covers tutorial → clear → collision → solve level 1 → reveal → gallery → reload persistence, plus keyboard, reduced motion, 390×844, and 320 px.
- [ ] README includes the live link, a representative screenshot, how to play, controls, accessibility notes, development commands, and architecture pointers.
- [ ] Lighthouse mobile scores ≥95 for performance, accessibility, best practices, and SEO (or documented, resolved exceptions).
- [ ] No open issues or PRs remain after merge; feature branch/worktrees are cleaned up.
