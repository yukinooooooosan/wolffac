import * as PIXI from 'pixi.js';

export class WinScene extends PIXI.Container {
  constructor(data: { animalName: string }) {
    super();
    const text = new PIXI.Text(`勝利！${data.animalName}を処分しました`, {
      fontSize: 50,
      fill: 0xffffff,
      fontWeight: 'bold',
    });
    text.anchor.set(0.5);
    text.x = 360;
    text.y = 640;
    this.addChild(text);
  }
}