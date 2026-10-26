import { describe, it, expect } from "vitest";
import { isGameCommand, getCommandActor, type GameCommand } from "./commands.js";
import { TopAction, BottomAction, ResourceType, StructureType } from "./enums.js";
import { makeCardId, makeHexId, makeSeatId, makeUnitId } from "./identifiers.js";

describe("GameCommand Runtime Type Guards & Helpers", () => {
  it("validates and extracts actor from a command", () => {
    const s1 = makeSeatId("s1");
    const cmd: GameCommand = {
      type: "SELECT_SECTION",
      actorSeatId: s1,
      clientSeq: 1,
      topAction: TopAction.Move,
      bottomAction: BottomAction.Upgrade,
    };
    expect(isGameCommand(cmd)).toBe(true);
    expect(getCommandActor(cmd)).toBe(s1);
  });

  it("returns false for non-command objects", () => {
    expect(isGameCommand(null)).toBe(false);
    expect(isGameCommand({})).toBe(false);
    expect(isGameCommand({ type: "UNKNOWN" })).toBe(false);
  });

  it("discriminates MoveUnitsCommand with unit routes", () => {
    const cmd: GameCommand = {
      type: "MOVE_UNITS",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 2,
      moves: [
        {
          unitId: makeUnitId("u1"),
          sourceHexId: makeHexId("h1"),
          targetHexId: makeHexId("h2"),
          carriedWorkers: [],
          carriedResources: { [ResourceType.Metal]: 2 },
        },
      ],
    };
    expect(isGameCommand(cmd)).toBe(true);
    if (cmd.type === "MOVE_UNITS") {
      expect(cmd.moves?.[0]?.targetHexId).toBe("h2");
    }
  });

  it("discriminates ProduceCommand with selected hex targets", () => {
    const cmd: GameCommand = {
      type: "PRODUCE",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 3,
      targetHexIds: [makeHexId("h1"), makeHexId("h2")],
    };
    expect(isGameCommand(cmd)).toBe(true);
  });

  it("discriminates TradeCommand with goods or popularity selection", () => {
    const tradeGoods: GameCommand = {
      type: "TRADE",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 4,
      choice: {
        kind: "RESOURCES",
        destinationHexId: makeHexId("h1"),
        resources: [ResourceType.Food, ResourceType.Metal],
      },
    };
    expect(isGameCommand(tradeGoods)).toBe(true);

    const tradePop: GameCommand = {
      type: "TRADE",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 5,
      choice: { kind: "POPULARITY" },
    };
    expect(isGameCommand(tradePop)).toBe(true);
  });

  it("discriminates BolsterCommand with power or combat card option", () => {
    const bolsterPower: GameCommand = {
      type: "BOLSTER",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 6,
      choice: "POWER",
    };
    expect(isGameCommand(bolsterPower)).toBe(true);

    const bolsterCard: GameCommand = {
      type: "BOLSTER",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 7,
      choice: "CARD",
    };
    expect(isGameCommand(bolsterCard)).toBe(true);
  });

  it("discriminates UpgradeCommand with source top slot and target bottom slot", () => {
    const cmd: GameCommand = {
      type: "UPGRADE",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 8,
      sourceAction: TopAction.Move,
      targetAction: BottomAction.Deploy,
    };
    expect(isGameCommand(cmd)).toBe(true);
  });

  it("discriminates DeployMechCommand with mech ability and location", () => {
    const cmd: GameCommand = {
      type: "DEPLOY_MECH",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 9,
      abilityId: "RIVERWALK",
      targetHexId: makeHexId("h1"),
    };
    expect(isGameCommand(cmd)).toBe(true);
  });

  it("discriminates BuildStructureCommand with structure type and location", () => {
    const cmd: GameCommand = {
      type: "BUILD_STRUCTURE",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 10,
      structureType: StructureType.Monument,
      targetHexId: makeHexId("h1"),
    };
    expect(isGameCommand(cmd)).toBe(true);
  });

  it("discriminates EnlistCommand with recruit section and bonus", () => {
    const cmd: GameCommand = {
      type: "ENLIST",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 11,
      bottomAction: BottomAction.Enlist,
      bonusChoice: "POWER",
    };
    expect(isGameCommand(cmd)).toBe(true);
  });

  it("discriminates SubmitCombatSelectionCommand with dial and cards", () => {
    const cmd: GameCommand = {
      type: "SUBMIT_COMBAT_SELECTION",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 12,
      powerDial: 5,
      combatCardIds: [makeCardId("cc-1"), makeCardId("cc-2")],
    };
    expect(isGameCommand(cmd)).toBe(true);
  });

  it("discriminates ChooseEncounterOptionCommand with 1-based index (1, 2, or 3)", () => {
    const cmd: GameCommand = {
      type: "CHOOSE_ENCOUNTER_OPTION",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 13,
      optionIndex: 2,
    };
    expect(isGameCommand(cmd)).toBe(true);
  });

  it("discriminates ClaimObjectiveCommand with card ID", () => {
    const cmd: GameCommand = {
      type: "CLAIM_OBJECTIVE",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 14,
      objectiveCardId: makeCardId("obj-1"),
    };
    expect(isGameCommand(cmd)).toBe(true);
  });

  it("discriminates PassBottomActionCommand", () => {
    const cmd: GameCommand = {
      type: "PASS_BOTTOM_ACTION",
      actorSeatId: makeSeatId("s1"),
      clientSeq: 15,
    };
    expect(isGameCommand(cmd)).toBe(true);
  });
});
