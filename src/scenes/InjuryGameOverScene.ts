import * as PIXI from 'pixi.js';
import { Assets } from 'pixi.js';
import { assetUrl } from '../core/assetPath';
import { SceneManager } from '../core/SceneManager';
import { StatsManager } from '../core/StatsManager';

export class InjuryGameOverScene extends PIXI.Container {
  constructor(animalName: string) {
    super();

    // 統計記録
    StatsManager.incrementInjuryDefeats();

    // 背景画像の読み込み
    this.renderBackground();

    // タイトル
    const title = new PIXI.Text('作業中の事故発生', {
      fill: 0xff4444,
      fontSize: 42,
      fontWeight: 'bold',
    });
    title.anchor.set(0.5);
    title.position.set(360, 180);
    this.addChild(title);

    // メッセージ
    const message = new PIXI.Text(
      `${animalName} は2度目の襲撃により倒れました。\nあなたの判断は間に合いませんでした…`,
      {
        fill: 0xffffff,
        fontSize: 22,
        wordWrap: true,
        wordWrapWidth: 600,
      }
    );
    message.anchor.set(0.5);
    message.position.set(360, 400);
    this.addChild(message);

    // 戻るボタン
    const button = new PIXI.Text('▶ タイトルに戻る', {
      fill: 0xffff00,
      fontSize: 28,
    });
    button.anchor.set(1);
    button.position.set(680, 1200);
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointertap', () => {
      SceneManager.changeScene('Title');
    });
    this.addChild(button);
  }

  private async renderBackground() {
    try {
      const texture = await Assets.load(assetUrl('assets/backgrounds/injurygameoverbg.png'));
      const bg = new PIXI.Sprite(texture);
      bg.width = 720;
      bg.height = 1280;
      bg.x = 0;
      bg.y = 0;
      this.addChildAt(bg, 0);
    } catch (e) {
      console.warn('背景画像 injurygameoverbg.png の読み込みに失敗しました');
    }
  }
}
