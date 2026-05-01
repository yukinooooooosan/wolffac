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

export function LogPanel({ logs, maxDays }: LogPanelProps) {
  const names = Object.keys(logs);

  return (
    <section className="log-panel" aria-label="作業ログ">
      <h2 className="work-screen__section-title">作業ログ</h2>
      <div className="log-panel__rows">
        {names.map(name => (
          <div className="log-panel__row" key={name}>
            <span className="log-panel__name">{name}</span>
            <span className="log-panel__days">
              {Array.from({ length: maxDays }, (_, day) => {
                const entry = logs[name]?.[day] ?? { selected: null, injured: false };
                return (
                  <span className="log-panel__day" key={day}>
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
