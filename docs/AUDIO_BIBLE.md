# AUDIO_BIBLE.md

> **Status:** Prompt 00 — Skeleton. Full audio system in Prompt 21.
> **Last updated:** 2026-10-26
> **Rights gate:** No licensed audio is cleared. All audio is `license-needed` or `placeholder-only`.

---

## Audio bus hierarchy

```
Master bus
├── Music bus         (menu, lobby, gameplay, combat tension, game end)
├── Ambience bus      (wind, machinery, terrain atmosphere)
├── UI bus            (hover, select, confirm, cancel, notification)
├── SFX bus           (game events: produce, move, deploy, combat, stars)
└── Voice bus         (tutorial narration — if rights-cleared; captions required)
```

---

## Audio cue registry (skeleton — Prompt 21 completes)

| Cue ID | Category | Trigger event | Loop | Status | Rights |
|---|---|---|---|---|---|
| AUDIO-MUSIC-MENU | music | app boot / menu visible | yes | not-started | license-needed |
| AUDIO-MUSIC-GAMEPLAY | music | match active | yes | not-started | license-needed |
| AUDIO-MUSIC-COMBAT | music | combat instance created | yes | not-started | license-needed |
| AUDIO-MUSIC-END | music | game end | no | not-started | license-needed |
| AUDIO-AMB-WIND | ambience | board visible | yes | not-started | license-needed |
| AUDIO-AMB-FACTORY | ambience | near Factory | yes | not-started | license-needed |
| AUDIO-UI-CONFIRM | ui | any confirm action | no | not-started | license-needed |
| AUDIO-UI-CANCEL | ui | cancel / close | no | not-started | license-needed |
| AUDIO-UI-HOVER | ui | button hover | no | not-started | license-needed |
| AUDIO-SFX-MOVE | sfx | unit.move event | no | not-started | license-needed |
| AUDIO-SFX-PRODUCE | sfx | resource.produced event | no | not-started | license-needed |
| AUDIO-SFX-DEPLOY | sfx | mech.deploy event | no | not-started | license-needed |
| AUDIO-SFX-BUILD | sfx | structure.build event | no | not-started | license-needed |
| AUDIO-SFX-COMBAT-REVEAL | sfx | combat.revealed event | no | not-started | license-needed |
| AUDIO-SFX-STAR | sfx | star.placed event | no | not-started | license-needed |
| AUDIO-SFX-GAME-END | sfx | game.ended event | no | not-started | license-needed |

---

## Implementation requirements (Prompt 21)

- Web Audio API; handle browser autoplay restrictions (init on user gesture).
- Sliders: master, music, ambience, SFX, voice. Global mute. Per-category mute.
- Settings persist to localStorage (not to server).
- Reduced-motion does not unexpectedly mute audio; "quiet mode" reduces ambience.
- Cooldowns and event ID deduplication prevent spam.
- Positional audio sparingly; non-positional fallback for accessibility.
- Text captions for all voiced tutorial cues.
- Audio never authoritative for timing or state.

---

## Blocked content

The official Scythe soundtrack and all Stonemaier Games audio recordings are `rejected` — do not use. Source a rights-cleared alternative library (e.g., Artlist, Epidemic Sound Business, or commission original).
