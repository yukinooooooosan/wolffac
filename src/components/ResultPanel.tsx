type ResultPanelProps = {
  attackedNames: string[];
  playerLost: boolean;
  accusedName?: string;
  accusationResult?: "win" | "lose";
};

export function ResultPanel({
  attackedNames,
  playerLost,
  accusedName,
  accusationResult,
}: ResultPanelProps) {
  const hasResult = attackedNames.length > 0 || playerLost || accusedName;

  if (!hasResult) {
    return (
      <section className="result-panel" aria-label="結果">
        <h2 className="work-screen__section-title">結果</h2>
        <p className="result-panel__text">作業員を選抜してください。</p>
      </section>
    );
  }

  return (
    <section className="result-panel" aria-label="結果">
      <h2 className="work-screen__section-title">結果</h2>
      {attackedNames.length > 0 ? (
        <p className="result-panel__text">被害: {attackedNames.join("、")}</p>
      ) : (
        <p className="result-panel__text">被害なし</p>
      )}
      {playerLost && <p className="result-panel__text result-panel__text--danger">死亡者が出ました。</p>}
      {accusedName && (
        <p className={`result-panel__text result-panel__text--${accusationResult}`}>
          {accusedName} の処分: {accusationResult === "win" ? "成功" : "失敗"}
        </p>
      )}
    </section>
  );
}
