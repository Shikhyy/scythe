# @scythe/protocol

Network message definitions, serialization schemas, and Zod runtime validators for Scythe 3D.

## Responsibilities

- Zod schemas for all inbound client commands (action requests, seat claims, combat commits)
- Outbound server event payload schemas and state diff message structures
- Monotonic sequence numbering and idempotency key specifications
- Error code catalog and user-facing error descriptions

## Non-Negotiables

- **Runtime validation**: Every inbound message must be parsed and verified by Zod before reaching room handlers.
- **Backwards compatibility**: Semantic versioning for protocol schemas.
