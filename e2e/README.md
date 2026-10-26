# e2e

Playwright multi-client end-to-end integration and security test suite for Scythe 3D.

## Responsibilities

- Multi-client room join, seat claim, and game start verification
- Real WebSocket synchronization across independent browser contexts
- Private data leakage prevention assertions (inspecting network frames and DOM)
- Turn ownership and illegal command rejection tests
- Simultaneous secret combat submission and authorized reveal verification
- Reconnection and network fault tolerance tests

## Non-Negotiables

- **Real clients**: Runs against a real Colyseus server process and rendered web app.
- **Privacy verification**: Explicitly tests that Player B's browser never receives Player A's hidden objectives or uncommitted combat power.
