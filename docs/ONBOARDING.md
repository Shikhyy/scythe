# ONBOARDING.md

> **Status:** Prompt 00 — Lesson graph skeleton. Implementation in Prompt 22.
> **Last updated:** 2026-10-26

---

## Goals

A first-time player completes the tutorial and can play a real multiplayer match without reading an external manual. The tutorial must:
- Teach through doing, not reading walls of text
- Use the same rules engine and server as a normal match
- Be skippable at any point with a clear "skip tutorial" affordance
- Be resumable (checkpoint saved in user preferences, not in match state)
- Support keyboard, touch, and screen reader
- Never secretly perform an action for the user (demo/replay mode is clearly labelled)

---

## Lesson graph

```
START
  └─→ LESSON-0: Look Around
        └─→ LESSON-1: The Turn System
              └─→ LESSON-2: Resources and Production
                    └─→ LESSON-3: Move and Explore
                          └─→ LESSON-4: Build Your Engine
                                └─→ LESSON-5: Power, Popularity, and Cards
                                      └─→ LESSON-6: Encounter and Factory
                                            └─→ LESSON-7: Combat Practice
                                                  └─→ LESSON-8: Stars and Final Scoring
                                                        └─→ LESSON-9: Real Match Checklist
                                                              └─→ FREE PLAY / REAL MATCH
```

Each lesson can be independently skipped. Completing LESSON-9 marks the tutorial as done.

---

## Lesson summaries (details in Prompt 22)

| ID | Title | Learning goal | Method | Status |
|---|---|---|---|---|
| LESSON-0 | Look Around | Camera, hexes, terrain, units, selection | Guided pan/zoom, hover inspection | not-started |
| LESSON-1 | The Turn System | Action token, 4 sections, no-repeat rule | Highlight section, select, read costs | not-started |
| LESSON-2 | Resources and Production | Resource types, Produce/Trade actions, token placement | Run a real Produce action | not-started |
| LESSON-3 | Move and Explore | Unit movement, rivers, encounters, territory control | Move a unit on real board | not-started |
| LESSON-4 | Build Your Engine | Upgrade, Deploy, Build, Enlist | One guided example of each | not-started |
| LESSON-5 | Power, Popularity, and Cards | Power dial, popularity track, private cards | Bolster action + card inspect | not-started |
| LESSON-6 | Encounter and Factory | Encounter trigger, choose option, Factory card | Character to encounter token | not-started |
| LESSON-7 | Combat Practice | Simultaneous secret commit, reveal, resolve | Scripted 2-unit tutorial combat | not-started |
| LESSON-8 | Stars and Scoring | Star categories, 6th star end, scoring tiers | Walk through score breakdown | not-started |
| LESSON-9 | Real Match Checklist | Complete a sequence in a test match | Server-confirmed actions | not-started |

---

## System requirements

- Tutorial state: stored in user preferences only (never in match game state)
- Safe exit/re-entry: checkpoints saved per lesson
- Tooltips: concise, keyboard navigable, touch compatible, dismissible
- "Why is this disabled?" links to relevant RULE-ID
- Captions/text for all audio cues
- Tutorial helpers cannot bypass server-side legal action validation
- All tutorial actions go through the same `validateCommand` path as normal play

---

## Open questions

- [ ] Tutorial opponent: controlled AI fixture or scripted NPC state?
- [ ] Should tutorial run in a dedicated match room or a special tutorial session?
- [ ] What is the minimum lesson set for an MVP (could skip some advanced lessons initially)?
