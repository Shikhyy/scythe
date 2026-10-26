# @scythe/game-server

Authoritative multiplayer game server for Scythe 3D.

## Responsibilities

- Colyseus room management (`LobbyRoom`, `MatchRoom`)
- Authoritative command execution via `packages/rules`
- Monotonic state revisions and state patch broadcasting
- Strict per-seat private data projection (secret hands, hidden objectives, pre-reveal combat bids)
- Room lifecycle, reconnection tokens, session preservation, and timeouts
- PostgreSQL persistence for match snapshots, event journals, and accounts

## Non-Negotiables

- **Strict authority**: Client intent is validated before applying any state change.
- **Data privacy**: Opponent secret cards, hidden deck order, and uncommitted combat choices are never serialized into public state patches.
