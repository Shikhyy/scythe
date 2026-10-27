import { z } from "zod";

export const TopActionSchema = z.enum(["MOVE", "PRODUCE", "TRADE", "BOLSTER"]);
export const BottomActionSchema = z.enum(["UPGRADE", "DEPLOY", "BUILD", "ENLIST"]);
export const ResourceTypeSchema = z.enum(["FOOD", "METAL", "WOOD", "OIL", "COIN"]);
export const StructureTypeSchema = z.enum(["MILL", "MINE", "ARMORY", "MONUMENT"]);

export const ResourceBundleSchema = z.record(ResourceTypeSchema, z.number().int().nonnegative());

/** Base Command schema */
const BaseCommandFields = {
  actorSeatId: z.string().min(1),
  clientSeq: z.number().int().nonnegative().optional(),
};

/** 1. Select Section */
export const SelectSectionCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("SELECT_SECTION"),
  topAction: TopActionSchema,
  bottomAction: BottomActionSchema.optional(),
});

/** 2. Move Units */
export const UnitMoveRouteSchema = z.object({
  unitId: z.string().min(1),
  sourceHexId: z.string().min(1),
  targetHexId: z.string().min(1),
  carriedWorkers: z.array(z.string().min(1)),
  carriedResources: ResourceBundleSchema.optional().default({}),
});

export const MoveUnitsCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("MOVE_UNITS"),
  moves: z.array(UnitMoveRouteSchema).optional().default([]),
  gainCoin: z.boolean().optional(),
});

/** 3. Produce */
export const ProduceCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("PRODUCE"),
  targetHexIds: z.array(z.string().min(1)),
});

/** 4. Trade */
export const TradeResourcesChoiceSchema = z.object({
  kind: z.literal("RESOURCES"),
  destinationHexId: z.string().min(1),
  resources: z.tuple([ResourceTypeSchema, ResourceTypeSchema]),
});

export const TradePopularityChoiceSchema = z.object({
  kind: z.literal("POPULARITY"),
});

export const TradeCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("TRADE"),
  choice: z.discriminatedUnion("kind", [TradeResourcesChoiceSchema, TradePopularityChoiceSchema]),
});

/** 5. Bolster */
export const BolsterCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("BOLSTER"),
  choice: z.enum(["POWER", "CARD"]),
});

/** 6. Upgrade */
export const UpgradeCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("UPGRADE"),
  sourceAction: TopActionSchema,
  targetAction: BottomActionSchema,
});

/** 7. Deploy Mech */
export const DeployMechCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("DEPLOY_MECH"),
  abilityId: z.string().min(1),
  targetHexId: z.string().min(1),
});

/** 8. Build Structure */
export const BuildStructureCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("BUILD_STRUCTURE"),
  structureType: StructureTypeSchema,
  targetHexId: z.string().min(1),
});

/** 9. Enlist */
export const EnlistCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("ENLIST"),
  bottomAction: BottomActionSchema,
  bonusChoice: z.enum(["POWER", "COIN", "POPULARITY", "COMBAT_CARD"]),
});

/** 10. Submit Combat Selection */
export const SubmitCombatSelectionCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("SUBMIT_COMBAT_SELECTION"),
  powerDial: z.number().int().min(0).max(7),
  combatCardIds: z.array(z.string().min(1)),
});

/** 11. Choose Encounter Option */
export const ChooseEncounterOptionCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("CHOOSE_ENCOUNTER_OPTION"),
  optionIndex: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

/** 12. Claim Objective */
export const ClaimObjectiveCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("CLAIM_OBJECTIVE"),
  objectiveCardId: z.string().min(1),
});

/** 13. Pass Bottom Action */
export const PassBottomActionCommandSchema = z.object({
  ...BaseCommandFields,
  type: z.literal("PASS_BOTTOM_ACTION"),
});

