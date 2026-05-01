import { useEffect, useMemo, useRef, useState } from 'react';
import type { AnimalData, ScenarioData } from '../core/types';
import { assetUrl } from '../core/assetPath';
import { EffectCanvasLayer } from '../effects/EffectCanvasLayer';
import { effectBus } from '../effects/effectBus';
import type { Point } from '../effects/effectTypes';
import {
  DEFAULT_ACCUSE_HOLD_CONFIG,
  resolveAccusation,
  type AccuseResult,
} from '../game/resolveAccuse';

type AccuseCue = "select" | "hold1" | "hold2" | "confirm" | "cancel";

type AccuseScreenProps = {
  scenario: ScenarioData;
  targetName: string;
  wolfNames: readonly string[];
  onCancel: () => void;
  onResolved: (result: AccuseResult) => void;
};

type AccuseOutcomeScreenProps = {
  result: AccuseResult;
  onBackToTitle: () => void;
};

const HOLD_FRAME_MS = 16;
const HOLD_CONFIRM_MS = DEFAULT_ACCUSE_HOLD_CONFIG.confirmFrames * HOLD_FRAME_MS;
const HOLD_1_MS = DEFAULT_ACCUSE_HOLD_CONFIG.hold1Frame * HOLD_FRAME_MS;
const HOLD_2_MS = DEFAULT_ACCUSE_HOLD_CONFIG.hold2Frame * HOLD_FRAME_MS;

function getElementCenter(element: HTMLElement | null): Point {
  if (!element) {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
  }

  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function stableRandomIndex(animalName: string, cue: AccuseCue, arrayLength: number): number {
  if (arrayLength === 0) return 0;

  const str = `${animalName}:accuse:${cue}`;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) % arrayLength;
}

function pickLine(animal: AnimalData, cue: AccuseCue, lines: string[] | undefined): string | undefined {
  if (!lines || lines.length === 0) return undefined;
  return lines[stableRandomIndex(animal.name, cue, lines.length)];
}

function firstLine(animal: AnimalData, cue: AccuseCue, isWolf: boolean): string {
  const accused = animal.lines.accused;
  if (cue === "confirm" && isWolf) {
    const wolfLine = pickLine(animal, cue, accused?.confirmWolf);
    if (wolfLine) return wolfLine;
  }
  const line = pickLine(animal, cue, accused?.[cue]);
  if (line) return line;

  if (cue === "hold1") return "待ってよ！";
  if (cue === "hold2") return "ほんとにやるの！？";
  if (cue === "confirm") return "……さようなら。";
  if (cue === "cancel") return "やめるなら今だよ！";
  return "え？ わたし？";
}

export function AccuseScreen({
  scenario,
  targetName,
  wolfNames,
  onCancel,
  onResolved,
}: AccuseScreenProps) {
  const animal = scenario.availableAnimals.find(candidate => candidate.name === targetName);
  const [holding, setHolding] = useState(false);
  const [locked, setLocked] = useState(false);
  const [cue, setCue] = useState<AccuseCue>("select");
  const timersRef = useRef<number[]>([]);
  const targetRef = useRef<HTMLDivElement>(null);

  const isWolf = useMemo(() => {
    return animal ? (animal.isWolf ?? wolfNames.includes(animal.name)) : false;
  }, [animal, wolfNames]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current) window.clearTimeout(timer);
      timersRef.current = [];
    };
  }, []);

  if (!animal) {
    return (
      <main className="accuse-screen">
        <p className="accuse-screen__missing">対象が見つかりません。</p>
        <button className="command-panel__button" type="button" onClick={onCancel}>戻る</button>
      </main>
    );
  }

  const clearTimers = () => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  };

  const startHold = () => {
    if (locked) return;
    clearTimers();
    setHolding(true);
    setCue("select");
    effectBus.emit({ type: "focusLines", center: getElementCenter(targetRef.current) });

    timersRef.current = [
      window.setTimeout(() => setCue("hold1"), HOLD_1_MS),
      window.setTimeout(() => setCue("hold2"), HOLD_2_MS),
      window.setTimeout(() => {
        setLocked(true);
        setHolding(false);
        setCue("confirm");
        const center = getElementCenter(targetRef.current);
        effectBus.emit({ type: "slash", from: { x: center.x - 180, y: center.y - 180 }, to: { x: center.x + 180, y: center.y + 160 } });
        window.setTimeout(() => {
          effectBus.emit({ type: "explosion", at: center });
          effectBus.emit({ type: "damageNumber", at: { x: center.x, y: center.y - 72 }, value: 9 });
        }, 120);
        const result = resolveAccusation(animal, wolfNames);
        window.setTimeout(() => onResolved(result), 900);
      }, HOLD_CONFIRM_MS),
    ];
  };

  const cancelHold = () => {
    if (!holding || locked) return;
    clearTimers();
    setHolding(false);
    setCue("cancel");
  };

  return (
    <main className={`accuse-screen accuse-screen--cue-${cue}${holding ? " is-holding" : ""}${locked ? " is-locked" : ""}`}>
      <EffectCanvasLayer />
      <div className="accuse-screen__danger-vignette" aria-hidden="true" />
      <header className="accuse-screen__header">
        <p className="work-screen__eyebrow">処分実行</p>
        <h1 className="accuse-screen__title">告発シーン</h1>
      </header>

      <section className="accuse-screen__stage" aria-label="処分対象">
        <button className="accuse-screen__back" type="button" onClick={onCancel} disabled={locked}>
          戻る
        </button>
        <div className="accuse-screen__target" ref={targetRef}>
          <div className="accuse-screen__halo" aria-hidden="true" />
          <img className="accuse-screen__image" src={assetUrl(`assets/animals/${animal.image}`)} alt="" />
          <p className="accuse-screen__name">{animal.name}</p>
          <p className="accuse-screen__target-note">処分対象</p>
        </div>
        <div className={`accuse-screen__bubble accuse-screen__bubble--${cue}`}>
          {firstLine(animal, cue, isWolf)}
        </div>
      </section>

      <section className="accuse-screen__controls" aria-label="処分確認">
        <p className="accuse-screen__hold-label">
          {locked ? "処分確定" : holding ? "確定処理中..." : "長押しで処分確定"}
        </p>
        <div className="accuse-screen__gauge" aria-hidden="true">
          <div
            className="accuse-screen__gauge-fill"
            style={{ animationDuration: `${HOLD_CONFIRM_MS}ms` }}
          />
        </div>
        <button
          className="accuse-screen__dispose"
          type="button"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          disabled={locked}
        >
          処分
        </button>
      </section>
    </main>
  );
}

export function AccuseOutcomeScreen({ result, onBackToTitle }: AccuseOutcomeScreenProps) {
  const isWin = result.result === "win";

  return (
    <main className={`accuse-outcome accuse-outcome--${result.result}`}>
      <div className="accuse-outcome__flare" aria-hidden="true" />
      <section className="accuse-outcome__content">
        <p className="work-screen__eyebrow">{isWin ? "業務完了" : "業務失敗"}</p>
        <h1 className="accuse-outcome__title">{isWin ? "WIN" : "LOSE..."}</h1>
        <p className="accuse-outcome__message">
          {isWin
            ? `${result.animalName}を処分しました。`
            : `${result.animalName} はオオカミではありませんでした。`}
        </p>
        <p className="accuse-outcome__submessage">
          {isWin
            ? "工場内の脅威は排除されました。"
            : "誤った処分により、作業計画は破綻しました。"}
        </p>
        <button className="command-panel__button" type="button" onClick={onBackToTitle}>
          タイトルへ戻る
        </button>
      </section>
    </main>
  );
}
