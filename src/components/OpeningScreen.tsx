import type { ScenarioData } from '../core/types';

type OpeningScreenProps = {
  scenario: ScenarioData;
  onStart: () => void;
  onBack: () => void;
};

export function OpeningScreen({ scenario, onStart, onBack }: OpeningScreenProps) {
  const heading = scenario.opening?.heading || "── 指令 ──";
  const lines = scenario.opening?.lines || ["任務が開始される..."];

  return (
    <main className="opening-screen" onClick={onStart}>
      <section className="opening-screen__paper" aria-label="指令書">
        <p className="opening-screen__heading">{heading}</p>
        <div className="opening-screen__body">
          {lines.map((line, index) => (
            <p key={`${line}-${index}`}>{line || "\u00a0"}</p>
          ))}
        </div>
        <p className="opening-screen__start">▶ タップして作業開始</p>
      </section>
      <button
        className="opening-screen__back"
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onBack();
        }}
      >
        タイトルへ戻る
      </button>
    </main>
  );
}
