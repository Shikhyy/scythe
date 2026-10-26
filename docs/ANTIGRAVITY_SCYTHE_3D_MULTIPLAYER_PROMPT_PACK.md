# Antigravity Build Prompt Pack: Full-Fidelity 3D Multiplayer Strategy Board Game

> **Purpose:** This is an executable prompt sequence for building a production-minded, browser-first, turn-based, 3D multiplayer adaptation of *Scythe*. It is designed for Google Antigravity IDE/App/CLI and the skills inventory supplied by the project owner.
>
> **Use:** Paste **Prompt 00 first**, in the project workspace in Antigravity. Then execute the prompts in numerical order, one at a time, checking the exit gate before continuing. Do not paste the entire file into one request and ask the agent to generate everything in one pass; that encourages incomplete rules, fake assets, placeholder multiplayer, and unverified claims.
>
> **Important rights gate:** This pack describes how to build a faithful implementation when you have authorization for the required Scythe names, art, card/content files, board illustrations, models, logos, and audio. The official product inventory and gameplay concepts are useful references, but public availability is not permission to rip artwork or reuse assets. Do not scrape assets from the physical or existing digital game. Where permission is absent or unclear, build neutral placeholders and/or a distinct original reskin; keep the architecture data-driven so licensed content can be substituted later. Record provenance for every asset. This is project guidance, not legal advice.

---

## Table of contents

