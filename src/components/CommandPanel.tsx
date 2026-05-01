type CommandPanelProps = {
  selectedCount: number;
  requiredCount: number;
  currentDay: number;
  maxDays: number;
  canStart: boolean;
  canAccuse: boolean;
  onStartWork: () => void;
  onOpenLedger: () => void;
  onAccuse: () => void;
  onReset: () => void;
};

export function CommandPanel({
  selectedCount,
  requiredCount,
  currentDay,
  maxDays,
  canStart,
  canAccuse,
  onStartWork,
  onOpenLedger,
  onAccuse,
  onReset,
}: CommandPanelProps) {
  const remaining = Math.max(requiredCount - selectedCount, 0);
  const ratio = requiredCount > 0 ? Math.min(selectedCount / requiredCount, 1) : 0;
  const percent = Math.round(ratio * 100);
  const remainingDays = Math.max(maxDays - currentDay, 0);
  const statusText = remainingDays === 0
    ? "作業は終了しました。告発に進んでください"
    : remaining === 0
      ? "問題なければ作業開始を選択してください"
      : `工場に配置する動物を残り ${remaining} 匹選択してください`;
  const dayText = remainingDays > 1
    ? `残り日数：${remainingDays}日`
    : remainingDays === 1
      ? "本日が作業最終日です"
      : "これ以上の作業は認められていません";

  return (
    <section className="command-panel" aria-label="操作">
      <div className="command-panel__status">
        <span>
          <strong>DAY</strong>
          {Math.min(currentDay + 1, maxDays)} / {maxDays}
        </span>
        <span>
          <strong>SELECT</strong>
          {selectedCount} / {requiredCount}
        </span>
      </div>
      <p className={`command-panel__message ${remaining === 0 ? "is-ready" : ""}`}>
        {statusText}
      </p>
      <div className="command-panel__progress" aria-label={`作業進捗 ${percent} %`}>
        <span className="command-panel__progress-fill" style={{ width: `${percent}%` }} />
        <span className="command-panel__progress-label">作業進捗 {percent} %</span>
      </div>
      <p className={`command-panel__days ${remainingDays <= 1 ? "is-warning" : ""}`}>
        {dayText}
      </p>
      <div className="command-panel__actions">
        <button className="command-panel__button command-panel__button--start" type="button" onClick={onStartWork} disabled={!canStart}>
          作業開始 ▶
        </button>
        <button className="command-panel__button command-panel__button--ledger" type="button" onClick={onOpenLedger}>
          作業員名簿
        </button>
        <button className="command-panel__button command-panel__button--danger" type="button" onClick={onAccuse} disabled={!canAccuse}>
          処分実行
        </button>
        <button className="command-panel__button command-panel__button--ghost" type="button" onClick={onReset}>
          初期化
        </button>
      </div>
    </section>
  );
}
