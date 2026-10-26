# @scythe/web

Browser-first client application for Scythe 3D Multiplayer.

## Responsibilities
- Next.js 14+ application shell (App Router)
- React Three Fiber (R3F) + Three.js 3D isometric board and miniature rendering
- GSAP-driven cinematic camera choreographies and UI timelines
- Zustand client-side transient UI store (modal state, camera angle, local preferences)
- Web Audio API layered soundscape (ambience, UI, SFX)
- Interactive onboarding tutorial campaign

## Non-Negotiables
- **No authoritative game logic**: Never calculates combat outcomes, resource production, or scores on the client.
- **Event-driven**: All board updates and animations consume confirmed domain events from `apps/game-server`.
- **Privacy enforcement**: Renders only public state and the authenticated user's private projection.
