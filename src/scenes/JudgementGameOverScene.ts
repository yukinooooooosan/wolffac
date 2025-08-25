import * as PIXI from 'pixi.js';
import { SceneManager } from '../core/SceneManager';
import type { ScenarioData } from '../core/types';

export class OpeningScene extends PIXI.Container {
  constructor(scenario: ScenarioData) {
    super();

    // オープニングテキストの表示
    const text = new PIXI.Text(scenario.openingText || "──物語が始まる。", {
      wordWrap: true,
      wordWrapWidth: 700,
      fontSize: 24,
      fill: 0xffffff,
    });
    text.position.set(50, 150);
    this.addChild(text);

    // タップして開始
    const tapToStart = new PIXI.Text("▶ タップして作業開始", {
      fontSize: 20,
      fill: 0x888888,
    });
    tapToStart.anchor.set(1, 1);
    tapToStart.position.set(750, 580);
    this.addChild(tapToStart);

    this.interactive = true;
    this.on('pointerdown', () => {
      SceneManager.changeScene('Game', scenario);
    });
  }
}
