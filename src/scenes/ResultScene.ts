import * as PIXI from 'pixi.js';
import { Assets } from 'pixi.js';
import { assetUrl } from '../core/assetPath';
import { SceneManager } from '../core/SceneManager';
import {
  RESULT_BG_WIDTH, RESULT_BG_HEIGHT,
  RESULT_TITLE_FONT_SIZE, RESULT_TITLE_COLOR, RESULT_TITLE_Y,
  RESULT_ANIMAL_ICON_SIZE, RESULT_ANIMAL_ICON_X,
  RESULT_SPACING_Y,
  RESULT_BUBBLE_WIDTH, RESULT_BUBBLE_HEIGHT, RESULT_BUBBLE_RADIUS,
  RESULT_BUBBLE_COLOR_NORMAL, RESULT_BUBBLE_COLOR_INJURED, RESULT_BUBBLE_COLOR_DEAD,
  RESULT_BUBBLE_OFFSET_X, RESULT_BUBBLE_OFFSET_Y,
  RESULT_TEXT_FONT_SIZE, RESULT_TEXT_COLOR, RESULT_TEXT_OFFSET_X, RESULT_TEXT_OFFSET_Y, RESULT_TEXT_WIDTH,
  LABEL_FONT_SIZE, LABEL_POS_X, LABEL_POS_Y, LABEL_INJURED_COLOR, LABEL_DEAD_COLOR,
  RESULT_NEXT_BTN_X, RESULT_NEXT_BTN_Y, RESULT_NEXT_BTN_COLOR, RESULT_NEXT_BTN_FONT_SIZE,
  RESULT_FLY_LABEL_START_X, RESULT_FLY_LABEL_START_Y, RESULT_FLY_LABEL_START_SCALE,
  RESULT_FLY_LABEL_FONT_SIZE, RESULT_FLY_LABEL_COLOR, RESULT_FLY_LABEL_STROKE, RESULT_FLY_LABEL_STROKE_THICKNESS
} from './ResultSceneDesign';

interface AnimalData {
  name: string;
  image: string;
  lines?: {
    normal?: string[];
    injured?: string[];
    dead?: string[];
    survivedWhileInjured?: string[];
    otherinjured?: string[];
  };
}

type StateType = "normal" | "injured" | "dead" | "survivedWhileInjured";

interface AnimalState {
  name: string;
  from: StateType;
  to: StateType;
}

interface ResultData {
  selected: AnimalData[];
  wolves: string[];
  scenario: any;
  playerLost?: boolean;
  animalStateList: AnimalState[];
}

export class ResultScene extends PIXI.Container {
  private app: PIXI.Application;
  private scenario: any;
  private wolves: string[];
  private playerLost: boolean;

  private healthyAnimals: AnimalData[] = [];
  private survivedInjuredAnimals: AnimalData[] = [];
  private newlyInjuredAnimals: AnimalData[] = [];
  private deadAnimals: AnimalData[] = [];

  private selectedAnimals: AnimalData[] = [];
  private animalContainers: { [name: string]: PIXI.Container } = {};
  private animalStateList: AnimalState[] = [];
  private injuredNames: string[] = [];
  private deadNames: string[] = [];
  private totalInjuryCount: number = 0;

  private attackedQueue: { animal: AnimalData; to: "injured" | "dead" }[] = [];
  private currentAnimIndex = 0;
  private animStep = 0;
  private animDuration = 20;
  private flyText?: PIXI.Text;
  private ticker: PIXI.Ticker;

  private finished = false;
  private deathOccured = false;

  private redOverlay?: PIXI.Graphics;
  private blackOverlay?: PIXI.Graphics;

