import { useEffect } from 'react';
import type { AnimalData, ScenarioData } from '../core/types';
import { assetUrl } from '../core/assetPath';
import { EffectCanvasLayer } from '../effects/EffectCanvasLayer';
import { effectBus } from '../effects/effectBus';
import type { Point } from '../effects/effectTypes';
import type { AnimalCondition } from '../game/battleTypes';

export type ResultAnimalState = {
  name: string;
  from: AnimalCondition;
  to: AnimalCondition;
};

export type WorkDayReport = {
  day: number;
  selectedAnimals: AnimalData[];
  animalStateList: ResultAnimalState[];
  attackedNames: string[];
  playerLost: boolean;
};

type ResultScreenProps = {
  scenario: ScenarioData;
  report: WorkDayReport;
  onNext: () => void;
  onBackToTitle: () => void;
};

function getElementCenter(element: HTMLElement): Point {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function getStatusLabel(state: ResultAnimalState | undefined): string {
  if (!state) return "異常なし";
  if (state.to === "dead") return "死亡";
  if (state.from === "normal" && state.to === "injured") return "負傷";
  if (state.from === "injured" && state.to === "injured") return "負傷継続";
  return "異常なし";
}

function getLineCategory(state: ResultAnimalState | undefined, attackedCount: number): string {
  if (state?.to === "dead") return "dead";
  if (state?.from === "normal" && state.to === "injured") return "injured";
  if (state?.from === "injured" && state.to === "injured") return "survivedWhileInjured";
  if (attackedCount > 0) return "otherinjured";
  return "normal";
}

function stableRandomIndex(animalName: string, category: string, day: number, arrayLength: number): number {
  if (arrayLength === 0) return 0;

  const str = `${animalName}:${category}:${day}`;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) % arrayLength;
}

function formatAttackedNames(names: readonly string[]): string {
  if (names.length === 0) return "被害者";
  if (names.length === 1) return names[0];
  return names.join("と");
}

function getLine(animal: AnimalData, state: ResultAnimalState | undefined, report: WorkDayReport): string {
  const attackedCount = report.attackedNames.length;
  const category = state?.to === "dead"
    ? "dead"
    : state?.from === "normal" && state.to === "injured"
      ? "injured"
      : state?.from === "injured" && state.to === "injured"
        ? "survivedWhileInjured"
        : attackedCount > 0
          ? "otherinjured"
          : "normal";

  const lines = (animal.lines as Record<string, string[] | undefined>)?.[category];
  const source = lines && lines.length > 0 ? lines : ["無事に終わったよ！"];
  const raw = source[stableRandomIndex(animal.name, category, report.day, source.length)];

  return raw
    .replace(/{name}/g, formatAttackedNames(report.attackedNames))
    .replace(/{count}/g, String(attackedCount));
}

function getResultClass(state: ResultAnimalState | undefined, attackedCount: number): string {
  const category = getLineCategory(state, attackedCount);
  if (category === "survivedWhileInjured") return "survived";
  if (category === "otherinjured") return "witness";
  return state?.to ?? "normal";
}

export function ResultScreen({ scenario, report, onNext, onBackToTitle }: ResultScreenProps) {
  const sectionTitle = scenario.sectionTitle || "作業A工区";
  const attackedCount = report.attackedNames.length;
  const deadName = report.animalStateList.find(state => state.to === "dead")?.name;
  const flyLabel = report.playerLost
    ? "死亡"
    : attackedCount > 0
      ? "負傷"
      : "異常なし";

  useEffect(() => {
    if (report.attackedNames.length === 0) return;

    const timers = report.attackedNames.flatMap((name, index) => {
      const delay = 180 + index * 180;
      const hitTimer = window.setTimeout(() => {
        const element = document.querySelector<HTMLElement>(`[data-result-name="${name}"]`);
        if (!element) return;

        const state = report.animalStateList.find(item => item.name === name);
        const center = getElementCenter(element);
        const at = { x: center.x - element.getBoundingClientRect().width * 0.32, y: center.y };

        effectBus.emit({ type: "focusLines", center: at });
        effectBus.emit({ type: state?.to === "dead" ? "explosion" : "hit", at });
        effectBus.emit({ type: "damageNumber", at: { x: at.x, y: at.y - 46 }, value: state?.to === "dead" ? 2 : 1 });
      }, delay);

      return [hitTimer];
    });

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [report]);

  return (
    <main
      className={`work-result-screen ${attackedCount > 0 ? "has-incident" : "is-clear"} ${report.playerLost ? "has-death" : ""}`}
      onClick={(event) => {
        if ((event.target as HTMLElement).closest("button")) return;
        onNext();
      }}
    >
      <EffectCanvasLayer />
      <div className="work-result-screen__flash" aria-hidden="true" />
      <div className="work-result-screen__fly-label" aria-hidden="true">{flyLabel}</div>
      <header className="work-result-screen__header">
        <p className="work-screen__eyebrow">作業報告</p>
        <h1 className="work-result-screen__title">{sectionTitle}　第{report.day + 1}日目作業報告</h1>
        <p className="work-result-screen__hint">画面をクリック / タップで次へ</p>
      </header>

      <section className="work-result-screen__list" aria-label="作業報告">
        {report.selectedAnimals.map(animal => {
          const state = report.animalStateList.find(item => item.name === animal.name);
          const label = getStatusLabel(state);
          const resultClass = getResultClass(state, attackedCount);
          return (
            <article className={`work-result-card work-result-card--${resultClass}`} data-result-name={animal.name} key={animal.name}>
              <div className="work-result-card__portrait">
                <img className="work-result-card__image" src={assetUrl(`assets/animals/${animal.image}`)} alt="" />
                {label !== "異常なし" && <span className="work-result-card__label">{label}</span>}
              </div>
              <div className="work-result-card__body">
                <div className="work-result-card__topline">
                  <h2 className="work-result-card__name">{animal.name}</h2>
                  <span className="work-result-card__status">{label}</span>
                </div>
                <p className="work-result-card__speech">{getLine(animal, state, report)}</p>
              </div>
            </article>
          );
        })}
      </section>

      <footer className="work-result-screen__footer">
        {report.playerLost ? (
          <p className="work-result-screen__danger">
            {deadName ?? "作業員"} は2度目の襲撃により倒れました。
          </p>
        ) : (
          <p className="work-result-screen__summary">
            {attackedCount > 0 ? `被害: ${report.attackedNames.join("、")}` : "本日の被害はありません。"}
          </p>
        )}
        <div className="work-result-screen__actions">
          <button className="command-panel__button command-panel__button--ghost" type="button" onClick={onBackToTitle}>
            タイトルへ
          </button>
          <button className="command-panel__button" type="button" onClick={onNext}>
            {report.playerLost ? "確認" : "次へ"}
          </button>
        </div>
      </footer>
    </main>
  );
}
