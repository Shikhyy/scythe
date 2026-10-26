import { z } from "zod";

/** Zod schema for a generic client→server command envelope */
export const ClientCommandEnvelopeSchema = z.object({
  protocolVersion: z.string(),
  matchId: z.string().min(1),
  actorSeatId: z.string().min(1),
  clientSeq: z.number().int().nonnegative(),
  payload: z.record(z.unknown()),
});

export type ClientCommandEnvelope = z.infer<typeof ClientCommandEnvelopeSchema>;

/** Zod schema for a generic server→client event envelope */
export const ServerEventEnvelopeSchema = z.object({
  protocolVersion: z.string(),
  matchId: z.string().min(1),
  stateVersion: z.number().int().nonnegative(),
  events: z.array(z.record(z.unknown())),
});

export type ServerEventEnvelope = z.infer<typeof ServerEventEnvelopeSchema>;
