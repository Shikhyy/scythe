import {
  type MatchState,
  type SeatState,
  type SubmitCombatSelectionCommand,
  type DomainError,
  type DomainEvent,
  type SeatId,
  type HexId,
  Faction,
  MatchPhase,
  StructureType,
  TerrainType,
  UnitType,
  domainError,
} from "@scythe/domain";
import { getCombatCardValue } from "@scythe/content";
import { awardStarIfEligible, getNextCombatStarCondition, checkGameEndCondition } from "./stars.js";
import { drawCombatCard, drawEncounterCard } from "../deck.js";
import type { DeterministicContext } from "../engine.js";

/**
 * Validate a SUBMIT_COMBAT_SELECTION command.
 * Rule citations: SRC-001 pp. 22–24
 */
export function validateSubmitCombatSelection(
  state: MatchState,
  command: SubmitCombatSelectionCommand,
): DomainError | null {
  if (state.phase !== MatchPhase.PendingCombat || !state.pendingCombat) {
    return domainError("NOT_IN_COMBAT", "No combat is currently pending.");
  }

  const pending = state.pendingCombat;
  const isAttacker = command.actorSeatId === pending.attackerSeatId;
  const isDefender = command.actorSeatId === pending.defenderSeatId;

  if (!isAttacker && !isDefender) {
    return domainError(
      "NOT_A_COMBAT_PARTICIPANT",
      "Actor is neither the attacker nor defender in this combat.",
    );
  }

  // Prevent double submission
  if (isAttacker && pending.attackerSubmission != null) {
    return domainError("COMBAT_ALREADY_SUBMITTED", "Attacker has already submitted combat dial.");
  }
  if (isDefender && pending.defenderSubmission != null) {
    return domainError("COMBAT_ALREADY_SUBMITTED", "Defender has already submitted combat dial.");
  }

  const seat = state.seats.find((s) => s.seatId === command.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${command.actorSeatId} not found.`);
  }

  // Validate power dial (0–7, integer, <= available power)
  if (!Number.isInteger(command.powerDial) || command.powerDial < 0 || command.powerDial > 7) {
    return domainError("INVALID_POWER_DIAL", "Power dial must be an integer between 0 and 7.");
  }

  const artilleryCost = command.useArtillery && seat.faction === Faction.Nordic ? 1 : 0;
  if (command.powerDial + artilleryCost > seat.power) {
    return domainError(
      "INVALID_POWER_DIAL",
      `Dialed power (${command.powerDial}) exceeds available power (${seat.power}).`,
    );
  }

  // Validate combat cards
  const cardsToPlay = command.combatCardIds ?? [];
  const uniqueCards = new Set(cardsToPlay);
  if (uniqueCards.size !== cardsToPlay.length) {
    return domainError("INVALID_COMMAND", "Duplicate combat cards in submission.");
  }

  for (const cardId of cardsToPlay) {
    if (!seat.combatCardIds.includes(cardId)) {
      return domainError("COMBAT_CARD_NOT_IN_HAND", `Combat card ${cardId} is not in hand.`);
    }
  }

  // Count eligible combat units (Character + Mechs) owned by actor on the combat hex
  const combatHexId = pending.combatHexId;
  const friendlyUnitsOnHex = Array.from(state.units.values()).filter(
    (u) => u.locationId === combatHexId && u.owner === seat.seatId,
  );

  const combatUnitsCount = friendlyUnitsOnHex.filter(
    (u) => u.unitType === UnitType.Character || u.unitType === UnitType.Mech,
  ).length;

  const hasWorker = friendlyUnitsOnHex.some((u) => u.unitType === UnitType.Worker);
  const isRusvietPeoplesArmy = seat.faction === Faction.Rusviet && hasWorker;

  const maxAllowedCards = combatUnitsCount + (isRusvietPeoplesArmy ? 1 : 0);

  if (cardsToPlay.length > maxAllowedCards) {
    return domainError(
      "EXCESS_COMBAT_CARDS",
      `Cannot play ${cardsToPlay.length} cards with ${combatUnitsCount} combat units (max allowed: ${maxAllowedCards}).`,
    );
  }

  return null;
}

/**
 * Apply a SUBMIT_COMBAT_SELECTION command.
 * If one player submits, records choice privately.
 * When both have submitted, simultaneously reveals and resolves combat according to SRC-001 pp. 22–24.
 */
export function applySubmitCombatSelection(
  state: MatchState,
  command: SubmitCombatSelectionCommand,
  context: DeterministicContext,
): { nextState: MatchState; events: DomainEvent[] } {
  const pending = state.pendingCombat!;
  const events: DomainEvent[] = [];
  const isAttacker = command.actorSeatId === pending.attackerSeatId;

  const submission = {
    seatId: command.actorSeatId,
    powerDial: command.powerDial,
    combatCardIds: command.combatCardIds ? [...command.combatCardIds] : [],
    useArtillery: command.useArtillery ?? false,
    lakeRetreatHexId: command.lakeRetreatHexId,
  };

  const nextPending = {
    ...pending,
    attackerSubmission: isAttacker ? submission : pending.attackerSubmission,
    defenderSubmission: !isAttacker ? submission : pending.defenderSubmission,
  };

  // Safe public submission event (no power or card leak!)
  events.push({
    id: context.generateEventId(),
    timestamp: context.now,
    type: "COMBAT_SELECTION_SUBMITTED",
    combatHexId: pending.combatHexId,
    seatId: command.actorSeatId,
  });

  // If only one player has submitted, wait for the other
  if (!nextPending.attackerSubmission || !nextPending.defenderSubmission) {
    return {
      nextState: {
        ...state,
        stateVersion: state.stateVersion + 1,
        pendingCombat: nextPending,
      },
      events,
    };
  }

  // BOTH PLAYERS HAVE SUBMITTED -> REVEAL AND RESOLVE SIMULTANEOUSLY!
  return resolveCombatInstance(state, nextPending, context, events);
}

/**
 * Resolve an abandoned or timed-out combat by treating the abandoning player
 * as dialing 0 power and 0 cards.
 */
export function resolveAbandonedCombat(
  state: MatchState,
  abandoningSeatId: SeatId,
  context: DeterministicContext,
): { nextState: MatchState; events: DomainEvent[] } {
  const pending = state.pendingCombat!;
  const events: DomainEvent[] = [];

  const defaultSubmission = {
    seatId: abandoningSeatId,
    powerDial: 0,
    combatCardIds: [],
    useArtillery: false,
  };

  const nextPending = {
    ...pending,
    attackerSubmission:
      pending.attackerSeatId === abandoningSeatId
        ? defaultSubmission
        : (pending.attackerSubmission ?? {
            seatId: pending.attackerSeatId,
            powerDial: 0,
            combatCardIds: [],
            useArtillery: false,
          }),
    defenderSubmission:
      pending.defenderSeatId === abandoningSeatId
        ? defaultSubmission
        : (pending.defenderSubmission ?? {
            seatId: pending.defenderSeatId,
            powerDial: 0,
            combatCardIds: [],
            useArtillery: false,
          }),
  };

  return resolveCombatInstance(state, nextPending, context, events);
}

/**
 * Initialize a pending combat instance with pre-combat abilities resolved (SRC-001 p. 22).
 * Attacker resolves mech abilities first (e.g. Saxony Disarm, Crimea Scout), followed by Defender.
 */
export function initializePendingCombat(
  state: MatchState,
  combatHexId: HexId,
  attackerSeatId: SeatId,
  defenderSeatId: SeatId,
  context: DeterministicContext,
): { nextState: MatchState; events: DomainEvent[] } {
  const events: DomainEvent[] = [];
  const nextSeats = state.seats.map((s) => ({ ...s, combatCardIds: [...s.combatCardIds] }));
  const attSeat = nextSeats.find((s) => s.seatId === attackerSeatId)!;
  const defSeat = nextSeats.find((s) => s.seatId === defenderSeatId)!;
  const combatHex = state.hexes.get(combatHexId);

  const friendlyCombatUnits = Array.from(state.units.values()).filter(
    (u) =>
      u.locationId === combatHexId &&
      u.owner === attackerSeatId &&
      (u.unitType === UnitType.Character || u.unitType === UnitType.Mech),
  );
  const enemyCombatUnits = Array.from(state.units.values()).filter(
    (u) =>
      u.locationId === combatHexId &&
      u.owner === defenderSeatId &&
      (u.unitType === UnitType.Character || u.unitType === UnitType.Mech),
  );

  events.push({
    id: context.generateEventId(),
    timestamp: context.now,
    type: "COMBAT_INITIATED",
    combatHexId,
    attackerSeatId,
    defenderSeatId,
  });

  const isTunnelOrMine = (seat: SeatState) => {
    if (!combatHex) return false;
    const isTunnel = combatHex.hasTunnel === true || combatHex.terrain === TerrainType.Tunnel;
    const isFriendlyMine =
      combatHex.structure?.ownerId === seat.seatId &&
      combatHex.structure.type === StructureType.Mine;
    return isTunnel || isFriendlyMine;
  };

  const applyPreCombat = (actorSeat: SeatState, opponentSeat: SeatState) => {
    // Saxony Disarm (RULE-SPEC-015): opponent loses 2 power on tunnel/mine
    if (actorSeat.faction === Faction.Saxony && isTunnelOrMine(actorSeat)) {
      const powerLost = Math.min(2, opponentSeat.power);
      opponentSeat.power -= powerLost;
      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "PRE_COMBAT_ABILITY_TRIGGERED",
        combatHexId,
        abilityId: "saxony-disarm",
        actorSeatId: actorSeat.seatId,
        targetSeatId: opponentSeat.seatId,
        powerLost,
      });
      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "POWER_CHANGED",
        seatId: opponentSeat.seatId,
        delta: -powerLost,
        newValue: opponentSeat.power,
      });
    }

    // Crimea Scout (RULE-SPEC-006): steal 1 random combat card from opponent
    if (actorSeat.faction === Faction.Crimea && opponentSeat.combatCardIds.length > 0) {
      const randIdx = context.randomInt(0, opponentSeat.combatCardIds.length - 1);
      const stolenCardId = opponentSeat.combatCardIds.splice(randIdx, 1)[0]!;
      actorSeat.combatCardIds.push(stolenCardId);

      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "PRE_COMBAT_ABILITY_TRIGGERED",
        combatHexId,
        abilityId: "crimea-scout",
        actorSeatId: actorSeat.seatId,
        targetSeatId: opponentSeat.seatId,
      });
    }
  };

  // Attacker uses ability first, then defender (SRC-001 p. 22)
  applyPreCombat(attSeat, defSeat);
  applyPreCombat(defSeat, attSeat);

  const pendingCombat = {
    combatHexId,
    attackerSeatId,
    defenderSeatId,
    attackerUnitIds: friendlyCombatUnits.map((u) => u.id),
    defenderUnitIds: enemyCombatUnits.map((u) => u.id),
    attackerSubmission: null,
    defenderSubmission: null,
    preCombatResolved: true,
  };

  const nextState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    phase: MatchPhase.PendingCombat,
    seats: nextSeats,
    pendingCombat,
  };

  return { nextState, events };
}

/**
 * Internal simultaneous reveal and resolution engine for combat.
 */
function resolveCombatInstance(
  state: MatchState,
  pending: NonNullable<MatchState["pendingCombat"]>,
  context: DeterministicContext,
  initialEvents: DomainEvent[],
): { nextState: MatchState; events: DomainEvent[] } {
  const events = [...initialEvents];
  const nextSeats = state.seats.map((s) => ({
    ...s,
    stars: [...s.stars],
    unitIds: [...s.unitIds],
  }));
  const nextUnits = new Map(state.units);
  const nextHexes = new Map(state.hexes);
  let nextCombatDiscard = state.combatDiscard ? [...state.combatDiscard] : [];

  const attSeat = nextSeats.find((s) => s.seatId === pending.attackerSeatId)!;
  const defSeat = nextSeats.find((s) => s.seatId === pending.defenderSeatId)!;
  const attSub = pending.attackerSubmission!;
  const defSub = pending.defenderSubmission!;

  // 1. Pre-combat: Nordic Artillery
  if (attSub.useArtillery && attSeat.faction === Faction.Nordic && attSeat.power >= 1) {
    attSeat.power -= 1;
    const powerLost = Math.min(2, defSeat.power);
    defSeat.power -= powerLost;

    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "PRE_COMBAT_ABILITY_TRIGGERED",
      combatHexId: pending.combatHexId,
      abilityId: "nordic-artillery",
      actorSeatId: attSeat.seatId,
      targetSeatId: defSeat.seatId,
      powerCost: 1,
      powerLost,
    });
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POWER_CHANGED",
      seatId: defSeat.seatId,
      delta: -powerLost,
      newValue: defSeat.power,
    });
  }

  if (defSub.useArtillery && defSeat.faction === Faction.Nordic && defSeat.power >= 1) {
    defSeat.power -= 1;
    const powerLost = Math.min(2, attSeat.power);
    attSeat.power -= powerLost;

    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "PRE_COMBAT_ABILITY_TRIGGERED",
      combatHexId: pending.combatHexId,
      abilityId: "nordic-artillery",
      actorSeatId: defSeat.seatId,
      targetSeatId: attSeat.seatId,
      powerCost: 1,
      powerLost,
    });
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POWER_CHANGED",
      seatId: attSeat.seatId,
      delta: -powerLost,
      newValue: attSeat.power,
    });
  }

  // Effective power dial (capped at remaining power after any artillery power loss)
  const effectiveAttDial = Math.min(attSub.powerDial, attSeat.power);
  const effectiveDefDial = Math.min(defSub.powerDial, defSeat.power);

  // 2. Sum combat card values
  const attCardBonus = attSub.combatCardIds.reduce(
    (sum, id) => sum + (getCombatCardValue(id) ?? 0),
    0,
  );
  const defCardBonus = defSub.combatCardIds.reduce(
    (sum, id) => sum + (getCombatCardValue(id) ?? 0),
    0,
  );

  const attTotal = effectiveAttDial + attCardBonus;
  const defTotal = effectiveDefDial + defCardBonus;

  // 3. Determine Winner & Loser (Attacker wins ties! SRC-001 p. 23)
  const attWins = attTotal >= defTotal;
  const tieOccurred = attTotal === defTotal;
  const winnerSeat = attWins ? attSeat : defSeat;
  const loserSeat = attWins ? defSeat : attSeat;
  const loserSub = attWins ? defSub : attSub;
  const loserEffectiveDial = attWins ? effectiveDefDial : effectiveAttDial;

  // 4. Pay power dialed
  attSeat.power = Math.max(0, attSeat.power - effectiveAttDial);
  defSeat.power = Math.max(0, defSeat.power - effectiveDefDial);

  events.push({
    id: context.generateEventId(),
    timestamp: context.now,
    type: "POWER_CHANGED",
    seatId: attSeat.seatId,
    delta: -effectiveAttDial,
    newValue: attSeat.power,
  });
  events.push({
    id: context.generateEventId(),
    timestamp: context.now,
    type: "POWER_CHANGED",
    seatId: defSeat.seatId,
    delta: -effectiveDefDial,
    newValue: defSeat.power,
  });

  // 5. Discard used combat cards
  attSeat.combatCardIds = attSeat.combatCardIds.filter((id) => !attSub.combatCardIds.includes(id));
  defSeat.combatCardIds = defSeat.combatCardIds.filter((id) => !defSub.combatCardIds.includes(id));
  nextCombatDiscard.push(...attSub.combatCardIds, ...defSub.combatCardIds);

  // 6. Loser consolation card (if dialed >= 1 power OR revealed cards with total power >= 1)
  const loserCardsPlayed = loserSub.combatCardIds;
  const loserDrewCard = loserEffectiveDial >= 1 || loserCardsPlayed.length > 0;
  let currentState: MatchState = {
    ...state,
    combatDiscard: nextCombatDiscard,
  };

  if (loserDrewCard) {
    const prng = () => context.randomInt(0, 1000000) / 1000000;
    const drawRes = drawCombatCard(currentState, prng);
    currentState = {
      ...currentState,
      combatDeck: drawRes.nextDeck,
      combatDiscard: drawRes.nextDiscard,
    };
    nextCombatDiscard = drawRes.nextDiscard;
    if (drawRes.drawnCardId) {
      loserSeat.combatCardIds.push(drawRes.drawnCardId);
      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "COMBAT_CARD_DRAWN",
        seatId: loserSeat.seatId,
        cardId: drawRes.drawnCardId,
      });
    }
  }

  // 7. Loser retreat: all loser units on combatHex retreat
  const loserUnitsOnHex = Array.from(nextUnits.values()).filter(
    (u) => u.locationId === pending.combatHexId && u.owner === loserSeat.seatId,
  );

  // Locate loser's home base hex
  const loserHomeHex = Array.from(nextHexes.values()).find(
    (h) =>
      h.terrain === TerrainType.HomeBase &&
      (String(h.id).toLowerCase().includes(loserSeat.faction.toLowerCase()) ||
        h.homeBaseFaction === loserSeat.faction),
  );
  const fallbackHomeId = loserHomeHex ? loserHomeHex.id : pending.combatHexId;

  // Nordic Seaworthy lake retreat
  const canLakeRetreat =
    loserSeat.faction === Faction.Nordic &&
    loserSub.lakeRetreatHexId != null &&
    nextHexes.get(loserSub.lakeRetreatHexId)?.terrain === TerrainType.Lake;

  const lakeHexId = canLakeRetreat ? loserSub.lakeRetreatHexId! : fallbackHomeId;

  let loserWorkersRetreated = 0;
  for (const u of loserUnitsOnHex) {
    const isWorker = u.unitType === UnitType.Worker;
    if (isWorker) {
      loserWorkersRetreated += 1;
      // Workers always retreat to home base (even Nordic cannot retreat workers to lakes)
      nextUnits.set(u.id, { ...u, locationId: fallbackHomeId });
    } else {
      // Mechs and character retreat to lake if Seaworthy, otherwise home base
      nextUnits.set(u.id, { ...u, locationId: canLakeRetreat ? lakeHexId : fallbackHomeId });
    }
  }

  // 8. Popularity penalty for Attacker if defender workers retreated
  let attackerPopLost = 0;
  if (attWins && loserWorkersRetreated > 0) {
    if (attSeat.faction !== Faction.Polania) {
      attackerPopLost = loserWorkersRetreated;
      attSeat.popularity = Math.max(0, attSeat.popularity - attackerPopLost);
      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "POPULARITY_CHANGED",
        seatId: attSeat.seatId,
        delta: -attackerPopLost,
        newValue: attSeat.popularity,
      });
    }
  }

  // 9. Award combat star to winner
  const nextCombatStar = getNextCombatStarCondition(winnerSeat);
  let starAwarded = false;
  if (nextCombatStar) {
    const starRes = awardStarIfEligible(winnerSeat, nextCombatStar, context);
    if (starRes.event) {
      starAwarded = true;
      const idx = nextSeats.findIndex((s) => s.seatId === winnerSeat.seatId);
      nextSeats[idx] = starRes.updatedSeat;
      events.push(starRes.event);
    }
  }

  // 10. Emit COMBAT_RESOLVED event
  events.push({
    id: context.generateEventId(),
    timestamp: context.now,
    type: "COMBAT_RESOLVED",
    combatHexId: pending.combatHexId,
    attackerSeatId: attSeat.seatId,
    defenderSeatId: defSeat.seatId,
    attackerTotalPower: attTotal,
    defenderTotalPower: defTotal,
    attackerCardsPlayed: attSub.combatCardIds,
    defenderCardsPlayed: defSub.combatCardIds,
    winnerSeatId: winnerSeat.seatId,
    loserSeatId: loserSeat.seatId,
    attackerPowerSpent: effectiveAttDial,
    defenderPowerSpent: effectiveDefDial,
    tieOccurred,
    loserDrewConsolationCard: loserDrewCard,
    attackerPopularityLost: attackerPopLost,
    starAwardedToWinner: starAwarded,
  });

  // 11. Check encounter if winner's character is on hex and hex has encounter token
  const combatHex = nextHexes.get(pending.combatHexId);
  let nextPendingEncounter = state.pendingEncounter;
  let nextEncounterDeck = state.encounterDeck;
  let nextEncounterDiscard = state.encounterDiscard;

  const winnerCharacterOnHex = Array.from(nextUnits.values()).some(
    (u) =>
      u.locationId === pending.combatHexId &&
      u.owner === winnerSeat.seatId &&
      u.unitType === UnitType.Character,
  );

  if (combatHex && combatHex.hasEncounterToken && winnerCharacterOnHex) {
    nextHexes.set(pending.combatHexId, { ...combatHex, hasEncounterToken: false });
    const encDraw = drawEncounterCard({
      ...state,
      encounterDeck: nextEncounterDeck,
      encounterDiscard: nextEncounterDiscard,
    });
    if (encDraw.drawnCardId) {
      nextEncounterDeck = encDraw.nextDeck;
      nextPendingEncounter = {
        hexId: pending.combatHexId,
        seatId: winnerSeat.seatId,
        encounterCardId: encDraw.drawnCardId,
      };
      events.push({
        id: context.generateEventId(),
        timestamp: context.now,
        type: "ENCOUNTER_TRIGGERED",
        seatId: winnerSeat.seatId,
        hexId: pending.combatHexId,
        encounterCardId: encDraw.drawnCardId,
      });
    }
  }

  // 12. Check 6th star game end condition
  const preFinalState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    phase: nextPendingEncounter ? MatchPhase.PendingEncounter : MatchPhase.Active,
    seats: nextSeats,
    units: nextUnits,
    hexes: nextHexes,
    pendingCombat: null,
    pendingEncounter: nextPendingEncounter,
    combatDeck: currentState.combatDeck,
    combatDiscard: nextCombatDiscard,
    encounterDeck: nextEncounterDeck,
    encounterDiscard: nextEncounterDiscard,
  };

  const endCheck = checkGameEndCondition(preFinalState, winnerSeat.seatId, context);
  if (endCheck.gameEnded && endCheck.matchEndedEvent) {
    events.push(endCheck.matchEndedEvent);
    return {
      nextState: endCheck.nextState,
      events,
    };
  }

  return {
    nextState: preFinalState,
    events,
  };
}
