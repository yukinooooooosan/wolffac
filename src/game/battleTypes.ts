export type AnimalCondition = "normal" | "injured" | "dead";

export type AnimalRole = "male" | "female" | "unknown";

export type WorkPhase =
  | "title"
  | "opening"
  | "selectingWorkers"
  | "resolvingWork"
  | "showingResult"
  | "accusing"
  | "gameOver"
  | "cleared";

export type GameResult = "playing" | "win" | "lose";

export type AttackRuleType = "random" | "targeted" | "maleOnly" | "self";

export type WorkAttackRule = {
  injuryType: AttackRuleType;
  maxInjuriesPerTurn: number;
  allowWolfSelfAttack: boolean;
  attackCount: number;
};

export type AnimalWorkState = {
  id: string;
  name: string;
  role: AnimalRole;
  condition: AnimalCondition;
  previousCondition: AnimalCondition;
  canBeWolf: boolean;
  isWolfKnown: boolean;
};

export type DailyAnimalLog = {
  animalId: string;
  animalName: string;
  day: number;
  selected: boolean | null;
  injured: boolean;
  conditionBefore: AnimalCondition;
  conditionAfter: AnimalCondition;
};

export type WorkDayInput = {
  day: number;
  selectedAnimalIds: string[];
  wolfAnimalIds: string[];
  animals: AnimalWorkState[];
  attackRule: WorkAttackRule;
};

export type WorkDayResult = {
  day: number;
  selectedAnimalIds: string[];
  attackedAnimalIds: string[];
  animals: AnimalWorkState[];
  logs: DailyAnimalLog[];
  playerLost: boolean;
};

export type WorkGameState = {
  phase: WorkPhase;
  scenarioId: string;
  scenarioTitle: string;
  currentDay: number;
  maxDays: number;
  selectCount: number;
  animals: AnimalWorkState[];
  wolfAnimalIds: string[];
  logs: DailyAnimalLog[];
  result: GameResult;
};

export type BattlePhase =
  | "ready"
  | "selecting"
  | "resolving"
  | "animating"
  | "checkingResult"
  | "result";

export type UnitSide = "player" | "enemy";

export type UnitVisualState =
  | "idle"
  | "attacking"
  | "damaged"
  | "down"
  | "holding"
  | "selected";

export type UnitState = {
  id: string;
  name: string;
  side: UnitSide;
  hp: number;
  maxHp: number;
  status: string[];
  visualState: UnitVisualState;
};

export type BattleLogKind =
  | "system"
  | "selection"
  | "attack"
  | "damage"
  | "condition"
  | "accuse"
  | "result";

export type BattleLogEntry = {
  id: string;
  turn: number;
  day?: number;
  kind: BattleLogKind;
  message: string;
  actorId?: string;
  targetId?: string;
  value?: number;
};

export type BattleState = {
  phase: BattlePhase;
  turn: number;
  units: UnitState[];
  selectedActionId?: string;
  selectedTargetId?: string;
  log: BattleLogEntry[];
  result: GameResult;
};

export type AccusePhase = "idle" | "holding" | "confirmed" | "cancelled";

export type AccuseState = {
  phase: AccusePhase;
  selectedAnimalId: string;
  progress: number;
  confirmed: boolean;
};
