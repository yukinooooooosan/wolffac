import * as PIXI from 'pixi.js';

export class LoseScene extends PIXI.Container {
  constructor(data: { animalName: string }) {
    super();
    const text = new PIXI.Text(`敗北…${data.animalName}はオオカミじゃなかった`, {
      fontSize: 50,
      fill: 0xff0000,
      fontWeight: 'bold',
    });
    text.anchor.set(0.5);
    text.x = 360;
    text.y = 640;
    this.addChild(text);
  }
}