import * as PIXI from 'pixi.js';
import { SceneManager } from '../core/SceneManager';

export class LoseScene extends PIXI.Container {
  constructor(data: { animalName: string }) {
    super();

    // 背景の追加
    this.addBackground();

    // タイトルの表示
    const title = new PIXI.Text("LOSE...", {
      fontSize: 64,
      fill: 0xff4444,
      fontWeight: 'bold',
    });
    title.anchor.set(0.5, 0);
    title.position.set(360, 150);
    this.addChild(title);

    // メッセージの表示
    const message = new PIXI.Text(`${data.animalName} はオオカミではありませんでした…`, {
      wordWrap: true,
      wordWrapWidth: 640,
      fontSize: 32,
      fill: 0xffffff,
      align: 'center',
    });
    message.anchor.set(0.5, 0);
    message.position.set(360, 400);
    this.addChild(message);

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
    // シェアボタン
    const shareText = encodeURIComponent(`オオカミ工場で敗北…\n${data.animalName}はオオカミではありませんでした。\n#WolfFactory #オオカミ工場`);
    const shareUrl = "https://twitter.com/intent/tweet?text=" + shareText;

    const shareButton = new PIXI.Text('Xでシェアする', {
      fontSize: 24,
      fill: 0x00ccff,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    shareButton.anchor.set(0.5, 1);
    shareButton.position.set(360, 1040);
    shareButton.eventMode = 'static';
    shareButton.cursor = 'pointer';
    shareButton.on('pointertap', () => {
      window.open(shareUrl, '_blank');
    });
    this.addChild(shareButton);

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