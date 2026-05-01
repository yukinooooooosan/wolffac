import type { AnimalData, ScenarioData } from '../core/types';
import { assetUrl } from '../core/assetPath';
import type { AnimalCondition } from '../game/battleTypes';

type AnimalState = {
  name: string;
  from: AnimalCondition;
  to: AnimalCondition;
};

type LedgerPanelProps = {
  scenario: ScenarioData;
  animalStates: AnimalState[];
  currentDay: number;
  onClose: () => void;
};

const stateLabelMap: Record<AnimalCondition, string> = {
  normal: "健康",
  injured: "負傷",
  dead: "死亡",
};

const fallbackComments: Record<AnimalCondition, string[]> = {
  normal: ["特に異常は見られない。"],
  injured: ["負傷しているようだ。"],
  dead: ["死亡している。"],
};

function stableRandomIndex(animalName: string, state: AnimalCondition, day: number, arrayLength: number): number {
  if (arrayLength === 0) return 0;

  const str = `${animalName}:${state}:${day}`;
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }

  return Math.abs(hash) % arrayLength;
}

function getLedgerComment(animal: AnimalData, state: AnimalCondition, currentDay: number): string {
  const comments = animal.ledgerComments?.[state];
  const source = comments && comments.length > 0 ? comments : fallbackComments[state];
  const index = stableRandomIndex(animal.name, state, currentDay, source.length);

  return source[index];
}

export function LedgerPanel({ scenario, animalStates, currentDay, onClose }: LedgerPanelProps) {
  const stateByName = new Map(animalStates.map(state => [state.name, state.to]));

  return (
    <div className="ledger-panel" role="dialog" aria-modal="true" aria-labelledby="ledger-panel-title">
      <div className="ledger-panel__shade" onClick={onClose} />
      <section className="ledger-panel__window">
        <header className="ledger-panel__header">
          <div>
            <p className="work-screen__eyebrow">作業員名簿</p>
            <h2 id="ledger-panel-title" className="ledger-panel__title">{scenario.title}</h2>
          </div>
          <button className="ledger-panel__close" type="button" onClick={onClose}>
            閉じる
          </button>
        </header>

        <div className="ledger-panel__list">
          {scenario.availableAnimals.map(animal => {
            const state = stateByName.get(animal.name) ?? "normal";
            const comment = getLedgerComment(animal, state, currentDay);

            return (
              <article className={`ledger-row ledger-row--${state}`} key={animal.name}>
                <img className="ledger-row__image" src={assetUrl(`assets/animals/${animal.image}`)} alt="" />
                <div className="ledger-row__body">
                  <div className="ledger-row__topline">
                    <h3 className="ledger-row__name">
                      {animal.name}
                      {animal.role && <span className="ledger-row__role">{animal.role}</span>}
                    </h3>
                    <span className={`ledger-row__state ledger-row__state--${state}`}>
                      状態：{stateLabelMap[state]}
                    </span>
                  </div>
                  <p className="ledger-row__comment">{comment}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
