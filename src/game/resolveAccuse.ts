export type AccuseTarget = {
  name: string;
  isWolf?: boolean;
};

export type AccuseResult = {
  animalName: string;
  isWolf: boolean;
  result: "win" | "lose";
};

export type HoldCue = "start" | "hold1" | "hold2" | "confirm";

export type AccuseHoldConfig = {
  confirmFrames: number;
  hold1Frame: number;
  hold2Frame: number;
};

export type AccuseHoldProgress = {
  frame: number;
  progress: number;
  confirmed: boolean;
  cues: HoldCue[];
};

export const DEFAULT_ACCUSE_HOLD_CONFIG: AccuseHoldConfig = {
  confirmFrames: 150,
  hold1Frame: 60,
  hold2Frame: 120,
};

export function resolveAccusation(
  target: AccuseTarget,
  wolfNames: readonly string[],
): AccuseResult {
  const isWolf = target.isWolf ?? wolfNames.includes(target.name);

  return {
    animalName: target.name,
    isWolf,
    result: isWolf ? "win" : "lose",
  };
}

export function advanceAccuseHold(
  currentFrame: number,
  config: AccuseHoldConfig = DEFAULT_ACCUSE_HOLD_CONFIG,
): AccuseHoldProgress {
  const frame = currentFrame + 1;
  const cues: HoldCue[] = [];

  if (frame === 1) cues.push("start");
  if (frame === config.hold1Frame) cues.push("hold1");
  if (frame === config.hold2Frame) cues.push("hold2");
  if (frame === config.confirmFrames) cues.push("confirm");

  return {
    frame,
    progress: Math.min(frame / config.confirmFrames, 1),
    confirmed: frame >= config.confirmFrames,
    cues,
  };
}

export function canCancelAccuseHold(
  frame: number,
  config: AccuseHoldConfig = DEFAULT_ACCUSE_HOLD_CONFIG,
): boolean {
  return frame < config.confirmFrames;
}