/** Discriminated union of all command schemas */
export const GameCommandSchema = z.discriminatedUnion("type", [
  SelectSectionCommandSchema,
  MoveUnitsCommandSchema,
  ProduceCommandSchema,
  TradeCommandSchema,
  BolsterCommandSchema,
  UpgradeCommandSchema,
  DeployMechCommandSchema,
  BuildStructureCommandSchema,
  EnlistCommandSchema,
  SubmitCombatSelectionCommandSchema,
  ChooseEncounterOptionCommandSchema,
  ClaimObjectiveCommandSchema,
  PassBottomActionCommandSchema,
]);

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

/** Inbound client message types */
export const ClientJoinMessageSchema = z.object({
  type: z.literal("JOIN"),
  sessionToken: z.string().min(1),
  displayName: z.string().min(1),
  preferredSeatId: z.string().optional(),
  spectator: z.boolean().optional(),
});
export type ClientJoinMessage = z.infer<typeof ClientJoinMessageSchema>;

export const ClientReconnectMessageSchema = z.object({
  type: z.literal("RECONNECT"),
  reconnectionToken: z.string().min(1),
});
export type ClientReconnectMessage = z.infer<typeof ClientReconnectMessageSchema>;

export const ClientCommandMessageSchema = z.object({
  type: z.literal("COMMAND"),
  commandId: z.string().min(1),
  clientSeq: z.number().int().nonnegative(),
  command: GameCommandSchema,
});
export type ClientCommandMessage = z.infer<typeof ClientCommandMessageSchema>;

export const ClientPingMessageSchema = z.object({
  type: z.literal("PING"),
  timestamp: z.number().nonnegative(),
});
export type ClientPingMessage = z.infer<typeof ClientPingMessageSchema>;

export const ClientMessageSchema = z.discriminatedUnion("type", [
  ClientJoinMessageSchema,
  ClientReconnectMessageSchema,
  ClientCommandMessageSchema,
  ClientPingMessageSchema,
]);
export type ClientMessage = z.infer<typeof ClientMessageSchema>;

/** Outbound server message types */
export const ServerSeatAssignedMessageSchema = z.object({
  type: z.literal("SEAT_ASSIGNED"),
  seatId: z.string().min(1),
  reconnectionToken: z.string().min(1),
  faction: z.string(),
  playerMatId: z.string(),
});
export type ServerSeatAssignedMessage = z.infer<typeof ServerSeatAssignedMessageSchema>;

export const ServerSyncStateMessageSchema = z.object({
  type: z.literal("STATE_SYNC"),
  stateVersion: z.number().int().nonnegative(),
  publicState: z.record(z.unknown()),
  myPrivateState: z.record(z.unknown()).optional(),
});
export type ServerSyncStateMessage = z.infer<typeof ServerSyncStateMessageSchema>;

export const ServerEventBatchMessageSchema = z.object({
  type: z.literal("EVENT_BATCH"),
  stateVersion: z.number().int().nonnegative(),
  events: z.array(z.record(z.unknown())),
});
export type ServerEventBatchMessage = z.infer<typeof ServerEventBatchMessageSchema>;

export const ServerErrorMessageSchema = z.object({
  type: z.literal("ERROR"),
  code: z.string().min(1),
  message: z.string(),
  commandId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});
export type ServerErrorMessage = z.infer<typeof ServerErrorMessageSchema>;

export const ServerPongMessageSchema = z.object({
  type: z.literal("PONG"),
  clientTimestamp: z.number().nonnegative(),
  serverTimestamp: z.number().nonnegative(),
});
export type ServerPongMessage = z.infer<typeof ServerPongMessageSchema>;

export const ServerMessageSchema = z.discriminatedUnion("type", [
  ServerSeatAssignedMessageSchema,
  ServerSyncStateMessageSchema,
  ServerEventBatchMessageSchema,
  ServerErrorMessageSchema,
  ServerPongMessageSchema,
]);
export type ServerMessage = z.infer<typeof ServerMessageSchema>;
