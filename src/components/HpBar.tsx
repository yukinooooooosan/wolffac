import type { AnimalCondition } from '../game/battleTypes';

type HpBarProps = {
  condition: AnimalCondition;
};

const CONDITION_VALUE: Record<AnimalCondition, number> = {
  normal: 100,
  injured: 50,
  dead: 0,
};

const CONDITION_LABEL: Record<AnimalCondition, string> = {
  normal: "健康",
  injured: "負傷",
  dead: "死亡",
};

export function HpBar({ condition }: HpBarProps) {
  const value = CONDITION_VALUE[condition];

  return (
    <div className="hp-bar" aria-label={`状態: ${CONDITION_LABEL[condition]}`}>
      <div className={`hp-bar__fill hp-bar__fill--${condition}`} style={{ width: `${value}%` }} />
    </div>
  );
}
