import {
  type HexId,
  type HexState,
  type MatchState,
  type SeatState,
  type UnitId,
  type UnitState,
  Faction,
  MatchPhase,
  PlayerMatId,
  UnitType,
  ConnectionState,
  makeMatchId,
  makePlayerId,
  makeSeatId,
  makeUnitId,
} from "@scythe/domain";
import { FACTION_STARTING_STATS } from "./factions.js";
import {
  ALL_COMBAT_CARDS,
  ALL_OBJECTIVE_CARDS,
  ALL_ENCOUNTER_CARDS,
  ALL_FACTORY_CARDS,
  ALL_STRUCTURE_BONUS_TILES,
} from "./cards/index.js";
import {
  CANONICAL_BOARD_HEXES,
  getHomeBaseHex,
  getStartingTerritoriesForFaction,
} from "./board.js";

/** Mulberry32 fast deterministic pseudorandom number generator */
export function createPrng(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates deterministic in-place shuffle */
export function shuffleArray<T>(array: T[], prng: () => number): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    const temp = array[i]!;
    array[i] = array[j]!;
    array[j] = temp;
  }
  return array;
}

export interface PlayerMatStats {
  readonly id: PlayerMatId;
  readonly matNumber: number;
  readonly startingPopularity: number;
  readonly startingCoins: number;
}

export const PLAYER_MAT_SPECS: Record<PlayerMatId, PlayerMatStats> = {
  [PlayerMatId.Industrial]: {
    id: PlayerMatId.Industrial,
    matNumber: 1,
    startingPopularity: 2,
    startingCoins: 4,
  },
  [PlayerMatId.Engineering]: {
    id: PlayerMatId.Engineering,
    matNumber: 2,
    startingPopularity: 2,
    startingCoins: 5,
  },
  [PlayerMatId.Military]: {
    id: PlayerMatId.Military,
    matNumber: 3,
    startingPopularity: 3,
    startingCoins: 4,
  },
  [PlayerMatId.Patriotic]: {
    id: PlayerMatId.Patriotic,
    matNumber: 4,
    startingPopularity: 2,
    startingCoins: 6,
  },
  [PlayerMatId.Agricultural]: {
    id: PlayerMatId.Agricultural,
    matNumber: 5,
    startingPopularity: 4,
    startingCoins: 7,
  },
};

export const SEATING_ORDER_FACTIONS: readonly Faction[] = [
  Faction.Nordic,
  Faction.Rusviet,
  Faction.Crimea,
  Faction.Saxony,
  Faction.Polania,
];

export const ALL_PLAYER_MATS: readonly PlayerMatId[] = [
  PlayerMatId.Industrial,
  PlayerMatId.Engineering,
  PlayerMatId.Military,
  PlayerMatId.Patriotic,
  PlayerMatId.Agricultural,
];

export interface MatchSetupConfig {
  readonly matchId: string;
  readonly playerCount: number;
  readonly seed: number;
  readonly customFactions?: readonly Faction[];
  readonly customPlayerMats?: readonly PlayerMatId[];
}

/**
 * Authoritative, deterministic match setup for 1-5 players.
 * Rules citations:
 * - Seating order: Nordic, Rusviet, Crimea, Saxony, Polania clockwise (SRC-001 p. 6)
 * - Mat dealing: 1 player mat per player (SRC-001 p. 6)
 * - First player: player with lowest printed mat number goes first (SRC-001 p. 8)
 * - Initial pieces: 1 character on home base, 2 workers on connected land territories (SRC-001 p. 7)
 * - Objective cards: 2 dealt secretly to each player (SRC-001 p. 7)
 * - 11 encounter tokens on designated spaces (SRC-001 p. 6)
 */
