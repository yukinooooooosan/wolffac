import { Application } from 'pixi.js';
import { SceneManager } from './core/SceneManager';

let app: Application;

async function main() {
  app = new Application({
    width: 720,
    height: 1280,
    backgroundColor: 0x000000,
  });
//  await app.init();
  document.body.appendChild(app.view as unknown as HTMLCanvasElement);
  // サイズをウィンドウにフィットさせる
  resizeCanvas();

  // 初期化
  await SceneManager.init(app);
  SceneManager.changeScene('Title');
}

// ✅ ウィンドウに合わせてキャンバス拡縮
function resizeCanvas() {
  const scaleX = window.innerWidth / 720;
  const scaleY = window.innerHeight / 1280;
  const scale = Math.min(scaleX, scaleY);

  app.stage.scale.set(scale);
  app.renderer.resize(window.innerWidth, window.innerHeight);
}

// ✅ resize イベント対応
window.addEventListener('resize', () => {
  resizeCanvas();
});

main();

// ✅ 画面リサイズ時にPixi側も自動で対応（ただし resizeTo があれば通常不要）
//window.addEventListener('resize', () => {
//  app.renderer.resize(window.innerWidth, window.innerHeight);
//});