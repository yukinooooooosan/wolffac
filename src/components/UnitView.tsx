import type { AnimalCondition } from '../game/battleTypes';
import type { UnitVisualState } from '../game/battleTypes';
import type { WorkerDayLog } from '../game/workLog';
import { assetUrl } from '../core/assetPath';
import { HpBar } from './HpBar';

type UnitViewProps = {
  name: string;
  role: '♂' | '♀' | '';
  image: string;
  condition: AnimalCondition;
  visualState: UnitVisualState;
  selected: boolean;
  disabled: boolean;
  logs: WorkerDayLog[];
  maxDays: number;
  onToggle: () => void;
};

const CONDITION_LABEL: Record<AnimalCondition, string> = {
  normal: "健康",
  injured: "負傷",
  dead: "死亡",
};

function logLabelFor(entry: WorkerDayLog | undefined): string {
  if (!entry || entry.selected === null) return "未";
  if (entry.selected && entry.injured) return "傷";
  if (entry.selected) return "作";
  return "休";
}

function logClassFor(entry: WorkerDayLog | undefined): string {
  if (!entry || entry.selected === null) return "unit-view__log-day--empty";
  if (entry.selected && entry.injured) return "unit-view__log-day--injured";
  if (entry.selected) return "unit-view__log-day--worked";
  return "unit-view__log-day--rested";
}

export function UnitView({
  name,
  role,
  image,
  condition,
  visualState,
  selected,
  disabled,
  logs,
  maxDays,
  onToggle,
}: UnitViewProps) {
  const className = [
    "unit-view",
    `unit-view--${condition}`,
    `unit-view--visual-${visualState}`,
    selected ? "is-selected" : "",
  ].filter(Boolean).join(" ");

  return (
    <button
      className={className}
      type="button"
      data-unit-name={name}
      onClick={onToggle}
      disabled={disabled}
    >
      <span className="unit-view__image-wrap">
        <img className="unit-view__image" src={assetUrl(`assets/animals/${image}`)} alt="" />
        {selected && <span className="unit-view__selected-label">投入</span>}
        {condition === "injured" && <span className="unit-view__injury-label">負傷</span>}
      </span>
      <span className="unit-view__main">
        <span className="unit-view__name">
          {name}
          {role && <span className="unit-view__role">{role}</span>}
        </span>
        <span className="unit-view__condition">{CONDITION_LABEL[condition]}</span>
        <HpBar condition={condition} />
        <span className="unit-view__logs" aria-label={`${name}の作業ログ`}>
          {Array.from({ length: maxDays }, (_, day) => {
            const entry = logs[day];
            return (
              <span className={`unit-view__log-day ${logClassFor(entry)}`} key={day}>
                {logLabelFor(entry)}
              </span>
            );
          })}
        </span>
      </span>
    </button>
  );
}