export function setupDeterministicMatch(config: MatchSetupConfig): MatchState {
  if (config.playerCount < 1 || config.playerCount > 5) {
    throw new Error(`Invalid playerCount: ${config.playerCount}. Must be between 1 and 5.`);
  }

  const prng = createPrng(config.seed);

  // 1. Determine factions
  const assignedFactions: Faction[] = config.customFactions
    ? [...config.customFactions]
    : SEATING_ORDER_FACTIONS.slice(0, config.playerCount);

  // 2. Determine and shuffle player mats
  const availableMats: PlayerMatId[] = config.customPlayerMats
    ? [...config.customPlayerMats]
    : shuffleArray([...ALL_PLAYER_MATS], prng).slice(0, config.playerCount);

  // 3. Generate combat cards deck (42 cards total: 16x2, 12x3, 8x4, 6x5)
  const combatDeck = shuffleArray([...ALL_COMBAT_CARDS.map((c) => c.id)], prng);

  // 4. Generate objective cards deck (23 cards)
  const objectiveDeck = shuffleArray([...ALL_OBJECTIVE_CARDS.map((o) => o.id)], prng);

  // 5. Generate encounter cards deck (28 cards)
  const encounterDeck = shuffleArray([...ALL_ENCOUNTER_CARDS.map((e) => e.id)], prng);

  // 6. Generate Factory cards pool (N_players + 1)
  const factoryDeck = shuffleArray([...ALL_FACTORY_CARDS.map((f) => f.id)], prng).slice(
    0,
    config.playerCount + 1,
  );

  // 7. Select 1 Structure Bonus Tile
  const structureBonusTile = shuffleArray(
    [...ALL_STRUCTURE_BONUS_TILES.map((t) => t.tileId)],
    prng,
  )[0]!;

  // 8. Initialize board hex states
  const hexes = new Map<HexId, HexState>();
  for (const h of CANONICAL_BOARD_HEXES) {
    hexes.set(h.id, {
      id: h.id,
      coord: h.coord,
      terrain: h.terrain,
      neighbours: h.neighborHexIds,
      blockedEdges: [],
      hasEncounterToken: h.hasEncounter,
      resources: {},
      structure: null,
    });
  }

  // 9. Setup seats and pieces
  const units = new Map<UnitId, UnitState>();
  const initialSeats: SeatState[] = [];

  for (let i = 0; i < config.playerCount; i++) {
    const faction = assignedFactions[i]!;
    const matId = availableMats[i]!;
    const seatId = makeSeatId(`seat-${i + 1}`);
    const playerId = makePlayerId(`player-${i + 1}`);

    const factionStats = FACTION_STARTING_STATS[faction];
    const matStats = PLAYER_MAT_SPECS[matId];

    // Deal starting combat cards
    const startingCombatCards = [];
    for (let c = 0; c < factionStats.startingCombatCards; c++) {
      const drawn = combatDeck.pop();
      if (drawn) startingCombatCards.push(drawn);
    }

    // Deal 2 objective cards
    const startingObjectives = [];
    for (let o = 0; o < 2; o++) {
      const drawn = objectiveDeck.pop();
      if (drawn) startingObjectives.push(drawn);
    }

    // Deploy starting character on home base
    const homeBase = getHomeBaseHex(faction);
    const charUnitId = makeUnitId(`unit-${faction}-char`);
    units.set(charUnitId, {
      id: charUnitId,
      owner: seatId,
      unitType: UnitType.Character,
      locationId: homeBase.id,
    });

    // Deploy 2 starting workers on adjacent starting land territories
    const startingTerritories = getStartingTerritoriesForFaction(faction);
    const workerIds: UnitId[] = [];
    for (let w = 0; w < 2; w++) {
      const territory = startingTerritories[w];
      if (territory) {
        const workerId = makeUnitId(`unit-${faction}-worker-${w + 1}`);
        workerIds.push(workerId);
        units.set(workerId, {
          id: workerId,
          owner: seatId,
          unitType: UnitType.Worker,
          locationId: territory.id,
        });
      }
    }

    initialSeats.push({
      seatId,
      playerId,
      faction,
      playerMatId: matId,
      connection: ConnectionState.Connected,
      coins: matStats.startingCoins,
      power: factionStats.startingPower,
      popularity: matStats.startingPopularity,
      stars: [],
      combatCardIds: startingCombatCards,
      objectiveCardIds: startingObjectives,
      factoryCardId: null,
      completedObjectiveCardIds: [],
      unitIds: [charUnitId, ...workerIds],
    });
  }

  // 7. Determine turn order: player with lowest mat number goes first (SRC-001 p. 8)
  // Clockwise order continues from that player
  let lowestMatIdx = 0;
  let lowestMatNumber = 999;
  for (let i = 0; i < initialSeats.length; i++) {
    const seat = initialSeats[i]!;
    const matNum = PLAYER_MAT_SPECS[seat.playerMatId].matNumber;
    if (matNum < lowestMatNumber) {
      lowestMatNumber = matNum;
      lowestMatIdx = i;
    }
  }

  // Rotate seats array so starting player is first
  const orderedSeats: SeatState[] = [
    ...initialSeats.slice(lowestMatIdx),
    ...initialSeats.slice(0, lowestMatIdx),
  ];

  const activeSeatId = orderedSeats[0]!.seatId;

  return {
    matchId: makeMatchId(config.matchId),
    rulesVersion: "1.0.0",
    contentVersion: "1.0.0",
    stateVersion: 1,
    turnNumber: 1,
    phase: MatchPhase.Active,
    activeSeatId,
    seats: orderedSeats,
    hexes,
    units,
    combatDeck,
    combatDiscard: [],
    objectiveDeck,
    encounterDeck,
    encounterDiscard: [],
    factoryDeck,
    structureBonusTile,
  };
}
