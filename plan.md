# Plan — next session

Backlog captured from the user (in the order they noticed them). **Not yet started.**
Each item has the verbatim note, a diagnosis, and a suggested approach so we can pick up cold.

---

## 1. Group match details aren't openable from the team card — ✅ DONE (2026-06-26)
**Status:** Restructured the played hub row: opponent name is now a clean team link, and the **score is an explicit "W 2–0 ›" details button** that opens the match detail modal when an event id exists. Upcoming-row opponent also linkified. **Caveat to verify at runtime:** if a specific game's ESPN event id still isn't captured, its score won't be clickable — that's a data-capture check (`detailIds`/`eventIdFor` for that group id), not an affordance issue anymore.


**Note:** "still can't view match details for group stage games inside a team's card. Mexico for example '1st in Group A, 3W-0D… MD1 South Africa W 2-0'. but it's just a link to the South Africa card, with no link to the game details."

**Diagnosis:** In `TeamHub` (`wc-hub-results`), a played row is one big `<button onClick={onOpenDetail(f.id)}>` *only when* `detailIds.has(f.id)`, and the opponent name is a nested button (`onSelectTeam` + `stopPropagation`). So clicking the name → team card; clicking elsewhere → details *if clickable*. Two likely problems:
  - **No visual affordance** that the row opens details, and the opponent name covers most of the row → user only ever hits the team link.
  - **`detailIds` may not include the group fixture** (its ESPN event id might not be captured). We added event-id merge+persist (`wc26_eventids`) last session — verify it actually populates for completed group games (check `eventIdFor` + `detailIds` for a group id at runtime).

