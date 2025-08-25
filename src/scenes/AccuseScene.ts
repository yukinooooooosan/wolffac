// src/scenes/AccuseScene.ts

import * as PIXI from 'pixi.js';
import type { ScenarioData } from '../core/types';
import { SceneManager } from '../core/SceneManager'; //？
import type { ResultData } from '../core/SceneManager';
import * as DESIGN from './AccuseSceneDesign';
import gsap from 'gsap';
import { GlowFilter } from '@pixi/filter-glow';

type BalloonType = "select" | "hold1" | "hold2" | "confirm" | "cancel";

export class AccuseScene extends PIXI.Container {
  private sprites: PIXI.Sprite[] = [];
  private selectedIdx = 0;
  private animals: ScenarioData['availableAnimals'];
  private wolves: string[] = [];
  private balloonContainer!: PIXI.Container;  // ←この行を追加

  // UI
  private gauge = 0;
  private isHolding = false;
  private gaugeText: PIXI.Text;
  private disposeButton: PIXI.Graphics;
  private leftArrow: PIXI.Graphics;
  private rightArrow: PIXI.Graphics;

  // カウンター/演出
  private accuseHoldFrame = 0;

  // バルーン管理
  private balloonMap: Map<BalloonType, PIXI.Container> = new Map();
  

