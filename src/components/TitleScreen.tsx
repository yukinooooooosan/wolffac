import { StatsManager } from '../core/StatsManager';
import { assetUrl } from '../core/assetPath';

export type ScenarioOption = {
  id: string;
  label: string;
  prev: string | null;
};

type TitleScreenProps = {
  scenarios: readonly ScenarioOption[];
  onSelectScenario: (id: string) => void;
  onResetStats: () => void;
};

export function TitleScreen({ scenarios, onSelectScenario, onResetStats }: TitleScreenProps) {
  return (
    <main className="title-screen">
      <div className="title-screen__shade" />
      <section className="title-screen__content" aria-label="タイトル">
        <h1 className="title-screen__title">オオカミ工場</h1>
        <div className="title-screen__scenarios" aria-label="作業日選択">
          {scenarios.map(scenario => {
            const locked = Boolean(scenario.prev && !StatsManager.isScenarioCleared(scenario.prev));
            return (
              <button
                className={`title-screen__scenario${locked ? " is-locked" : ""}`}
                key={scenario.id}
                type="button"
                onClick={() => onSelectScenario(scenario.id)}
                disabled={locked}
              >
                {locked ? "LOCKED" : scenario.label}
              </button>
            );
          })}
        </div>
      </section>
      <footer className="title-screen__footer">
        <a className="title-screen__link" href={assetUrl("manual/index.html")} target="_blank" rel="noreferrer">
          操作説明書
        </a>
        <button className="title-screen__reset" type="button" onClick={onResetStats}>
          データ初期化
        </button>
      </footer>
    </main>
  );
}