**Approach:** Mirror the Knockout-run pattern — make the **score** (`W 2–0`) an explicit details button (opens detail when an event id exists), and keep the opponent name as the team link. Add a clear hover/affordance. Verify the detail modal actually renders for a group fixture (`matchInfoFor` returns group info ✓, needs `eventIdFor(id)` non-null).
**Files:** `TeamHub` results map (~`wc-hub-result`), `detailIds`/`eventIdFor` wiring, `wc-hub-result-link` CSS.
**Effort:** small. **Priority:** high (it's a correctness/usability gap).

---

## 2. Preview/detail lineups should use each team's kit colors — ✅ DONE (2026-06-26)
**Status:** Added `pitchAccentStyle(code)` → sets a local `--gold` to that team's `brighten(TEAM_COLORS[code].accent)`. Applied to `PreviewPitch`, `DetailPitch`, and the team-card pitch, so each side shows in its own kit color regardless of the ambient app theme. (DetailPitch keys off ESPN `team.code`; if an abbreviation ever mismatches `TEAM_COLORS`, that side falls back to the ambient accent — fine.)


**Note:** "in Japan's team card, app is white/red. click KNOCKOUT RUN → R32 BRAZIL PREVIEW → the players are all red, including Brazil's. Also Schedule → Norway vs France lineups are all in the default yellow; team lineups should match the team kit colors."

**Diagnosis:** `PitchDiagram` dots use `var(--gold)` (the *current* theme accent). In a two-team modal both pitches inherit the same accent (Japan's red, or the default gold). The two sides should each use **their own** kit accent from `TEAM_COLORS`.

**Approach:** Give each pitch a per-team accent. In `PreviewPitch`/`DetailPitch` (and the KO preview), set an inline `style={{ ['--gold']: teamAccentFor(code) }}` (and maybe a tinted dot bg) on each pitch card so dots/labels render in that team's color. Reuse `TEAM_COLORS[code].accent` via `brighten()` so it stays legible on the modal's dark surface. Make sure the modal isn't sitting inside the themed `.wc-app` accent (override locally per side).
**Files:** `PitchDiagram` (accept an accent override or read a CSS var set by parent), `PreviewPitch`, `DetailPitch`, `KoPreviewModal`, `MatchPreviewModal`. `TEAM_COLORS`/`brighten` already exist.
**Effort:** small–medium. **Priority:** medium (polish).

---

## 3. "Confirmed XI" is dishonest — ✅ DONE (2026-06-26)
**Status:** "Confirmed XI" → **"Possible XI"** everywhere. Team card badge reads `Possible XI · last out MD{n} v {OPP}` (honest: it's their most recent actual lineup, used as a likely guide); previews read "Possible XI"; pure guesses still read "Predicted XI". If we ever fetch the genuinely-published XI for the *upcoming* match (~30–60 min pre-kickoff), that one can legitimately say "Confirmed XI".


**Note:** "CONFIRMED XI is still a lie. say something like POSSIBLE XI. it's not confirmed until ~30 min before the game; we shouldn't lie to the user."

**Diagnosis:** We label the **last ESPN-published XI** as "Confirmed XI · MDx v OPP". For an *upcoming* match that lineup isn't confirmed (it's the previous game's). Real confirmation lands ~1hr (or ~30 min) before kickoff.

**Approach:** Stop claiming "Confirmed". Wording options to decide: **"Possible XI"**, "Likely XI", or "Last XI (MDx v OPP)". Probably: predicted-source → "Possible XI"; ESPN-last-lineup source → "Possible XI · last out MDx v OPP" (honest: it's the most recent real XI, used as a likely guide). If/when we ever fetch the lineup for the *actual upcoming* match (published pre-KO), that one can legitimately say "Confirmed XI". Decide wording with user.
**Files:** `confirmedLabel` in `TeamProfileCard`, the `wc-lineup-badge` text in `PreviewPitch`/`TeamProfileCard` (`confirmed?confirmedLabel:"Predicted XI"`).
**Effort:** trivial (wording) — but **confirm the exact copy with the user first.** **Priority:** medium.

---

## 4. Digest: link a *match reference* to the match preview (not two team links)
**Note:** Example digest "…Egypt and Iran face off…". Team names already link to team cards (good), but when the digest references **two teams playing each other**, link that phrase to the **match preview**. "jumping to the match preview when referencing a particular match makes sense; linking to the team when discussing one in isolation makes sense."

**Diagnosis:** `tokenizeDigest` currently links every team name → its team card. Need to detect "X and Y / X vs Y / X face Y / X play Y" where X,Y are **opponents in a known fixture** and render a combined link to that match's preview.

**Approach:** In `tokenizeDigest`, after finding adjacent team tokens, check the connective text between them (`and`, `vs`, `v`, `face`, `play`, `meet`, `host`) and whether the two codes share a fixture (group `FIXTURE_BY_PAIR` or a KO matchup that exists/resolves). If so, emit a single "match" segment linking to the preview (`onOpenPreview` for group, `onPreviewKo` for KO). Keep solo mentions as team links. Edge cases: same two teams could appear in group + KO — prefer the upcoming/most-relevant one. Consider whether to thread `onOpenPreview`/`onPreviewKo` into the digest panel (currently digest only has `onSelectTeam`/`onSelectGroup`).
**Files:** `tokenizeDigest`, `DigestLinks`, `Typewriter`, `DigestPanel` props (add preview handlers), `App` wiring.
**Effort:** medium (the parsing + threading). **Priority:** medium-high (nice payoff, and the digest is a showcase).

---

## 5. Bracket visualization needs real work (connectors)
**Note:** "brackets visualization needs a lot of work. not obvious which games feed into which next games. maybe do a quick round of research so we don't reinvent the wheel."

**Diagnosis:** `KoBracket` is columns of cards with no connector lines between a game and the game it feeds. Hard to read the flow R32→R16→QF→SF→F.

**Approach:** **Research first** (WebSearch) — established patterns for React/CSS tournament brackets and connector techniques:
  - Pure-CSS bracket connectors (flexbox columns + `::before/::after` elbow lines), the classic "two children join one parent" approach.
  - Libraries to crib from / consider: `@g-loot/react-tournament-brackets`, `react-brackets`, `brackets-viewer.js` (for visual reference, not necessarily a dep).
  - Note the WC2026 R32 layout isn't a clean power-of-two seed mirror (slots are explicit `homeSlot`/`awaySlot` strings), so connectors should be derived from the actual feeder relationships (`"Round of 32 N Winner"` → which R16 fixture). We removed `feederFixture`/`nextFixtureFor` with PathView — **may need to re-derive the feeder map** (winner-of-slot → next fixture) for drawing lines.
  - Keep horizontal scroll on mobile; consider highlighting a fixture's feeders/descendants on hover.
**Files:** `KoBracket`, new connector CSS/SVG, possibly a small `feederOf`/`nextFixtureFor` helper (re-add).
**Effort:** large. **Priority:** high-impact but biggest job — probably its own focused session.

---

### Remaining for next session
**#1, #2, #3 are ✅ DONE.** Left: **#4** (digest match links) then **#5** (bracket redesign — research first, its own chunk).

### Repo state at handoff
- "Pick a Team" view removed; team journeys live in the team card (group results + table + **Knockout run** + minimize button).
- Real KO results from ESPN (`koResults`, penalties). Event ids/results now merge + persist to localStorage.
- Per-team theming (dark / light / vivid by kit); scroll-aware theming for the most-visible open team card.
- Goal-celebration overlay; loose-ball easter egg (triple-tap title) with 👟 cursor in ball mode.
- `npm run build` (tsc -b + vite) green at handoff.