  constructor(data: ResultData) {
    super();
    const { scenario, wolves } = data;
    this.animals = scenario.availableAnimals;
    this.wolves = wolves ?? [];
    // 背景スプライトを生成
    const bg = PIXI.Sprite.from("/assets/backgrounds/accusebg.png");
    bg.x = 0; // 左上
    bg.y = 0;
    bg.width = 720;    // 画面幅に合わせる
    bg.height = 1280;  // 画面高さに合わせる
    bg.anchor.set(0);  // アンカーを左上基準に（デフォルトなので省略も可）

    // 最背面に追加
    this.addChild(bg);


    // タイトル
    const title = new PIXI.Text('告発シーン', {
      fontSize: DESIGN.TITLE_FONT_SIZE,
      fill: DESIGN.TITLE_COLOR,
      fontWeight: 'bold',
    });
    title.anchor.set(0.5);
    title.x = DESIGN.TITLE_X;
    title.y = DESIGN.TITLE_Y;
    this.addChild(title);


    this.balloonContainer = new PIXI.Container();
    // ... ここでballoonBgやballoonTextもaddChild
    this.addChild(this.balloonContainer);

   // === ここから動物スプライトを生成 ===
  this.sprites = [];
  for (let i = 0; i < this.animals.length; i++) {
    const animal = this.animals[i];
    const sprite = PIXI.Sprite.from(`/assets/animals/${animal.image}`);
    sprite.anchor.set(0.5);

    // --- 初期位置・サイズ・透明度・表示状態をここで決定 ---
    let initX, initY, initW, initA;
    if (i === this.selectedIdx) {
      initX = DESIGN.HORIZONTAL_CENTER_X;
      initY = DESIGN.HORIZONTAL_CENTER_Y;
      initW = DESIGN.HORIZONTAL_ICON_SIZE_SELECTED;
      initA = DESIGN.HORIZONTAL_ICON_ALPHA_SELECTED;
      sprite.visible = true;
    } else if (i === (this.selectedIdx + 1) % this.animals.length) {
      initX = DESIGN.HORIZONTAL_CENTER_X + DESIGN.HORIZONTAL_ICON_SIZE + DESIGN.HORIZONTAL_ICON_SPACING;
      initY = DESIGN.HORIZONTAL_CENTER_Y;
      initW = DESIGN.HORIZONTAL_ICON_SIZE;
      initA = DESIGN.HORIZONTAL_ICON_ALPHA;
      sprite.visible = true;
    } else if (i === (this.selectedIdx - 1 + this.animals.length) % this.animals.length) {
      initX = DESIGN.HORIZONTAL_CENTER_X - DESIGN.HORIZONTAL_ICON_SIZE - DESIGN.HORIZONTAL_ICON_SPACING;
      initY = DESIGN.HORIZONTAL_CENTER_Y;
      initW = DESIGN.HORIZONTAL_ICON_SIZE;
      initA = DESIGN.HORIZONTAL_ICON_ALPHA;
      sprite.visible = true;
    } else {
      initX = DESIGN.HORIZONTAL_CENTER_X;
      initY = DESIGN.HORIZONTAL_CENTER_Y;
      initW = DESIGN.HORIZONTAL_ICON_SIZE;
      initA = 0;
      sprite.visible = false; // 圏外は最初から非表示
    }
    sprite.x = initX;
    sprite.y = initY;
    sprite.width = sprite.height = initW;
    sprite.alpha = initA;

    this.sprites.push(sprite);
    this.addChild(sprite);
  }

    // ゲージ
    this.gaugeText = new PIXI.Text('ゲージ: 0', {
      fontSize: DESIGN.PROGRESS_GAUGE_FONT_SIZE,
      fill: DESIGN.PROGRESS_GAUGE_COLOR,
    });
    this.gaugeText.x = DESIGN.PROGRESS_GAUGE_X;
    this.gaugeText.y = DESIGN.PROGRESS_GAUGE_Y;
    this.addChild(this.gaugeText);

    // 処分ボタン
    this.disposeButton = new PIXI.Graphics();
    this.disposeButton.beginFill(DESIGN.DISPOSE_BUTTON_COLOR);
    this.disposeButton.drawRoundedRect(
      0, 0,
      DESIGN.DISPOSE_BUTTON_WIDTH,
      DESIGN.DISPOSE_BUTTON_HEIGHT,
      DESIGN.DISPOSE_BUTTON_RADIUS
    );
    this.disposeButton.endFill();
    this.disposeButton.x = DESIGN.DISPOSE_BUTTON_X;
    this.disposeButton.y = DESIGN.DISPOSE_BUTTON_Y;
    this.disposeButton.eventMode = 'static';
    this.disposeButton.cursor = 'pointer';
    this.addChild(this.disposeButton);

    const buttonLabel = new PIXI.Text('処分', {
      fontSize: DESIGN.DISPOSE_BUTTON_LABEL_FONT_SIZE,
      fill: DESIGN.DISPOSE_BUTTON_LABEL_COLOR,
    });
    buttonLabel.anchor.set(0.5);
    buttonLabel.x = DESIGN.DISPOSE_BUTTON_WIDTH / 2;
    buttonLabel.y = DESIGN.DISPOSE_BUTTON_HEIGHT / 2;
    this.disposeButton.addChild(buttonLabel);

    // 初期バルーン生成
    this.createAllBalloonsForAnimal(this.selectedIdx);

    // 動物アイコン配置
    this.updateAnimalPositions(false);

    // 矢印
    const N = this.animals.length;
    this.leftArrow = new PIXI.Graphics();
    this.leftArrow.beginFill(0xffffff);
    this.leftArrow.drawPolygon([0, 40, 40, 0, 40, 80]);
    this.leftArrow.endFill();
    this.leftArrow.x = 60;
    this.leftArrow.y = DESIGN.HORIZONTAL_CENTER_Y - 40;
    this.leftArrow.eventMode = 'static';
    this.leftArrow.cursor = 'pointer';
    this.leftArrow.on('pointertap', () => {
      this.selectedIdx = (this.selectedIdx - 1 + N) % N;
      this.switchAnimal(this.selectedIdx);
    });
    this.addChild(this.leftArrow);

    this.rightArrow = new PIXI.Graphics();
    this.rightArrow.beginFill(0xffffff);
    this.rightArrow.drawPolygon([0, 0, 40, 40, 0, 80]);
    this.rightArrow.endFill();
    this.rightArrow.x = 620;
    this.rightArrow.y = DESIGN.HORIZONTAL_CENTER_Y - 40;
    this.rightArrow.eventMode = 'static';
    this.rightArrow.cursor = 'pointer';
    this.rightArrow.on('pointertap', () => {
      this.selectedIdx = (this.selectedIdx + 1) % N;
      this.switchAnimal(this.selectedIdx);
    });
    this.addChild(this.rightArrow);

    // 処分ボタン長押し
    this.disposeButton.on('pointerdown', () => {
      this.isHolding = true;
    });
    this.disposeButton.on('pointerup', () => {
      this.isHolding = false;
      this.gauge = 0;
      this.gaugeText.text = `ゲージ: 0`;
    });
    this.disposeButton.on('pointerupoutside', () => {
      this.isHolding = false;
      this.gauge = 0;
      this.gaugeText.text = `ゲージ: 0`;
    });

    // 初回selectセリフ
    this.showSelectLine();

    // Ticker
    PIXI.Ticker.shared.add(() => {
      if (this.isHolding) {
        this.accuseHoldFrame++;
        const progress = Math.min(this.accuseHoldFrame / 600, 1.0);
        this.updateHoldColorEffect(progress);
        if (this.accuseHoldFrame === 1) {
          this.fadeOutUI();
          this.showVibrationEffect();
        }
        if (this.accuseHoldFrame === 60) this.showHold1Line();
        if (this.accuseHoldFrame === 120) this.showHold2Line();
        if (this.accuseHoldFrame === 150) {
          this.showConfirmLine();
          this.finishAccuse(); // ←ここで画面遷移
          }
        this.gauge++;
        this.gaugeText.text = `ゲージ: ${this.gauge}`;
      } else {
        const sprite = this.sprites[this.selectedIdx];
        if (sprite) {
          sprite.tint = 0xffffff;
          sprite.alpha = DESIGN.HORIZONTAL_ICON_ALPHA_SELECTED;
        }
        if (this.accuseHoldFrame > 0) {
          this.showCancelLine();
          this.fadeInUI();
        }
        this.accuseHoldFrame = 0;
        this.gauge = 0;
        this.gaugeText.text = `ゲージ: 0`;
      }
    });
  }

