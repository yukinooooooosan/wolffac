import { useEffect, useRef } from 'react';
import { createCanvasEffect, drawCanvasEffect, isEffectAlive } from './canvasEffects';
import { effectBus } from './effectBus';

type CanvasEffectHandle = ReturnType<typeof createCanvasEffect>;

export function EffectCanvasLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const effectsRef = useRef<CanvasEffectHandle[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const scale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * scale);
      canvas.height = Math.floor(window.innerHeight * scale);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(scale, 0, 0, scale, 0, 0);
    };

    const draw = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      effectsRef.current = effectsRef.current.filter(effect => isEffectAlive(effect, now));

      for (const effect of effectsRef.current) {
        drawCanvasEffect(ctx, effect, now);
      }

      if (effectsRef.current.length > 0) {
        frameRef.current = window.requestAnimationFrame(draw);
      } else {
        frameRef.current = null;
      }
    };

    const startDrawing = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(draw);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    const unsubscribe = effectBus.subscribe(event => {
      effectsRef.current.push(createCanvasEffect(event, performance.now()));
      startDrawing();
    });

    return () => {
      unsubscribe();
      window.removeEventListener("resize", resize);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return <canvas className="effect-canvas-layer" ref={canvasRef} aria-hidden="true" />;
}
