import type { AnimalCondition, AttackRuleType } from './battleTypes';

export type WorkDayAnimal = {
  name: string;
  role: '♂' | '♀' | '';
};

export type WorkDayAnimalState = {
  name: string;
  from: AnimalCondition;
  to: AnimalCondition;
};

export type ResolveWorkDayInput = {
  allAnimals: readonly WorkDayAnimal[];
  selectedAnimals: readonly WorkDayAnimal[];
  previousStateList: readonly WorkDayAnimalState[];
  wolfNames: readonly string[];
  attackRule: {
    injuryType?: AttackRuleType;
    attackCount?: number;
    allowWolfSelfAttack?: boolean;
  };
  random?: () => number;
};

export type ResolveWorkDayResult = {
  attackedNames: string[];
  animalStateList: WorkDayAnimalState[];
  playerLost: boolean;
};

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  return [...items].sort(() => random() - 0.5);
}

function createNoAttackStateList(
  previousStateList: readonly WorkDayAnimalState[],
): WorkDayAnimalState[] {
  return previousStateList.map(state => ({
    name: state.name,
    from: state.to,
    to: state.to,
  }));
}

function resolveNextCondition(
  current: AnimalCondition,
  isAttacked: boolean,
): AnimalCondition {
  if (!isAttacked) return current;
  if (current === "normal") return "injured";
  return "dead";
}

export function pickAttackedNames({
  selectedAnimals,
  wolfNames,
  attackRule,
  random = Math.random,
}: Omit<ResolveWorkDayInput, "allAnimals" | "previousStateList">): string[] {
  const hasWolf = selectedAnimals.some(animal => wolfNames.includes(animal.name));
  if (!hasWolf) return [];

  if (attackRule.injuryType === "maleOnly") {
    const candidates = selectedAnimals.filter(animal =>
      animal.role === '♂' && !wolfNames.includes(animal.name)
    );

    if (candidates.length >= 2) {
      return shuffled(candidates, random).slice(0, 2).map(animal => animal.name);
    }

    if (candidates.length === 1) {
      return [candidates[0].name];
    }

    return [];
  }

  if (attackRule.injuryType === "self") {
    return selectedAnimals
      .filter(animal => wolfNames.includes(animal.name))
      .map(animal => animal.name);
  }

  const attackCount = attackRule.attackCount ?? 1;
  const candidates = attackRule.allowWolfSelfAttack
    ? selectedAnimals
    : selectedAnimals.filter(animal => !wolfNames.includes(animal.name));

  return shuffled(candidates, random).slice(0, attackCount).map(animal => animal.name);
}

export function resolveWorkDay({
  allAnimals,
  selectedAnimals,
  previousStateList,
  wolfNames,
  attackRule,
  random = Math.random,
}: ResolveWorkDayInput): ResolveWorkDayResult {
  const attackedNames = pickAttackedNames({
    selectedAnimals,
    wolfNames,
    attackRule,
    random,
  });

  const animalStateList = attackedNames.length === 0
    ? createNoAttackStateList(previousStateList)
    : allAnimals.flatMap(animal => {
      const previousState = previousStateList.find(state => state.name === animal.name);
      if (!previousState) return [];

      const fromState = previousState.to;
      const toState = resolveNextCondition(fromState, attackedNames.includes(animal.name));

      return [{
        name: animal.name,
        from: fromState,
        to: toState,
      }];
    });

  return {
    attackedNames,
    animalStateList,
    playerLost: animalStateList.some(state => state.to === "dead"),
  };
}
