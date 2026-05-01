import * as PIXI from 'pixi.js';
import { SceneManager } from '../core/SceneManager';
import type { ScenarioData } from '../core/types';
import { StatsManager } from '../core/StatsManager';

export class OpeningScene extends PIXI.Container {
  constructor(scenario: ScenarioData) {
    super();

    // 統計記録: 新しいゲームを開始
    StatsManager.incrementTotalGames();

    // 背景（必要であれば追加）
    this.addBackground();

    // 指令書のタイトル（例: "── 指令書 ──"）
    const heading = scenario.opening?.heading || "── 指令 ──";
    const headingText = new PIXI.Text(heading, {
      fontSize: 28,
      fill: 0xffffcc,
      fontWeight: 'bold',
    });
    headingText.position.set(50, 80);
    this.addChild(headingText);

    // 指令文（lines を \n で結合）
    const bodyText = (scenario.opening?.lines || ["任務が開始される…"]).join('\n');
    const body = new PIXI.Text(bodyText, {
      wordWrap: true,
      wordWrapWidth: 700,
      fontSize: 24,
      fill: 0xffffff,
    });
    body.position.set(50, 140);
    this.addChild(body);

    // タップして開始
    const tapToStart = new PIXI.Text("▶ タップして作業開始", {
      fontSize: 20,
      fill: 0x888888,
    });
    tapToStart.anchor.set(1, 1);
    tapToStart.position.set(750, 580);
    this.addChild(tapToStart);

    // タップでゲーム開始へ
    this.interactive = true;
    this.on('pointerdown', () => {
      SceneManager.changeScene('Game', scenario);
    });
  }

  private addBackground() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000);
    bg.drawRect(0, 0, 800, 600);
    bg.endFill();
    this.addChild(bg);
  }
}