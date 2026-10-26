import { Faction } from "@scythe/domain";
import type { AbilityDefinition } from "./types.js";

/**
 * Authoritative Registry of all Faction Core and Mech Abilities (SRC-001 pp. 15–17, 31).
 */
export const ABILITY_REGISTRY: Record<string, AbilityDefinition> = {
  // -------------------------------------------------------------------------
  // Core Faction Abilities (5)
  // -------------------------------------------------------------------------
  "nordic-swim": {
    id: "nordic-swim",
    name: "Swim",
    faction: Faction.Nordic,
    category: "FACTION_CORE",
    source: "SRC-001 p. 11",
    description: "Nordic workers may move across rivers onto any adjacent territory.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-SPEC-001",
  },
  "rusviet-relentless": {
    id: "rusviet-relentless",
    name: "Relentless",
    faction: Faction.Rusviet,
    category: "FACTION_CORE",
    source: "SRC-001 p. 10",
    description: "Rusviet may choose the same section on their player mat on consecutive turns.",
    trigger: "TURN_START",
    isPublic: true,
    ruleId: "RULE-TURN-002",
  },
  "crimea-coercion": {
    id: "crimea-coercion",
    name: "Coercion",
    faction: Faction.Crimea,
    category: "FACTION_CORE",
    source: "SRC-001 p. 14",
    description: "Once per turn, Crimea may spend 1 Combat Card as any 1 resource.",
    trigger: "PAYMENT",
    isPublic: true,
    ruleId: "RULE-SPEC-003",
  },
  "saxony-dominate": {
    id: "saxony-dominate",
    name: "Dominate",
    faction: Faction.Saxony,
    category: "FACTION_CORE",
    source: "SRC-001 p. 27",
    description: "Saxony may achieve unlimited Combat stars and both Objective stars.",
    trigger: "STARS",
    isPublic: true,
    ruleId: "RULE-COMBAT-006",
  },
  "polania-meander": {
    id: "polania-meander",
    name: "Meander",
    faction: Faction.Polania,
    category: "FACTION_CORE",
    source: "SRC-001 p. 24",
    description: "On encounter cards, Polania may choose up to 2 options instead of 1.",
    trigger: "ENCOUNTER",
    isPublic: true,
    ruleId: "RULE-CONT-001",
  },

  // -------------------------------------------------------------------------
  // Nordic Mech Abilities (4)
  // -------------------------------------------------------------------------
  "nordic-riverwalk": {
    id: "nordic-riverwalk",
    name: "Riverwalk",
    faction: Faction.Nordic,
    category: "MECH",
    source: "SRC-001 p. 15",
    description: "Move across rivers to Forests and Mountains.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },
  "nordic-seaworthy": {
    id: "nordic-seaworthy",
    name: "Seaworthy",
    faction: Faction.Nordic,
    category: "MECH",
    source: "SRC-001 p. 15",
    description: "Move to/from lakes and retreat onto adjacent lakes after combat.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-002",
  },
  "nordic-artillery": {
    id: "nordic-artillery",
    name: "Artillery",
    faction: Faction.Nordic,
    category: "MECH",
    source: "SRC-001 p. 15",
    description: "Pay 1 power before combat to force opponent to lose 2 power.",
    trigger: "COMBAT_PREPARATION",
    isPublic: true,
    ruleId: "RULE-COMBAT-002",
  },
  "nordic-speed": {
    id: "nordic-speed",
    name: "Speed",
    faction: Faction.Nordic,
    category: "MECH",
    source: "SRC-001 p. 15",
    description: "+1 movement for character and mechs.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },

  // -------------------------------------------------------------------------
  // Rusviet Mech Abilities (4)
  // -------------------------------------------------------------------------
  "rusviet-riverwalk": {
    id: "rusviet-riverwalk",
    name: "Riverwalk",
    faction: Faction.Rusviet,
    category: "MECH",
    source: "SRC-001 p. 16",
    description: "Move across rivers to Farms and Villages.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },
  "rusviet-township": {
    id: "rusviet-township",
    name: "Township",
    faction: Faction.Rusviet,
    category: "MECH",
    source: "SRC-001 p. 16",
    description: "Controlled villages and the Factory are adjacent.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-003",
  },
  "rusviet-peoples-army": {
    id: "rusviet-peoples-army",
    name: "People's Army",
    faction: Faction.Rusviet,
    category: "MECH",
    source: "SRC-001 p. 16",
    description: "Play +1 combat card in combat if at least 1 worker is present.",
    trigger: "COMBAT_CARDS",
    isPublic: true,
    ruleId: "RULE-COMBAT-003",
  },
  "rusviet-speed": {
    id: "rusviet-speed",
    name: "Speed",
    faction: Faction.Rusviet,
    category: "MECH",
    source: "SRC-001 p. 16",
    description: "+1 movement for character and mechs.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },

  // -------------------------------------------------------------------------
  // Crimea Mech Abilities (4)
  // -------------------------------------------------------------------------
  "crimea-riverwalk": {
    id: "crimea-riverwalk",
    name: "Riverwalk",
    faction: Faction.Crimea,
    category: "MECH",
    source: "SRC-001 p. 15",
    description: "Move across rivers to Farms and Tundras.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },
  "crimea-wayfare": {
    id: "crimea-wayfare",
    name: "Wayfare",
    faction: Faction.Crimea,
    category: "MECH",
    source: "SRC-001 p. 15",
    description: "Move to any inactive faction base or own base.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-003",
  },
  "crimea-scout": {
    id: "crimea-scout",
    name: "Scout",
    faction: Faction.Crimea,
    category: "MECH",
    source: "SRC-001 p. 15",
    description: "Steal 1 random combat card from opponent before combat.",
    trigger: "COMBAT_PREPARATION",
    isPublic: true,
    ruleId: "RULE-COMBAT-002",
  },
  "crimea-speed": {
    id: "crimea-speed",
    name: "Speed",
    faction: Faction.Crimea,
    category: "MECH",
    source: "SRC-001 p. 15",
    description: "+1 movement for character and mechs.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },

  // -------------------------------------------------------------------------
  // Saxony Mech Abilities (4)
  // -------------------------------------------------------------------------
  "saxony-riverwalk": {
    id: "saxony-riverwalk",
    name: "Riverwalk",
    faction: Faction.Saxony,
    category: "MECH",
    source: "SRC-001 p. 16",
    description: "Move across rivers to Forests and Mountains.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },
  "saxony-underpass": {
    id: "saxony-underpass",
    name: "Underpass",
    faction: Faction.Saxony,
    category: "MECH",
    source: "SRC-001 p. 16",
    description: "Controlled mountains and all tunnels/Mine are adjacent.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-003",
  },
  "saxony-disarm": {
    id: "saxony-disarm",
    name: "Disarm",
    faction: Faction.Saxony,
    category: "MECH",
    source: "SRC-001 p. 16",
    description: "Opponent loses 2 power before combat on tunnel/Mine.",
    trigger: "COMBAT_PREPARATION",
    isPublic: true,
    ruleId: "RULE-COMBAT-002",
  },
  "saxony-speed": {
    id: "saxony-speed",
    name: "Speed",
    faction: Faction.Saxony,
    category: "MECH",
    source: "SRC-001 p. 16",
    description: "+1 movement for character and mechs.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },

  // -------------------------------------------------------------------------
  // Polania Mech Abilities (4)
  // -------------------------------------------------------------------------
  "polania-riverwalk": {
    id: "polania-riverwalk",
    name: "Riverwalk",
    faction: Faction.Polania,
    category: "MECH",
    source: "SRC-001 p. 17",
    description: "Move across rivers to Villages and Mountains.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },
  "polania-submerge": {
    id: "polania-submerge",
    name: "Submerge",
    faction: Faction.Polania,
    category: "MECH",
    source: "SRC-001 p. 17",
    description: "Move to/from lakes and between lakes without restriction.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-002",
  },
  "polania-camaraderie": {
    id: "polania-camaraderie",
    name: "Camaraderie",
    faction: Faction.Polania,
    category: "MECH",
    source: "SRC-001 p. 17",
    description: "Do not lose popularity when forcing worker retreats.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-004",
  },
  "polania-speed": {
    id: "polania-speed",
    name: "Speed",
    faction: Faction.Polania,
    category: "MECH",
    source: "SRC-001 p. 17",
    description: "+1 movement for character and mechs.",
    trigger: "MOVEMENT",
    isPublic: true,
    ruleId: "RULE-MOVE-001",
  },
};

export function getAbility(abilityId: string): AbilityDefinition | undefined {
  return ABILITY_REGISTRY[abilityId];
}

export function getFactionAbilities(faction: Faction): AbilityDefinition[] {
  return Object.values(ABILITY_REGISTRY).filter((a) => a.faction === faction);
}