  constructor(app: PIXI.Application, data: ResultData) {
    super();
    this.app = app;
    this.scenario = data.scenario;
    this.wolves = data.wolves;
    this.playerLost = data.playerLost ?? false;
    this.animalStateList = data.animalStateList;

    const findState = (name: string) => this.animalStateList.find(s => s.name === name);

    this.healthyAnimals = data.selected.filter(a => {
      const s = findState(a.name);
      return s && s.from === "normal" && s.to === "normal";
    });
    this.survivedInjuredAnimals = data.selected.filter(a => {
      const s = findState(a.name);
      return s && s.from === "injured" && s.to === "injured";
    });
    this.newlyInjuredAnimals = data.selected.filter(a => {
      const s = findState(a.name);
      return s && s.from === "normal" && s.to === "injured";
    });
    this.deadAnimals = data.selected.filter(a => {
      const s = findState(a.name);
      return s && s.to === "dead";
    });

    this.selectedAnimals = data.selected;

    this.renderBackground();
    this.renderTitle();
    this.createBackButton();

    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointertap', () => {
      if (!this.finished) {
        this.skipAll();
      } else {
        this.gotoNext();
      }
    });

    this.ticker = new PIXI.Ticker();
    this.ticker.add(this.onTickerUpdate, this);

    this.initAsync();
  }

  private async initAsync() {
    this.injuredNames = this.newlyInjuredAnimals.map(a => a.name);
    this.deadNames = this.deadAnimals.map(a => a.name);
    this.totalInjuryCount = this.injuredNames.length + this.deadNames.length;

    // まずは全員を「前日の状態」で描画する
    await this.renderGroup(this.healthyAnimals, "normal");
    await this.renderGroup(this.survivedInjuredAnimals, "survivedWhileInjured");
    // 被害者も、まずは「異常なし」または「元々の負傷状態」で出す
    await this.renderGroup(this.newlyInjuredAnimals, "normal_pre_injured");
    await this.renderGroup(this.deadAnimals, "injured_pre_dead");

    this.prepareAttackedQueue();
    // 最初の待機
    await new Promise(r => setTimeout(r, 800));
    this.ticker.start();
  }

  private async renderBackground() {
    try {
      const bgTexture = await Assets.load(assetUrl('assets/backgrounds/resultbg.png'));
      const bg = new PIXI.Sprite(bgTexture);
      bg.width = RESULT_BG_WIDTH; bg.height = RESULT_BG_HEIGHT;
      bg.x = 0; bg.y = 0;
      this.addChildAt(bg, 0);

      this.redOverlay = new PIXI.Graphics();
      this.redOverlay.beginFill(0xff0000);
      this.redOverlay.drawRect(0, 0, RESULT_BG_WIDTH, RESULT_BG_HEIGHT);
      this.redOverlay.endFill();
      this.redOverlay.alpha = 0;
      this.addChildAt(this.redOverlay, 1);

      this.blackOverlay = new PIXI.Graphics();
      this.blackOverlay.beginFill(0x000000);
      this.blackOverlay.drawRect(0, 0, RESULT_BG_WIDTH, RESULT_BG_HEIGHT);
      this.blackOverlay.endFill();
      this.blackOverlay.alpha = 0;
      this.addChildAt(this.blackOverlay, 2);
    } catch (e) {
      console.warn('⚠️ 結果背景の読み込みに失敗しました', e);
    }
  }

  private renderTitle() {
    const day = (SceneManager.currentDay ?? 0) + 1;
    const sectionTitle = this.scenario?.sectionTitle || "作業A工区";
    const title = new PIXI.Text(
      `${sectionTitle}　第${day}日目作業報告`,
      {
        fill: RESULT_TITLE_COLOR,
        fontSize: RESULT_TITLE_FONT_SIZE,
        fontWeight: 'bold',
        stroke: 0x000000,
        strokeThickness: 6,
      }
    );
    title.anchor.set(0.5, 0);
    title.x = RESULT_BG_WIDTH / 2;
    title.y = RESULT_TITLE_Y;
    this.addChild(title);
  }

  private prepareAttackedQueue() {
    this.attackedQueue = [];
    this.newlyInjuredAnimals.forEach(a => this.attackedQueue.push({ animal: a, to: "injured" }));
    this.deadAnimals.forEach(a => this.attackedQueue.push({ animal: a, to: "dead" }));
    this.currentAnimIndex = 0;
    this.animStep = 0;
  }

  private isPlayingEffect = false;
  private onTickerUpdate() {
    if (this.currentAnimIndex >= this.attackedQueue.length) {
      this.finished = true;
      this.ticker.stop();
      return;
    }

    // エフェクト再生中は進行しない
    if (this.isPlayingEffect) return;

    if (this.animStep === 0) {
      const { animal, to } = this.attackedQueue[this.currentAnimIndex];
      const container = this.animalContainers[animal.name];
      if (!container) { this.currentAnimIndex++; return; }

      // 演出開始（オーバーレイなど）
      if (to === "dead") {
        this.tweenBlackOverlay();
      } else {
        this.tweenRedOverlay();
      }

      const textMap = { injured: { label: "負傷", color: LABEL_INJURED_COLOR }, dead: { label: "死亡", color: LABEL_DEAD_COLOR } };
      this.flyText = new PIXI.Text(textMap[to].label, {
        fill: textMap[to].color,
        fontSize: RESULT_FLY_LABEL_FONT_SIZE,
        fontWeight: "bold",
        stroke: RESULT_FLY_LABEL_STROKE,
        strokeThickness: RESULT_FLY_LABEL_STROKE_THICKNESS,
      });
      this.flyText.anchor.set(0.5);
      this.flyText.x = RESULT_FLY_LABEL_START_X;
      this.flyText.y = RESULT_FLY_LABEL_START_Y;
      this.flyText.scale.set(RESULT_FLY_LABEL_START_SCALE);
      this.flyText.alpha = 0.95;
      this.addChild(this.flyText);

      this.animStep++;
    } else {
      if (!this.flyText) { this.animStep = 0; this.currentAnimIndex++; return; }

      const { animal, to } = this.attackedQueue[this.currentAnimIndex];
      const container = this.animalContainers[animal.name];

      // 目的地計算（既存ラベルがある場所）
      // まだラベルがない場合は作成しておく（非表示）
      let stateLabel = (container as any).stateLabel as PIXI.Text | undefined;
      if (!stateLabel) {
        stateLabel = new PIXI.Text(to === "injured" ? "負傷" : "死亡", {
          fill: to === "injured" ? LABEL_INJURED_COLOR : LABEL_DEAD_COLOR,
          fontSize: LABEL_FONT_SIZE,
          fontWeight: "bold",
          stroke: 0xffffff,
          strokeThickness: 4,
        });
        stateLabel.anchor.set(0.5);
        stateLabel.x = LABEL_POS_X - RESULT_ANIMAL_ICON_X;
        stateLabel.y = LABEL_POS_Y;
        stateLabel.visible = false;
        (container as any).stateLabel = stateLabel;
        container.addChild(stateLabel);
      }

      const globalLabel = stateLabel.getGlobalPosition();
      const localGoal = this.toLocal(globalLabel);

      const startX = RESULT_FLY_LABEL_START_X, startY = RESULT_FLY_LABEL_START_Y;
      const endX = localGoal.x, endY = localGoal.y;
      const startScale = RESULT_FLY_LABEL_START_SCALE, endScale = 1.0;

      const t = this.animStep / this.animDuration;
      const ease = (p: number) => 1 - Math.pow(1 - p, 2);
      const p = ease(t);

      this.flyText.x = startX + (endX - startX) * p;
      this.flyText.y = startY + (endY - startY) * p;
      this.flyText.scale.set(startScale + (endScale - startScale) * p);

      if (t >= 1) {
        // 重複実行防止フラグを立てる
        this.isPlayingEffect = true;

        this.flyText.visible = false;
        const sprite = container.children.find(c => c instanceof PIXI.Sprite) as PIXI.Sprite;

        // ヒット時に対象の見た目を更新
        this.updateStateLabel(container, to);
        this.updateSpeechText(container, animal, to);
        this.updateBubbleColor(container, to);

        this.shakeSprite(sprite, to, () => {
          if (this.flyText) {
            this.removeChild(this.flyText);
            this.flyText = undefined;
          }

          if (to === "dead") {
            this.deathOccured = true;
            this.fadeOutAndRemove(container, () => {
              this.currentAnimIndex++;
              this.animStep = 0;
              this.isPlayingEffect = false;
            });
          } else {
            this.currentAnimIndex++;
            this.animStep = 0;
            this.isPlayingEffect = false;
          }
        });
      } else {
        this.animStep++;
      }
    }
  }

  private async renderGroup(animals: AnimalData[], status: StateType | "injured_pre_dead" | "normal_pre_injured") {
    if (animals.length === 0) return;

    const totalCount =
      this.healthyAnimals.length +
      this.survivedInjuredAnimals.length +
      this.newlyInjuredAnimals.length +
      this.deadAnimals.length;

    const spacingY = RESULT_SPACING_Y - (totalCount <= 4 ? 20 : 0);
    const totalHeight = spacingY * totalCount;
    const startX = RESULT_ANIMAL_ICON_X;

    const groupStartIndex = this.getGroupStartIndex(status);
    const startY = (RESULT_BG_HEIGHT - totalHeight) / 2 + groupStartIndex * spacingY;

    for (let i = 0; i < animals.length; i++) {
      const animal = animals[i];
      const y = startY + i * spacingY;
      const container = await this.createAnimalContainer(animal, startX, y, status);
      this.animalContainers[animal.name] = container;
      this.addChild(container);
    }
  }

  private getGroupStartIndex(status: StateType | "injured_pre_dead" | "normal_pre_injured"): number {
    switch (status) {
      case "normal": return 0;
      case "survivedWhileInjured": return this.healthyAnimals.length;
      case "injured":
      case "normal_pre_injured":
        return this.healthyAnimals.length + this.survivedInjuredAnimals.length;
      case "injured_pre_dead":
      case "dead":
        return this.healthyAnimals.length + this.survivedInjuredAnimals.length + this.newlyInjuredAnimals.length;
      default: return 0;
    }
  }

  private async createAnimalContainer(animal: AnimalData, x: number, y: number, status: StateType | "injured_pre_dead" | "normal_pre_injured"): Promise<PIXI.Container> {
    const container = new PIXI.Container();
    container.x = x; container.y = y;

    const actualStatus: StateType = (status === "injured_pre_dead")
      ? "injured"
      : (status === "normal_pre_injured" ? "normal" : status);

    try {
      await Assets.load(assetUrl(`assets/animals/${animal.image}`));
      const sprite = PIXI.Sprite.from(assetUrl(`assets/animals/${animal.image}`));
      sprite.width = RESULT_ANIMAL_ICON_SIZE;
      sprite.height = RESULT_ANIMAL_ICON_SIZE;
      sprite.anchor.set(0.5);
      sprite.x = 0; sprite.y = 0;

      const state = this.animalStateList.find(s => s.name === animal.name);
      if (state?.from === "injured" && state.to === "injured") {
        sprite.tint = 0xff6666;
      }
      if (status === "survivedWhileInjured") sprite.tint = 0xff9999;
      else if (status === "dead") sprite.tint = 0x444444;

      container.addChild(sprite);
    } catch {
      const fallback = new PIXI.Graphics();
      fallback.beginFill(0x888888);
      fallback.drawCircle(0, 0, RESULT_ANIMAL_ICON_SIZE / 2);
      fallback.endFill();
      container.addChild(fallback);
    }

    let bubbleColor = RESULT_BUBBLE_COLOR_NORMAL;
    if (status === "injured") bubbleColor = RESULT_BUBBLE_COLOR_INJURED;
    else if (status === "dead") bubbleColor = RESULT_BUBBLE_COLOR_DEAD;

    const bubble = new PIXI.Graphics();
    bubble.beginFill(bubbleColor);
    bubble.drawRoundedRect(RESULT_BUBBLE_OFFSET_X, RESULT_BUBBLE_OFFSET_Y, RESULT_BUBBLE_WIDTH, RESULT_BUBBLE_HEIGHT, RESULT_BUBBLE_RADIUS);
    bubble.endFill();
    container.addChild(bubble);

    let lineCategory: StateType | "otherinjured" = actualStatus;
    if (actualStatus === "normal" && (this.injuredNames.length + this.deadNames.length) > 0) {
      lineCategory = "otherinjured";
    }

    const lines = animal.lines?.[lineCategory];
    let message = "";
    if (lines && lines.length > 0) {
      const available = lines.filter(line => {
        if (line.includes("{name}") && this.injuredNames.length === 0) return false;
        if (line.includes("{count}") && (this.injuredNames.length + this.deadNames.length) === 0) return false;
        return true;
      });
      const raw = (available.length > 0 ? available : lines)[Math.floor(Math.random() * (available.length > 0 ? available.length : lines.length))];
      message = raw.replace(/{name}/g, formatInjuredNames(this.injuredNames))
        .replace(/{count}/g, (this.injuredNames.length + this.deadNames.length).toString());
    } else {
      message =
        status === "injured" ? 'イテテ… ぶつかったかも…' :
          status === "dead" ? '…もう、動けないみたい…' :
            status === "survivedWhileInjured" ? 'なんとかやり過ごせた…かな？' :
              '無事に終わったよ！';
    }

    const text = new PIXI.Text(message, {
      fill: RESULT_TEXT_COLOR,
      fontSize: RESULT_TEXT_FONT_SIZE,
      wordWrap: true,
      wordWrapWidth: RESULT_TEXT_WIDTH,
    });
    text.x = RESULT_TEXT_OFFSET_X;
    text.y = RESULT_TEXT_OFFSET_Y;
    container.addChild(text);

    let labelText = "";
    let labelColor = 0xffffff;
    if (actualStatus === "injured" || actualStatus === "survivedWhileInjured") {
      labelText = "負傷";
      labelColor = LABEL_INJURED_COLOR;
    } else if (actualStatus === "dead") {
      labelText = "死亡";
      labelColor = LABEL_DEAD_COLOR;
    }
    if (labelText) {
      const stateLabel = new PIXI.Text(labelText, {
        fill: labelColor,
        fontSize: LABEL_FONT_SIZE,
        fontWeight: "bold",
        stroke: 0xffffff,
        strokeThickness: 4,
      });
      stateLabel.anchor.set(0.5);
      stateLabel.x = LABEL_POS_X - RESULT_ANIMAL_ICON_X;
      stateLabel.y = LABEL_POS_Y;
      (container as any).stateLabel = stateLabel;
      container.addChild(stateLabel);
    }
    return container;
  }

  private updateBubbleColor(container: PIXI.Container, to: "injured" | "dead") {
    const bubble = container.children.find(c => c instanceof PIXI.Graphics) as PIXI.Graphics | undefined;
    if (bubble) {
      const color = (to === "injured") ? RESULT_BUBBLE_COLOR_INJURED : RESULT_BUBBLE_COLOR_DEAD;
      bubble.clear();
      bubble.beginFill(color);
      bubble.drawRoundedRect(RESULT_BUBBLE_OFFSET_X, RESULT_BUBBLE_OFFSET_Y, RESULT_BUBBLE_WIDTH, RESULT_BUBBLE_HEIGHT, RESULT_BUBBLE_RADIUS);
      bubble.endFill();
    }
  }

  private updateStateLabel(container: PIXI.Container, to: "injured" | "dead") {
    const stateLabel = (container as any).stateLabel as PIXI.Text;
    if (stateLabel) {
      (stateLabel.style as any).fill = (to === "injured") ? LABEL_INJURED_COLOR : LABEL_DEAD_COLOR;
      stateLabel.text = (to === "injured") ? "負傷" : "死亡";
      stateLabel.scale.set(1.0);
      stateLabel.visible = true;
    } else {
      const label = new PIXI.Text(to === "injured" ? "負傷" : "死亡", {
        fill: to === "injured" ? LABEL_INJURED_COLOR : LABEL_DEAD_COLOR,
        fontSize: LABEL_FONT_SIZE,
        fontWeight: "bold",
        stroke: 0xffffff,
        strokeThickness: 4,
      });
      label.anchor.set(0.5);
      label.x = LABEL_POS_X - RESULT_ANIMAL_ICON_X;
      label.y = LABEL_POS_Y;
      (container as any).stateLabel = label;
      container.addChild(label);
    }
  }

  private updateSpeechText(container: PIXI.Container, animal: AnimalData, to: StateType) {
    const speechText = container.children.find(c => c instanceof PIXI.Text && c !== (container as any).stateLabel) as PIXI.Text | undefined;
    if (!speechText) return;

    const lines = animal.lines?.[to];
    const message = lines && lines.length > 0
      ? lines[Math.floor(Math.random() * lines.length)]
      : to === "injured" ? 'イテテ… ぶつかったかも…'
        : to === "dead" ? '…もう、動けないみたい…'
          : to === "survivedWhileInjured" ? 'なんとかやり過ごせた…かな？'
            : '無事に終わったよ！';

    speechText.text = message;
  }

  private skipAll() {
    if (this.ticker) this.ticker.stop();
    for (; this.currentAnimIndex < this.attackedQueue.length; this.currentAnimIndex++) {
      const { animal, to } = this.attackedQueue[this.currentAnimIndex];
      const container = this.animalContainers[animal.name];
      if (!container) continue;
      this.updateStateLabel(container, to);
      this.updateSpeechText(container, animal, to);
      if (to === "dead") this.deathOccured = true;
    }
    this.finished = true;
  }

  private gotoNext() {
    // 進行状況に関わらず確実に ticker を停止・破棄
    if (this.ticker) {
      this.ticker.stop();
      this.ticker.destroy();
    }
    if (!this.finished) {
      this.skipAll();
    }
    if (this.deathOccured) {
      SceneManager.changeScene('InjuryGameOver', {
        animal: this.deadAnimals.length > 0 ? this.deadAnimals[0].name : ""
      });
    } else {
      SceneManager.currentDay++;
      SceneManager.changeScene('Game', this.scenario, this.wolves);
    }
  }

  private createBackButton() {
    const button = new PIXI.Text('▶ 次へ', {
      fill: RESULT_NEXT_BTN_COLOR,
      fontSize: RESULT_NEXT_BTN_FONT_SIZE,
    });
    button.anchor.set(1);
    button.x = RESULT_NEXT_BTN_X;
    button.y = RESULT_NEXT_BTN_Y;
    button.eventMode = 'static';
    button.cursor = 'pointer';
    button.on('pointertap', () => this.gotoNext());
    this.addChild(button);
  }

  private shakeSprite(sprite: PIXI.Sprite, to: "injured" | "dead", onComplete?: () => void) {
    const originalX = sprite.x;
    let count = 0; const max = 16; const step = 2;

    const doShake = () => {
      if (count >= max) {
        sprite.x = originalX;
        if (onComplete) onComplete();
        return;
      }
      sprite.x = originalX + (count % 2 === 0 ? step : -step);
      if (count === 0) {
        sprite.tint = (to === "injured") ? 0xff6666 : 0x101010;
      }
      count++;
      setTimeout(doShake, 16);
    };
    doShake();
  }

  private tweenRedOverlay() {
    if (!this.redOverlay) return;
    const duration = 10;
    let frame = 0; const maxAlpha = 0.5;
    const update = () => {
      if (!this.redOverlay) return;
      if (frame < duration) this.redOverlay.alpha = (frame / duration) * maxAlpha;
      else if (frame < duration * 2) this.redOverlay.alpha = ((duration * 2 - frame) / duration) * maxAlpha;
      else { this.ticker.remove(update); return; }
      frame++;
    };
    this.ticker.add(update);
  }

  private tweenBlackOverlay() {
    if (!this.blackOverlay) return;
    const duration = 100; let frame = 0; const maxAlpha = 1;
    const update = () => {
      if (!this.blackOverlay) return;
      if (frame < duration) this.blackOverlay.alpha = (frame / duration) * maxAlpha;
      else if (frame < duration * 2) this.blackOverlay.alpha = ((duration * 2 - frame) / duration) * maxAlpha;
      else { this.ticker.remove(update); return; }
      frame++;
    };
    this.ticker.add(update);
  }

  private fadeOutAndRemove(container: PIXI.Container, onComplete: () => void) {
    let alpha = 1.0; const step = 0.01;
    const fade = () => {
      alpha -= step; container.alpha = alpha;
      if (alpha <= 0) { this.removeChild(container); onComplete(); }
      else { requestAnimationFrame(fade); }
    };
    fade();
  }
}

function formatInjuredNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]}さん`;
  if (names.length === 2) return `${names[0]}さんと${names[1]}さん`;
  return names.slice(0, -1).map(n => `${n}さん`).join("、") + `と${names[names.length - 1]}さん`;
}
