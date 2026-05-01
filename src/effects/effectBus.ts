import type { EffectEvent } from './effectTypes';

type EffectListener = (event: EffectEvent) => void;

const listeners = new Set<EffectListener>();

export const effectBus = {
  emit(event: EffectEvent) {
    for (const listener of listeners) {
      listener(event);
    }
  },

  subscribe(listener: EffectListener) {
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  },
};

