import { Faction } from "@scythe/domain";

/** Starting stats per faction — verified from rulebook pp. 4-5 */
export interface FactionStartingStats {
  readonly faction: Faction;
  readonly startingPower: number;
  readonly startingCombatCards: number;
  readonly startingPopularity: number;
  readonly startingCoins: number;
}

export const FACTION_STARTING_STATS: Record<Faction, FactionStartingStats> = {
  [Faction.Nordic]: {
    faction: Faction.Nordic,
    startingPower: 4,
    startingCombatCards: 1,
    startingPopularity: 3,
    startingCoins: 5,
  },
  [Faction.Rusviet]: {
    faction: Faction.Rusviet,
    startingPower: 3,
    startingCombatCards: 2,
    startingPopularity: 3,
    startingCoins: 5,
  },
  [Faction.Crimea]: {
    faction: Faction.Crimea,
    startingPower: 5,
    startingCombatCards: 0,
    startingPopularity: 3,
    startingCoins: 5,
  },
  [Faction.Saxony]: {
    faction: Faction.Saxony,
    startingPower: 1,
    startingCombatCards: 4,
    startingPopularity: 3,
    startingCoins: 5,
  },
  [Faction.Polania]: {
    faction: Faction.Polania,
    startingPower: 0,
    startingCombatCards: 3,
    startingPopularity: 3,
    startingCoins: 5,
  },
};
