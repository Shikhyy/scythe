import {
  type MatchState,
  type TradeCommand,
  type DomainError,
  type DomainEvent,
  type CoinsChangedEvent,
  type ResourcesChangedEvent,
  type PopularityChangedEvent,
  type PowerChangedEvent,
  type HexState,
  type HexId,
  type ResourceBundle,
  StructureType,
  TopAction,
  UnitType,
  domainError,
} from "@scythe/domain";
import type { CommandApplyResult, DeterministicContext } from "../engine.js";

/**
 * Validate Trade Action:
 * - Cost: 1 coin.
 * - Choice RESOURCES: Destination hex must exist and contain at least 1 friendly worker.
 * - Choice POPULARITY: Always valid.
 */
export function validateTrade(state: MatchState, cmd: TradeCommand): DomainError | null {
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${cmd.actorSeatId} not found.`);
  }

  // Cost check: $1
  if (seat.coins < 1) {
    return domainError(
      "INSUFFICIENT_COINS",
      `Trade requires $1, but seat only has $${seat.coins}.`,
    );
  }

  // Resource placement check
  if (cmd.choice.kind === "RESOURCES") {
    const resChoice = cmd.choice;
    const destHex = state.hexes.get(resChoice.destinationHexId);
    if (!destHex) {
      return domainError(
        "ILLEGAL_TERRITORY",
        `Destination hex ${resChoice.destinationHexId} not found.`,
      );
    }

    // Must contain at least one friendly worker
    const hasFriendlyWorker = Array.from(state.units.values()).some(
      (u) =>
        u.owner === cmd.actorSeatId &&
        u.unitType === UnitType.Worker &&
        u.locationId === resChoice.destinationHexId,
    );

    if (!hasFriendlyWorker) {
      return domainError(
        "NO_WORKERS_PRESENT",
        `Trade resources must be placed on a territory with at least 1 friendly worker.`,
      );
    }
  }

  return null;
}

/**
 * Apply Trade Action:
 * Deducts 1 coin, distributes 2 resources or adds 1 popularity, triggers Armory bonus if present.
 */
export function applyTrade(
  state: MatchState,
  cmd: TradeCommand,
  context: DeterministicContext,
): CommandApplyResult {
  const events: DomainEvent[] = [];
  const seat = state.seats.find((s) => s.seatId === cmd.actorSeatId)!;

  // 1. Pay $1 coin
  const newCoins = seat.coins - 1;
  const coinsEv: CoinsChangedEvent = {
    id: context.generateEventId(),
    timestamp: context.now,
    type: "COINS_CHANGED",
    seatId: seat.seatId,
    delta: -1,
    newValue: newCoins,
  };
  events.push(coinsEv);

  // Clone hexes map
  const nextHexes = new Map<HexId, HexState>(state.hexes);
  let newPopularity = seat.popularity;
  let newPower = seat.power;

  // 2. Apply choice
  if (cmd.choice.kind === "RESOURCES") {
    const destHex = nextHexes.get(cmd.choice.destinationHexId)!;
    const r1 = cmd.choice.resources[0];
    const r2 = cmd.choice.resources[1];

    const updatedResources = { ...destHex.resources };
    updatedResources[r1] = (updatedResources[r1] ?? 0) + 1;
    updatedResources[r2] = (updatedResources[r2] ?? 0) + 1;

    nextHexes.set(cmd.choice.destinationHexId, {
      ...destHex,
      resources: updatedResources,
    });

    const resDeltas: ResourceBundle = {};
    resDeltas[r1] = (resDeltas[r1] ?? 0) + 1;
    resDeltas[r2] = (resDeltas[r2] ?? 0) + 1;

    const resEv: ResourcesChangedEvent = {
      id: context.generateEventId(),
      timestamp: context.now,
      type: "RESOURCES_CHANGED",
      hexId: cmd.choice.destinationHexId,
      resourceDeltas: resDeltas,
      reason: "TRADE",
    };
    events.push(resEv);
  } else {
    // Popularity choice: +1 (max 18)
    const prevPop = newPopularity;
    newPopularity = Math.min(18, newPopularity + 1);
    const popEv: PopularityChangedEvent = {
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POPULARITY_CHANGED",
      seatId: seat.seatId,
      delta: newPopularity - prevPop,
      newValue: newPopularity,
    };
    events.push(popEv);
  }

  // 3. Armory Structure Bonus: +1 Power if Armory built (SRC-001 p. 18)
  const hasArmory =
    seat.structures?.includes(StructureType.Armory) ||
    Array.from(state.hexes.values()).some(
      (h) => h.structure?.ownerId === seat.seatId && h.structure.type === StructureType.Armory,
    );

  if (hasArmory) {
    const prevPow = newPower;
    newPower = Math.min(16, newPower + 1);
    const powEv: PowerChangedEvent = {
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POWER_CHANGED",
      seatId: seat.seatId,
      delta: newPower - prevPow,
      newValue: newPower,
    };
    events.push(powEv);
  }

  const updatedSeats = state.seats.map((s) => {
    if (s.seatId === seat.seatId) {
      return {
        ...s,
        coins: newCoins,
        popularity: newPopularity,
        power: newPower,
        lastSelectedSection: TopAction.Trade,
      };
    }
    return s;
  });

  const nextState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    seats: updatedSeats,
    hexes: nextHexes,
    activeTurn: {
      seatId: seat.seatId,
      turnNumber: state.turnNumber,
      selectedSection: TopAction.Trade,
      topActionCompleted: true,
      bottomActionCompleted: state.activeTurn?.bottomActionCompleted ?? false,
    },
  };

  return {
    nextState,
    events,
  };
}
