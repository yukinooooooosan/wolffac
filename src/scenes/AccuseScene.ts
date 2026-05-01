// src/scenes/AccuseScene.ts

import * as PIXI from 'pixi.js';
import type { ScenarioData } from '../core/types';
import { assetUrl } from '../core/assetPath';
import { SceneManager } from '../core/SceneManager';
import type { ResultData } from '../core/SceneManager';
import { StatsManager } from '../core/StatsManager';
import * as DESIGN from './AccuseSceneDesign';
import gsap from 'gsap';
import { GlowFilter } from '@pixi/filter-glow';
import { advanceAccuseHold, canCancelAccuseHold, resolveAccusation } from '../game/resolveAccuse';

type BalloonType = "select" | "hold1" | "hold2" | "confirm" | "cancel";

export class AccuseScene extends PIXI.Container {
  private sprites: PIXI.Sprite[] = [];
  private selectedIdx = 0;
  private animals: ScenarioData['availableAnimals'];
  private wolves: string[] = [];
  private scenario: ScenarioData; // ← 追加

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
  private tickerUpdate: () => void;

  constructor(data: ResultData) {
    super();
    const { scenario, wolves } = data;
    this.scenario = scenario; // ← 保存
    this.animals = scenario.availableAnimals;
    this.wolves = wolves ?? [];

    // 背景スプライトを生成
    const bg = PIXI.Sprite.from(assetUrl("assets/backgrounds/accusebg.png"));
    bg.width = 720;
    bg.height = 1280;
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

    // === 動物スプライトを生成 ===
    this.sprites = [];
    for (let i = 0; i < this.animals.length; i++) {
      const animal = this.animals[i];
      const sprite = PIXI.Sprite.from(assetUrl(`assets/animals/${animal.image}`));
      sprite.anchor.set(0.5);
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
    const onRelease = () => {
      if (!this.isHolding) return;
      this.isHolding = false;
      this.resetHoldState();
    };
    this.disposeButton.on('pointerup', onRelease);
    this.disposeButton.on('pointerupoutside', onRelease);

    // 初期化
    this.switchAnimal(this.selectedIdx);

    // Ticker Update
    this.tickerUpdate = () => this.update();
    PIXI.Ticker.shared.add(this.tickerUpdate);
  }

  private update() {
    if (this.isHolding) {
      const hold = advanceAccuseHold(this.accuseHoldFrame);
      this.accuseHoldFrame = hold.frame;
      this.gauge = hold.frame;
      this.updateHoldColorEffect(hold.progress);

      for (const cue of hold.cues) {
        if (cue === "start") {
          this.fadeOutUI();
          this.showVibrationEffect();
        } else if (cue === "hold1") {
          this.showHold1Line();
        } else if (cue === "hold2") {
          this.showHold2Line();
        } else if (cue === "confirm") {
          this.showConfirmLine();
        }
      }

      if (hold.confirmed) {
        this.isHolding = false;
        // セリフを読ませるためのウェイトを入れてから遷移
        gsap.delayedCall(1.5, () => this.finishAccuse());
      }
      this.gaugeText.text = `ゲージ: ${this.gauge}`;
    }
  }

  private resetHoldState() {
    // すでに確定フェーズ（150に到達）している場合は何もしない
    if (!canCancelAccuseHold(this.accuseHoldFrame)) return;

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

  // ===== バルーン事前生成 =====
  private createAllBalloonsForAnimal(idx: number) {
    // 既存バルーン削除と破棄
    for (const balloon of this.balloonMap.values()) {
      balloon.destroy({ children: true });
    }
    this.balloonMap.clear();

    const animal = this.animals[idx];
    const select = this.getRandomLine(animal.lines.accused?.select);
    const hold1 = this.getRandomLine(animal.lines.accused?.hold1);
    const hold2 = this.getRandomLine(animal.lines.accused?.hold2);
    const cancel = this.getRandomLine(animal.lines.accused?.cancel);

    let isWolf = animal.isWolf ?? this.wolves.includes(animal.name);

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

    for (const b of this.balloonMap.values()) {
      b.visible = false;
      this.addChild(b);
    }
  }

  private createBalloon(text: string | undefined, type?: BalloonType): PIXI.Container {
    const container = new PIXI.Container();
    const paddingX = 30, paddingY = 20, minWidth = 140, minHeight = 54, maxWidth = 360;

    const balloonText = new PIXI.Text(text ?? '', {
      fontSize: 28,
      fill: 0x222222,
      wordWrap: true,
      wordWrapWidth: maxWidth - paddingX * 2,
      align: 'center',
    });
    balloonText.anchor.set(0.5, 0.5);

    const w = Math.max(balloonText.width + paddingX * 2, minWidth);
    const h = Math.max(balloonText.height + paddingY * 2, minHeight);

    const balloonBg = new PIXI.Graphics();
    // 中心を (0,0) にするように描画
    balloonBg.beginFill(0xffffff, 0.95).drawRoundedRect(-w / 2, -h / 2, w, h, 20).endFill();

    if (type === "hold1" || type === "hold2" || type === "confirm") {
      balloonBg.filters = [
        new GlowFilter({
          color: 0xffffff,
          distance: 24,
          outerStrength: 4,
          innerStrength: 0,
          quality: 0.5
        })
      ];
    }

    balloonText.position.set(0, 0);
    container.addChild(balloonBg);
    container.addChild(balloonText);

    return container;
  }

  private showBalloon(type: BalloonType) {
    for (const [key, balloon] of this.balloonMap) {
      gsap.killTweensOf(balloon);
      gsap.killTweensOf(balloon.scale);

      if (key === type) {
        const pos = this.getBalloonPosition(type);
        balloon.position.set(pos.x, pos.y);

        if (type === "hold1" || type === "hold2" || type === "confirm") {
          balloon.scale.set(0.1);
          balloon.alpha = 0;
          balloon.visible = true;
          gsap.to(balloon.scale, { x: 1, y: 1, duration: 0.23, ease: "back.out(2)" });
          gsap.to(balloon, { alpha: 1, duration: 0.7 });
        } else {
          balloon.scale.set(1);
          balloon.alpha = 1;
          balloon.visible = true;
        }
        this.setChildIndex(balloon, this.children.length - 1);
      } else {
        if (key === "hold1" || key === "hold2" || key === "confirm") {
          gsap.to(balloon, { alpha: 0, duration: 0.7 });
          gsap.to(balloon.scale, {
            x: 1.7, y: 2.2,
            duration: 0.16, ease: "power2.in",
            onComplete: () => { balloon.visible = false; }
          });
        } else {
          balloon.visible = false;
        }
      }
    }
  }

  private switchAnimal(idx: number) {
    this.createAllBalloonsForAnimal(idx);
    this.updateAnimalPositions(false);
    this.showSelectLine();
  }

  private updateAnimalPositions(animate = false) {
    const N = this.sprites.length;
    const centerX = DESIGN.HORIZONTAL_CENTER_X;
    const centerY = DESIGN.HORIZONTAL_CENTER_Y;
    const spacing = DESIGN.HORIZONTAL_ICON_SIZE + DESIGN.HORIZONTAL_ICON_SPACING;

    for (let i = 0; i < N; i++) {
      const sprite = this.sprites[i];
      let targetX, targetY, targetW, targetA, z;

      if (i === this.selectedIdx) {
        targetX = centerX; targetY = centerY;
        targetW = DESIGN.HORIZONTAL_ICON_SIZE_SELECTED; targetA = DESIGN.HORIZONTAL_ICON_ALPHA_SELECTED; z = 3;
      } else if (i === (this.selectedIdx + 1) % N) {
        targetX = centerX + spacing; targetY = centerY;
        targetW = DESIGN.HORIZONTAL_ICON_SIZE; targetA = DESIGN.HORIZONTAL_ICON_ALPHA; z = 2;
      } else if (i === (this.selectedIdx - 1 + N) % N) {
        targetX = centerX - spacing; targetY = centerY;
        targetW = DESIGN.HORIZONTAL_ICON_SIZE; targetA = DESIGN.HORIZONTAL_ICON_ALPHA; z = 1;
      } else {
        targetX = centerX; targetY = centerY; targetW = DESIGN.HORIZONTAL_ICON_SIZE; targetA = 0; z = 0;
      }

      gsap.killTweensOf(sprite);
      if (animate) {
        sprite.visible = true;
        gsap.to(sprite, {
          x: targetX, y: targetY, width: targetW, height: targetW, alpha: targetA,
          duration: 0.3, ease: "power2.out",
          onComplete: () => { if (z === 0) sprite.visible = false; }
        });
      } else {
        sprite.position.set(targetX, targetY);
        sprite.width = targetW;
        sprite.height = targetW;
        sprite.alpha = targetA;
        sprite.visible = z !== 0;
      }
      sprite.zIndex = z;
    }
    this.children.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  }

  private showSelectLine() { this.showBalloon("select"); }
  private showHold1Line() { this.showBalloon("hold1"); }
  private showHold2Line() { this.showBalloon("hold2"); }
  private showConfirmLine() { this.showBalloon("confirm"); }
  private showCancelLine() { this.showBalloon("cancel"); }

  private fadeOutUI() {
    gsap.to([this.leftArrow, this.rightArrow], { alpha: 0, duration: 0.16 });
    const N = this.sprites.length;
    gsap.to(this.sprites[(this.selectedIdx - 1 + N) % N], { alpha: 0, duration: 0.16 });
    gsap.to(this.sprites[(this.selectedIdx + 1) % N], { alpha: 0, duration: 0.16 });
  }

  private fadeInUI() {
    gsap.to([this.leftArrow, this.rightArrow], { alpha: 1, duration: 0.16 });
    const N = this.sprites.length;
    gsap.to(this.sprites[(this.selectedIdx - 1 + N) % N], { alpha: DESIGN.HORIZONTAL_ICON_ALPHA, duration: 0.16 });
    gsap.to(this.sprites[(this.selectedIdx + 1) % N], { alpha: DESIGN.HORIZONTAL_ICON_ALPHA, duration: 0.16 });
  }

  private updateHoldColorEffect(progress: number) {
    const sprite = this.sprites[this.selectedIdx];
    if (!sprite) return;
    const startColor = 0xff4444;
    const endColor = 0x220000;
    const lerpColor = (a: number, b: number, t: number): number => {
      const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
      const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
      return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
    };
    sprite.tint = lerpColor(startColor, endColor, progress);
  }

  private showVibrationEffect() {
    const sprite = this.sprites[this.selectedIdx];
    if (sprite) {
      gsap.fromTo(sprite, { x: sprite.x - 10 }, { x: sprite.x + 10, duration: 0.08, repeat: 5, yoyo: true, onComplete: () => { sprite.x = DESIGN.HORIZONTAL_CENTER_X; } });
    }
  }

  private getRandomLine(arr: string[] | undefined): string {
    return (arr && arr.length > 0) ? arr[Math.floor(Math.random() * arr.length)] : '';
  }

  private getBalloonPosition(type: BalloonType): { x: number, y: number } {
    const screenW = 720;
    const padding = 180; // Balloonの端がはみ出ないための余白(360 / 2)

    switch (type) {
      case "hold1": // 左下寄り
        return {
          x: Math.random() * 100 + padding,
          y: Math.random() * 150 + 850
        };
      case "hold2": // 右上寄り
        return {
          x: screenW - padding - Math.random() * 100,
          y: Math.random() * 150 + 250
        };
      case "confirm": // 中央・動物に被せる
        return {
          x: 360,
          y: 500
        };
      default: // select / cancel (通常の下位置)
        return {
          x: 360,
          y: 830
        };
    }
  }

  private finishAccuse() {
    const animal = this.animals[this.selectedIdx];
    const result = resolveAccusation(animal, this.wolves);

    // 統計記録
    StatsManager.incrementTotalAccusations();
    if (result.isWolf) {
      StatsManager.incrementCorrectAccusations();
    } else {
      StatsManager.incrementWrongAccusations();
    }

    SceneManager.changeScene(result.result === "win" ? 'Win' : 'Lose', {
      animalName: result.animalName,
      scenarioId: this.animals === this.scenario?.availableAnimals ? this.scenario?.id : undefined // シナリオIDを渡す
    });
  }

  public destroy(options?: PIXI.IDestroyOptions | boolean): void {
    PIXI.Ticker.shared.remove(this.tickerUpdate);
    gsap.killTweensOf(this);
    for (const b of this.balloonMap.values()) b.destroy({ children: true });
    this.balloonMap.clear();
    super.destroy(options);
  }
}
