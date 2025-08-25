import * as PIXI from 'pixi.js';
import { SceneManager } from '../core/SceneManager';
import { loadScenario } from '../core/ScenarioLoader';

export class TitleScene extends PIXI.Container {
  constructor() {
    super();

    const title = new PIXI.Text("オオカミ工場", {
      fontSize: 48,
      fill: 0xffffff,
    });
    title.anchor.set(0.5);
    title.position.set(400, 100);
    this.addChild(title);

    const scenarios = [
      { id: 'day1', label: '第1作業日' },
      { id: 'day2', label: '第2作業日 - 狙われた性別' },
      { id: 'dayX', label: '特別作業日 - オオカミの咆哮' }
    ];

    scenarios.forEach((scenario, index) => {
      const btn = new PIXI.Text(scenario.label, {
        fontSize: 28,
        fill: 0x00ff00,
      });
      btn.anchor.set(0.5);
      btn.position.set(400, 200 + index * 80);
      btn.interactive = true;
      btn.cursor = 'pointer';
      btn.on('pointerdown', async () => {
        // ★ここでNewGame系の初期化！
        SceneManager.currentDay = 0;           // ←必ずリセット！
        SceneManager.injuryRecord = {};        // すでにリセット済み

        // 他にも初期化したいものがあればここに追加

        console.log("読み込もうとしているシナリオID:", scenario.id);
        const data = await loadScenario(scenario.id);

                // --- ↓ ここで初期化するのが安全 ---
        const maxDays = data.maxDays ?? 3;
        SceneManager.animalLogs = {};
        for (const animal of data.availableAnimals) {
          SceneManager.animalLogs[animal.name] = [];
          for (let i = 0; i < maxDays; i++) {
            SceneManager.animalLogs[animal.name].push({
              selected: null,
              injured: false,
            });
          }
        }
        // -----------------------------------
        
        SceneManager.changeScene('Opening', data);
      });
      this.addChild(btn);
});
  }
}
