import {
  type MatchState,
  type ChooseEncounterOptionCommand,
  type DomainError,
  type DomainEvent,
  type EncounterResolvedEvent,
  type CoinsChangedEvent,
  type PowerChangedEvent,
  type PopularityChangedEvent,
  type ResourcesChangedEvent,
  type CombatCardDrawnEvent,
  type MechDeployedEvent,
  type StructureBuiltEvent,
  type RecruitEnlistedEvent,
  type WorkerProducedEvent,
  type ResourceBundle,
  type ResourceType,
  type SeatState,
  type StructureType,
  type BottomAction,
  domainError,
  getChosenEncounterOptionIndices,
  Faction,
  MatchPhase,
  UnitType,
  StructureType as StructEnum,
  BottomAction as BottomEnum,
  StarCondition,
  makeUnitId,
} from "@scythe/domain";
import { getEncounterCard } from "@scythe/content";
import type { DeterministicContext } from "../engine.js";
import { awardStarIfEligible } from "./stars.js";

/**
 * Validate Choose Encounter Option command against current MatchState.
 * Rules citations:
 * - SRC-001 p. 24 (Encounter resolution and costs)
 * - SRC-001 p. 21 (Polania Meander ability: up to 2 options)
 */
export function validateChooseEncounterOption(
  state: MatchState,
  command: ChooseEncounterOptionCommand,
): DomainError | null {
  if (!state.pendingEncounter) {
    return domainError("ENCOUNTER_NOT_FOUND", "There is no pending encounter to resolve.");
  }

  if (state.pendingEncounter.seatId !== command.actorSeatId) {
    return domainError(
      "NOT_YOUR_TURN",
      `Pending encounter belongs to ${state.pendingEncounter.seatId}, not ${command.actorSeatId}.`,
    );
  }

  const seat = state.seats.find((s) => s.seatId === command.actorSeatId);
  if (!seat) {
    return domainError("SEAT_NOT_FOUND", `Seat ${command.actorSeatId} not found.`);
  }

  const optionIndices = getChosenEncounterOptionIndices(command);
  if (optionIndices.length === 0) {
    return domainError("INVALID_ENCOUNTER_OPTION", "No encounter option selected.");
  }

  const isPolania = seat.faction === Faction.Polania;
  if (!isPolania && optionIndices.length > 1) {
    return domainError(
      "INVALID_ENCOUNTER_OPTION",
      "Only Polania (Meander ability) can choose more than 1 encounter option.",
    );
  }

  if (optionIndices.length > 2) {
    return domainError("INVALID_ENCOUNTER_OPTION", "Cannot choose more than 2 encounter options.");
  }

  // Ensure options are unique
  const uniqueIndices = new Set(optionIndices);
  if (uniqueIndices.size !== optionIndices.length) {
    return domainError(
      "INVALID_ENCOUNTER_OPTION",
      "Cannot choose the same encounter option multiple times.",
    );
  }

  const card = getEncounterCard(state.pendingEncounter.encounterCardId);
  if (!card) {
    return domainError(
      "ENCOUNTER_NOT_FOUND",
      `Encounter card ${state.pendingEncounter.encounterCardId} not found.`,
    );
  }

  if (!state.hexes.has(state.pendingEncounter.hexId)) {
    return domainError(
      "ILLEGAL_TERRITORY",
      `Encounter territory ${state.pendingEncounter.hexId} not found on board.`,
    );
  }

  let totalCostCoins = 0;
  let totalCostPower = 0;
  let totalCostPopularity = 0;

  for (const idx of optionIndices) {
    const opt = card.options.find((o) => o.index === idx);
    if (!opt) {
      return domainError(
        "INVALID_ENCOUNTER_OPTION",
        `Encounter option ${idx} does not exist on card ${card.id}.`,
      );
    }
    if (opt.cost?.coins) totalCostCoins += opt.cost.coins;
    if (opt.cost?.power) totalCostPower += opt.cost.power;
    if (opt.cost?.popularity) totalCostPopularity += opt.cost.popularity;
  }

  if (seat.coins < totalCostCoins) {
    return domainError(
      "INSUFFICIENT_COINS",
      `Requires ${totalCostCoins} coins, but player only has ${seat.coins}.`,
    );
  }

  if (seat.power < totalCostPower) {
    return domainError(
      "INSUFFICIENT_POWER",
      `Requires ${totalCostPower} power, but player only has ${seat.power}.`,
    );
  }

  if (seat.popularity < totalCostPopularity) {
    return domainError(
      "INSUFFICIENT_POPULARITY",
      `Requires ${totalCostPopularity} popularity, but player only has ${seat.popularity}.`,
    );
  }

  return null;
}

