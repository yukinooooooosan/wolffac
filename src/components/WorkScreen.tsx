import { useEffect, useMemo, useState } from 'react';
import type { ScenarioData } from '../core/types';
import { EffectCanvasLayer } from '../effects/EffectCanvasLayer';
import { effectBus } from '../effects/effectBus';
import type { Point } from '../effects/effectTypes';
import type { AnimalCondition, UnitVisualState } from '../game/battleTypes';
import { resolveWorkDay } from '../game/resolveWorkDay';
import { applyWorkDayLogs, type WorkerLogBook } from '../game/workLog';
import { CommandPanel } from './CommandPanel';
import { LedgerPanel } from './LedgerPanel';
import { LogPanel } from './LogPanel';
import type { WorkDayReport } from './ResultScreen';
import { UnitView } from './UnitView';

type AnimalState = {
  name: string;
  from: AnimalCondition;
  to: AnimalCondition;
};

type WorkResult = {
  attackedNames: string[];
  playerLost: boolean;
};

type VisualStateByName = Record<string, UnitVisualState>;

function getUnitCenter(name: string): Point | undefined {
  const elements = document.querySelectorAll<HTMLElement>(".unit-view[data-unit-name]");
  const element = Array.from(elements).find(candidate => candidate.dataset.unitName === name);
  if (!element) return undefined;

  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getViewportCenter(): Point {
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}

type WorkScreenProps = {
  scenario: ScenarioData;
  currentDay: number;
  animalStates: AnimalState[];
  logs: WorkerLogBook;
  wolfNames: readonly string[];
  onBackToTitle: () => void;
  onResetWork: () => void;
  onWorkResolved: (report: WorkDayReport, nextAnimalStates: AnimalState[], nextLogs: WorkerLogBook) => void;
  onAccuseRequested: (targetName: string) => void;
};

export function WorkScreen({
  scenario,
  currentDay,
  animalStates,
  logs,
  wolfNames,
  onBackToTitle,
  onResetWork,
  onWorkResolved,
  onAccuseRequested,
}: WorkScreenProps) {
  const [selectedNames, setSelectedNames] = useState<Set<string>>(() => new Set());
  const [workResult, setWorkResult] = useState<WorkResult>({ attackedNames: [], playerLost: false });
  const [visualStateByName, setVisualStateByName] = useState<VisualStateByName>({});
  const [isLedgerOpen, setLedgerOpen] = useState(false);

  useEffect(() => {
    setSelectedNames(new Set());
    setWorkResult({ attackedNames: [], playerLost: false });
    setVisualStateByName({});
    setLedgerOpen(false);
  }, [scenario]);

  const stateByName = useMemo(() => {
    return new Map(animalStates.map(state => [state.name, state]));
  }, [animalStates]);

  const maxDays = scenario.maxDays ?? 3;
  const sectionTitle = scenario.sectionTitle || "作業A工区";
  const displayDay = currentDay + 1 > maxDays ? "工場閉鎖日" : `第${currentDay + 1}稼働日`;
  const isWorkClosed = currentDay >= maxDays || workResult.playerLost;
  const canStart = selectedNames.size === scenario.selectCount && !isWorkClosed;
  const canAccuse = selectedNames.size === 1;

  const toggleAnimal = (name: string) => {
    setSelectedNames(current => {
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < scenario.selectCount) {
        next.add(name);
      }
      return next;
    });
  };

  const reset = () => {
    setSelectedNames(new Set());
    setWorkResult({ attackedNames: [], playerLost: false });
    setVisualStateByName({});
    onResetWork();
  };

  const startWork = () => {
    if (!canStart) return;

    const selectedAnimals = scenario.availableAnimals.filter(animal => selectedNames.has(animal.name));
    const result = resolveWorkDay({
      allAnimals: scenario.availableAnimals,
      selectedAnimals,
      previousStateList: animalStates,
      wolfNames,
      attackRule: {
        injuryType: scenario.wolfAttackRule?.injuryType,
        attackCount: scenario.wolfAttackRule?.attackCount,
        allowWolfSelfAttack: scenario.wolfAttackRule?.allowWolfSelfAttack ?? false,
      },
    });

    const nextVisualState: VisualStateByName = {};
    for (const animal of selectedAnimals) {
      nextVisualState[animal.name] = "attacking";
    }
    for (const name of result.attackedNames) {
      const nextState = result.animalStateList.find(state => state.name === name);
      nextVisualState[name] = nextState?.to === "dead" ? "down" : "damaged";
    }

    setVisualStateByName(nextVisualState);

    window.setTimeout(() => {
      const fallbackSource = getUnitCenter(selectedAnimals[0]?.name ?? "") ?? getViewportCenter();
      for (const name of result.attackedNames) {
        const target = getUnitCenter(name) ?? getViewportCenter();
        const source = selectedAnimals.find(animal => animal.name !== name);
        const from = source ? getUnitCenter(source.name) ?? fallbackSource : fallbackSource;
        const nextState = result.animalStateList.find(state => state.name === name);

        effectBus.emit({ type: "focusLines", center: target });
        effectBus.emit({ type: "slash", from, to: target });
        window.setTimeout(() => {
          effectBus.emit({ type: nextState?.to === "dead" ? "explosion" : "hit", at: target });
          effectBus.emit({ type: "damageNumber", at: { x: target.x, y: target.y - 34 }, value: nextState?.to === "dead" ? 2 : 1 });
        }, 120);
      }
    }, 40);

    const nextLogs = applyWorkDayLogs({
      currentLogs: logs,
      animals: scenario.availableAnimals,
      stateList: result.animalStateList,
      selectedNames: [...selectedNames],
      day: currentDay,
    });

    setWorkResult({
      attackedNames: result.attackedNames,
      playerLost: result.playerLost,
    });
    setSelectedNames(new Set());

    window.setTimeout(() => {
      setVisualStateByName({});
      onWorkResolved({
        day: currentDay,
        selectedAnimals,
        animalStateList: result.animalStateList,
        attackedNames: result.attackedNames,
        playerLost: result.playerLost,
      }, result.animalStateList, nextLogs);
    }, 720);
  };

  const accuse = () => {
    const [name] = selectedNames;
    if (!name) return;
    onAccuseRequested(name);
  };

  return (
    <main className="work-screen">
      <EffectCanvasLayer />
      <header className="work-screen__header">
        <div>
          <p className="work-screen__eyebrow">作業管理画面</p>
          <h1 className="work-screen__title">{sectionTitle}　{displayDay}</h1>
        </div>
        <div className="work-screen__meta">
          <span>選抜 {scenario.selectCount} 匹</span>
          <span>{scenario.wolfAttackRule.injuryType}</span>
          <button className="work-screen__back" type="button" onClick={onBackToTitle}>
            タイトルへ
          </button>
        </div>
      </header>

      <section className="work-screen__board" aria-label="作業員">
        {scenario.availableAnimals.map(animal => {
          const state = stateByName.get(animal.name);
          const condition = state?.to ?? "normal";
          return (
            <UnitView
              key={animal.name}
              name={animal.name}
              role={animal.role}
              image={animal.image}
              condition={condition}
              visualState={visualStateByName[animal.name] ?? "idle"}
              selected={selectedNames.has(animal.name)}
              disabled={condition === "dead" || workResult.playerLost}
              logs={logs[animal.name] ?? []}
              maxDays={maxDays}
              onToggle={() => toggleAnimal(animal.name)}
            />
          );
        })}
      </section>

      <div className="work-screen__lower">
        <CommandPanel
          selectedCount={selectedNames.size}
          requiredCount={scenario.selectCount}
          currentDay={currentDay}
          maxDays={maxDays}
          canStart={canStart}
          canAccuse={canAccuse}
          onStartWork={startWork}
          onOpenLedger={() => setLedgerOpen(true)}
          onAccuse={accuse}
          onReset={reset}
        />
        <LogPanel logs={logs} maxDays={maxDays} />
      </div>

      {isLedgerOpen && (
        <LedgerPanel
          scenario={scenario}
          animalStates={animalStates}
          currentDay={currentDay}
          onClose={() => setLedgerOpen(false)}
        />
      )}
    </main>
  );
}