1. [How to use this pack in Antigravity](#1-how-to-use-this-pack-in-antigravity)
2. [Recommended skill loading strategy](#2-recommended-skill-loading-strategy)
3. [Prompt 00 — Master reference prompt](#prompt-00--master-reference-prompt-run-this-first)
4. [Prompt 01 — Repository, skills, toolchain, and working rules](#prompt-01--repository-skills-toolchain-and-working-rules)
5. [Prompt 02 — Source-of-truth, rights, and asset provenance](#prompt-02--source-of-truth-rights-and-asset-provenance)
6. [Prompt 03 — Exhaustive product and rules specification](#prompt-03--exhaustive-product-and-rules-specification)
7. [Prompt 04 — Architecture and monorepo foundation](#prompt-04--architecture-and-monorepo-foundation)
8. [Prompt 05 — Domain model, state machine, commands, and events](#prompt-05--domain-model-state-machine-commands-and-events)
9. [Prompt 06 — Setup, board graph, terrain, and initial state](#prompt-06--setup-board-graph-terrain-and-initial-state)
10. [Prompt 07 — Turn loop and top-row actions](#prompt-07--turn-loop-and-top-row-actions)
11. [Prompt 08 — Bottom-row actions and engine building](#prompt-08--bottom-row-actions-and-engine-building)
12. [Prompt 09 — Movement, territory control, factions, and mech abilities](#prompt-09--movement-territory-control-factions-and-mech-abilities)
13. [Prompt 10 — Cards, encounters, objectives, Factory, and content registry](#prompt-10--cards-encounters-objectives-factory-and-content-registry)
14. [Prompt 11 — Combat, stars, end-game, and scoring](#prompt-11--combat-stars-end-game-and-scoring)
15. [Prompt 12 — Rules test harness and parity checklist](#prompt-12--rules-test-harness-and-parity-checklist)
16. [Prompt 13 — Authoritative multiplayer server](#prompt-13--authoritative-multiplayer-server)
17. [Prompt 14 — Accounts, lobby, invites, persistence, and reconnect](#prompt-14--accounts-lobby-invites-persistence-and-reconnect)
18. [Prompt 15 — Product UI, visual design system, and responsive shell](#prompt-15--product-ui-visual-design-system-and-responsive-shell)
19. [Prompt 16 — 3D board, hex coordinates, camera, and scene composition](#prompt-16--3d-board-hex-coordinates-camera-and-scene-composition)
20. [Prompt 17 — Characters, mechs, workers, structures, and component asset pipeline](#prompt-17--characters-mechs-workers-structures-and-component-asset-pipeline)
21. [Prompt 18 — Mats, cards, tracks, tokens, resource UI, and interactions](#prompt-18--mats-cards-tracks-tokens-resource-ui-and-interactions)
22. [Prompt 19 — Event-driven animation system](#prompt-19--event-driven-animation-system)
23. [Prompt 20 — Every cinematic sequence and transition](#prompt-20--every-cinematic-sequence-and-transition)
24. [Prompt 21 — Music, ambience, sound effects, and audio settings](#prompt-21--music-ambience-sound-effects-and-audio-settings)
25. [Prompt 22 — Onboarding, tutorial campaign, and in-context teaching](#prompt-22--onboarding-tutorial-campaign-and-in-context-teaching)
26. [Prompt 23 — Accessibility, reduced motion, performance, and polish](#prompt-23--accessibility-reduced-motion-performance-and-polish)
27. [Prompt 24 — Multiplayer E2E, security, and fault-injection testing](#prompt-24--multiplayer-e2e-security-and-fault-injection-testing)
28. [Prompt 25 — Deployment, CI/CD, operations, and release engineering](#prompt-25--deployment-cicd-operations-and-release-engineering)
29. [Prompt 26 — Final completeness audit and release gate](#prompt-26--final-completeness-audit-and-release-gate)
30. [Prompt 27 — Optional expansion, solo, replay, and spectator work](#prompt-27--optional-expansion-solo-replay-and-spectator-work)
31. [Asset/component inventory checklist](#assetcomponent-inventory-checklist)
32. [Cinematic sequence bible](#cinematic-sequence-bible)
33. [Recommended repository shape](#recommended-repository-shape)
34. [Reference links](#reference-links)

---

# 1. How to use this pack in Antigravity

## Before starting

1. Create or open a dedicated Git repository for this project. Do not use a folder containing unrelated work.
2. Put authorized rules/reference files in a clearly named directory such as `reference/authorized/`. Keep unlicensed artwork, card scans, audio, and models out of the repository.
3. Open the repository root as the Antigravity workspace. Confirm the workspace root and Git status before any edits or terminal commands.
4. Copy this file into the repository root as `ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md`.
5. Paste **Prompt 00** in the Antigravity Agent panel first. Ask it to create an implementation plan/artifact and persistent root `AGENTS.md` before code changes.
6. Run each numbered prompt as a separate Agent task. Only proceed when that prompt's exit gate is met. Do not send all prompts at once.
7. Ask Antigravity to activate or read each relevant skill. In the IDE, skills are commonly discovered from `.agents/skills/` and `~/.gemini/config/skills/`; the provided `npx skills` inventory reports a separate `~/.agents/skills/` location, so verify discovery in Antigravity’s Customizations/skills UI or by reading the files. Use `/skill-name` only where the current surface supports it. Missing skills must be reported honestly.
8. Use Antigravity’s browser capability for local UI verification when available. Ask it to capture a screenshot/browser recording or other review artifact for major visual milestones, but do not treat screenshots as proof of business logic correctness.
9. Keep work in small vertical slices. The agent must actually execute tests and report actual results; “looks complete,” a generated plan, or an artifact is not proof that the game rules or multiplayer work.
10. Review diffs and terminal actions. Do not approve destructive commands, secrets handling, new paid services, public deployment, or large downloads without explicit approval.

## Antigravity-specific operating notes

- Treat `AGENTS.md` as durable workspace instructions. Put only universal project invariants there; use `.agents/rules/*.md` for narrowly scoped rule sets and `.agents/skills/<name>/SKILL.md` for reusable workflows.
- Prefer Antigravity’s Plan mode / implementation plan before broad changes, then implement one bounded task at a time. Where manager agents or parallel subagents are available, parallelize research and reviews—not simultaneous edits to the same files.
- Use the integrated Browser for real rendered application checks (load route, interact, inspect console/network errors if tools expose them, test viewport sizes). Record what was actually verified and what could not be checked.
- Ask for artifacts that help review: architecture diagram, task plan, screenshots, browser recording, change summary, test log, and open-issues report. Artifacts supplement the repository; durable specs/tests must still be committed to source control.
- Do not rely on legacy Antigravity Workflows for this pack. As of October 26, 2026, the official IDE documentation says the previous workflow system was scheduled to stop working on October 19, 2026 and is transitioning toward skills. Prefer Skills + `AGENTS.md` + this numbered prompt pack unless the current installation confirms a supported successor.
- This is a project that may exceed one agent session. Maintain continuity through committed docs and status files—not through assumptions that the agent remembers prior conversations.

## Suggested Antigravity working style

- Use Antigravity’s planning/implementation modes and manager/subagents where available. Delegate independent read-only work (rule-source audit, asset pipeline research, testing strategy) in parallel; keep shared-file implementation sequential unless clear file ownership and merge strategy exist. Request an implementation plan/artifact before high-risk multi-file changes.
- Use focused branches or commits at meaningful milestones. If Antigravity proposes a multi-file change, inspect its diff/artifact before accepting it; do not treat a generated plan, browser screenshot, or narration as proof that tests passed.
- Do not let the agent overwrite unreviewed files, download unknown assets, add unapproved services, or run destructive shell commands without confirmation.
- Keep one source of truth for rules, data manifests, and asset licensing. UI components should not duplicate rules logic.
- In the response after each prompt, require: summary, files changed, Antigravity artifacts/reports produced (if any), test commands and their real outputs/status, browser verification actually performed (if applicable), known gaps, risks, and the next recommended prompt.
- If an instruction is too large for one session, the agent should split it into sub-tasks, create tickets, and finish one coherent slice; it must not claim completion prematurely.

## Definition of “complete”

The project is only considered complete when all of these are true:

- The agreed scope is explicitly defined (base game first; expansions later).
- All required game mechanics have a source reference and implementation status.
- Every legal action is validated by the server-side rules engine.
- Tests cover rules, edge cases, every faction/ability, scoring, and end-game timing.
- Two or more independent browser clients can play the same match without diverging or leaking private information.
- Every component type in scope exists in the component registry and has an intended visual representation, whether licensed asset or temporary placeholder.
- All animations are driven by confirmed game events and can be skipped or reduced.
- Music and SFX have a rights/provenance record and working mute/volume controls.
- A new player can complete onboarding without needing an external rulebook.
- The application can be built, deployed, monitored, and recovered using documented steps.

---

## Recommended Antigravity session pattern

For each prompt, use the following message wrapper above the relevant numbered prompt when useful:

```text
Use this repository's root AGENTS.md and ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md as persistent project context. First read the prompt's purpose, skills, full instructions, deliverables, and exit gate. Discover/read the listed skills through Antigravity's supported skill mechanism; do not pretend a skill is available if it is not. Create or update an implementation plan when the change spans multiple files. Implement only this prompt's scope, test it, inspect the resulting diff, and use the Browser tool for relevant UI checks if available. Do not move to a later prompt. Report actual commands/results, files changed, artifacts created, blockers, and the next prompt number.
```

**Antigravity artifact guidance:** Ask for a plan artifact before major implementation; request a screenshot or browser recording for visual milestones; request a test/verification report for logic milestones. Make sure decisive information is also saved as `docs/*.md` and tests in the repository. Do not rely on ephemeral chat context or an artifact that is not committed.

**Skill path check:** Official Antigravity IDE documentation lists workspace skills at `.agents/skills/<skill-folder>/SKILL.md` and global skills at `~/.gemini/config/skills/<skill-folder>/SKILL.md`. The user's `npx skills@latest ls -g` output listed skills in `~/.agents/skills/`, so first verify whether those skills are surfaced to this Antigravity installation. If not, copy or link only relevant skill folders into the documented workspace/global location after checking their contents and licenses; do not bulk-copy or overwrite an existing global setup.

**Rules path check:** Antigravity recognizes `AGENTS.md` / `GEMINI.md` and `.agents/rules/*.md` for workspace-scoped instructions. Keep a root `AGENTS.md` for project invariants and use narrowly scoped rules if the rules grow large. Do not assume IDE-specific settings files from another coding agent apply to Antigravity.

---

# 2. Recommended skill loading strategy

Antigravity skills are reusable instruction sets. They are not libraries, assets, or runtime dependencies. Before each prompt, ask Antigravity to activate/read the relevant skills. Antigravity IDE documentation lists workspace skills under `.agents/skills/` and global skills under `~/.gemini/config/skills/`. Use `/skill-name` where the current surface supports manual invocation, or ask the agent to inspect the relevant `SKILL.md` directly. Never claim a skill was loaded unless it was actually found and read. If a skill is missing, say so and proceed with general engineering discipline rather than pretending it was loaded.

## Skill groups from the uploaded list

### Discovery, planning, and specification

- `research`
- `grill-with-docs`
- `grill-me`
- `domain-modeling`
- `codebase-design`
- `to-spec`
- `writing-plans`
- `to-tickets`
- `wayfinder`

### Implementation, testing, and debugging

- `implement`
- `implement-spec`
- `tdd`
- `test-driven-development`
- `systematic-debugging`
- `diagnosing-bugs`
- `code-review`
- `verification-before-completion`
- `improve-codebase-architecture`

### Visual design, UI, and brand presentation

- `design-taste-frontend`
- `design-system`
- `ui-ux-pro-max`
- `ui-styling`
- `impeccable`
- `build-awwwards-quality-sites`
- `web-design-guidelines`
- `vercel-react-best-practices`
- `vercel-optimize`

### 3D, animation, and cinematic motion

- `threejs`
- `webgl-3d-object`
- `cinematic-gsap-lenis-motion-system`
- `cinematic-scroll-storytelling`
- `gsap-core`
- `gsap-react`
- `gsap-timeline`
- `gsap-performance`
- `gsap-utils`
- `gsap-plugins`
- `gsap-frameworks`

### Delivery and workflow

- `dispatching-parallel-agents`
- `subagent-driven-development`
- `executing-plans`
- `finishing-a-development-branch`
- `setup-pre-commit`
- `deploy-to-vercel`
- `vercel-cli-with-tokens`
- `git-guardrails-claude-code`
- `writing-for-agents`

## Additional skills worth searching for

Use `find-skills` (or your skills discovery tool) to find current skills for:

- Colyseus room architecture and authoritative state synchronization
- Playwright multi-browser end-to-end testing
- Blender modeling and Blender-to-glTF/GLB export
- Web Audio API or interactive game sound design
- WebGL profiling, texture/model compression, and low-end GPU performance
- authentication, application security, rate limiting, and abuse prevention

Only install genuinely useful skills. Do not install a skill just because the name sounds relevant; inspect its purpose, supported tools, maintenance, and instructions first.

---

# Prompt 00 — Master reference prompt (run this first)

**Purpose:** Establish the project as one coherent product, create durable project instructions, and keep all later sessions aligned. This is the master prompt to use again if the coding agent loses context or starts drifting.

**Paste into the Antigravity Agent panel:**

```text
You are the principal engineer, game-rules architect, multiplayer engineer, 3D technical artist, UX lead, test engineer, and release owner for this repository. We are building a browser-first, turn-based, multiplayer 3D digital implementation of Scythe, with a highly polished cinematic presentation, detailed miniature-like pieces, immersive audio, and exceptional first-time-user onboarding.

FIRST: inspect the current repository and environment. Do not assume this is an empty repo, do not overwrite working code, do not install packages blindly, and do not claim that a skill or tool exists until you discover it. Load and read the relevant installed skills using Antigravity’s skill mechanism (manual `/skill-name` invocation where supported, otherwise inspect the discovered `SKILL.md`). Use a planning/exploration agent for read-only discovery where available, and reserve implementation changes for a focused build task.

MASTER REFERENCE FILE
- If `ANTIGRAVITY_SCYTHE_3D_MULTIPLAYER_PROMPT_PACK.md` exists in the repository, read it as the canonical phased build guide before making a plan. The prompt pack's scope, phases, sequence bible, component inventory, and exit gates are requirements unless an approved project decision explicitly changes them.
- If the file is not in the repository, record that fact and ask the project owner to copy it into the repository root or `docs/` before using the detailed phase prompts. You may still complete safe repository discovery, but do not claim to be following the full prompt pack until it is available.
- Execute one phase prompt at a time, in order. Do not try to generate the complete game in a single response. At each phase gate, report actual results and blockers before moving on.

PRODUCT NORTH STAR
- Build the complete agreed scope, not merely a landing page, visual mockup, static map, or single-player demo.
- Start with the base Scythe game and implement expansion/solo/spectator scope only after base-game behavior is validated.
- Support 1–5 player base-game sessions unless the authoritative reference and approved scope explicitly say otherwise.
- Deliver online multiplayer with private rooms/invites, turn ownership, server-authoritative validation, reconnection, durable match state, and safe hidden-information handling.
- Build an isometric 3D board with every in-scope hex, terrain type, river/lake boundary, base, Factory, unit, worker, mech, structure, resource, encounter location, and visual component represented.
- Build the player/faction mat experience, cards, dials, tracks, resources, recruit and structure systems, combat, encounter/objective handling, achievements/stars, final scoring, and end-game behavior.
- Make the art direction cohesive: tactile physical miniatures, painted faction materials, carefully lit terrain, weather and atmosphere, authored camera motion, mechanical movement, cinematic UI transitions, contextual sound design, and a full skip/reduced-motion path.
- Onboarding must teach the game interactively. It must explain the interface, action selection, resources, movement, deployment/upgrades/building/enlisting, encounters, combat, popularity/power, stars, and final scoring without forcing players to read an external manual.

RIGHTS AND ASSET GATE
- Exact reproduction of Scythe-branded illustrations, board artwork, card faces/text, character and mech sculpts, logos, music, sound recordings, and distinctive visual assets may be used only when supplied or authorized by the project owner with appropriate rights. Do not rip assets from a physical copy or an existing digital implementation. Do not scrape asset packs or bypass access controls.
- Create `docs/licensing/rights-register.md` and require provenance/permission status for every asset and content bundle.
- If rights are not proven, keep neutral placeholders and create an original, legally distinct visual/content layer. Keep mechanics/data schemas decoupled from artwork so authorized content can be plugged in later. Do not silently substitute an unlicensed imitation while claiming the app is an exact official product.
- Treat official rules/source materials provided by the owner as the rule authority. Public web content may aid research, but the agent must not invent missing card text, quantities, costs, edge cases, or abilities. Mark unresolved information as an explicit blocker or placeholder.

ENGINEERING NON-NEGOTIABLES
1. Rules engine: pure TypeScript, deterministic state transitions, no React/Three.js dependency, no network side effects.
2. Authority: server validates and commits every move; the browser sends commands and renders confirmed state/events. A client never decides the official outcome.
3. Data: separate public state, player-private state, hidden deck state, and unrevealed simultaneous combat choices. Never broadcast secrets to unauthorized clients.
4. Tests: TDD on rules and domain logic; unit tests, invariants, integration tests, and multi-client E2E tests. Never report a test as passing unless you executed it and observed the result.
5. Presentation: animations consume confirmed domain events. Animation timing must never determine who owns territory, who won combat, what a card does, or the final score.
6. Assets: all models, textures, card images, illustrations, music, and sound effects have stable IDs, source/provenance, license status, variant information, and fallbacks.
7. Resilience: loading, network errors, stale commands, reconnection, refresh, server restarts, missing assets, and reduced WebGL capability must have visible recovery paths.
8. Security: validate commands server-side, authorize room membership and seats, rate-limit abuse, keep secrets on the server, and avoid logging private card/objective choices.
9. Quality: TypeScript strictness, lint, formatting, tests, build checks, and dependency security review are part of the delivery—not optional polish.
10. Workflow: work incrementally in reviewed vertical slices. Preserve existing work. Use plan/spec/tickets before high-risk changes. Run the smallest focused tests, then relevant broader checks.

DEFAULT STACK (verify repository and current docs before selecting versions)
- Web: Next.js or an existing React framework, React, TypeScript, React Three Fiber/Three.js, Drei where useful.
- Motion: GSAP for authored sequences; Three.js animation clips/Mixer for actual model animation. Avoid overlapping animation systems for the same property.
- UI transient state: Zustand or the existing lightweight store. Do not duplicate server-owned game state in an authoritative client store.
- Server: Node.js + TypeScript + Colyseus (or a documented equivalent if the repo already has a good multiplayer solution).
- Data: PostgreSQL for accounts, durable match snapshots and event logs; add Redis only when operationally justified.
- Validation/tests: Zod or equivalent runtime validation, Vitest for domain/rules, Playwright for browser/multi-client E2E.
- Assets: glTF/GLB pipeline with a manifest; compress and lazy-load heavy assets; provide placeholders.
- Deployment: web frontend and persistent WebSocket game server deployed to compatible services, with secrets kept server-side.

PROJECT OPERATING MODEL
- Use root `AGENTS.md` as persistent project guidance because Antigravity recognizes it as workspace instructions; add narrowly scoped `.agents/rules/*.md` files only when useful. Keep skill workflows in `.agents/skills/<skill-name>/SKILL.md` with valid frontmatter. Maintain living documents: `docs/PRODUCT_SPEC.md`, `docs/RULES_MATRIX.md`, `docs/ARCHITECTURE.md`, `docs/ASSET_BIBLE.md`, `docs/CINEMATICS.md`, `docs/AUDIO_BIBLE.md`, `docs/TEST_STRATEGY.md`, `docs/ROADMAP.md`, and `docs/licensing/rights-register.md`.
- Create a traceability system: each rule/component/ability/animation/asset/test has a stable ID and status: `not-started`, `in-progress`, `implemented`, `tested`, `verified`, `blocked`, or `not-in-scope`.
- Every implementation ticket must state prerequisites, acceptance criteria, test coverage, asset needs, and scope exclusions.
- At the end of each task, report what changed, what was executed, actual test/build results, remaining gaps, new risks, and the exact next prompt/ticket.
- Do not stop after scaffolding. Continue through the current prompt's acceptance criteria. If a prompt is too large, break it into small tickets and complete one well-defined slice at a time without inventing completion.

FIRST TASK ONLY
1. Inspect the repository, Antigravity capabilities, installed/discovered skills, and tools.
2. Produce a short current-state audit and proposal; do not start implementing gameplay or cinematic assets yet.
3. Create/update `AGENTS.md` and the project docs listed above with honest TODOs where the repo/source material does not yet answer something.
4. Record the planned architecture, base-game scope, rights status, build/test commands, skill-loading map, work sequence, and risk register.
5. Propose the first small implementation ticket with explicit exit criteria.

Do not ask broad questions that can be resolved by inspecting the repo or available source material. If a required decision cannot be inferred, make a reversible recommendation, document the assumption, and proceed until a real blocker is reached. Never claim the complete game exists after only writing plans.
```

**Exit gate:** `AGENTS.md`, initial project docs, architecture/risk notes, skill-loading plan, and a first implementation ticket exist. No gameplay implementation is falsely claimed at this stage.

---

# Prompt 01 — Repository, skills, toolchain, and working rules

**Skills:** `research`, `codebase-design`, `writing-plans`, `to-spec`, `find-skills`, `setup-pre-commit`, `git-guardrails-claude-code`.

```text
Continue the project from AGENTS.md and the current roadmap. Load the relevant skills before doing work. Audit the repository, runtime versions, package manager, git status, test/lint/build scripts, existing CI, Antigravity workspace configuration and project rules, installed global skills, and available local asset tooling. Do not print secrets or inspect private keys.

Deliver:
1. A repository map showing apps/packages/docs/assets/test fixtures and clear ownership.
2. An environment report: runtime and package versions, scripts that actually work, and missing prerequisites.
3. A skill matrix matching every relevant installed skill to a phase and explaining when to load it. Verify the actual skill exists before listing it as available.
4. A dependency policy: pin compatible versions, avoid unnecessary packages, document why each major dependency is needed, and use official documentation for current APIs.
5. A safe Git workflow: clean ignore rules, `.env.example` without secrets, pre-commit checks where appropriate, conventional branch/commit expectations, and no destructive reset/rebase/clean commands without explicit approval.
6. Add or refine `AGENTS.md` with package manager commands and testing order derived from the real repo. Do not invent commands.
7. Search for additional skills only for identified gaps: Colyseus, Playwright multi-client tests, Blender/glTF, Web Audio, WebGL performance, security. Do not auto-install them; present a recommendation and use existing skills if installation is unavailable.

Do not build features in this task. Finish by running only safe diagnostic commands and report their outputs/status accurately.
```

**Exit gate:** A reproducible environment map exists and the commands in `AGENTS.md` are real.

---

# Prompt 02 — Source-of-truth, rights, and asset provenance

**Skills:** `research`, `grill-with-docs`, `to-spec`, `domain-modeling`.

```text
Establish a strict source-of-truth process before encoding any game rules or creating final visual assets. Read supplied reference files and authorized owner-provided materials first. Use official documentation/source pages only as supplemental evidence, and record URLs and access dates in the project documents.

Create or complete:
- `docs/licensing/rights-register.md`
- `docs/SOURCE_REGISTER.md`
- `docs/ASSET_BIBLE.md`
- `packages/content/README.md`
- `packages/asset-manifest/README.md`

The rights register must track each content domain separately: product name/logo, board artwork, faction marks, character/mech designs, card fronts/backs and text, player/faction mat art/layout, icons, fonts, 3D models, textures, promotional illustrations, music, ambience, sound effects, voice performance, and tutorial copy. For each item record: stable asset/content ID, creator/source, source URL or internal file, acquisition date, rights owner, license/permission status, allowed use, attribution requirement, modification rights, distribution restrictions, and current status.

Use explicit statuses: `approved`, `owner-supplied-awaiting-review`, `placeholder-only`, `original-created`, `license-needed`, `rejected`, `unknown`. Do not turn `unknown` into `approved` by assumption.

Rules/data policy:
- Never invent missing official content values.
- Keep component IDs and rules IDs independent from their art assets.
- For a licensed build, allow approved source data/assets to be attached through a manifest.
- If authorization is missing, use generic placeholder pieces and distinct original art/content; do not reproduce the original board art, card illustrations/text, branded logos, distinctive sculpts, or soundtrack.
- Mark external source claims with direct links and distinguish verified source facts from assumptions.

Produce a blocker list for every content item that prevents exact visual/content parity, plus the minimum owner-provided documents/files needed to clear that blocker. Continue engineering using placeholders when possible. Do not download or import copyrighted assets to fill gaps.
```

**Exit gate:** Every asset/content category has a traceable license status and a placeholder strategy.

---

# Prompt 03 — Exhaustive product and rules specification

**Skills:** `research`, `grill-with-docs`, `grill-me`, `domain-modeling`, `to-spec`, `to-questionnaire`, `writing-plans`, `to-tickets`.

```text
Create the complete base-game product and rules specification before implementing mechanics. Use the authoritative rules reference supplied/approved by the project owner. Consult the official product inventory and official rule materials as permitted. Do not treat a secondary summary as sufficient for edge cases. If the exact rule source is unavailable, mark that rule `blocked-source-needed` rather than guessing.

Update `docs/PRODUCT_SPEC.md` and create `docs/RULES_MATRIX.md`, `docs/COMPONENT_CATALOG.md`, `docs/PLAYER_FLOWS.md`, `docs/OPEN_RULE_QUESTIONS.md`, and tickets in `docs/tickets/` or the repo's existing issue system.

The spec must explicitly cover:
- Base-game player counts, setup sequence, random setup elements, turn order, legal action section selection, and game lifecycle.
- Every faction, its special ability, its four mech abilities, faction mat starting pieces, and all player-mat variability that is verified by the source.
- Map topology: every hex ID, terrain, river/lake boundaries, adjacency, home bases, encounters, tunnels/mines, Factory, and control rules.
- Four resource types, where resources are stored, which actions produce/spend them, who can spend them, and when ownership changes.
- All top-row and bottom-row actions, costs, effects, bonuses, limits, and action order.
- Movement and transport, worker retreats, character encounters, river rules, lakes, mine routes, and faction/mech exceptions.
- Upgrade, deployment, building, enlistment, objective, encounter, Factory-card, power, popularity, combat-card, and structure-bonus behavior.
- Combat submission/reveal timing, eligible combat units, power/card calculations, tie rules, retreat, popularity effects, card draws, and star eligibility.
- All star categories, limits, six-star trigger, end-of-game timing, coin/star/territory/resource scoring, Factory scoring, structure bonus, and tie-breakers.
- Public vs private information; deck order and hidden choices; reconnect and interrupted action behavior.
- All content quantities and component classes from the official inventory. The current official product listing includes a board; player/faction mats; wooden resources and coins; multiplier/encounter/structure-bonus tokens; combat, objective, encounter, Factory, riverwalk, and quick-start cards; power dials; action/popularity/power/star/structure/recruit tokens; mechs, characters, workers, and technology cubes. Verify all exact quantities against the source version selected for this project.

For every rule, assign a stable ID (`RULE-...`) and document:
- Player-facing rule statement in neutral, concise language.
- Source reference (document section/page or official URL and access date).
- Preconditions, state changes, effects, costs, timing, exceptions, and failure cases.
- Visibility (public/private/secret-until-reveal).
- Unit/integration test cases.
- Implementation status and responsible package.

Also write an onboarding learning sequence and define an MVP that remains playable even while final licensed assets are unavailable. Do not implement game code yet; create testable acceptance criteria and small tickets ordered by dependency.
```

**Exit gate:** Every in-scope rule has a source reference or a documented blocker, and all major behaviors have acceptance criteria.

---

# Prompt 04 — Architecture and monorepo foundation

**Skills:** `codebase-design`, `domain-modeling`, `improve-codebase-architecture`, `writing-plans`, `implement-spec`.

```text
Based on the approved spec, make the architecture real in the existing repository. Inspect the current stack before changing it; reuse sound existing infrastructure. If starting from scratch, propose a TypeScript monorepo with:
- `apps/web`: React/Next.js application shell, 3D scene, overlays, audio, tutorial.
- `apps/game-server`: authoritative Node.js multiplayer server and room lifecycle.
- `packages/domain`: identifiers, enums, types, invariants, public/private state types.
- `packages/rules`: pure deterministic rules/state transitions.
- `packages/protocol`: client commands, server events, validators, versioning.
- `packages/content`: approved, data-driven rule content and card/deck manifests.
- `packages/asset-manifest`: model, texture, audio, UI-asset IDs and provenance.
- `packages/ui`: design tokens and reusable UI primitives where sharing is useful.
- `packages/test-fixtures`: canonical setup states and scenario builders.
- `docs/`: specs, architecture decisions, source register, asset bible, cinematics, audio and test plans.

Implement only the foundation required for later phases. Use compatible, maintained package versions and confirm APIs using current official docs. Set strict TypeScript, lint/format, unit test configuration, type checking, build scripts, path aliases, `.env.example`, sane ignores, and CI as appropriate. Do not add authentication/database/cloud dependencies before the plan calls for them.

Create `docs/ARCHITECTURE.md` and short ADRs for consequential decisions: app framework, renderer, animation division of responsibilities, game server framework, database, event sourcing/replay policy, assets pipeline, and deployment split. Clarify package boundaries and prohibit imports from `rules` into React, Three.js, or network modules.

Run install, typecheck, lint, test, and build only if commands have been set up and are safe. Fix problems caused by this task; document environmental failures accurately. Avoid speculative abstractions and avoid building a generic game engine unrelated to the specification.
```

**Exit gate:** The repo builds, types, lints, and tests a minimal placeholder package; architecture boundaries are documented.

---

# Prompt 05 — Domain model, state machine, commands, and events

**Skills:** `domain-modeling`, `tdd`, `implement-spec`, `code-review`.

```text
Implement the core domain model without a renderer or multiplayer networking dependency. Follow `docs/RULES_MATRIX.md` exactly. Keep names and structures clear rather than compressing everything into an untyped JSON blob.

Model at minimum:
- Match lifecycle: lobby, setup, active turn, pending simultaneous decision/combat, ending, completed, abandoned.
- Match ID, rules/content version, state version, turn number, active seat, turn history, RNG seed/state or recorded random outcomes, timestamped domain events.
- Player seat, player ID, connection state, faction, player mat, private hand/objectives, public coins/power/popularity, star placements.
- Hex IDs, terrain, neighbors, river/lake edges, home base, Factory marker, encounter availability, tunnel links.
- Units: character, worker, mech with owner, location, state and legal capabilities.
- Resources on territories, structures, recruits, technology cubes, action token, and all progress tracks.
- Player-mat sections, top/bottom actions, cost symbols, reward symbols, upgrade slots, recruit bonuses and faction/mech unlocks.
- Cards/decks/discard piles with deck order hidden; Factory cards; combat submissions private until reveal.
- Derived territory control, legal actions, achievement eligibility, match end, and score breakdown.

Use stable discriminated unions for commands and events. Define commands separately from events. Commands express player intent, e.g. choose section, move units, produce, trade, bolster, upgrade, deploy mech, build, enlist, submit encounter choice, choose Factory card, submit combat dial/card selection, and acknowledge tutorial steps. Domain events express confirmed results, e.g. resources produced/spent, unit moved, workers retreated, card revealed, power spent, combat resolved, star placed, game ended.

Rules requirements:
- Implement a pure function boundary: `validateCommand(state, playerContext, command)` and `applyCommand(state, validatedCommand, deterministicContext)` or equivalent.
- Invalid commands must return typed errors and leave the input state unchanged.
- Avoid mutating caller-owned state; deep freeze/immutable test fixtures where practical.
- Make random draws reproducible and testable without exposing future random state to clients.
- Keep UI selection and animations out of authoritative domain state unless the rules require it.
- Derive territory ownership, legal actions and scores from canonical state. Do not maintain duplicated counters that can drift unless justified and invariant-tested.

Write tests for schema invariants, invalid command no-op guarantees, reducer determinism, event ordering, and public/private projection boundaries. Update architecture docs with state ownership and command-to-event flow.
```

**Exit gate:** Domain objects are typed, deterministic, testable, and independent of the frontend.

---

# Prompt 06 — Setup, board graph, terrain, and initial state

**Skills:** `domain-modeling`, `implement-spec`, `tdd`, `research`.

```text
Implement the exact base-game setup and board topology from the authorized rule sources and verified content manifest. Do not hand-wave board geometry or generate a random layout if the published board is fixed. Keep the board data independent from its 3D representation.

Tasks:
1. Create a canonical board data file with stable hex IDs, logical axial/offset coordinates, terrain, neighbor relationships, river/lake boundary data, special spaces, encounter-token locations, home-base placements, Factory position, and tunnel/mine routing metadata where relevant.
2. Create setup procedures for the supported player count, mat combinations, player order, starting pieces, resources, coins, power, popularity, initial workers and character positions, cards/decks, structure bonus tile, and other setup randomness. Each detail must trace to a source rule or authorized setup data.
3. Keep seeded randomness injectable for deterministic tests. Random choices must be server-side and replayable.
4. Validate the map: all hex references exist; neighbor relationships are reciprocal where appropriate; edges are not accidentally traversable across rivers; special spaces are within the board; starting units and pieces have valid ownership/location; no duplicate IDs exist.
5. Create fixture builders for 1–5 player starts and focused edge cases without duplicating production setup logic.
6. Add setup snapshots that tests can compare to hand-verified expected values.
7. Do not yet create 3D models; expose geometry-neutral board data that a renderer will consume later.

Tests must cover each supported player count, each faction's starting data, all player-mat assignment constraints, deterministic seeded setup, map connectivity, invalid terrain/boundary references, and total piece accounting.
```

**Exit gate:** All supported starting states are deterministic and validated; the map graph has no unexplained topology.

---

# Prompt 07 — Turn loop and top-row actions

**Skills:** `tdd`, `implement-spec`, `domain-modeling`, `systematic-debugging`.

```text
Implement the turn engine and the four top-row actions using the approved rules matrix. Build action logic in the pure rules package and add rule-ID comments/references for subtle timing rules.

Implement:
- Start/advance turn, active-player identity, prior section tracking, optional action omission if permitted, and player-mat section selection constraints.
- Move top-row coin option where printed on the assigned mat.
- Produce: eligible territories, worker counts, production costs, resource placement, worker production, Mill behavior if it applies, and any production-capacity rules verified by the source.
- Trade: correct cost, resource choice and placement, popularity option, ownership constraints, action limits and bonuses.
- Bolster: correct cost and choice between power/card, power cap, combat card draw from the correct deck, and bonuses.
- Proper ordering: choose one section, top action before bottom action; if top-row effects provide resources needed by the bottom row, they must be spendable in that same turn when the rules permit.
- Correct exception handling for factions/abilities that alter section selection.

Every command must include actor, match/state version or idempotency token, target parameters, and validated preconditions where relevant. Do not let clients submit a claimed result such as “I gained 3 metal”; they submit the action and the server computes the effect.

Add tests for each mat/action cost variant, insufficient coins/resources, empty/full maps, invalid territory targets, action order, repeated-section restrictions, ownership, action omission, and action errors leaving the state unchanged. Test every affected recruit/structure bonus once the related content is available; mark any waiting integration test explicitly.
```

**Exit gate:** The turn loop and all four top-row actions are complete and independently tested.

---

# Prompt 08 — Bottom-row actions and engine building

**Skills:** `implement-spec`, `tdd`, `domain-modeling`, `code-review`.

```text
Implement all four bottom-row actions against the exact printed/authorized mat configuration and faction state: Upgrade, Deploy, Build, and Enlist. Costs, eligibility, rewards, and mat-space transitions must come from content data, never be hardcoded in UI components.

UPGRADE
- Select a valid technology cube from an eligible benefit location and move it to a permitted empty cost location.
- Recalculate exposed benefits and reduced costs from the authoritative mat layout.
- Prevent moving a cube into a forbidden/occupied slot; do not create a new cube.
- Track the upgrade-star condition exactly.

DEPLOY
- Verify metal cost, an available mech, placement on a legal territory with an eligible friendly worker, and faction-specific unlock mapping.
- Deploy one mech, remove it from the mat reserve, assign stable ID/location/owner, and unlock the exact ability associated with that mech.
- Track the all-mechs star condition.

BUILD
- Verify wood cost, structure availability, eligible territory, one-structure-per-territory rule, and placement legality.
- Implement each of the four structure effects from the rule source: their own ongoing effect, Mill production semantics, Mine routing semantics, and ownership interactions if a structure's territory is taken.
- Track the all-structures star condition.

ENLIST
- Verify food cost, available recruit and mat slot, then take the appropriate recruit token and apply the correct immediate reward and ongoing bonus.
- Implement recruit bonuses as typed effects, including who may receive a neighbor bonus and when.
- Track the all-recruits star condition.

General:
- All bottom actions use the current player-mat configuration, so upgrades and recruit placement can change future costs/bonuses without rewriting the rules engine.
- Keep every effect deterministic, logged, and testable.
- Do not infer exact mat layout or reward symbols from memory. Load verified source content; if unavailable, use a labelled test fixture and block parity certification for that mat.

Tests must include costs, insufficient resources, availability limits, placement restrictions, exact mat-slot transitions, immediate and repeated recruit rewards, structure abilities, and star eligibility. Assert both the state changes and emitted domain events.
```

**Exit gate:** Engine-building actions work for every verified mat configuration and every deployed asset is traceable.

---

# Prompt 09 — Movement, territory control, factions, and mech abilities

**Skills:** `domain-modeling`, `tdd`, `implement-spec`, `systematic-debugging`.

```text
Implement movement and territory control as a rules subsystem. All movement legality must use graph topology and explicit faction/mech abilities—not visual coordinates, model colliders, or front-end assumptions.

Implement and test:
- Unit eligibility, action movement limits, one-step/extended movement effects, and multiple-unit movement exactly as specified.
- Hex adjacency and impassable river/lake edge checks.
- Mech transport of the correct number/types of workers/resources and restrictions for character movement.
- Tunnel/mine routes and faction-specific movement/crossing permissions.
- Encounter-trigger rules for the character, encounter-token removal timing, and stop conditions.
- Entering spaces containing friendly units, enemy workers, enemy character/mechs, structures, resources, or special locations.
- Worker retreat, worker return location, unit movement termination, popularity effects, territory and resource control after the move/combat, and any mech ability that changes these consequences.
- Control of a territory by units and the verified structure-control rules; ensure structures retain/lose control effects exactly as the rules state.
- All five base factions' core abilities and four mech abilities each, using approved content data and stable ability IDs.
- Special cases where faction abilities override a general rule. Apply explicit, tested precedence rather than scattered `if factionName` checks in UI code.

Prefer a typed movement/ability rules registry over a monolithic function. Each ability entry must include description/source, trigger, preconditions, effect, order/priority, whether the effect is public, and associated tests.

Add table-driven tests for every faction and mech ability, river/lake crossings, mines/tunnels, transporting workers/resources, encounter stops, forced worker retreat, control changes, and invalid paths. Add property tests for “no unit can end a standard move on an illegal tile” and “each resource has one authoritative location/owner context.”
```

**Exit gate:** All base-game movement and ability exceptions are covered by explicit tests.

---

# Prompt 10 — Cards, encounters, objectives, Factory, and content registry

**Skills:** `domain-modeling`, `implement-spec`, `tdd`, `research`, `code-review`.

```text
Implement the data-driven card/content systems. This includes combat cards, objective cards, encounter cards, Factory cards, setup/reference cards as applicable to the UI, and structure bonus tiles. Exact card text/effects/art may be added only from approved owner-supplied or licensed content. Do not copy card text from random websites or invent replacements while labeling them official.

Build typed content schemas and validators for:
- stable ID, content category, rules/source reference, effect definition, timing, cost, visibility, locale, artwork ID, license status, and retired/version status;
- deck composition, shuffle/draw/discard cycles, deck exhaustion rules, and reproducible randomization;
- encounter option availability, payment, choice constraints, immediate effects, and faction exceptions;
- objectives and completion predicates, allowed reveal timing, star eligibility, and secrecy;
- Factory-card selection and the extra action section, including the special selection and turn-restriction interactions verified by the rules;
- combat card value and any eligibility/hand limits;
- the structure-bonus tile and final scoring interaction.

Add source-schema validation and a content build report. The build must fail in strict licensed-fidelity mode when an in-scope official content item is missing, duplicated, uses an invalid effect type, or has unresolved rights. In prototype mode, neutral placeholder entries may be allowed but must be visibly marked and must not masquerade as official assets/text.

Keep card contents that are private from other players on the server. Send only public reveal events or the requesting player's private hand projection. Do not send deck order.

Tests: draw/discard/recycle, deterministic shuffle, card exhaustion, hidden information, invalid options, effects/costs, objective completion timing, Factory choice availability, and tile bonus scoring.
```

**Exit gate:** Content is schema-validated, versioned, traceable, and hidden information is enforced.

---

# Prompt 11 — Combat, stars, end-game, and scoring

**Skills:** `implement-spec`, `tdd`, `domain-modeling`, `systematic-debugging`, `code-review`.

```text
Implement combat and final scoring according to the authoritative source. Treat timing and secret submission as first-class states, not modal-only UI behavior.

COMBAT FLOW
- Detect when a move creates combat and create a server-side combat instance with an immutable participant/unit snapshot.
- Accept each participant's secret power dial and eligible combat card choices privately.
- Do not reveal one player's choice to another before the rules permit simultaneous reveal.
- Validate power limits, available power, card hand, number/eligibility of combat units, and card-count limits.
- Resolve attacker/defender totals and tie-breaking according to the source. Compute power expenditure, cards used, winner, retreats, resource/territory control, worker-related popularity effects, eligible combat star, and card draw/retreat effects.
- Send one confirmed public combat result plus each player's permitted private data. Persist a safe audit event without leaking secret pre-reveal submissions.
- Handle disconnects and abandoned combat submissions with a documented rules-consistent policy. Do not invent a default timeout outcome without marking the rule/policy distinction.

STARS AND END GAME
- Implement every standard achievement category, one-time eligibility, category-specific limits, and all verified faction exceptions.
- Place each star only once per eligible achievement and preserve it if the underlying track later decreases where that is how the rule works.
- End the game immediately at the rule-defined sixth-star event, at the correct point in the command/event sequence. Do not allow later actions from the same turn if the official game should already be over.
- Compute final coin total from cash, stars, territories, resource pairs, Factory's special territory value, structure-bonus tile, and all documented scoring modifiers.
- Implement popularity scoring tiers and all tie-breakers from the source. Return an explainable score breakdown, not just a single total.
- Keep score computation as a pure function over canonical final state.

Tests must cover attacker wins ties, zero-power battles, maximum legal dial/card combinations, insufficient power, combat card limits, multiple units, private submission/reveal, forced retreats, popularity loss/prevention ability, combat-star caps, other star categories, the sixth-star stop timing, Factory scoring, paired/unpaired resources, all popularity tiers, structure-bonus tile, and each tie-breaker. Use hand-calculated fixture scenarios with a documented expected result.
```

**Exit gate:** Combat and scoring pass focused tests, and a completed match produces a traceable score breakdown.

---

# Prompt 12 — Rules test harness and parity checklist

**Skills:** `tdd`, `test-driven-development`, `verification-before-completion`, `systematic-debugging`, `code-review`.

```text
Create a rigorous automated rules-verification harness. Do not add new gameplay features in this task unless required to fix a verified failure.

Deliver:
1. Table-driven rule tests keyed to `RULE-*` IDs and expected source references.
2. Setup fixtures for every supported player count, all base factions, and relevant player-mat variants.
3. Invariant/property tests: resource conservation where required, unique stable IDs, valid ownership/location, legal state transitions, action cost correctness, star uniqueness/limits, no spending resources not controlled, match ending at correct time, no hidden data in public projection, deterministic replay.
4. Scenario tests for common full turns: top action only, bottom action only where legal, both actions, action unavailable, cost gained from top action and spent below, movement triggering encounter, movement triggering combat, and move causing control change.
5. Full-game scripted tests reaching each star category and end-game scoring tier.
6. Content manifest tests: expected component counts, duplicate IDs, missing assets/content, invalid effects, provenance and rights status.
7. Mutation/negative tests showing illegal client commands are rejected without changing state.
8. A rules parity matrix showing pass/fail/blocked per rule, ability, content item, and scoring rule.

Use Vitest or the existing test stack. Keep tests deterministic and fast. Add a separate slower “full match” test command if needed. Do not lower assertions or skip a failing case to force a green build. If a source ambiguity blocks an expected value, mark it blocked and capture the exact missing evidence.

At the end, execute the focused suite, full suite, typecheck, lint, and production build where configured. Report actual commands and outcomes. Do not state “100% complete” if any rows are blocked or untested.
```

**Exit gate:** The implementation has measurable, honest rules coverage and a repeatable regression suite.

---

# Prompt 13 — Authoritative multiplayer server

**Skills:** `domain-modeling`, `implement-spec`, `tdd`, `codebase-design`, `systematic-debugging`.

```text
Build the real multiplayer layer around the rules engine. Prefer the planned Colyseus architecture if it fits the repo and current stable docs; verify all API details against official documentation. Do not fake multiplayer with localStorage, BroadcastChannel, optimistic local state, or mock room IDs.

Requirements:
- One authoritative server room owns canonical game state and validates every command using `packages/rules`.
- The client sends intent/commands; it never submits claimed resource balances, movement outcomes, combat winners, star counts, or scores.
- Use runtime schemas for every inbound command and outbound message. Reject malformed, stale, unauthorized, duplicated, or out-of-turn commands.
- Add command IDs/idempotency where a retry could otherwise perform the same action twice.
- Use a monotonic state/revision number and safe stale-command handling.
- Separate public state projections from per-player private state. No hidden objective, secret hand, deck order, or unsubmitted combat choice may leak through state sync, logs, debug endpoints, error messages, or replay payloads.
- For combat, hold each submission privately and reveal according to official rules only when the state machine says it is time.
- Validate player identity against server session and room seat; never trust a player ID sent in an action payload.
- Broadcast typed, sanitized domain events for animation, plus state patches as needed. Events must have stable IDs and sequence numbers.
- Support join, leave, resume, spectator permission if in scope, session token validation, graceful room close, and room cleanup.
- Add server-side structured logs without secrets. Avoid logging private card/objective contents or raw authentication tokens.

Write integration tests using multiple actual clients or a test transport. Test that one client cannot move another player's unit, call actions out of turn, forge power/resources, see private cards, submit combat for another player, or replay the same command to duplicate effects.

Document the network protocol, authoritative state ownership, public/private projection, error catalogue, reconnection contract, and expected latency/retry behavior in `docs/ARCHITECTURE.md`.
```

**Exit gate:** Two independent clients play a real stateful match through the server and cannot forge an illegal move.

---

# Prompt 14 — Accounts, lobby, invites, persistence, and reconnect

**Skills:** `implement-spec`, `codebase-design`, `tdd`, `web-design-guidelines`, `verification-before-completion`.

```text
Implement the product flow around matches. Inspect existing auth and data infrastructure first; do not introduce a second identity system unnecessarily.

LOBBY/FLOW
- Landing/menu with Play, Join with code, How to Play, Settings, Rules Reference, Credits, and Account/Guest options as appropriate.
- Create private room, join by short room code or invite URL, copy invite link, room capacity and status, player seats, faction selection, player-mat selection where allowed, readiness, host controls, start requirements, and clear waiting states.
- Prevent seat duplication and unauthorized join/start/kick operations. Do not expose another player's private settings or secrets.
- Handle room full, invalid/expired invite, host disconnect, server unavailable, conflicting seat, and match already started with understandable errors.

PERSISTENCE
- Add PostgreSQL only following the approved ADR. Persist users/guest identities as appropriate, match metadata, game snapshots, event history/replay records, rules/content version, timestamps, and safe configuration.
- Store only the private data each user should be entitled to access; use proper authorization on every read.
- Implement periodic snapshots and append-only action/event history if selected in the ADR. Add schema migrations, indexes, connection pooling, transaction handling, and retention limits.
- Ensure restart/reconnect restores the correct state without duplicating the last command.
- Handle a reconnect during a turn, private selection, submitted combat, and end-game modal.

SECURITY
- Protect invite endpoints, room capacity, session tokens, guest identity assumptions, rate limits, and ownership checks.
- Never put secrets in `NEXT_PUBLIC_*` or client bundles.
- Do not add tracking/analytics by default. If added, document consent and data retention.

Tests: invite lifecycle, room capacity, concurrent seat claims, host leaving, bad tokens, unauthorized snapshot reads, reconnect in every match phase, duplicate command retry, server restart resume, and private state restoration.
```

**Exit gate:** Players can create/join a private room and resume an interrupted match without corrupting state.

---

# Prompt 15 — Product UI, visual design system, and responsive shell

**Skills:** `design-taste-frontend`, `design-system`, `ui-ux-pro-max`, `ui-styling`, `impeccable`, `build-awwwards-quality-sites`, `web-design-guidelines`, `vercel-react-best-practices`.

```text
Design and implement a premium, tactile, readable interface around the actual game state. Study the installed UI/visual skills before changing code. Do not copy Scythe's proprietary art or exact screen layouts unless authorized; preserve only approved licensed assets. If unlicensed, create a distinctive original interface and placeholder treatment.

Art direction target: an elegant alternate-history tabletop brought to life—painted miniature silhouettes, enamel/wood/aged-metal materials, restrained industrial detail, atmospheric landscape, warm directional lights, clear faction color coding, deliberate depth and typography. Avoid generic admin-dashboard styling, neon cyberpunk defaults, excessive glass panels, tiny labels, and over-animated every-click effects.

Create design tokens for color, elevation, spacing, type scale, border/radius, motion durations/easing, focus rings, shadows, and state colors. Maintain readable contrast and do not rely on hue alone to communicate ownership or error.

Main shells and screens:
- Landing/menu with striking but performant hero scene, immediate play/continue actions, accessible navigation and settings.
- New game and join game flows.
- Match lobby with seats, faction and player-mat previews, invite/copy, ready/start, network status.
- Game screen: 3D board as primary canvas; persistent turn/action panel; player/faction mat; resource bank; power/popularity; star progress; player roster; action log; help; sound/camera/settings controls.
- Modal/panel patterns for move selection, resource choice, upgrade slot, deploy mech, build structure, enlist recruit, encounter choice, Factory card, secret objective, simultaneous combat commitment/reveal, game-end score breakdown, reconnect/error state.
- Rules reference/glossary that is searchable and linked to current action explanations.
- Settings: music/SFX/ambience sliders, mute, subtitles/captions for authored dialogue, reduced motion, camera sensitivity, quality preset, color/contrast/accessibility options.

UX behavior:
- Every button reflects actual server-authorized legal actions. Disable illegal actions with a clear reason rather than silently failing.
- Do not hide important rules in hover-only tooltips. Add help text for touch and keyboard.
- Use optimistic UI only for reversible visual previews; commit official game state only after server confirmation.
- Show player’s current turn, action token/section restriction, costs and after-action outcomes before confirmation.
- Make 3D selection states and 2D action panels stay in sync.
- Build responsive desktop/tablet layouts. On narrow screens use a compact camera/UI layout, not a compressed unreadable full desktop panel. If mobile WebGL cannot support the full experience, show a clear supported-device message or a lightweight board fallback.

Use seeded screenshot fixtures and component tests for the main screen states. Provide loading/skeleton, no asset, disconnected, failed join, player’s turn, waiting for opponent, combat pending, game ended, and reduced-motion states.
```

**Exit gate:** The product shell and all major UI states are understandable, responsive, and connected to real game state.

---

# Prompt 16 — 3D board, hex coordinates, camera, and scene composition

**Skills:** `threejs`, `webgl-3d-object`, `build-awwwards-quality-sites`, `design-taste-frontend`, `gsap-performance`.

```text
Implement the world scene from the geometry-neutral board data already in the rules package. Use React Three Fiber/Three.js and the currently documented APIs. Do not place rules in meshes or infer board adjacency from raycast hits. Picked objects must resolve to stable domain IDs.

BOARD
- Render every in-scope hex using stable logical coordinates. Calculate world positions through one tested hex-to-world conversion utility.
- Render terrain variants based on the approved asset/theme registry: forest, farm, mountain, tundra, village and any special spaces required by the source. Use asset slots so licensed artwork/models can replace placeholders without altering logic.
- Rivers and lakes must visually represent the same non-traversable boundaries used by the rules. Use edge geometry/decals and avoid visual gaps that imply a legal path where no path exists.
- Render home bases, the Factory, encounters, mines/tunnels and structure placement clearly. Selection/highlight affordances must not obscure important board features.
- Add resource tokens, workers, characters, mechs, structures and controlled-territory feedback as child scene objects referencing domain IDs.
- Use matching faction palette, material properties, decal/emblem slots and lighting according to the rights-approved art bible. Without approved assets, use original placeholder palettes instead of unlicensed copies.

CAMERA/CONTROLS
- Orthographic/isometric strategy camera as default; smooth pan, zoom, rotate only if helpful and consistent, focus-on-unit, focus-on-conflict, return-to-board, and reset view.
- Clamp camera bounds to the map and prevent nausea-inducing motion. Make the initial camera composition beautiful but leave the whole play area navigable.
- Raycast selection must work on hexes and pieces with clear priority rules. Add hover outline/halo, valid move destinations, illegal boundary feedback, and reachable/selected states.
- UI overlays must not be occluded by 3D depth. Camera focus and UI selection must remain synchronized across mouse, touch, and keyboard.

LIGHTING/ATMOSPHERE
- Carefully composed key/fill/rim lighting, soft shadows, ambient occlusion only where performance allows, atmospheric fog with restrained distance, subtle wind/snow/steam particles as optional quality layers.
- Real-world materials should feel tactile but never destroy color readability. Keep piece silhouettes recognizable at tabletop scale.
- Avoid heavy post-processing by default. Add quality tiers and a WebGL fallback/loading/error state.

PERFORMANCE
- Instancing/batching for repeated resources/workers where useful; LOD, texture/model compression, frustum culling, lazy-loaded GLBs, shared materials, and explicit disposal of scene resources.
- No leaking animation loops or event handlers after unmount. Pause nonessential effects when the tab is hidden.
- Measure on representative devices. Record frame-time/render statistics and tune with evidence rather than guessing.

Write tests for coordinate mapping, neighbor-to-world distance, edge placement, picking-to-domain-ID mapping, and river/lake visualization. Do not fabricate or alter board topology to fit the art.
```

**Exit gate:** The full playable board renders consistently with the rules graph and supports precise selection.

---

# Prompt 17 — Characters, mechs, workers, structures, and component asset pipeline

**Skills:** `threejs`, `webgl-3d-object`, `design-system`, `research`, `code-review`.

```text
Create the complete 3D component pipeline and component registry. Each domain component must have a visual representation, but the first pass may use clear blockout meshes while approved/authorized final assets are pending. Never label placeholder geometry as the official miniature. Do not scrape, extract or trace proprietary miniatures, logos or illustrations.

ASSET PIPELINE
- Define a stable manifest schema containing asset ID, type, role, local path/URL, file format, dimensions/scale, pivot/origin, orientation, LOD levels, texture maps/materials, animation clips, thumbnail, attribution, license status, creator, source, checksum/version, load priority, and placeholder fallback.
- Support GLB/glTF for models; use approved textures and audio formats. Create model loading, fallback, caching, cancellation, error reporting and disposal utilities.
- Establish Blender-to-glTF import/export guidance if Blender is available. Validate model scale, normals, UVs, material slots, pivots, skeletons, animations and texture sizes. Do not assume Blender exists; verify tooling and write setup instructions if absent.
- Keep model paths and material/color assignment data-driven. A new approved model must not require rewriting game rules or core UI.

COMPONENT CLASSES TO REPRESENT
1. Character miniatures: one per base faction, with approved silhouette/material/animation if rights permit; separate identity from visual asset path.
2. Mechs: four per faction in the base game, each with its own identity/ability binding; ensure the correct faction palette and variant mapping.
3. Workers: faction-colored pieces, many repeated instances, readable at common camera distance.
4. Structures: monument, mill, mine and armory represented as distinct pieces; model scale and footprint must not block unit selection.
5. Resources: wood, metal, food and oil; use a distinct shape/material per resource and readable quantity stacking.
6. Coins, multiplier tokens, encounter tokens, star tokens, structure tokens, recruit tokens, action/popularity/power markers and technology cubes.
7. Power dials and player/faction mats may be high-resolution UI objects rather than full 3D, while remaining visually consistent with the component set.
8. Card backs/faces and tiles use approved assets or non-infringing placeholders.
9. Special board objects: Factory, home bases, mines/tunnel markers, encounter locations, terrain dressing and board-edge decoration.

VISUAL DETAIL
- Use physically plausible scale, beveled edges, painted/enameled finishes, mild wear, controlled roughness/metalness, believable contact shadows and recognizable silhouettes.
- Use faction colors as accessible tokens: color plus emblem/pattern/name, never hue alone.
- Keep all pieces readable in strategic camera mode; detailed inspection can use a focus camera or larger piece preview.
- Provide idle/selection/hover/placed/moved/retreating/disabled visual states where relevant.
- Resource counts must remain readable when stacks overlap. Use deterministic spacing/stacking and selected-piece elevation/outline.

ANIMATION READINESS
- Create a standard animation interface for idle, walk/move, deploy/land, construction, reaction, combat-ready, victory, retreat and inspection where a rig/asset supports those clips.
- For static/placeholder models, use subtle procedural transforms only as a temporary fallback and document limitations. Do not attempt complex skeletal animation on unrigged meshes.
- Use distinct animation IDs and ensure all animated properties can be disabled or reduced.

Build an asset coverage report for every component category, count, variant and status. The report must separate “registry entry exists,” “placeholder renders,” “approved production asset loaded,” and “visually reviewed.”
```

**Exit gate:** Every base-game component category is represented in the registry and rendered with an explicit status.

---

# Prompt 18 — Mats, cards, tracks, tokens, resource UI, and interactions

**Skills:** `design-taste-frontend`, `design-system`, `ui-ux-pro-max`, `ui-styling`, `implement-spec`, `web-design-guidelines`.

```text
Implement the complete screen-space game interface using data from the authoritative state and component/content registries. Treat legibility as a core gameplay requirement. Reproduce exact licensed mats/cards only if the approved rights register permits it; otherwise create distinct original panels that convey the same functional information without copying proprietary composition/artwork/text.

PLAYER MAT
- Show all four action sections with top-row action, bottom-row action, visible costs, rewards, upgrades, action token position, and disabled/available status.
- Keep technology cubes visible and draggable/clickable only into legal slots. Show why a slot is not legal. Support keyboard selection as well as pointer input.
- Show recruit availability and current placement, immediate reward, ongoing bonus and who can receive neighbor bonuses.

FACTION MAT
- Show faction ability text sourced from approved rules content, all four mech ability slots, available/deployed mech state, character, workers, structures, recruits, technology cubes and star spaces.
- Provide a larger accessible inspection view so small mat text is never the only place to read a rule.

RESOURCE BANK / TRACKS
- Display coins, wood, metal, food, oil, power and popularity with value, change animation and accessible label.
- Show resources on the territory where they are stored when that affects ownership/spending. A global summary is informative only and must not imply the player can spend resources they do not control.
- Display star track categories, the six-star game-ending threshold, and legal remaining categories.
- Show objective cards privately only to their owner; reveal information only when game rules allow it.

CARD/CHOICE PANELS
- Combat cards, objectives, encounters, Factory cards and structure-bonus tile should have expandable inspection panels, clear selection, cost/reward preview, confirmation where needed, and source IDs for debugging.
- Exact artwork/text is rights-gated. Add placeholders with visible development treatment when exact licensed content is not present.
- Never expose an opponent’s hand, hidden objective, deck order or unsubmitted combat choice in the DOM, network payload, or accessible tree.

FEEDBACK
- Before committing a consequential action, show the expected resource cost and state changes. Do not simulate a guaranteed result before the server confirms it.
- Use concise, contextual explanations and “Why unavailable?” details on disabled actions.
- Add undo only if the official rules/transaction model allow it; otherwise show a clear confirmation step.
- Keep the action log ordered and derived from confirmed server events, with filters such as movement, economy, combat and achievements.

TESTS: all mat states, narrow viewport, high zoom, keyboard-only interactions, hidden/private UI, cost previews, disabled reasons, server rejection messages, and consistent labels between UI and rules content.
```

**Exit gate:** Players can understand and submit every legal action without relying on unrendered debug controls.

---

# Prompt 19 — Event-driven animation system

**Skills:** `threejs`, `cinematic-gsap-lenis-motion-system`, `gsap-core`, `gsap-react`, `gsap-timeline`, `gsap-performance`, `gsap-utils`.

```text
Implement the animation architecture after rules and multiplayer are functioning. Animations must be a presentation subscriber to authoritative event IDs. Never calculate game outcomes inside a GSAP timeline or Three.js callback.

ARCHITECTURE
- Create an animation/event router mapping domain event types to animation recipes.
- Ensure idempotency: the same event replay/reconnect cannot animate or apply the visual move twice incorrectly.
- Separate critical state synchronization from decorative animation. The rendered scene must converge to canonical server state even when an animation is skipped, interrupted or fails.
- Use GSAP for scripted camera/UI timelines; use GLTF animation clips/Three.js AnimationMixer for skeletal model motion; use small CSS transitions for ordinary UI. Do not let two systems simultaneously animate the same transform.
- Add an event queue with priority, cancellation, duration caps, conflict rules, “fast mode,” skip-all, reduced-motion fallback, tab-hidden behavior and recovery from a dropped asset.
- All timelines must clean up contexts/listeners on unmount and avoid stale closures.

ANIMATION RECIPES
- `unit.move`: brief highlight, lift, interpolate across hex path, align to destination, settle and emit visual-completion only; server state already determines location.
- `worker.retreat`: highlight affected workers, move them to home base, fade/settle, show popularity effect if the server event says so.
- `resource.produced`: short spawn/stack animation on the correct hex with count update.
- `resource.spent`: move tokens toward the mat/action panel and update count on confirmation.
- `mech.deploy`: faction-mat slot highlight, deployment camera attention, approved deploy animation/steam/landing, confirmation pulse.
- `structure.build`: preview ghost, legal placement outline, construction effect, final placement.
- `upgrade`: camera/panel focus on the cube, cube slide to its new slot, benefit/cost rows update.
- `recruit.enlist`: recruit moves into slot; immediate reward shown separately from ongoing-bonus indicator.
- `encounter.open`: character focus, card/panel transition, optional audio sting, then wait for actual choice.
- `combat`: conflict focus, both sides highlighted, reveal sequence only after server says both choices are committed, dial/card display, clear result, retreat/victory and territory-control feedback.
- `star.placed`: track pulse, star animation into the valid slot, short achievement accent; if this is star six, transition immediately to game-end after the correct rules event.
- `factory.claimed`: camera focus on Factory/card, card reveal, transition to available action section.
- `game.ended`: stop legal input, resolve in-flight visuals to canonical state, transition into final score breakdown.

Use duration/easing tokens and respect reduced-motion/fast mode. Avoid lengthy camera flights during ordinary turns. Write testable mapping coverage for every public domain event and a fallback for unrecognized event types.
```

**Exit gate:** All event-driven visuals can be skipped and cannot alter gameplay state.

---

# Prompt 20 — Every cinematic sequence and transition

**Skills:** `cinematic-gsap-lenis-motion-system`, `cinematic-scroll-storytelling`, `gsap-timeline`, `gsap-react`, `gsap-performance`, `design-taste-frontend`, `threejs`.

```text
Create the production cinematic system and implement the sequences below as explicit, documented, skippable timelines. Read the installed cinematic and motion skills first. Use approved/licensed assets for an exact branded version; otherwise use original environmental design and placeholder assets. Do not use unlicensed game illustrations or soundtrack.

Build `docs/CINEMATICS.md` and a machine-readable cinematic registry. Every sequence needs: ID, purpose, trigger, camera path, keyframes/timing, focus targets, UI state, lighting/particle cues, sound cue IDs, captions, interruption/skip behavior, reduced-motion equivalent, loading dependencies, and QA scenarios.

SEQUENCE A — APP BOOT / LOADING REVEAL (5–10 seconds, skippable)
1. Fade from neutral background to a softly lit tabletop/landscape silhouette.
2. Resolve fog/atmosphere into the playable world; camera eases to the menu framing.
3. Title/menu UI appears without blocking input after the transition.
4. Show progress only when actual asset loading is occurring; never use a fake progress bar.
5. On load failure, replace animation with a useful error/retry state.

SEQUENCE B — MAIN MENU IDLE WORLD (looping ambient, no forced motion)
- Slow, nearly imperceptible camera drift or environmental movement; occasional steam/wind/ambient movement only when performance permits.
- Never move menu controls or cause motion sickness. Stop expensive ambience in background tabs.

SEQUENCE C — CREATE/JOIN MATCH
- Transition camera to the board/lobby staging view; seat/faction information enters in a clear order.
- Invite code and readiness controls stay stable and copyable during transitions.
- A newly connected player gets a brief arrival cue but no disruptive full-screen effect during another player's turn.

SEQUENCE D — FACTION SELECTION INTRO (3–6 seconds per selection; skippable)
- Camera focuses on a neutral miniature pedestal or board seat.
- Show faction color, approved emblem/label, character/mech preview, starting-position marker and special-ability summary.
- Allow the player to rotate/inspect the model freely; cinematic auto-rotation pauses on interaction.
- Do not invent stats or ability copy. Pull text from the verified content registry.
- Confirm selection with a concise settle animation; avoid theatrically re-running every time the selection changes by one click.

SEQUENCE E — MATCH OPENING / WORLD ESTABLISHER (12–20 seconds, skippable)
Proposed beat sheet:
1. 0–3s: low, wide environmental establishing shot—mountain/forest/industrial landmarks, subdued wind and distant machinery.
2. 3–6s: camera rises/orbits enough to reveal the hex-board geometry and faction home bases.
3. 6–10s: brief close passes over the Factory and resource terrains; use approved assets only.
4. 10–14s: reveal each player's faction seat/miniature in a consistent order; optional name plate.
5. 14–17s: pull back to the playable strategy camera and highlight the active player.
6. 17–20s: show the first action hint and return full control.
The world must remain the real board layout. The cinematic must not relocate pieces or invent scenery that misrepresents legal movement.

SEQUENCE F — TURN START (1–2 seconds, mostly UI-level)
- Highlight the active player and active turn marker, update the action panel, play a restrained audio cue.
- No full camera move that delays every turn. The player can disable turn-start flourishes.

SEQUENCE G — TOP-ROW ACTIONS
- Move: highlight selectable units and legal destinations; preview route and crossed boundaries; move miniatures along confirmed route.
- Produce: briefly light eligible territories and pop produced workers/resources into deterministic token stacks.
- Trade: animate acquired resource tokens into their legal territory or show popularity rising on the track.
- Bolster: show power marker/dial movement or draw/flip the authorized combat card; no random fake card reveal.
Each sequence should usually be under 1.5 seconds and not hold input longer than needed.

SEQUENCE H — BOTTOM-ROW ACTIONS
- Upgrade: focus the mat slot and slide the technology cube; update reduced cost and uncovered benefit together.
- Deploy mech: camera attention from mat to placement, approved model arrives/settles, ability slot unlock is indicated.
- Build structure: preview placement, construction cue, final structure and map/mat state update.
- Enlist recruit: token enters slot; immediate reward is shown once and ongoing bonus is labelled as persistent.
Use server-confirmed data only; a failed command triggers a clear correction, not a successful-looking animation.

SEQUENCE I — ENCOUNTER
1. Character enters encounter territory and stops.
2. Camera gently focuses character and token, without hiding neighboring hexes.
3. Encounter panel/card opens with readable choice text and cost/reward previews.
4. User selects an option; the client submits the choice.
5. On server confirmation, show only the confirmed results and close/return to board.
6. If the response is rejected, keep the choice panel open and explain why.

SEQUENCE J — FACTORY CLAIM
- Use a brief camera focus on Factory, reveal the selected card only to the entitled player at the correct timing, then show the new action-section UI.
- Avoid revealing unavailable cards to opponents if the rules or game design treat the selection as private until chosen.
- Retreat camera to strategic view.

SEQUENCE K — COMBAT COMMIT / REVEAL / RESOLUTION
1. Combat begins: outline territory and participants; use a restrained tension cue.
2. Each side sees its own private power dial/card submission UI. Do not reveal opponent choices before the state machine authorizes the reveal.
3. Show waiting status without exposing secret totals.
4. When all required players have submitted, transition to a short simultaneous reveal: dial, card values, computed total.
5. Highlight the winner according to confirmed server result.
6. Animate loser retreat to the correct location, settle territory control and resources, update popularity/power/cards/stars.
7. Show one concise result banner; let player return to the board immediately.
8. If a player disconnects or the reveal fails to load, the confirmed state and result remain accessible without the cinematic.

SEQUENCE L — STAR / MILESTONE
- A star moves to the correct category slot, track receives a short pulse, optional one-line label explains the achievement.
- If the star causes the game to end, do not animate additional turns or allow more actions. Transition directly to Sequence N.

SEQUENCE M — LOW-FREQUENCY MAP MILESTONES
- First Factory visit, last mech deployed, last structure built, final recruit, popularity threshold, and other approved milestones can trigger short optional focus moments.
- Do not produce a cinematic for every token change. Avoid alert fatigue and repetitive forced camera movement.

SEQUENCE N — GAME END / FINAL SCORE (8–15 seconds optional intro, immediately skippable)
1. Stop action input and settle scene objects to canonical final state.
2. Pull back to a clear full-board view and show every player's final positions.
3. Reveal score breakdown in a staged but non-obscuring way: existing coins, stars, controlled territories, Factory contribution, paired resources, popularity tier, structure bonus, total.
4. Show the winner only after the authoritative score function returns.
5. Provide “View full breakdown”, “Review match”, “Rematch”, and “Main menu” actions as allowed.
6. Avoid misleading rank transitions while score arithmetic is still being calculated; score is deterministic and should be available immediately.

SEQUENCE O — REMATCH / RETURN TO MENU
- Smoothly preserve the player’s choice and room context where valid. Show clear confirmation before destroying an active match.

SEQUENCE P — FIRST-TIME TUTORIAL MOTION
- Show valid tile highlights, short camera focus, panel annotation, and one action at a time. Keep user input in control; do not autoplay long movement sequences that obscure how the action works.

GLOBAL MOTION RULES
- All sequences can be skipped; gameplay-critical information has a static equivalent.
- Reduced-motion disables rapid pans/zooms, camera shake, forced orbit, flashing and nonessential particle bursts.
- A “Fast animations” setting shortens all noncritical animation durations.
- Keyboard focus must not be lost during cinematic transitions.
- Use measured performance; no sequence should load a huge asset synchronously without a fallback.
- Every timeline has cleanup, cancellation, idempotency and test coverage.

Implement the cinematic registry, shared timeline helpers, reduced-motion adapters, per-sequence integration tests, and debug controls to replay a sequence in a local development build. Do not build every sequence in one giant timeline; compose small named timelines.
```

**Exit gate:** Every sequence has a registry entry, trigger, reduced-motion path, skip behavior, and a playable implementation or explicitly blocked asset need.

---

# Prompt 21 — Music, ambience, sound effects, and audio settings

**Skills:** `research`, `design-system`, `implement-spec`, `verification-before-completion`.

```text
Build a rights-safe, layered audio system. Do not copy music or sound from the commercial game, soundtrack, trailer, online video, or another digital adaptation. Use original recordings/compositions, an approved licensed library, or silent placeholders with provenance until cleared.

Create `docs/AUDIO_BIBLE.md` and a machine-readable `audio-manifest.json`. Every cue needs: stable ID, category, file/stream path, source/creator, license status, loop status, duration, loudness notes, sample rate/format, spatialization, mix bus, triggering event, priority, cooldown, and fallback behavior.

AUDIO LAYERS
1. Master bus.
2. Music bus: menu, lobby, active gameplay, combat tension, game end/results. Seamless or gently crossfaded transitions, not abrupt cuts.
3. Ambience bus: wind, distant machinery, forest/wildlife/terrain atmosphere, low mechanical hum. Keep it subtle and non-distracting.
4. UI bus: hover/selection/confirm/cancel/notification.
5. Gameplay SFX bus: resource produced/spent, worker movement, mech deployment/movement, structure build, upgrade, enlist, encounter reveal, Factory selection, combat reveal/retreat, star placement, game end.
6. Voice/caption bus only if rights-cleared dialogue is used.

IMPLEMENTATION
- Use Web Audio API or an existing verified audio library. Handle browser autoplay restrictions: initialize/resume audio only after a user gesture and expose a clear muted/start state.
- Add separate master/music/ambience/SFX/voice sliders, global mute, per-category mute, persistent user settings, and a test-audio control.
- Support reduced-motion without unexpectedly muting important audio; support a “quiet mode” that reduces ambience and nonessential accents.
- Prevent repeated cue spam with event IDs, coalescing, cooldowns and priority. Do not play an SFX twice after reconnect or replayed event.
- Use positional audio sparingly for 3D events, with a clear non-positional equivalent for accessibility and mobile/headphone behavior.
- Normalize loudness to avoid sudden painful volume jumps; fade buses on scene changes; stop unused audio and release resources.
- Keep audio non-authoritative: it never decides action timing or state.
- Add captions/text labels for spoken tutorial cues and never require hearing a sound to understand a rules consequence.

Test browser autoplay block, muted state, settings persistence, transition crossfade, duplicate event handling, missing audio asset, reconnect, tab sleep/resume, and audio context disposal. Unlicensed cue IDs must use silence or a development placeholder and remain visibly blocked in the provenance report.
```

**Exit gate:** All audio routes through a single controllable system, each cue is rights-cleared or a labelled placeholder, and mute works everywhere.

---

# Prompt 22 — Onboarding, tutorial campaign, and in-context teaching

**Skills:** `teach`, `design-taste-frontend`, `ui-ux-pro-max`, `implement-spec`, `tdd`.

```text
Implement an onboarding system that teaches a first-time player by doing, not by displaying a wall of text. Do not invent rules or tutorial rewards. All tutorial actions must go through the same rules engine and server protocol as normal play. Tutorial guidance may highlight an action but must never secretly perform a legal move for the user unless the user explicitly chose a demo/replay.

Create `docs/ONBOARDING.md` with goals, lesson graph, unlock/skip rules, accessibility behavior, source references, and test scenarios. Implement these lessons as separate interruptible steps:

LESSON 0 — LOOK AROUND
- Camera orbit/pan/zoom basics; identify hexes, terrain, rivers/lakes, home base, Factory, player color, units/resources and the current player.
- Explain selection, hover information, valid/invalid destinations, camera reset and how to skip the guided tour.

LESSON 1 — THE TURN SYSTEM
- Explain the action token and four player-mat sections.
- Demonstrate selecting a section and reading top-row/bottom-row costs/rewards.
- Explain the restriction on repeating a section unless the selected faction's verified exception permits it.

LESSON 2 — RESOURCES AND PRODUCTION
- Select a territory, inspect its workers/resources, run a legal Produce or Trade action, and show how resource tokens are stored on the board.
- Explain wood, metal, food and oil through their verified uses, without overloading the learner with every advanced exception at once.

LESSON 3 — MOVE AND EXPLORE
- Select a unit and preview a legal move; identify river/lake restrictions, character encounter behavior, mech transport, and control of a territory.
- Show illegal moves with a reason and an example of a legal alternative.

LESSON 4 — BUILD YOUR ENGINE
- Teach Upgrade, Deploy, Build and Enlist with a single guided example for each action, using neutral demo resources as allowed in the tutorial fixture.
- Explain immediate reward versus ongoing recruit benefit and faction/mech ability unlocks.

LESSON 5 — POWER, POPULARITY, AND CARDS
- Explain what power is, what popularity changes, how combat cards are private, and why power is not the same thing as coins or victory points.

LESSON 6 — ENCOUNTER AND FACTORY
- Explain the character-only encounter trigger, choosing options and costs, then Factory card selection and its extra action section.

LESSON 7 — COMBAT PRACTICE
- Use a scripted tutorial fixture with two clients or a controlled AI/tutorial opponent. Show simultaneous secret commitment, reveal timing, arithmetic, tie rule, retreat, territory control and the consequences for resources/popularity.
- Do not show the opponent's hidden choice before the reveal step.

LESSON 8 — STARS AND FINAL SCORING
- Demonstrate achievement categories, how the sixth star ends the game, popularity tiers, scoring of stars/territories/resource pairs/Factory/structure bonus, and tie-breakers.
- Use a transparent score breakdown and let the learner compare different outcomes.

LESSON 9 — REAL MATCH CHECKLIST
- Ask the learner to complete a short sequence in an actual test match. The tutorial should verify actions through server-confirmed events, not through checkbox clicks.
- Offer “Continue guided”, “Practice freely”, “Rules reference”, and “Skip tutorial”.

SYSTEM REQUIREMENTS
- Tutorial state stores only progress/preferences; the game rules remain authoritative.
- The user can exit/re-enter safely; checkpoints are saved without putting a tutorial-only hidden action into a normal match.
- Tooltips are concise, context-sensitive, keyboard navigable, touch compatible, and dismissible.
- Provide “why is this disabled?” help and link it to the relevant rule ID.
- Add captions/text equivalents for audio and an accessible non-cinematic route.
- Avoid patronizing copy; explain purpose, cost, result, and one useful strategic reason.

Tests must ensure every lesson can be skipped, resumed, completed with keyboard, completed with reduced motion, and safely interrupted by a server error. Test that tutorial helpers cannot bypass legal action validation.
```

**Exit gate:** A new player can learn the full action loop and basic win condition through a real, skippable guided flow.

---

# Prompt 23 — Accessibility, reduced motion, performance, and polish

**Skills:** `web-design-guidelines`, `vercel-react-best-practices`, `vercel-optimize`, `gsap-performance`, `threejs`, `verification-before-completion`.

```text
Run a dedicated accessibility, performance, and resilience pass. Do not trade away rules readability for cinematic spectacle.

ACCESSIBILITY
- Keyboard operation for menus, action selection, cards, combat choices, settings, modal close/confirm and camera controls.
- Visible focus, logical tab order, semantic labels, appropriate roles, correct dialog focus trapping/restoration and screen-reader announcement of state changes without overwhelming speech.
- Contrast-compliant text, scalable font sizing, clear selected/disabled/invalid states, color-plus-symbol/faction labels, reduced motion, subtitles/captions, and configurable animation speed.
- Avoid flashing, intense screen shake, rapid forced zoom, and motion that can cause disorientation.
- Do not require 3D visual inspection for rules-critical text; duplicate necessary information in accessible panels.

PERFORMANCE
- Profile scene rendering, CPU state updates, network patches, asset loading and memory use separately.
- Establish desktop/tablet/mobile quality presets with documented target devices. Use measured frame-time budgets; do not claim a universal FPS guarantee.
- Optimize model/texture size, reuse materials, instancing, LOD, lazy loading, texture compression, shadow complexity, draw calls, particles, post-processing and audio decoding.
- Ensure board state updates only change affected visuals rather than remounting the whole scene.
- Dispose GPU/Audio resources and detach listeners reliably. Test repeated menu→match→menu cycles for leaks.
- Pause or reduce background effects when tab hidden or CPU/GPU constrained.
- Provide loading progress based on real tasks, offline/network error feedback, asset fallback and a graceful unsupported-WebGL state.

POLISH
- Check framing, clipping, z-fighting, shadow flicker, text scale, overlapping tokens, confusing highlights, and camera focus after every event type.
- Keep normal gameplay animations short; reserve full camera sequences for optional milestones/onboarding.
- Add sound and motion toggles from the main game screen.
- Make visual quality robust if a model, texture, font or sound file is missing.

Run automated axe/accessibility scans if available and perform a documented keyboard-only/manual review. Use browser profiling tools on representative hardware. Capture before/after figures and document the machine/browser. Never invent performance measurements.
```

**Exit gate:** Accessibility and performance findings are tracked and critical gameplay/UI issues are fixed.

---

# Prompt 24 — Multiplayer E2E, security, and fault-injection testing

**Skills:** `tdd`, `verification-before-completion`, `systematic-debugging`, `code-review`, `diagnosing-bugs`.

```text
Create end-to-end tests that prove the entire product works with multiple independent browser clients and an authoritative server. Use Playwright or the current approved E2E stack; inspect current official docs and available skills before setup.

MULTI-CLIENT FLOWS
- Player A creates a room; Player B joins via invite code; both see the same lobby; one selects/locks a faction/seat; ready/start restrictions are enforced.
- Both clients see the same public board after setup, while each only sees their own private hand/objective and permitted private combat submission.
- Execute legal action(s) and confirm both views converge to the same state version/event sequence.
- Attempt out-of-turn, invalid-cost, illegal-movement, fake-resource, other-player-unit, forged-player-ID, stale-version and duplicate-ID commands; each must be rejected with no state mutation.
- Simulate combat: each client submits secret choices; verify the other client cannot inspect the first choice until authorized reveal; then verify the same result and correct animation/state on both clients.
- Refresh browser, disconnect/reconnect, server restart where the test environment permits, and reconnect in lobby, normal turn, encounter choice, pending combat and game-end state.
- Complete a scripted short match through the sixth-star condition and verify final scoring and match read-only behavior.

FAULT INJECTION
- Delay, duplicate, reorder where transport permits, or drop messages; reload one client during an animation; block a model/audio request; reject a server command; time out an invite; fill a room; disconnect host; simulate stale state version.
- Confirm UI recovers to canonical server state and never commits a visual result that was rejected.

SECURITY/PRIVACY
- Assert no secret objectives, private hands, deck order, pre-reveal combat choice, auth token, or hidden server-only fields appear in another client's API/network data, browser storage, telemetry, or HTML.
- Check server-side authorization on join, action submission, snapshot/replay retrieval and room control.
- Verify rate limits/input bounds for command spam and malformed payloads. Do not use real production credentials in tests.

VISUAL/ACCESSIBILITY
- Capture screenshots for lobby, game board, each action panel, combat pending/reveal, encounter, Factory, tutorial, reconnect error, results breakdown and reduced-motion mode.
- Keep snapshot assertions focused on regressions, not brittle pixel identity across different platforms.

Add test run instructions and a test matrix to `docs/TEST_STRATEGY.md`. Run the suite and fix root causes; do not silence flaky tests by adding arbitrary waits when a state/event-based wait is possible.
```

**Exit gate:** The multiplayer test matrix demonstrates convergence, privacy, reconnect and complete game flow.

---

# Prompt 25 — Deployment, CI/CD, operations, and release engineering

**Skills:** `deploy-to-vercel`, `vercel-cli-with-tokens`, `vercel-optimize`, `setup-pre-commit`, `finishing-a-development-branch`, `verification-before-completion`.

```text
Prepare reproducible staging and production deployment. Inspect the actual hosting/runtime situation first. Do not expose tokens, commit secrets, or deploy to a paid/public target without explicit owner approval.

DELIVERY
- CI checks: install from lockfile, format/lint, typecheck, unit tests, rule parity test, build, asset manifest validation, and selected E2E tests.
- Build separate deploy instructions for web app and persistent multiplayer server if the hosting requirements differ. Confirm WebSocket support, process lifetime, health checks and graceful shutdown for the chosen server host.
- Configure PostgreSQL connection, migrations, backup/restore policy, environment separation, connection pooling, and secret storage. Add Redis only if chosen by a documented scaling requirement.
- Use `.env.example` with placeholder values, never production credentials. Validate required env vars at startup and fail with actionable messages.
- Configure HTTPS/WSS, origins/CORS, CSP and relevant security headers, rate limits, session expiry, logs, health endpoints and database availability checks.
- Support versioned rules/content manifests. A room should record the version it started with so a later deployment cannot silently alter an active match's rule interpretation.
- Provide a rollback plan and a data migration policy. Do not apply destructive migrations automatically without a safe backup and approval.

OBSERVABILITY
- Add structured logs with match/room IDs and correlation IDs while redacting private content/tokens.
- Basic health/readiness endpoints and metrics for active rooms, disconnects, failed commands, command latency, reconnect frequency, room errors and persistence failures.
- Set error boundaries and user-facing messages for frontend failures, WebGL creation failures and network loss.
- Include operating instructions: install, dev, test, build, migrate, deploy, rollback, backup and restore.

If using Vercel for the web frontend, verify that it fits the selected frontend and hosting model. Do not assume the persistent game server should run as a short-lived serverless function. Choose a compatible persistent host for the multiplayer runtime and document why.

Run CI locally if practical. State clearly which deployments were performed, which remain pending approval, and which checks were actually run.
```

**Exit gate:** A clean environment can reproduce the build and deploy the web/server/database stack using documented secrets and steps.

---

# Prompt 26 — Final completeness audit and release gate

**Skills:** `verification-before-completion`, `code-review`, `research`, `grill-with-docs`, `finishing-a-development-branch`, `retro`.

```text
Perform a strict final audit against `docs/PRODUCT_SPEC.md`, `docs/RULES_MATRIX.md`, `docs/COMPONENT_CATALOG.md`, `docs/ASSET_BIBLE.md`, `docs/CINEMATICS.md`, `docs/AUDIO_BIBLE.md`, `docs/ONBOARDING.md`, and `docs/TEST_STRATEGY.md`.

Do not implement a new large feature during the audit unless necessary to fix a confirmed release blocker. Produce:
1. Rules completeness report by RULE ID, source reference, implementation file, test, and status.
2. Component completeness report by type, expected quantity/scope, stable ID, placeholder/production asset, rights status, visual verification, and status.
3. Card/content completeness report with source, manifest schema validation, effect tests, art rights and hidden-information handling.
4. Character/mech/worker/structure/terrain report including model loading, variants, animation availability, performance fallback and visual review.
5. Multiplayer report: room/lobby, invite, turn authority, command validation, private state, reconnect, persistence, replay/versioning, and E2E results.
6. Cinematic coverage report for every sequence A–P, including trigger, skip, reduced-motion, missing-asset fallback, audio, and tests.
7. Audio report for every cue/category, rights status, loading failure, autoplay behavior, sliders/mute, accessibility text/captions, and reconnect dedupe.
8. Accessibility/performance/security report with actual observed findings and machine/browser details.
9. Build/deploy/recovery checklist and unresolved incidents.
10. A prioritized blocker list (P0/P1/P2) with exact reproducible steps and tickets.

Run verification commands in the repo. Read actual command output and fix errors where safe. Do not claim a test, screenshot review, deployment, rights clearance, or manual playtest occurred unless it did. Do not call the game “exact” or “complete” while official content/rights, rule sources, components, tests or assets remain blocked.

Finish with a precise go/no-go recommendation. Separate “code complete,” “rules parity verified,” “assets rights-cleared,” “multiplayer verified,” and “production-ready”; these are different claims.
```

**Exit gate:** A truthful, traceable go/no-go report exists; no critical gap is hidden by a broad completion claim.

---

# Prompt 27 — Optional expansion, solo, replay, and spectator work

**Skills:** `to-spec`, `domain-modeling`, `implement-spec`, `tdd`, `verification-before-completion`.

```text
Only start this task after Prompt 26 reports that the agreed base-game scope is stable. Extend the architecture modularly and define a separate spec, license/content register, tests and feature flags for each optional module.

Potential modules:
- Authorized expansion factions and their abilities/components.
- Airships/resolution modules or other approved expansion mechanics.
- Campaign progression and persistent unlocks, if the target expansion's rights and scope permit.
- Solo Automa opponent, based on the approved solo rule source and card/state behavior.
- Spectator seats with strictly read-only public state and no access to hidden decks, objectives, hands or combat submissions.
- Match replay with event-log versioning, scrubber, camera replay timeline, and safe redaction of private decisions when sharing.
- Custom lobbies, rematch settings, local tutorial AI, accessibility improvements and localization.

For each module, document dependency, rights requirement, gameplay/content IDs, server-authority changes, migration/version policy, acceptance tests and performance impact. Do not quietly mix expansion content into the base-game rules or alter base-game behavior. Add regression tests that run the original base rules unchanged.
```

**Exit gate:** Optional modules are independently specified, rights-cleared, versioned and unable to regress base-game parity.

---

# Asset/component inventory checklist

Use this as an initial inventory based on the official base-game product listing. Validate all quantities and scope against the exact edition and authorized rulebook/files selected for the project before marking any row verified. Quantities are product inventory, not a claim that every token must be separately rendered at maximum 3D detail.

| Component category | Official listing quantity | Implementation requirement |
|---|---:|---|
| Main game board | 1 | Fixed topology dataset plus 3D board scene; separate rules geometry from art. |
| Player mats | 5 | Data-driven mat layout, action rows, costs/rewards, upgrade/recruit spaces; licensed exact visuals only with rights. |
| Faction mats | 5 | Starting components, faction identity, abilities, available/deployed piece state. |
| Wooden resource tokens | 80 | Four resource types; exact distribution verified from authorized reference. |
| Coin tokens | 80 | Physical display token/stack plus canonical numeric balance. |
| Multiplier tokens | 12 | Token model/icon and valid use as defined by reference. |
| Encounter tokens | 12 | Map position, availability, removal/trigger state and visual representation. |
| Structure-bonus tiles | 6 | One active scenario tile plus tile catalog/data as rules require. |
| Combat cards | 42 | Validated deck, card IDs/effects, private hands, discard/draw, approved art/content. |
| Objective cards | 23 | Secret assignment, completion predicates, owner-only view, reveal and star timing. |
| Encounter cards | 28 | Choice options/cost/effects, hidden deck order, approved content. |
| Factory cards | 12 | Selection pool, extra action section, correct visibility and timing. |
| Power dials | 2 | Simultaneous combat choice UI and valid power limits; not necessarily 3D. |
| Riverwalk cards | 5 | Setup/reference UI where applicable; verify exact purpose from selected rule edition. |
| Quick-start cards | 5 | Optional in-app quick reference/onboarding content with rights status. |
| Action tokens | 5 | One per player, controls current section selection and rendered mat marker. |
| Popularity tokens | 5 | Track marker and numeric state per player. |
| Power tokens | 5 | Track marker and numeric state per player. |
| Star tokens | 36 | Achievement category, owner and placement tracking; game-end trigger at correct point. |
| Structure tokens | 20 | Four structure types per faction/owner as authorized content determines. |
| Recruit tokens | 20 | Recruit identities, slot placement, immediate rewards and ongoing bonuses. |
| Mech miniatures | 20 | Four per base faction; distinct IDs/ability mapping, movement/transport/combat. |
| Character miniatures | 5 | One per base faction; movement, encounters, combat and Factory selection. |
| Workers | 48 | Worker ownership/location, production and retreat; instanced rendering where possible. |
| Technology cubes | 36 | Upgrade state on player mat and reduced cost/uncovered benefit computation. |

## Additional logical objects that must be modelled even if not separately listed as physical inventory

- Coins in a numeric canonical state and any multiplier accounting.
- Four resource types and each resource token's map location.
- Player seats, turn order, active-player token, faction/player-mat pairing.
- Home bases, terrain types, river/lake boundaries, Factory, encounters, tunnel/mine relationships.
- Structures' persistent owner, territory control, unit occupancy and resource ownership.
- Public/private card projections, deck order, discard piles, secret objectives and private simultaneous choices.
- Combat instance, participant snapshots, secret choices, revealed result, retreats and resource/control updates.
- Stars and achievement eligibility, popularity and power tracks, game lifecycle and final score breakdown.
- Lobby invitations, presence, ready state, network status, reconnection token and saved match version.
- Tutorial progress/preferences, accessibility/audio settings and cinematic playback/skip state.

## Suggested manifest fields

```ts
export type ContentStatus =
  | "not-started"
  | "in-progress"
  | "implemented"
  | "tested"
  | "verified"
  | "blocked"
  | "not-in-scope";

export type RightsStatus =
  | "approved"
  | "owner-supplied-awaiting-review"
  | "placeholder-only"
  | "original-created"
  | "license-needed"
  | "rejected"
  | "unknown";

export interface ComponentManifestEntry {
  id: string;
  kind: string;
  quantity: number | "per-player" | "variable";
  rulesIds: string[];
  sourceReference: string;
  modelAssetId?: string;
  uiAssetId?: string;
  audioCueIds?: string[];
  rightsStatus: RightsStatus;
  implementationStatus: ContentStatus;
  visualReviewStatus: ContentStatus;
  testIds: string[];
  notes?: string;
}
```

---

# Cinematic sequence bible

This checklist is the acceptance-test version of the cinematic specification. It is not permission to use the original commercial game's artwork or soundtrack.

| ID | Sequence | Trigger | Required behavior | Skip/reduced-motion equivalent |
|---|---|---|---|---|
| CIN-BOOT | App boot | App launch | Real loading state, world/menu resolve, retry path | Static menu and progress/error status |
| CIN-MENU-IDLE | Menu idle world | Menu visible | Subtle environment, no input obstruction | Static background |
| CIN-ROOM | Lobby transition | Create/join room | Seats, invite/ready status reveal | Immediate stable lobby UI |
| CIN-FACTION | Faction intro | Hover/select faction | Model/seat focus and verified ability summary | Static preview/info panel |
| CIN-OPEN | Match opening | Match successfully starts | Establishing view then playable board | One short fade to board |
| CIN-TURN | Turn start | Server says turn changes | Active player/action indicator | Immediate marker update |
| CIN-MOVE | Unit movement | Confirmed unit-move event | Route, move, settle, ownership cue | Snap to authoritative position |
| CIN-PRODUCE | Production | Confirmed production event | Resource/worker generation | Count update only |
| CIN-TRADE | Trade | Confirmed trade event | Resource/popularity feedback | Static result banner |
| CIN-BOLSTER | Bolster | Confirmed bolster event | Power/card feedback | Static result update |
| CIN-UPGRADE | Upgrade | Confirmed cube movement | Cube movement and new costs/rewards | Mat state jumps to final state |
| CIN-DEPLOY | Mech deploy | Confirmed deployment | Mat-to-board visual, unlock ability | Piece appears in final position |
| CIN-BUILD | Build | Confirmed structure placement | Placement/construction | Structure appears immediately |
| CIN-ENLIST | Enlist | Confirmed enlistment | Recruit placement + reward/bonus distinction | Static mat update |
| CIN-ENCOUNTER | Encounter | Character encounter triggered | Open options, costs, chosen result | Immediate choice panel |
| CIN-FACTORY | Factory claim | Confirmed Factory selection | Reveal card and extra action affordance | Card/action section shown statically |
| CIN-COMBAT | Combat | Valid combat instance | Hidden simultaneous choice, authorized reveal, result/retreat | Static choice/result panels |
| CIN-STAR | Star placed | Confirmed achievement | Star placement, category explanation | Static marker/label update |
| CIN-MILESTONE | Major milestone | Approved milestone event | Brief optional highlight | Non-animated notification |
| CIN-END | Game end | Server end event | Final board and verified score breakdown | Direct results screen |
| CIN-REMATCH | Rematch/menu | Player chooses next step | Clear transition with state confirmation | Direct navigation |
| CIN-TUTORIAL | Guided lesson | Tutorial step starts | Highlight relevant UI/object, one learning goal | Static tooltip/step card |

## Cinematic QA checklist

Every sequence must verify:

- It fires only on the correct authoritative event/state.
- A duplicate event or reconnect does not duplicate irreversible visual effects.
- Skip works at every point and immediately restores usable UI.
- Reduced-motion mode removes forced pans/zooms and unnecessary particles.
- Fast mode shortens but does not remove rules-critical feedback.
- Missing model, texture, voice or SFX never blocks a turn.
- Keyboard focus, active dialog and screen-reader status remain correct.
- No animation can reveal hidden information early.
- No animation can change rule state.
- Camera returns to a playable framing and does not leave the active unit off-screen.
- It is profiled on representative devices and can be switched off if it harms performance.

---

# Recommended repository shape

Adapt to the existing repo rather than forcing a rewrite. This is a target, not a mandate to duplicate packages already present.

```text
.
├── AGENTS.md
├── .agents/
│   ├── rules/                            # optional scoped Antigravity rules
│   └── skills/                           # optional project-specific skills
├── GEMINI.md                             # optional additional project guidance
├── package.json / workspace config
├── apps/
│   ├── web/
│   │   ├── app/                        # menus, lobby, game shell
│   │   ├── components/                 # overlays and interface
│   │   ├── game-scene/                 # React Three Fiber scene
│   │   ├── animations/                 # event-driven timelines
│   │   ├── audio/                      # audio context, buses, cues
│   │   └── onboarding/                 # tutorial lessons
│   └── game-server/
│       ├── rooms/                      # match/lobby room lifecycle
│       ├── auth/
│       ├── persistence/
│       ├── protocol/
│       └── observability/
├── packages/
│   ├── domain/
│   ├── rules/
│   ├── protocol/
│   ├── content/
│   ├── asset-manifest/
│   ├── ui/
│   └── test-fixtures/
├── public/
│   ├── models/                         # approved/original GLB files
│   ├── textures/
│   ├── images/
│   ├── audio/
│   └── fonts/
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── RULES_MATRIX.md
│   ├── COMPONENT_CATALOG.md
│   ├── ARCHITECTURE.md
│   ├── ASSET_BIBLE.md
│   ├── CINEMATICS.md
│   ├── AUDIO_BIBLE.md
│   ├── ONBOARDING.md
│   ├── TEST_STRATEGY.md
│   ├── ROADMAP.md
│   ├── SOURCE_REGISTER.md
│   ├── OPEN_RULE_QUESTIONS.md
│   ├── tickets/
│   └── licensing/
│       └── rights-register.md
└── e2e/                                # browser/multi-client flows
```

---

# Reference links

Use current official documentation, and record the version/access date in project docs when an API or rule is relied on.

- Official Scythe product page and published component inventory: https://store.stonemaiergames.com/products/scythe
- Official Scythe site: https://scytheboardgame.com/
- U.S. Copyright Office guidance on games and copyright: https://www.copyright.gov/register/tx-games.html
- Antigravity IDE overview: https://antigravity.google/docs/ide/overview/
- Antigravity rules and `AGENTS.md`: https://antigravity.google/docs/rules/
- Antigravity skills: https://antigravity.google/docs/skills?app=antigravity-ide
- Antigravity IDE workflows notice: https://www.antigravity.google/docs/ide/workflows/
- Three.js documentation: https://threejs.org/docs/
- React Three Fiber documentation: https://r3f.docs.pmnd.rs/
- Colyseus documentation: https://docs.colyseus.io/
- Colyseus state synchronization: https://docs.colyseus.io/state
- Vitest: https://vitest.dev/guide/
- Playwright: https://playwright.dev/docs/intro
- PostgreSQL documentation: https://www.postgresql.org/docs/

---

## Last instruction to the Antigravity agent

When this entire prompt pack is present in the repository, treat it as the long-term implementation guide, not as a claim that the work is done. Work sequentially, maintain traceability, validate sources, preserve rights boundaries, and implement a truly playable complete product rather than a cinematic shell. At every milestone, distinguish what is implemented, what is tested, what is verified against the source, what is visually reviewed, and what remains blocked.
