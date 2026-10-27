import { describe, it, expect } from "vitest";
import {
  MatchPhase,
  Faction,
  TopAction,
  BottomAction,
  ResourceType,
  UnitType,
  StarCondition,
  makeHexId,
  makeEventId,
  type GameCommand,
  type MatchState,
} from "@scythe/domain";
import { validateCommand, applyCommand, type DeterministicContext } from "../engine.js";
import { buildScenarioForPlayerCount, buildScenarioForFaction } from "@scythe/test-fixtures";

function testApply(state: MatchState, command: GameCommand): MatchState {
  let counter = 0;
  const context: DeterministicContext = {
    now: 1700000000000,
    randomInt: () => 0,
    generateEventId: () => makeEventId(`ev-${++counter}`),
  };
  return applyCommand(state, command, context).nextState;
}

describe("Common Full Turn Scenarios (Prompt 12 Deliverable 4)", () => {
  it("Scenario 1: Top Action Only (executes top action, passes bottom action, turn passes)", () => {
    const state = buildScenarioForPlayerCount(2);
    const activeSeatId = state.activeSeatId!;
    const nextSeatId = state.seats.find((s) => s.seatId !== activeSeatId)!.seatId;
    const initialPower = state.seats.find((s) => s.seatId === activeSeatId)!.power;
    const initialCoins = state.seats.find((s) => s.seatId === activeSeatId)!.coins;

    // 1. Select Section
    let s = testApply(state, {
      type: "SELECT_SECTION",
      actorSeatId: activeSeatId,
      clientSeq: 1,
      topAction: TopAction.Bolster,
    });
    expect(s.activeTurn?.selectedSection).toBe(TopAction.Bolster);

    // 2. Execute Bolster (Power)
    s = testApply(s, {
      type: "BOLSTER",
      actorSeatId: activeSeatId,
      clientSeq: 2,
      choice: "POWER",
    });
    expect(s.activeTurn?.topActionCompleted).toBe(true);

    // 3. Pass bottom action -> turn ends and passes clockwise
    s = testApply(s, {
      type: "PASS_BOTTOM_ACTION",
      actorSeatId: activeSeatId,
      clientSeq: 3,
    });

    const activeSeatAfter = s.seats.find((st) => st.seatId === activeSeatId)!;
    expect(activeSeatAfter.power).toBe(initialPower + 2);
    expect(activeSeatAfter.coins).toBe(initialCoins - 1);
    expect(s.activeSeatId).toBe(nextSeatId);
  });

  it("Scenario 2: Bottom Action Only (skips top action, takes bottom action, turn passes)", () => {
    const state = buildScenarioForPlayerCount(2);
    const activeSeatId = state.activeSeatId!;
    const nextSeatId = state.seats.find((s) => s.seatId !== activeSeatId)!.seatId;
    const seat = state.seats.find((s) => s.seatId === activeSeatId)!;

    // Give worker hex sufficient oil for Upgrade
    const worker = state.units.get(seat.unitIds[1]!)!;
    const hex = state.hexes.get(worker.locationId)!;
    hex.resources[ResourceType.Oil] = 5;

    // 1. Select Bolster section (bottom action is Upgrade on Industrial mat)
    let s = testApply(state, {
      type: "SELECT_SECTION",
      actorSeatId: activeSeatId,
      clientSeq: 1,
      topAction: TopAction.Bolster,
    });

    // 2. Execute Upgrade directly without taking Bolster top action
    s = testApply(s, {
      type: "UPGRADE",
      actorSeatId: activeSeatId,
      clientSeq: 2,
      sourceAction: TopAction.Move,
      targetAction: BottomAction.Deploy,
    });
    expect(s.activeTurn?.bottomActionCompleted).toBe(true);

    // 3. Conclude turn
    s = testApply(s, {
      type: "PASS_BOTTOM_ACTION",
      actorSeatId: activeSeatId,
      clientSeq: 3,
    });

    expect(s.activeSeatId).toBe(nextSeatId);
    const updatedSeat = s.seats.find((st) => st.seatId === activeSeatId)!;
    expect(updatedSeat.upgradesCount).toBe(1);
  });

  it("Scenario 3: Both Actions in a Single Turn (top row, then bottom row)", () => {
    const state = buildScenarioForPlayerCount(2);
    const activeSeatId = state.activeSeatId!;
    const nextSeatId = state.seats.find((s) => s.seatId !== activeSeatId)!.seatId;
    const seat = state.seats.find((s) => s.seatId === activeSeatId)!;

    // Stock metal on worker hex
    const worker = state.units.get(seat.unitIds[1]!)!;
    const hex = state.hexes.get(worker.locationId)!;
    hex.resources[ResourceType.Metal] = 5;

    // 1. Select Produce section
    let s = testApply(state, {
      type: "SELECT_SECTION",
      actorSeatId: activeSeatId,
      clientSeq: 1,
      topAction: TopAction.Produce,
    });

    // 2. Execute Produce (top action)
    s = testApply(s, {
      type: "PRODUCE",
      actorSeatId: activeSeatId,
      clientSeq: 2,
      targetHexIds: [hex.id],
    });
    expect(s.activeTurn?.topActionCompleted).toBe(true);

    // 3. Execute Deploy Mech (bottom action) on same turn
    s = testApply(s, {
      type: "DEPLOY_MECH",
      actorSeatId: activeSeatId,
      clientSeq: 3,
      targetHexId: hex.id,
      abilityId: `${seat.faction.toLowerCase()}-speed`,
    });
    expect(s.activeTurn?.bottomActionCompleted).toBe(true);

    // 4. Pass turn
    s = testApply(s, {
      type: "PASS_BOTTOM_ACTION",
      actorSeatId: activeSeatId,
      clientSeq: 4,
    });

    expect(s.activeSeatId).toBe(nextSeatId);
    const mechs = Array.from(s.units.values()).filter(
      (u) => u.owner === activeSeatId && u.unitType === UnitType.Mech,
    );
    expect(mechs).toHaveLength(1);
  });

  it("Scenario 4: Action Unavailable / Repeated Section Restriction", () => {
    // Non-Rusviet faction
    const state = buildScenarioForFaction(Faction.Nordic);
    const seat = state.seats[0]!;
    state.activeSeatId = seat.seatId;
    seat.lastSelectedSection = TopAction.Trade;

    const err = validateCommand(state, {
      type: "SELECT_SECTION",
      actorSeatId: seat.seatId,
      clientSeq: 1,
      topAction: TopAction.Trade,
    });
    expect(err?.code).toBe("ALREADY_USED_SECTION");

    // Rusviet can repeat
    const rusvietState = buildScenarioForFaction(Faction.Rusviet);
    const rusvietSeat = rusvietState.seats.find((s) => s.faction === Faction.Rusviet)!;
    rusvietState.activeSeatId = rusvietSeat.seatId;
    rusvietSeat.lastSelectedSection = TopAction.Trade;

    const rusvietErr = validateCommand(rusvietState, {
      type: "SELECT_SECTION",
      actorSeatId: rusvietSeat.seatId,
      clientSeq: 1,
      topAction: TopAction.Trade,
    });
    expect(rusvietErr).toBeNull();
  });

  it("Scenario 5: Resource Reinvestment (Trade for metal, deploy mech with that exact metal)", () => {
    const state = buildScenarioForPlayerCount(2);
    const activeSeatId = state.activeSeatId!;
    const seat = state.seats.find((s) => s.seatId === activeSeatId)!;
    seat.coins = 5;

    // Start with 2 metal on hex; Industrial deploy costs 3 metal
    const worker = state.units.get(seat.unitIds[1]!)!;
    const hex = state.hexes.get(worker.locationId)!;
    hex.resources[ResourceType.Metal] = 2;

    // 1. Select Trade section
    let s = testApply(state, {
      type: "SELECT_SECTION",
      actorSeatId: activeSeatId,
      clientSeq: 1,
      topAction: TopAction.Trade,
    });

    // 2. Trade: buy 2 Metal and put them on worker hex
    s = testApply(s, {
      type: "TRADE",
      actorSeatId: activeSeatId,
      clientSeq: 2,
      choice: {
        kind: "RESOURCES",
        destinationHexId: hex.id,
        resources: [ResourceType.Metal, ResourceType.Metal],
      },
    });

    // Hex now has 4 Metal
    expect(s.hexes.get(hex.id)?.resources[ResourceType.Metal]).toBe(4);

    // 3. Immediately spend 3 Metal on Deploy Mech on the exact same turn!
    s = testApply(s, {
      type: "DEPLOY_MECH",
      actorSeatId: activeSeatId,
      clientSeq: 3,
      targetHexId: hex.id,
      abilityId: `${seat.faction.toLowerCase()}-speed`,
    });

    // 3 metal spent -> 1 left, mech deployed
    expect(s.hexes.get(hex.id)?.resources[ResourceType.Metal]).toBe(1);
    const mechs = Array.from(s.units.values()).filter(
      (u) => u.owner === activeSeatId && u.unitType === UnitType.Mech,
    );
    expect(mechs).toHaveLength(1);
  });

  it("Scenario 6: Movement Triggering Encounter (character lands on encounter token, resolves choice)", () => {
    const state = buildScenarioForPlayerCount(2);
    const activeSeatId = state.activeSeatId!;
    const seat = state.seats.find((s) => s.seatId === activeSeatId)!;

    // Place an encounter token on an adjacent territory
    const char = state.units.get(seat.unitIds[0]!)!;
    const currentHex = state.hexes.get(char.locationId)!;
    const encHexId = currentHex.neighbours[0]!;
    const encHex = state.hexes.get(encHexId)!;
    encHex.hasEncounterToken = true;

    state.activeTurn = {
      seatId: activeSeatId,
      turnNumber: 1,
      selectedSection: TopAction.Move,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };

    // Move character to encounter hex
    const afterMove = testApply(state, {
      type: "MOVE_UNITS",
      actorSeatId: activeSeatId,
      clientSeq: 1,
      moves: [{ unitId: char.id, sourceHexId: char.locationId, targetHexId: encHexId }],
    });

    // Encounter is triggered!
    expect(afterMove.phase).toBe(MatchPhase.PendingEncounter);
    expect(afterMove.pendingEncounter?.hexId).toBe(encHexId);
    expect(afterMove.hexes.get(encHexId)?.hasEncounterToken).toBe(false); // Token removed

    // Resolve encounter option 1 (gain rewards)
    const afterEnc = testApply(afterMove, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      actorSeatId: activeSeatId,
      clientSeq: 2,
      optionIndex: 1,
    });

    // Phase restored to Active
    expect(afterEnc.phase).toBe(MatchPhase.Active);
    expect(afterEnc.pendingEncounter).toBeNull();
  });

  it("Scenario 7: Movement Triggering Combat (mech enters opponent mech hex, resolves battle)", () => {
    const state = buildScenarioForPlayerCount(2);
    const attackerSeat = state.seats[0]!;
    const defenderSeat = state.seats[1]!;

    attackerSeat.power = 6;
    defenderSeat.power = 4;

    const attackerChar = state.units.get(attackerSeat.unitIds[0]!)!;
    const defenderChar = state.units.get(defenderSeat.unitIds[0]!)!;

    // Place defender on battle hex
    const battleHexId = makeHexId("HEX_INNER_NW");
    defenderChar.locationId = battleHexId;

    // Place attacker on adjacent hex
    const battleHex = state.hexes.get(battleHexId)!;
    attackerChar.locationId = battleHex.neighbours[0]!;

    state.activeSeatId = attackerSeat.seatId;
    state.activeTurn = {
      seatId: attackerSeat.seatId,
      turnNumber: 1,
      selectedSection: TopAction.Move,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };

    // Move into enemy space -> triggers Combat
    const afterMove = testApply(state, {
      type: "MOVE_UNITS",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      moves: [
        { unitId: attackerChar.id, sourceHexId: attackerChar.locationId, targetHexId: battleHexId },
      ],
    });

    expect(afterMove.phase).toBe(MatchPhase.PendingCombat);
    expect(afterMove.pendingCombat?.combatHexId).toBe(battleHexId);

    // Attacker submits dial 4
    const afterAttacker = testApply(afterMove, {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 2,
      powerDial: 4,
    });

    // Defender submits dial 2
    const afterBoth = testApply(afterAttacker, {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: defenderSeat.seatId,
      clientSeq: 3,
      powerDial: 2,
    });

    // Combat resolved: attacker wins (4 > 2), defender retreats, phase back to Active
    expect(afterBoth.phase).toBe(MatchPhase.Active);
    expect(afterBoth.seats.find((s) => s.seatId === attackerSeat.seatId)!.stars).toContain(
      StarCondition.CombatVictory1,
    );
  });

  it("Scenario 8: Move causing territory and resource control change", () => {
    const state = buildScenarioForPlayerCount(2);
    const attackerSeat = state.seats[0]!;
    const defenderSeat = state.seats[1]!;

    // Place defender worker and 3 Wood on target hex
    const targetHexId = makeHexId("HEX_INNER_NW");
    const defWorker = state.units.get(defenderSeat.unitIds[1]!)!;
    defWorker.locationId = targetHexId;

    const targetHex = state.hexes.get(targetHexId)!;
    targetHex.resources[ResourceType.Wood] = 3;

    // Place attacker character on adjacent hex
    const attChar = state.units.get(attackerSeat.unitIds[0]!)!;
    attChar.locationId = targetHex.neighbours[0]!;

    state.activeSeatId = attackerSeat.seatId;
    state.activeTurn = {
      seatId: attackerSeat.seatId,
      turnNumber: 1,
      selectedSection: TopAction.Move,
      topActionCompleted: false,
      bottomActionCompleted: false,
    };

    const initialPop = attackerSeat.popularity;

    // Attacker moves character onto hex with enemy worker
    const afterMove = testApply(state, {
      type: "MOVE_UNITS",
      actorSeatId: attackerSeat.seatId,
      clientSeq: 1,
      moves: [{ unitId: attChar.id, sourceHexId: attChar.locationId, targetHexId: targetHexId }],
    });

    // Defender worker forced to retreat to home base!
    const updatedDefWorker = afterMove.units.get(defWorker.id)!;
    const defHomeHex = Array.from(afterMove.hexes.values()).find(
      (h) => h.homeBaseFaction === defenderSeat.faction,
    )!;
    expect(updatedDefWorker.locationId).toBe(defHomeHex.id);

    // Attacker controls the hex and wood
    expect(afterMove.hexes.get(targetHexId)?.resources[ResourceType.Wood]).toBe(3);
    const updatedAttackerSeat = afterMove.seats.find((s) => s.seatId === attackerSeat.seatId)!;
    if (attackerSeat.faction !== Faction.Polania) {
      expect(updatedAttackerSeat.popularity).toBe(Math.max(0, initialPop - 1));
    }
  });
});