/**
 * Apply Choose Encounter Option command to MatchState.
 */
export function applyChooseEncounterOption(
  state: MatchState,
  command: ChooseEncounterOptionCommand,
  context: DeterministicContext,
): { nextState: MatchState; events: DomainEvent[] } {
  const pending = state.pendingEncounter!;
  const seatIndex = state.seats.findIndex((s) => s.seatId === command.actorSeatId);
  const seat = state.seats[seatIndex]!;
  const hex = state.hexes.get(pending.hexId)!;
  const card = getEncounterCard(pending.encounterCardId)!;
  const optionIndices = getChosenEncounterOptionIndices(command);

  const events: DomainEvent[] = [];

  let nextCoins = seat.coins;
  let nextPower = seat.power;
  let nextPopularity = seat.popularity;
  const nextCombatCardIds = [...seat.combatCardIds];
  let nextUnitIds = [...seat.unitIds];
  const nextStructures = [...(seat.structures ?? [])];
  const nextRecruits = [...(seat.recruits ?? [])];
  const nextUnlockedMechAbilities = [...(seat.unlockedMechAbilities ?? [])];

  const nextHexResources: ResourceBundle = { ...hex.resources };
  const nextUnits = new Map(state.units);
  let nextHexStructure = hex.structure;

  // 1. Process costs
  for (const idx of optionIndices) {
    const opt = card.options.find((o) => o.index === idx)!;
    if (opt.cost?.coins) nextCoins -= opt.cost.coins;
    if (opt.cost?.power) nextPower = Math.max(0, nextPower - opt.cost.power);
    if (opt.cost?.popularity) nextPopularity = Math.max(0, nextPopularity - opt.cost.popularity);
  }

  // 2. Process rewards
  for (const idx of optionIndices) {
    const opt = card.options.find((o) => o.index === idx)!;
    const r = opt.reward;

    if (r.coins) nextCoins += r.coins;
    if (r.power) nextPower = Math.min(16, nextPower + r.power);
    if (r.popularity) nextPopularity = Math.min(18, nextPopularity + r.popularity);

    // Resources placed on encounter territory
    if (r.resources) {
      for (const [resType, count] of Object.entries(r.resources)) {
        if (typeof count === "number" && count > 0) {
          const rt = resType as ResourceType;
          nextHexResources[rt] = (nextHexResources[rt] ?? 0) + count;
        }
      }
    }

    // Combat cards
    if (r.combatCardsCount && r.combatCardsCount > 0) {
      const deck = state.combatDeck ? [...state.combatDeck] : [];
      for (let c = 0; c < r.combatCardsCount; c++) {
        const drawn = deck.pop();
        if (drawn) {
          nextCombatCardIds.push(drawn);
          events.push({
            id: context.generateEventId(),
            timestamp: context.now,
            type: "COMBAT_CARD_DRAWN",
            seatId: seat.seatId,
            cardId: drawn,
          } as CombatCardDrawnEvent);
        }
      }
      state.combatDeck = deck;
    }

    // Free Mech Deploy
    if (r.deployMechFree) {
      const currentMechCount = nextUnitIds.filter(
        (uid) => nextUnits.get(uid)?.unitType === UnitType.Mech,
      ).length;
      if (currentMechCount < 4) {
        const newMechNumber = currentMechCount + 1;
        const newMechId = makeUnitId(`unit-${seat.faction}-mech-${newMechNumber}`);
        nextUnits.set(newMechId, {
          id: newMechId,
          owner: seat.seatId,
          unitType: UnitType.Mech,
          locationId: pending.hexId,
        });
        nextUnitIds.push(newMechId);
        const abilityName = `Ability-${seat.faction}-Mech-${newMechNumber}`;
        nextUnlockedMechAbilities.push(abilityName);

        events.push({
          id: context.generateEventId(),
          timestamp: context.now,
          type: "MECH_DEPLOYED",
          seatId: seat.seatId,
          mechId: newMechId,
          locationHexId: pending.hexId,
          unlockedAbility: abilityName,
        } as MechDeployedEvent);
      }
    }

    // Free Structure Build (if hex doesn't already have one)
    if (r.buildStructureFree && !nextHexStructure) {
      const allStructs: StructureType[] = [
        StructEnum.Monument,
        StructEnum.Mill,
        StructEnum.Armory,
        StructEnum.Mine,
      ];
      const availableStruct = allStructs.find((st) => !nextStructures.includes(st));
      if (availableStruct) {
        nextStructures.push(availableStruct);
        nextHexStructure = { type: availableStruct, ownerId: seat.seatId };
        events.push({
          id: context.generateEventId(),
          timestamp: context.now,
          type: "STRUCTURE_BUILT",
          seatId: seat.seatId,
          structureType: availableStruct,
          locationHexId: pending.hexId,
        } as StructureBuiltEvent);
      }
    }

    // Free Recruit Enlist
    if (r.enlistRecruitFree) {
      const allRecruitSlots: BottomAction[] = [
        BottomEnum.Upgrade,
        BottomEnum.Deploy,
        BottomEnum.Build,
        BottomEnum.Enlist,
      ];
      const availableSlot = allRecruitSlots.find((slot) => !nextRecruits.includes(slot));
      if (availableSlot) {
        nextRecruits.push(availableSlot);
        events.push({
          id: context.generateEventId(),
          timestamp: context.now,
          type: "RECRUIT_ENLISTED",
          seatId: seat.seatId,
          slotAction: availableSlot,
          immediateReward: "Encounter-Free-Recruit",
          ongoingBonus: "Bonus",
        } as RecruitEnlistedEvent);
      }
    }

    // Workers gain
    if (r.gainWorkersCount && r.gainWorkersCount > 0) {
      const currentWorkerCount = nextUnitIds.filter(
        (uid) => nextUnits.get(uid)?.unitType === UnitType.Worker,
      ).length;
      const canAdd = Math.min(r.gainWorkersCount, 8 - currentWorkerCount);
      for (let w = 0; w < canAdd; w++) {
        const workerNum = currentWorkerCount + w + 1;
        const workerId = makeUnitId(`unit-${seat.faction}-worker-${workerNum}`);
        nextUnits.set(workerId, {
          id: workerId,
          owner: seat.seatId,
          unitType: UnitType.Worker,
          locationId: pending.hexId,
        });
        nextUnitIds.push(workerId);
        events.push({
          id: context.generateEventId(),
          timestamp: context.now,
          type: "WORKER_PRODUCED",
          seatId: seat.seatId,
          workerId,
          hexId: pending.hexId,
          totalWorkersOnBoard: currentWorkerCount + w + 1,
        } as WorkerProducedEvent);
      }
    }
  }

  // 3. Emit track events
  if (nextCoins !== seat.coins) {
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "COINS_CHANGED",
      seatId: seat.seatId,
      delta: nextCoins - seat.coins,
      newValue: nextCoins,
    } as CoinsChangedEvent);
  }

  if (nextPower !== seat.power) {
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POWER_CHANGED",
      seatId: seat.seatId,
      delta: nextPower - seat.power,
      newValue: nextPower,
    } as PowerChangedEvent);
  }

  if (nextPopularity !== seat.popularity) {
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "POPULARITY_CHANGED",
      seatId: seat.seatId,
      delta: nextPopularity - seat.popularity,
      newValue: nextPopularity,
    } as PopularityChangedEvent);
  }

  // Resources changed event
  const resourceDeltas: ResourceBundle = {};
  for (const [rt, count] of Object.entries(nextHexResources)) {
    const prev = hex.resources[rt as ResourceType] ?? 0;
    const curr = (count as number) ?? 0;
    if (curr !== prev) {
      resourceDeltas[rt as ResourceType] = curr - prev;
    }
  }

  if (Object.keys(resourceDeltas).length > 0) {
    events.push({
      id: context.generateEventId(),
      timestamp: context.now,
      type: "RESOURCES_CHANGED",
      hexId: pending.hexId,
      resourceDeltas,
      reason: "ENCOUNTER",
    } as ResourcesChangedEvent);
  }

  // 4. Update updated seat
  let updatedSeat: SeatState = {
    ...seat,
    coins: nextCoins,
    power: nextPower,
    popularity: nextPopularity,
    combatCardIds: nextCombatCardIds,
    unitIds: nextUnitIds,
    structures: nextStructures,
    recruits: nextRecruits,
    unlockedMechAbilities: nextUnlockedMechAbilities,
  };

  // Check stars for 4 mechs, 4 structures, 4 recruits, 8 workers
  const mechCount = updatedSeat.unitIds.filter(
    (uid) => nextUnits.get(uid)?.unitType === UnitType.Mech,
  ).length;
  if (mechCount >= 4) {
    const starRes = awardStarIfEligible(updatedSeat, StarCondition.AllMechs, context);
    updatedSeat = starRes.updatedSeat;
    if (starRes.event) events.push(starRes.event);
  }

  if ((updatedSeat.structures?.length ?? 0) >= 4) {
    const starRes = awardStarIfEligible(updatedSeat, StarCondition.AllStructures, context);
    updatedSeat = starRes.updatedSeat;
    if (starRes.event) events.push(starRes.event);
  }

  if ((updatedSeat.recruits?.length ?? 0) >= 4) {
    const starRes = awardStarIfEligible(updatedSeat, StarCondition.AllRecruits, context);
    updatedSeat = starRes.updatedSeat;
    if (starRes.event) events.push(starRes.event);
  }

  const workerCount = updatedSeat.unitIds.filter(
    (uid) => nextUnits.get(uid)?.unitType === UnitType.Worker,
  ).length;
  if (workerCount >= 8) {
    const starRes = awardStarIfEligible(updatedSeat, StarCondition.AllWorkers, context);
    updatedSeat = starRes.updatedSeat;
    if (starRes.event) events.push(starRes.event);
  }

  // 5. Recycle encounter card to bottom of deck
  const nextEncounterDeck = state.encounterDeck ? [...state.encounterDeck] : [];
  nextEncounterDeck.unshift(pending.encounterCardId); // unshift to bottom of deck

  // 6. Emit encounter resolved event
  events.push({
    id: context.generateEventId(),
    timestamp: context.now,
    type: "ENCOUNTER_RESOLVED",
    seatId: seat.seatId,
    hexId: pending.hexId,
    encounterCardId: pending.encounterCardId,
    chosenOptionIndices: optionIndices,
  } as EncounterResolvedEvent);

  const nextSeats = [...state.seats];
  nextSeats[seatIndex] = updatedSeat;

  const nextHexes = new Map(state.hexes);
  nextHexes.set(pending.hexId, {
    ...hex,
    resources: nextHexResources,
    structure: nextHexStructure,
    hasEncounterToken: false, // Token was consumed
  });

  const nextState: MatchState = {
    ...state,
    stateVersion: state.stateVersion + 1,
    phase: MatchPhase.Active,
    pendingEncounter: null,
    encounterDeck: nextEncounterDeck,
    seats: nextSeats,
    hexes: nextHexes,
    units: nextUnits,
  };

  return { nextState, events };
}
