import * as PIXI from 'pixi.js';
import { StatsManager } from '../core/StatsManager';
import { SceneManager } from '../core/SceneManager';

export class WinScene extends PIXI.Container {
  constructor(data: { animalName: string, scenarioId?: string }) {
    super();

    // 統計記録
    StatsManager.incrementWins();
    if (data.scenarioId) {
      StatsManager.markScenarioCleared(data.scenarioId);
    }

    const text = new PIXI.Text(`勝利！${data.animalName}を処分しました`, {
      fontSize: 50,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    text.anchor.set(0.5);
    text.x = 360;
    text.y = 640;
    this.addChild(text);

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
    // シェアボタン
    const shareText = encodeURIComponent(`オオカミ工場で勝利！\n${data.animalName}を処分しました。\n#WolfFactory #オオカミ工場`);
    const shareUrl = "https://twitter.com/intent/tweet?text=" + shareText;

    const shareButton = new PIXI.Text('Xでシェアする', {
      fontSize: 24,
      fill: 0x00ccff,
      fontWeight: 'bold',
      stroke: 0x000000,
      strokeThickness: 3
    });
    shareButton.anchor.set(1);
    shareButton.position.set(680, 1140);
    shareButton.eventMode = 'static';
    shareButton.cursor = 'pointer';
    shareButton.on('pointertap', () => {
      window.open(shareUrl, '_blank');
    });
    this.addChild(shareButton);

    this.addChild(button);
  }
}