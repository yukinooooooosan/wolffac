import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import { SceneManager } from './core/SceneManager';
import { ReactGame } from './components/ReactGame';
import './styles/work-screen.css';

const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;

function LegacyPixiGame() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application({
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x000000,
    });

    const canvas = app.view as unknown as HTMLCanvasElement;
    host.appendChild(canvas);

    const resizeCanvas = () => {
      const scaleX = window.innerWidth / GAME_WIDTH;
      const scaleY = window.innerHeight / GAME_HEIGHT;
      const scale = Math.min(scaleX, scaleY);

      app.stage.scale.set(scale);
      app.renderer.resize(window.innerWidth, window.innerHeight);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    void SceneManager.init(app).then(() => {
      void SceneManager.changeScene('Title');
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.remove();
      app.destroy(true, { children: true });
    };
  }, []);

  return <div className="legacy-pixi-root" ref={hostRef} />;
}

export function App() {
  const mode = new URLSearchParams(window.location.search).get('mode');

  if (mode === 'legacy') {
    return <LegacyPixiGame />;
  }

  return <ReactGame />;
}
