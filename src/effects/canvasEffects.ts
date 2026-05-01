import type { EffectEvent, Point } from './effectTypes';

type CanvasEffect = {
  event: EffectEvent;
  startedAt: number;
  duration: number;
};

export function createCanvasEffect(event: EffectEvent, now: number): CanvasEffect {
  const durationByType: Record<EffectEvent["type"], number> = {
    slash: 360,
    hit: 420,
    damageNumber: 720,
    explosion: 620,
    focusLines: 460,
  };

  return {
    event,
    startedAt: now,
    duration: durationByType[event.type],
  };
}

export function isEffectAlive(effect: CanvasEffect, now: number): boolean {
  return now - effect.startedAt < effect.duration;
}

export function drawCanvasEffect(ctx: CanvasRenderingContext2D, effect: CanvasEffect, now: number) {
  const progress = Math.min((now - effect.startedAt) / effect.duration, 1);

  switch (effect.event.type) {
    case "slash":
      drawSlash(ctx, effect.event.from, effect.event.to, progress);
      break;
    case "hit":
      drawHit(ctx, effect.event.at, progress);
      break;
    case "damageNumber":
      drawDamageNumber(ctx, effect.event.at, effect.event.value, progress);
      break;
    case "explosion":
      drawExplosion(ctx, effect.event.at, progress);
      break;
    case "focusLines":
      drawFocusLines(ctx, effect.event.center, progress);
      break;
  }
}

function easeOut(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

function drawSlash(ctx: CanvasRenderingContext2D, from: Point, to: Point, progress: number) {
  const eased = easeOut(progress);
  const x = from.x + (to.x - from.x) * eased;
  const y = from.y + (to.y - from.y) * eased;
  const alpha = Math.max(0, 1 - progress);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 10;
  ctx.shadowColor = "#ff4b4b";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(x, y);
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.72;
  ctx.strokeStyle = "#ff3333";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(from.x + 18, from.y - 10);
  ctx.lineTo(x + 18, y - 10);
  ctx.stroke();
  ctx.restore();
}

function drawHit(ctx: CanvasRenderingContext2D, at: Point, progress: number) {
  const radius = 12 + progress * 42;
  const alpha = Math.max(0, 1 - progress);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ffe08a";
  ctx.lineWidth = 4;
  ctx.shadowColor = "#ff3030";
  ctx.shadowBlur = 12;

  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const inner = radius * 0.35;
    const outer = radius;
    ctx.beginPath();
    ctx.moveTo(at.x + Math.cos(angle) * inner, at.y + Math.sin(angle) * inner);
    ctx.lineTo(at.x + Math.cos(angle) * outer, at.y + Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDamageNumber(ctx: CanvasRenderingContext2D, at: Point, value: number, progress: number) {
  const y = at.y - progress * 54;
  const alpha = Math.max(0, 1 - progress);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#ffef7a";
  ctx.strokeText(`-${value}`, at.x, y);
  ctx.fillText(`-${value}`, at.x, y);
  ctx.restore();
}

function drawExplosion(ctx: CanvasRenderingContext2D, at: Point, progress: number) {
  const radius = 20 + progress * 88;
  const alpha = Math.max(0, 1 - progress);

  ctx.save();
  ctx.globalAlpha = alpha;
  const gradient = ctx.createRadialGradient(at.x, at.y, 0, at.x, at.y, radius);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.28, "rgba(255,70,55,0.82)");
  gradient.addColorStop(1, "rgba(255,70,55,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(at.x, at.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFocusLines(ctx: CanvasRenderingContext2D, center: Point, progress: number) {
  const alpha = Math.max(0, 0.7 - progress);
  const { width, height } = ctx.canvas;
  const far = Math.max(width, height);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;

  for (let i = 0; i < 32; i += 1) {
    const angle = (Math.PI * 2 * i) / 32;
    const inner = 110 + progress * 40;
    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(angle) * inner, center.y + Math.sin(angle) * inner);
    ctx.lineTo(center.x + Math.cos(angle) * far, center.y + Math.sin(angle) * far);
    ctx.stroke();
  }
  ctx.restore();
}

