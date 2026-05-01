import type { AnimalCondition, DailyAnimalLog } from './battleTypes';

export type WorkerDayLog = {
  selected: boolean | null;
  injured: boolean;
};

export type WorkerLogBook = Record<string, WorkerDayLog[]>;

export type WorkLogAnimal = {
  name: string;
};

export type WorkLogAnimalState = {
  name: string;
  from: AnimalCondition;
  to: AnimalCondition;
};

type CreateDailyAnimalLogsInput = {
  animals: readonly WorkLogAnimal[];
  stateList: readonly WorkLogAnimalState[];
  selectedNames: readonly string[];
  day: number;
};

type ApplyWorkDayLogsInput = CreateDailyAnimalLogsInput & {
  currentLogs: WorkerLogBook;
};

export function createInitialAnimalLogs(
  animals: readonly WorkLogAnimal[],
  maxDays: number,
): WorkerLogBook {
  return Object.fromEntries(
    animals.map(animal => [
      animal.name,
      Array.from({ length: maxDays }, () => ({
        selected: null,
        injured: false,
      })),
    ]),
  );
}

export function createDailyAnimalLogs({
  animals,
  stateList,
  selectedNames,
  day,
}: CreateDailyAnimalLogsInput): DailyAnimalLog[] {
  const selectedNameSet = new Set(selectedNames);

  return animals.map(animal => {
    const state = stateList.find(s => s.name === animal.name);
    const conditionBefore = state?.from ?? "normal";
    const conditionAfter = state?.to ?? conditionBefore;

    return {
      animalId: animal.name,
      animalName: animal.name,
      day,
      selected: selectedNameSet.has(animal.name),
      injured: conditionAfter === "injured" || conditionAfter === "dead",
      conditionBefore,
      conditionAfter,
    };
  });
}

export function applyWorkDayLogs({
  currentLogs,
  animals,
  stateList,
  selectedNames,
  day,
}: ApplyWorkDayLogsInput): WorkerLogBook {
  const nextLogs: WorkerLogBook = { ...currentLogs };
  const dailyLogs = createDailyAnimalLogs({ animals, stateList, selectedNames, day });

  for (const log of dailyLogs) {
    const entries = [...(nextLogs[log.animalName] ?? [])];
    entries[day] = {
      selected: log.selected,
      injured: log.injured,
    };
    nextLogs[log.animalName] = entries;
  }

  return nextLogs;
}