      // ===== バルーン事前生成（段階ごと） =====
    private createAllBalloonsForAnimal(idx: number) {
      // 既存バルーン削除
      for (const balloon of this.balloonMap.values()) {
        this.removeChild(balloon);
      }
      this.balloonMap.clear();

      const animal = this.animals[idx];
      const select = this.getRandomLine(animal.lines.accused?.select);
      const hold1 = this.getRandomLine(animal.lines.accused?.hold1);
      const hold2 = this.getRandomLine(animal.lines.accused?.hold2);
      const cancel = this.getRandomLine(animal.lines.accused?.cancel);

      let isWolf = false;
      if (animal.isWolf !== undefined) isWolf = animal.isWolf;
      else if (this.wolves) isWolf = this.wolves.includes(animal.name);

      let confirm = "";
      if (isWolf && animal.lines.accused?.confirmWolf) {
        confirm = this.getRandomLine(animal.lines.accused.confirmWolf);
      } else {
        confirm = this.getRandomLine(animal.lines.accused?.confirm);
      }

      this.balloonMap.set("select", this.createBalloon(select, "select"));
      this.balloonMap.set("hold1", this.createBalloon(hold1, "hold1"));
      this.balloonMap.set("hold2", this.createBalloon(hold2, "hold2"));
      this.balloonMap.set("confirm", this.createBalloon(confirm, "confirm"));
      this.balloonMap.set("cancel", this.createBalloon(cancel, "cancel"));

      for (const [, b] of this.balloonMap) {
        b.visible = false;
        this.addChild(b);
      }
      this.showBalloon("select");
    }

private createBalloon(text: string | undefined, type?: BalloonType): PIXI.Container {
  const container = new PIXI.Container();
  const paddingX = 30, paddingY = 20, minWidth = 140, minHeight = 54, maxWidth = 320;

  // テキスト作成
  const balloonText = new PIXI.Text(text ?? '', {
    fontSize: 28,
    fill: 0x222222,
    wordWrap: true,
    wordWrapWidth: maxWidth - paddingX * 2,
  });
  balloonText.anchor.set(0.5, 0.5);

  // テキストサイズ計算
  //balloonText.updateText?.();
  const w = Math.max(balloonText.width + paddingX * 2, minWidth);
  const h = Math.max(balloonText.height + paddingY * 2, minHeight);

  // バックグラウンド
  const balloonBg = new PIXI.Graphics();
  balloonBg.beginFill(0xffffff, 0.95).drawRoundedRect(-w / 2, 0, w, h, 20).endFill();

  // --- typeによってGlowFilter付与 ---
  if (type === "hold1" || type === "hold2" || type === "confirm") {
    balloonBg.filters = [
      new GlowFilter({
        color: 0xffffff,      // 白ぼかし
        distance: 24,         // ぼかし半径
        outerStrength: 4,     // 外側光の強さ
        innerStrength: 0,     // 内側なし
        quality: 0.5
      })
    ];
  }

  balloonText.x = 0;
  balloonText.y = h / 2;
  container.addChild(balloonBg);
  container.addChild(balloonText);

  container.x = DESIGN.HORIZONTAL_CENTER_X;
  container.y = DESIGN.HORIZONTAL_CENTER_Y + DESIGN.HORIZONTAL_ICON_SIZE_SELECTED / 2 + 30;
  container.alpha = 1.0;
  container.visible = false;
  return container;
}

private showBalloon(type: BalloonType) {
  for (const [key, balloon] of this.balloonMap) {
    // アニメーション前に既存Tweenをkill
    gsap.killTweensOf(balloon);
    gsap.killTweensOf(balloon.scale);

    if (key === type) {
      // ポジション設定
      const pos = this.getBalloonPosition(type);
      balloon.x = pos.x;
      balloon.y = pos.y;

      if (type === "hold1" || type === "hold2" || type === "confirm") {
        // アニメ演出（スケール＋フェード）
        balloon.scale.set(0.1);
        balloon.alpha = 0;
        balloon.visible = true;

        gsap.to(balloon.scale, {
          x: 1, y: 1,
          duration: 0.23,
          ease: "back.out(2)"
        });
        gsap.to(balloon, {
          alpha: 1,
          duration: 0.7,
          overwrite: true
        });
      } else {
        // select/cancelは即時
        balloon.scale.set(1);
        balloon.alpha = 1;
        balloon.visible = true;
      }
      this.setChildIndex(balloon, this.children.length - 1);

    } else {
      if (key === "hold1" || key === "hold2" || key === "confirm") {
        // フェードアウト＋膨張
        gsap.to(balloon, {
          alpha: 0,
          duration: 0.7,
          overwrite: true
        });
        gsap.to(balloon.scale, {
          x: 1.7,
          y: 2.2,
          duration: 0.16,
          ease: "power2.in",
          onComplete: () => { balloon.visible = false; }
        });
      } else {
        balloon.visible = false;
        balloon.alpha = 0;
        balloon.scale.set(1);
      }
    }
  }

}

