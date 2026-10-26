/** Faction identifiers — base game only */
export enum Faction {
  Nordic = "NORDIC",
  Rusviet = "RUSVIET",
  Crimea = "CRIMEA",
  Saxony = "SAXONY",
  Polania = "POLANIA",
}

/** Resource types */
export enum ResourceType {
  Food = "FOOD",
  Metal = "METAL",
  Wood = "WOOD",
  Oil = "OIL",
  Coin = "COIN",
}

/** Terrain hex types */
export enum TerrainType {
  Farm = "FARM",
  Tundra = "TUNDRA",
  Forest = "FOREST",
  Mountain = "MOUNTAIN",
  Village = "VILLAGE",
  Lake = "LAKE",
  Factory = "FACTORY",
  HomeBase = "HOME_BASE",
  Tunnel = "TUNNEL",
}

/** Structure types */
export enum StructureType {
  Mill = "MILL",
  Mine = "MINE",
  Armory = "ARMORY",
  Monument = "MONUMENT",
}

/** Unit types on the board */
export enum UnitType {
  Character = "CHARACTER",
  Mech = "MECH",
  Worker = "WORKER",
}

/** Actions available on the player mat (top row) */
export enum TopAction {
  Move = "MOVE",
  Produce = "PRODUCE",
  Trade = "TRADE",
  Bolster = "BOLSTER",
}

/** Actions available on the player mat (bottom row) */
export enum BottomAction {
  Upgrade = "UPGRADE",
  Deploy = "DEPLOY",
  Build = "BUILD",
  Enlist = "ENLIST",
}

/** Match lifecycle states */
export enum MatchPhase {
  Lobby = "LOBBY",
  Setup = "SETUP",
  Active = "ACTIVE",
  PendingCombat = "PENDING_COMBAT",
  PendingEncounter = "PENDING_ENCOUNTER",
  Ended = "ENDED",
  Abandoned = "ABANDONED",
}

/** Player connection states */
export enum ConnectionState {
  Connected = "CONNECTED",
  Disconnected = "DISCONNECTED",
  Reconnecting = "RECONNECTING",
}

/** Star conditions — ways to earn a star */
export enum StarCondition {
  AllMechs = "ALL_MECHS",
  AllStructures = "ALL_STRUCTURES",
  AllRecruits = "ALL_RECRUITS",
  AllUpgrades = "ALL_UPGRADES",
  AllWorkers = "ALL_WORKERS",
  FirstObjective = "FIRST_OBJECTIVE",
  SecondObjective = "SECOND_OBJECTIVE",
  CombatVictory1 = "COMBAT_VICTORY_1",
  CombatVictory2 = "COMBAT_VICTORY_2",
  MaxPopularity = "MAX_POPULARITY",
  MaxPower = "MAX_POWER",
}

/** Player mat identifiers */
export enum PlayerMatId {
  Industrial = "INDUSTRIAL",
  Engineering = "ENGINEERING",
  Military = "MILITARY",
  Patriotic = "PATRIOTIC",
  Agricultural = "AGRICULTURAL",
}
