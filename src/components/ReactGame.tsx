import { useState } from 'react';
import type { ScenarioData } from '../core/types';
import type { AnimalCondition } from '../game/battleTypes';
import type { AccuseResult } from '../game/resolveAccuse';
import { assetUrl } from '../core/assetPath';
import { StatsManager } from '../core/StatsManager';
import { createInitialAnimalLogs, type WorkerLogBook } from '../game/workLog';
import { AccuseOutcomeScreen, AccuseScreen } from './AccuseScreen';
import { type ScenarioOption, TitleScreen } from './TitleScreen';
import { ResultScreen, type WorkDayReport } from './ResultScreen';
import { StoryScene } from './StoryScene';
import { WorkScreen } from './WorkScreen';

const SCENARIOS: ScenarioOption[] = [
  { id: 'day1', label: '第1作業日', prev: null },
  { id: 'day2', label: '第2作業日 - 狙われた性別', prev: 'day1' },
  { id: 'dayX', label: '特別作業日 - オオカミの咆哮', prev: 'day2' },
];

type ReactGamePhase = "title" | "opening" | "work" | "result" | "accuse" | "accuseResult";

type AnimalState = {
  name: string;
  from: AnimalCondition;
  to: AnimalCondition;
};

function createInitialStates(scenario: ScenarioData): AnimalState[] {
  return scenario.availableAnimals.map(animal => ({
    name: animal.name,
    from: "normal",
    to: "normal",
  }));
}

function pickInitialWolves(scenario: ScenarioData): string[] {
  const wolf = scenario.availableAnimals.find(animal => animal.canBeWolf);
  return wolf ? [wolf.name] : [];
}

export function ReactGame() {
  const [phase, setPhase] = useState<ReactGamePhase>("title");
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [animalStates, setAnimalStates] = useState<AnimalState[]>([]);
  const [logs, setLogs] = useState<WorkerLogBook>({});
  const [wolfNames, setWolfNames] = useState<string[]>([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [report, setReport] = useState<WorkDayReport | null>(null);
  const [accuseTargetName, setAccuseTargetName] = useState<string | null>(null);
  const [accuseResult, setAccuseResult] = useState<AccuseResult | null>(null);
  const [resetVersion, setResetVersion] = useState(0);

  const selectScenario = async (id: string) => {
    const response = await fetch(assetUrl(`assets/scenarios/${id}.json`));
    if (!response.ok) throw new Error(`Failed to load scenario: ${id}`);
    const data = await response.json() as ScenarioData;
    setScenario(data);
    setAnimalStates(createInitialStates(data));
    setLogs(createInitialAnimalLogs(data.availableAnimals, data.maxDays ?? 3));
    setWolfNames(pickInitialWolves(data));
    setCurrentDay(0);
    setReport(null);
    setAccuseTargetName(null);
    setAccuseResult(null);
    setPhase("opening");
  };

  const resetStats = () => {
    const ok = window.confirm("本当にデータを初期化しますか？\nこの操作は取り消せません。");
    if (!ok) return;
    StatsManager.resetStats();
    setScenario(null);
    setAnimalStates([]);
    setLogs({});
    setWolfNames([]);
    setCurrentDay(0);
    setReport(null);
    setAccuseTargetName(null);
    setAccuseResult(null);
    setPhase("title");
    setResetVersion(version => version + 1);
  };

  if (phase === "opening" && scenario) {
    return (
      <StoryScene
        scenario={scenario}
        onStart={() => {
          StatsManager.incrementTotalGames();
          setPhase("work");
        }}
        onBack={() => setPhase("title")}
      />
    );
  }

  if (phase === "work" && scenario) {
    return (
      <WorkScreen
        scenario={scenario}
        currentDay={currentDay}
        animalStates={animalStates}
        logs={logs}
        wolfNames={wolfNames}
        onBackToTitle={() => setPhase("title")}
        onResetWork={() => {
          setAnimalStates(createInitialStates(scenario));
          setLogs(createInitialAnimalLogs(scenario.availableAnimals, scenario.maxDays ?? 3));
          setWolfNames(pickInitialWolves(scenario));
          setCurrentDay(0);
          setReport(null);
        }}
        onWorkResolved={(nextReport, nextAnimalStates, nextLogs) => {
          setReport(nextReport);
          setAnimalStates(nextAnimalStates);
          setLogs(nextLogs);
          setPhase("result");
        }}
        onAccuseRequested={(targetName) => {
          setAccuseTargetName(targetName);
          setPhase("accuse");
        }}
      />
    );
  }

  if (phase === "result" && scenario && report) {
    return (
      <ResultScreen
        scenario={scenario}
        report={report}
        onBackToTitle={() => setPhase("title")}
        onNext={() => {
          if (report.playerLost) {
            setPhase("title");
            return;
          }
          setCurrentDay(day => Math.min(day + 1, scenario.maxDays ?? 3));
          setReport(null);
          setPhase("work");
        }}
      />
    );
  }

  if (phase === "accuse" && scenario && accuseTargetName) {
    return (
      <AccuseScreen
        scenario={scenario}
        targetName={accuseTargetName}
        wolfNames={wolfNames}
        onCancel={() => setPhase("work")}
        onResolved={(result) => {
          StatsManager.incrementTotalAccusations();
          if (result.isWolf) {
            StatsManager.incrementCorrectAccusations();
            StatsManager.incrementWins();
            StatsManager.markScenarioCleared(scenario.id);
          } else {
            StatsManager.incrementWrongAccusations();
          }
          setAccuseResult(result);
          setPhase("accuseResult");
        }}
      />
    );
  }

  if (phase === "accuseResult" && accuseResult) {
    return (
      <AccuseOutcomeScreen
        result={accuseResult}
        onBackToTitle={() => {
          setScenario(null);
          setAccuseTargetName(null);
          setAccuseResult(null);
          setPhase("title");
        }}
      />
    );
  }

  return (
    <TitleScreen
      key={resetVersion}
      scenarios={SCENARIOS}
      onSelectScenario={selectScenario}
      onResetStats={resetStats}
    />
  );
}