  // ===== 動物切替（すべて再生成） =====
  private switchAnimal(idx: number) {
    this.createAllBalloonsForAnimal(idx);
    this.updateAnimalPositions(true);
    this.showSelectLine();
  }

  // ===== 動物位置スライド =====
private updateAnimalPositions(animate = false) {
  const N = this.sprites.length;
  const centerX = DESIGN.HORIZONTAL_CENTER_X;
  const centerY = DESIGN.HORIZONTAL_CENTER_Y;
  const spacing = DESIGN.HORIZONTAL_ICON_SIZE + DESIGN.HORIZONTAL_ICON_SPACING;

  const leftIdx = (this.selectedIdx - 1 + N) % N;
  const centerIdx = this.selectedIdx;
  const rightIdx = (this.selectedIdx + 1) % N;

  for (let i = 0; i < N; i++) {
    const sprite = this.sprites[i];
    let targetX: number, targetY: number, targetW: number, targetA: number, z: number;

    if (i === centerIdx) {
      targetX = centerX;
      targetY = centerY;
      targetW = DESIGN.HORIZONTAL_ICON_SIZE_SELECTED;
      targetA = DESIGN.HORIZONTAL_ICON_ALPHA_SELECTED;
      z = 3;
    } else if (i === rightIdx) {
      targetX = centerX + spacing;
      targetY = centerY;
      targetW = DESIGN.HORIZONTAL_ICON_SIZE;
      targetA = DESIGN.HORIZONTAL_ICON_ALPHA;
      z = 2;
    } else if (i === leftIdx) {
      targetX = centerX - spacing;
      targetY = centerY;
      targetW = DESIGN.HORIZONTAL_ICON_SIZE;
      targetA = DESIGN.HORIZONTAL_ICON_ALPHA;
      z = 1;
    } else {
      // 圏外
      targetX = sprite.x;
      targetY = sprite.y;
      targetW = DESIGN.HORIZONTAL_ICON_SIZE;
      targetA = 0;
      z = 0;
    }

    // --- 衝突防止のため既存アニメをkill ---
    gsap.killTweensOf(sprite);

    if (animate) {
      sprite.visible = true; // 必ず最初にON
      gsap.to(sprite, {
        x: targetX,
        y: targetY,
        width: targetW,
        height: targetW,
        alpha: targetA,
        duration: 0.3,
        ease: "power2.out",
        onStart: () => {
          sprite.visible = true;
        },
        onComplete: () => {
          if (z === 0) sprite.visible = false; // 圏外は終了時OFF
        }
      });
    } else {
      sprite.x = targetX;
      sprite.y = targetY;
      sprite.width = sprite.height = targetW;
      sprite.alpha = targetA;
      sprite.visible = z !== 0;
    }
    sprite.zIndex = z;
  }
  this.children.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
}

