import { useEffect, useMemo, useState } from 'react';
import type { ScenarioData } from '../core/types';
import { EffectCanvasLayer } from '../effects/EffectCanvasLayer';
import { effectBus } from '../effects/effectBus';

type StorySceneProps = {
  scenario: ScenarioData;
  onStart: () => void;
  onBack: () => void;
};

type StoryPanel = {
  label: string;
  title: string;
  body: string;
  tone: "night" | "alert" | "directive";
};

function createStoryPanels(scenario: ScenarioData): StoryPanel[] {
  const sectionTitle = scenario.sectionTitle || "作業A工区";
  const openingLines = (scenario.opening?.lines ?? []).filter(line => line.trim().length > 0);
  const firstLine = openingLines[0] ?? `${sectionTitle}にて作業指令を受信。`;
  const warningLine = openingLines.find(line => /オオカミ|異常|警告|報告/.test(line) && line !== firstLine)
    ?? openingLines[1]
    ?? "対象群に潜むオオカミの存在が報告されている。";
  const directiveLine = openingLines
    .filter(line => line !== firstLine && line !== warningLine)
    .join("\n") || "選定・監督は慎重に行うこと。";

  return [
    {
      label: "01",
      title: "夜間工場",
      body: firstLine,
      tone: "night",
    },
    {
      label: "02",
      title: "警告",
      body: warningLine,
      tone: "alert",
    },
    {
      label: "03",
      title: scenario.opening?.heading || "指令書",
      body: directiveLine,
      tone: "directive",
    },
  ];
}

export function StoryScene({ scenario, onStart, onBack }: StorySceneProps) {
  const panels = useMemo(() => createStoryPanels(scenario), [scenario]);
  const [index, setIndex] = useState(0);
  const panel = panels[index];
  const isLast = index >= panels.length - 1;

  useEffect(() => {
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.42,
    };

    if (panel.tone === "alert") {
      effectBus.emit({ type: "focusLines", center });
    } else if (panel.tone === "directive") {
      effectBus.emit({ type: "hit", at: center });
    }
  }, [panel]);

  const goNext = () => {
    if (isLast) {
      onStart();
      return;
    }

    setIndex(current => Math.min(current + 1, panels.length - 1));
  };

  return (
    <main className={`story-scene story-scene--${panel.tone}`} onClick={goNext}>
      <EffectCanvasLayer />
      <section className="story-scene__panel" aria-label="ショートストーリー">
        <p className="story-scene__label">{panel.label}</p>
        <h1 className="story-scene__title">{panel.title}</h1>
        <div className="story-scene__body">
          {panel.body.split("\n").map((line, lineIndex) => (
            <p key={`${line}-${lineIndex}`}>{line}</p>
          ))}
        </div>
      </section>

      <div className="story-scene__controls">
        <button
          className="story-scene__button story-scene__button--ghost"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onBack();
          }}
        >
          戻る
        </button>
        <button
          className="story-scene__button story-scene__button--ghost"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onStart();
          }}
        >
          スキップ
        </button>
        <button
          className="story-scene__button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            goNext();
          }}
        >
          {isLast ? "作業開始" : "次へ"}
        </button>
      </div>
    </main>
  );
}
