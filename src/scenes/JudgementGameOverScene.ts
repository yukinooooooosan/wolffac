import * as PIXI from 'pixi.js';
import { SceneManager } from '../core/SceneManager';
import type { ScenarioData } from '../core/types';
import { StatsManager } from '../core/StatsManager';

export class JudgementGameOverScene extends PIXI.Container {
  constructor(scenario: ScenarioData) {
    super();

    // 統計記録
    StatsManager.incrementJudgementDefeats();

    // 背景の追加
    this.addBackground();

    // ゲームオーバータイトルの表示
    const title = new PIXI.Text("JUDGEMENT GAME OVER", {
      fontSize: 48,
      fill: 0xff4444,
      fontWeight: 'bold',
    });
    title.anchor.set(0.5, 0);
    title.position.set(360, 80);
    this.addChild(title);

    // メッセージの表示
    const text = new PIXI.Text(scenario.opening?.lines?.join('\n') || "──審判により、道は閉ざされた。", {
      wordWrap: true,
      wordWrapWidth: 640,
      fontSize: 24,
      fill: 0xffffff,
      lineHeight: 36,
    });
    text.anchor.set(0.5, 0);
    text.position.set(360, 200);
    this.addChild(text);

    // タイトルへ戻るボタン
    const backToTitle = new PIXI.Text("▶ タイトルへ戻る", {
      fontSize: 28,
      fill: 0xffff00,
    });
    backToTitle.anchor.set(0.5, 1);
    backToTitle.position.set(360, 1100);
    backToTitle.eventMode = 'static';
    backToTitle.cursor = 'pointer';

    backToTitle.on('pointertap', () => {
      SceneManager.changeScene('Title');
    });
    this.addChild(backToTitle);
  }

  private addBackground() {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000);
    bg.drawRect(0, 0, 720, 1280);
    bg.endFill();
    this.addChild(bg);
  }
}