  // ===== 個別メソッド（段階ごと） =====
  private showSelectLine() { this.showBalloon("select"); }


  private showHold1Line() {
  this.showBalloon("hold1");
  this.balloonContainer.x = 620;  // 任意の座標
  this.balloonContainer.y = 600;
  
  }
  private showHold2Line() { this.showBalloon("hold2"); }
  private showConfirmLine() { this.showBalloon("confirm"); }
  private showCancelLine() { this.showBalloon("cancel"); }

  // ===== エフェクト =====
  private fadeOutUI() {
    gsap.to(this.leftArrow, { alpha: 0, duration: 10/60 });
    gsap.to(this.rightArrow, { alpha: 0, duration: 10/60 });
    const N = this.sprites.length;
    const leftIdx = (this.selectedIdx - 1 + N) % N;
    const rightIdx = (this.selectedIdx + 1) % N;
    gsap.to(this.sprites[leftIdx], { alpha: 0, duration: 10/60 });
    gsap.to(this.sprites[rightIdx], { alpha: 0, duration: 10/60 });
  }
  private fadeInUI() {
    gsap.to(this.leftArrow, { alpha: 1, duration: 10/60 });
    gsap.to(this.rightArrow, { alpha: 1, duration: 10/60 });
    const N = this.sprites.length;
    const leftIdx = (this.selectedIdx - 1 + N) % N;
    const rightIdx = (this.selectedIdx + 1) % N;
    gsap.to(this.sprites[leftIdx], { alpha: DESIGN.HORIZONTAL_ICON_ALPHA, duration: 10/60 });
    gsap.to(this.sprites[rightIdx], { alpha: DESIGN.HORIZONTAL_ICON_ALPHA, duration: 10/60 });
  }

  private updateHoldColorEffect(progress: number) {
    const sprite = this.sprites[this.selectedIdx];
    if (!sprite) return;
    const startColor = 0xff4444;
    const endColor = 0x220000;
    const lerpColor = (a: number, b: number, t: number): number => {
      const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
      const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
      const rr = Math.round(ar + (br - ar) * t);
      const rg = Math.round(ag + (bg - ag) * t);
      const rb = Math.round(ab + (bb - ab) * t);
      return (rr << 16) | (rg << 8) | rb;
    };
    sprite.tint = lerpColor(startColor, endColor, progress);
    sprite.alpha = 1.0 - 0.02 * progress;
  }

  private showVibrationEffect() {
    const sprite = this.sprites[this.selectedIdx];
    if (sprite) {
      gsap.fromTo(sprite,
        { x: sprite.x - 10 },
        {
          x: sprite.x + 10,
          duration: 0.08,
          repeat: 5,
          yoyo: true,
          onComplete: () => { sprite.x = DESIGN.HORIZONTAL_CENTER_X; }
        }
      );
    }
  }

  // ===== ランダムテキスト抽選 =====
  private getRandomLine(arr: string[] | undefined): string {
    if (!arr || arr.length === 0) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  //ランダムバルーンポジション
  private getBalloonPosition(type: BalloonType): { x: number, y: number } {
  // 画面サイズ前提: 720x1280
  switch (type) {
    case "hold1": // 左下
      return {
        x: Math.random() * 120 + 60, // 60~180px
        y: Math.random() * 120 + 900 // 900~1020px
      };
    case "hold2": // 右中
      return {
        x: Math.random() * 120 + 500, // 500~620px
        y: Math.random() * 120 + 500  // 500~620px
      };
    case "confirm": // 中央上
      return {
        x: Math.random() * 100 + 310, // 310~410px
        y: Math.random() * 100 + 120  // 120~220px
      };
    default: // デフォルト（中央下）
      return {
        x: DESIGN.HORIZONTAL_CENTER_X,
        y: DESIGN.HORIZONTAL_CENTER_Y + DESIGN.HORIZONTAL_ICON_SIZE_SELECTED / 2 + 30
      };
  }
  }

  //勝敗判定
  private finishAccuse() {
  const animal = this.animals[this.selectedIdx];
  // オオカミ判定：animal.isWolfまたはwolves配列
  const isWolf = animal.isWolf !== undefined ? animal.isWolf : this.wolves.includes(animal.name);

  if (isWolf) {
    SceneManager.changeScene('Win', { animalName: animal.name });
  } else {
    SceneManager.changeScene('Lose', { animalName: animal.name });
  }
}
}