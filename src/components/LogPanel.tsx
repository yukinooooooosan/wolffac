import type { WorkerLogBook } from '../game/workLog';

type LogPanelProps = {
  logs: WorkerLogBook;
  maxDays: number;
};

function labelFor(selected: boolean | null, injured: boolean): string {
  if (selected === null) return "未";
  if (selected && injured) return "傷";
  if (selected) return "作";
  return "休";
}

function classNameFor(selected: boolean | null, injured: boolean): string {
  if (selected === null) return "log-panel__day log-panel__day--empty";
  if (selected && injured) return "log-panel__day log-panel__day--injured";
  if (selected) return "log-panel__day log-panel__day--worked";
  return "log-panel__day log-panel__day--rested";
}

export function LogPanel({ logs, maxDays }: LogPanelProps) {
  const names = Object.keys(logs);
  const gridStyle = { gridTemplateColumns: `minmax(86px, 1fr) repeat(${maxDays}, 42px)` };

  return (
    <section className="log-panel" aria-label="作業ログ">
      <h2 className="work-screen__section-title">作業ログ</h2>
      <div className="log-panel__head" style={gridStyle} aria-hidden="true">
        <span />
        {Array.from({ length: maxDays }, (_, day) => (
          <span key={day}>D{day + 1}</span>
        ))}
      </div>
      <div className="log-panel__rows">
        {names.map(name => (
          <div className="log-panel__row" style={gridStyle} key={name}>
            <span className="log-panel__name">{name}</span>
            <span className="log-panel__days" aria-label={`${name}の作業ログ`}>
              {Array.from({ length: maxDays }, (_, day) => {
                const entry = logs[name]?.[day] ?? { selected: null, injured: false };
                return (
                  <span className={classNameFor(entry.selected, entry.injured)} key={day}>
                    {labelFor(entry.selected, entry.injured)}
                  </span>
                );
              })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
