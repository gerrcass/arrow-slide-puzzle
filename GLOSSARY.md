# Glossary

The shared vocabulary for Nana Pearl's Arrow Slide Puzzle. Use these words in specs, tickets, code, tests, and UI copy.

| Term | Meaning |
| --- | --- |
| **Arrow** | Player-facing name for a ribbon piece. |
| **Attempt** | One play of a level, starting with three hearts. Retrying begins a new attempt. |
| **Blocked** | A ribbon whose slide would overlap another ribbon at some point before it fully exits. Tapping a blocked ribbon causes a collision. |
| **Board** | The rectangular grid a level occupies. Pieces never share a cell. |
| **Chapter** | A group of four levels with a shared difficulty band and mood. |
| **Clear** | A ribbon that can slide all the way off the board without overlapping any other ribbon. A clear ribbon is always safe to remove. |
| **Clearance sweep** | The engine check that translates a ribbon one cell at a time until it is entirely off-board, failing on the first overlap. |
| **Collision** | A blocked tap. Costs one heart and does not change the board. |
| **Constellation** | The hidden artwork under a level, and the collectible shown in the gallery. |
| **Curated level** | A generated candidate accepted after solver verification and difficulty-metric review, then committed as content. |
| **Frost** | The opaque overlay that hides a constellation until cleared ribbons punch holes in it. |
| **Gallery** | The collection screen showing unlocked constellations and their names. |
| **Head** | The end of a ribbon that carries the arrowhead. |
| **Heading** | The direction the head points: up, down, left, or right. |
| **Heart** | A life in the current attempt. Three at the start; a collision removes one. |
| **Hint** | A pulse on one currently clear ribbon. Free and unlimited. |
| **Legal move** | Synonym for clear. The set of legal moves is computed from the current board state only. |
| **Level** | One board, one constellation, a difficulty band, and display metadata. |
| **Nana Pearl** | The guide. Warm, brief, never scolding. |
| **No dead ends** | The domain invariant that removing a clear ribbon cannot make any other ribbon less clear. Any sequence of legal slides is safe; perception is the challenge. |
| **Piece** | Code word for a ribbon: an ordered, self-avoiding path of grid cells plus a heading. |
| **Reveal** | Holes punched in the frost along cleared paths, culminating in the full constellation. |
| **Ribbon** | The visual form of a piece: a glossy, round-cornered stroke with an arrowhead. |
| **Seed** | Deterministic input to the level generator. |
| **Slide** | Rigid translation of a ribbon along its heading until it exits. |
| **Solvable** | A board where repeated removal of clear ribbons clears every piece. Verified by the solver. |
| **Stars** | The rating for a completed level: one per heart remaining, from 1 to 3. Best result persists. |
| **Tail** | The blunt end of a ribbon, opposite the head. |
| **Tangle** | The player-facing name for a board's arrangement of ribbons. |
