# ADR 0005 — Progressive frost reveal with SVG masks

**Status:** Accepted (2026-10-27)

## Context

The hidden picture is the emotional payoff. Showing it only after the last ribbon is a single moment; showing it only in a gallery separates the reward from the play.

## Decision

Lay a frosted overlay over the constellation. Each cleared ribbon records its path and punches a soft-edged hole in the frost using an SVG mask. Clearing the board animates the remaining frost away, draws the constellation lines, and names the constellation. The constellation is also collected in the gallery.

The reveal geometry is derived from the same path data as the ribbons, so it stays aligned at every board size.

## Consequences

- Every clear gives a small reward and a sense of excavation.
- The mask is one SVG node, so the cost is low and the effect is smooth.
- Reduced-motion mode skips the line-draw and confetti but keeps the completed art.
- Art is original inline SVG; no image requests, no licensing ambiguity.
