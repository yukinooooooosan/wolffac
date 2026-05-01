export type Point = {
  x: number;
  y: number;
};

export type EffectEvent =
  | { type: "slash"; from: Point; to: Point }
  | { type: "hit"; at: Point }
  | { type: "damageNumber"; at: Point; value: number }
  | { type: "explosion"; at: Point }
  | { type: "focusLines"; center: Point };

