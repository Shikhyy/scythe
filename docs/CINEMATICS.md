# CINEMATICS.md

> **Status:** Prompt 00 — Sequence registry skeleton. Implementation in Prompt 20.
> **Last updated:** 2026-10-26

---

## Cinematic sequence registry

Every sequence listed in the prompt pack's Cinematic Sequence Bible. All entries are `not-started`.

| ID            | Sequence                  | Trigger                       | Status      | Notes                           |
| ------------- | ------------------------- | ----------------------------- | ----------- | ------------------------------- |
| CIN-BOOT      | App boot / loading reveal | App launch                    | not-started | ~5–10s, skippable               |
| CIN-MENU-IDLE | Menu idle world           | Menu visible                  | not-started | Looping, low motion             |
| CIN-ROOM      | Lobby transition          | Create/join room              | not-started | Seats + invite UI stable during |
| CIN-FACTION   | Faction selection intro   | Hover/select faction          | not-started | ~3–6s, skippable                |
| CIN-OPEN      | Match opening establisher | Match starts                  | not-started | ~12–20s, skippable              |
| CIN-TURN      | Turn start                | Server: turn changes          | not-started | ~1–2s, can disable              |
| CIN-MOVE      | Unit movement             | Confirmed unit-move event     | not-started | Path + settle                   |
| CIN-PRODUCE   | Production                | Confirmed production event    | not-started | Resource spawn                  |
| CIN-TRADE     | Trade                     | Confirmed trade event         | not-started | Resource/popularity             |
| CIN-BOLSTER   | Bolster                   | Confirmed bolster event       | not-started | Power/card                      |
| CIN-UPGRADE   | Upgrade                   | Confirmed cube movement       | not-started | Cube slide                      |
| CIN-DEPLOY    | Mech deploy               | Confirmed deployment          | not-started | Mat-to-board                    |
| CIN-BUILD     | Build                     | Confirmed structure placement | not-started | Construction cue                |
| CIN-ENLIST    | Enlist                    | Confirmed enlistment          | not-started | Token + reward                  |
| CIN-ENCOUNTER | Encounter                 | Character encounter triggered | not-started | Panel + choice                  |
| CIN-FACTORY   | Factory claim             | Confirmed Factory selection   | not-started | Card reveal                     |
| CIN-COMBAT    | Combat                    | Valid combat instance         | not-started | Hidden→reveal→result            |
| CIN-STAR      | Star placed               | Confirmed achievement         | not-started | Track pulse                     |
| CIN-MILESTONE | Major milestone           | Approved milestone event      | not-started | Optional, low-frequency         |
| CIN-END       | Game end                  | Server end event              | not-started | ~8–15s optional intro           |
| CIN-REMATCH   | Rematch/menu              | Player chooses next step      | not-started | State confirmation              |
| CIN-TUTORIAL  | Guided lesson             | Tutorial step starts          | not-started | Highlight + focus               |

---

## Global motion rules

- All sequences: skippable; gameplay-critical information has static equivalent.
- Reduced-motion: disables rapid pans/zooms, camera shake, forced orbit, flashing.
- Fast mode: shortens all non-critical durations.
- Keyboard focus must not be lost during transitions.
- No sequence reveals hidden information before authorized.
- No sequence changes rule state.

---

## Cinematic QA checklist (per sequence)

- [ ] Fires only on correct authoritative event
- [ ] Duplicate event / reconnect does not duplicate irreversible visual effects
- [ ] Skip works at every point
- [ ] Reduced-motion removes forced pans/particles
- [ ] Fast mode shortens but preserves rules-critical feedback
- [ ] Missing asset never blocks a turn
- [ ] Keyboard focus / dialog / screen-reader status correct
- [ ] No hidden info revealed early
- [ ] No rule state changed
- [ ] Camera returns to playable framing
- [ ] Profiled on representative devices

---

## Implementation notes

- Use GSAP for authored camera/UI timelines.
- Use Three.js AnimationMixer for skeletal model motion.
- Never animate the same property with both systems simultaneously.
- All timelines: cleanup, cancellation, idempotency, test coverage.
- Duration/easing tokens from design system.
