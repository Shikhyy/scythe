export type {
  BaseCommand,
  SelectSectionCommand,
  MoveUnitsCommand,
  ProduceCommand,
  TradeCommand,
  BolsterCommand,
  UpgradeCommand,
  DeployMechCommand,
  BuildStructureCommand,
  EnlistCommand,
  SubmitCombatSelectionCommand,
  ChooseEncounterOptionCommand,
  ChooseFactoryCardCommand,
  ClaimObjectiveCommand,
  PassBottomActionCommand,
  GameCommand,
} from "@scythe/domain";
export { isGameCommand, getCommandActor } from "@scythe/domain";
