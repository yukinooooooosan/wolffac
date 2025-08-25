import * as PIXI from 'pixi.js';
import { Assets } from 'pixi.js';
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

  // 襲撃アニメーション管理用キュー
  private attackedQueue: { animal: AnimalData; to: "injured" | "dead" }[] = [];
  private currentAnimIndex = 0;
  private animStep = 0;
  private animDuration = 20; // フレーム数（20フレームで演出完了）
  private flyText?: PIXI.Text;
  private ticker: PIXI.Ticker;

  private finished = false;
  private deathOccured = false;

  private redOverlay?: PIXI.Graphics;  
  private blackOverlay?: PIXI.Graphics;

  constructor(app: PIXI.Application, data: ResultData) {
    super();
    this.app = app; // ← 保存して使えるようにする
    this.scenario = data.scenario;
    this.wolves = data.wolves;
    this.playerLost = data.playerLost ?? false;
    this.animalStateList = data.animalStateList;

    const findState = (name: string) => this.animalStateList.find(s => s.name === name);

    this.healthyAnimals = data.selected.filter(animal => {
      const state = findState(animal.name);
      return state && state.from === "normal" && state.to === "normal";
    });

    this.survivedInjuredAnimals = data.selected.filter(animal => {
      const state = findState(animal.name);
      return state && state.from === "injured" && state.to === "injured";
    });

    this.newlyInjuredAnimals = data.selected.filter(animal => {
      const state = findState(animal.name);
      return state && state.from === "normal" && state.to === "injured";
    });

    this.deadAnimals = data.selected.filter(animal => {
      const state = findState(animal.name);
      return state && state.to === "dead";
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
      console.log('initAsync started');

      this.injuredNames = this.newlyInjuredAnimals.map(a => a.name);
      this.deadNames = this.deadAnimals.map(a => a.name);
      this.totalInjuryCount = this.injuredNames.length + this.deadNames.length;


      await this.renderGroup(this.healthyAnimals, "normal");
      await this.renderGroup(this.survivedInjuredAnimals, "survivedWhileInjured");

      if (this.newlyInjuredAnimals.length > 0) {
        this.tweenRedOverlay();
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.renderGroup(this.newlyInjuredAnimals, "injured");
       }
      if (this.deadAnimals.length > 0) {
        this.tweenBlackOverlay();
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.renderGroup(this.deadAnimals, "dead");

      }


      this.prepareAttackedQueue();
      this.ticker.start();

      console.log('Ticker started');
    }

      private async renderBackground() {
        try {
          const bgTexture = await Assets.load('/assets/backgrounds/resultbg.png');
          const bg = new PIXI.Sprite(bgTexture);
          bg.width = RESULT_BG_WIDTH;
          bg.height = RESULT_BG_HEIGHT;
          bg.x = 0;
          bg.y = 0;
          this.addChildAt(bg, 0); // 背景は一番下

          // 🔴 赤フラッシュ用オーバーレイ
          this.redOverlay = new PIXI.Graphics();
          this.redOverlay.beginFill(0xff0000);
          this.redOverlay.drawRect(0, 0, RESULT_BG_WIDTH, RESULT_BG_HEIGHT);
          this.redOverlay.endFill();
          this.redOverlay.alpha = 0;
          this.addChildAt(this.redOverlay, 1); // 背景のすぐ上に

          // ⚫ 黒フラッシュ用オーバーレイ
          this.blackOverlay = new PIXI.Graphics();
          this.blackOverlay.beginFill(0x000000);
          this.blackOverlay.drawRect(0, 0, RESULT_BG_WIDTH, RESULT_BG_HEIGHT);
          this.blackOverlay.endFill();
          this.blackOverlay.alpha = 0;
          this.addChildAt(this.blackOverlay, 2); // 赤よりさらに上（動物より下ならOK）

        } catch (e) {
          console.warn('⚠️ 結果背景の読み込みに失敗しました', e);
        }
      }

  private renderTitle() {
    const day = (SceneManager.currentDay ?? 0) +1;
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
    this.newlyInjuredAnimals.forEach(animal => {
      this.attackedQueue.push({ animal, to: "injured" });
    });
    this.deadAnimals.forEach(animal => {
      this.attackedQueue.push({ animal, to: "dead" });
    });
    this.currentAnimIndex = 0;
    this.animStep = 0;
  }

  private onTickerUpdate() {
    if (this.currentAnimIndex >= this.attackedQueue.length) {
      this.finished = true;
      this.ticker.stop();
      return;
    }

    if (this.animStep === 0) {
      const { animal, to } = this.attackedQueue[this.currentAnimIndex];
      const container = this.animalContainers[animal.name];
      if (!container) {
        console.warn(`[WARN] Animal container not found for ${animal.name}`);
        this.currentAnimIndex++;
        return;
      }

      const textMap = {
        injured: { label: "負傷", color: LABEL_INJURED_COLOR },
        dead: { label: "死亡", color: LABEL_DEAD_COLOR }
      };
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

      let stateLabel = (container as any).stateLabel as PIXI.Text | undefined;
      if (!stateLabel) {
        stateLabel = new PIXI.Text(
          to === "injured" ? "負傷" : "死亡",
          {
            fill: to === "injured" ? LABEL_INJURED_COLOR : LABEL_DEAD_COLOR,
            fontSize: LABEL_FONT_SIZE,
            fontWeight: "bold",
            stroke: 0xffffff,
            strokeThickness: 4,
          }
        );
        stateLabel.anchor.set(0.5);
        stateLabel.x = LABEL_POS_X - RESULT_ANIMAL_ICON_X;
        stateLabel.y = LABEL_POS_Y;
        (container as any).stateLabel = stateLabel;
        container.addChild(stateLabel);
      }
      this.animStep++;
    } else {
      if (!this.flyText) {
        this.animStep = 0;
        this.currentAnimIndex++;
        return;
      }
      const { animal, to } = this.attackedQueue[this.currentAnimIndex];
      const container = this.animalContainers[animal.name];
      const stateLabel = (container as any).stateLabel as PIXI.Text;
      const globalLabel = stateLabel.getGlobalPosition();
      const localGoal = this.toLocal(globalLabel);

      const startX = RESULT_FLY_LABEL_START_X;
      const startY = RESULT_FLY_LABEL_START_Y;
      const endX = localGoal.x;
      const endY = localGoal.y;
      const startScale = RESULT_FLY_LABEL_START_SCALE;
      const endScale = 1.0;

      const t = this.animStep / this.animDuration;
      const ease = (p: number) => 1 - Math.pow(1 - p, 2);
      const p = ease(t);

      this.flyText.x = startX + (endX - startX) * p;
      this.flyText.y = startY + (endY - startY) * p;
      this.flyText.scale.set(startScale + (endScale - startScale) * p);

      if (t >= 1) {
        this.flyText.visible = false;
        const sprite = container.children.find(c => c instanceof PIXI.Sprite) as PIXI.Sprite;
        this.shakeSprite(sprite, to, () => {
        this.removeChild(this.flyText!);
        this.flyText = undefined;

        if (to === "dead") {
          this.deathOccured = true;

          // 揺れの後にフェードアウト
            this.fadeOutAndRemove(container, () => {
            this.currentAnimIndex++;
            this.animStep = 0;
          });

          // 👇 死亡した場合：崩れて散る処理を呼ぶ
          //this.crumbleAndRemove(container, () => {
          //  this.currentAnimIndex++;
          //  this.animStep = 0;
          //});

        } else {
          this.currentAnimIndex++;
          this.animStep = 0;
        }
      });

      } else {
        this.animStep++;
      }
    }
  }

  private async renderGroup(animals: AnimalData[], status: StateType) {
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

  private getGroupStartIndex(status: StateType): number {
    switch (status) {
      case "normal": return 0;
      case "survivedWhileInjured": return this.healthyAnimals.length;
      case "injured": return this.healthyAnimals.length + this.survivedInjuredAnimals.length;
      case "dead": return this.healthyAnimals.length + this.survivedInjuredAnimals.length + this.newlyInjuredAnimals.length;
      default: return 0;
    }
  }

  private async createAnimalContainer(animal: AnimalData, x: number, y: number, status: StateType): Promise<PIXI.Container> {
    const container = new PIXI.Container();
    container.x = x;
    container.y = y;

    try {
      await Assets.load(`/assets/animals/${animal.image}`);
      const sprite = PIXI.Sprite.from(`/assets/animals/${animal.image}`);
      sprite.width = RESULT_ANIMAL_ICON_SIZE;
      sprite.height = RESULT_ANIMAL_ICON_SIZE;
      sprite.anchor.set(0.5);
      sprite.x = 0;
      sprite.y = 0;
     // ✅ 状態を取得し、負傷→負傷だった場合は赤くする
    const state = this.animalStateList.find(s => s.name === animal.name);
    if (state?.from === "injured" && state.to === "injured") {
      sprite.tint = 0xff6666; // 薄赤
    }


      if (status === "survivedWhileInjured") {
        sprite.tint = 0xff9999; // 負傷継続の場合は薄い赤
      } else if (status === "injured") {
        //sprite.tint = 0xff3333; // 新規負傷は濃い赤（任意）
      } else if (status === "dead") {
        sprite.tint = 0x444444; // 死亡時は暗めのグレー
      }
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

    // 🔁 状態によってセリフカテゴリを切り替え（normal → otherinjured）
    let lineCategory: StateType | "otherinjured" = status;
    if (status === "normal" && this.totalInjuryCount > 0) {
      lineCategory = "otherinjured";
    }

    const lines = animal.lines?.[lineCategory];
    let message = "";

    if (lines && lines.length > 0) {
      const availableLines = lines.filter(line => {
        if (line.includes("{name}") && this.injuredNames.length === 0) return false;
        if (line.includes("{count}") && this.totalInjuryCount === 0) return false;
        return true;
      });

      const raw = availableLines.length > 0
        ? availableLines[Math.floor(Math.random() * availableLines.length)]
        : lines[Math.floor(Math.random() * lines.length)];

      message = raw
        .replace(/{name}/g, formatInjuredNames(this.injuredNames))
        .replace(/{count}/g, this.totalInjuryCount.toString());
    } else {
      // fallbackセリフ（テンプレなし）
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
    if (status === "injured" || status === "survivedWhileInjured") {
      labelText = "負傷";
      labelColor = LABEL_INJURED_COLOR;
    } else if (status === "dead") {
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

  private updateStateLabel(container: PIXI.Container, to: "injured" | "dead") {
    const stateLabel = (container as any).stateLabel as PIXI.Text;
    if (stateLabel) {
      if (to === "injured") {
        stateLabel.text = "負傷";
        stateLabel.style.fill = LABEL_INJURED_COLOR;
      } else if (to === "dead") {
        stateLabel.text = "死亡";
        stateLabel.style.fill = LABEL_DEAD_COLOR;
      }
      stateLabel.scale.set(1.0);
    } else {
      const label = new PIXI.Text(
        to === "injured" ? "負傷" : "死亡",
        {
          fill: to === "injured" ? LABEL_INJURED_COLOR : LABEL_DEAD_COLOR,
          fontSize: LABEL_FONT_SIZE,
          fontWeight: "bold",
          stroke: 0xffffff,
          strokeThickness: 4,
        }
      );
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
    this.ticker.stop();

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
    if (!this.finished) {
      this.skipAll();
      return;
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

      private shake(sprite: PIXI.Sprite, onComplete?: () => void) {
        const originalX = sprite.x;
        let count = 0;
        const max = 16;
        const step = 2;
        const doShake = () => {
          if (count >= max) {
            sprite.x = originalX;  // ← ここを container → sprite に修正
            if (onComplete) onComplete();
            return;
          }
          sprite.x = originalX + (count % 2 === 0 ? step : -step);
          count++;
          setTimeout(doShake, 16);
        };
        doShake();
      }

  private shakeSprite(sprite: PIXI.Sprite, to: "injured" | "dead", onComplete?: () => void) {
  const originalX = sprite.x;
  let count = 0;
  const max = 16;
  const step = 2;

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

  const duration = 10; // フレーム数で表現（約0.3秒）
  let frame = 0;
  const maxAlpha = 0.5;

  const update = () => {
    if (!this.redOverlay) return;
    if (frame < duration) {
      this.redOverlay.alpha = (frame / duration) * maxAlpha;
    } else if (frame < duration * 2) {
      this.redOverlay.alpha = ((duration * 2 - frame) / duration) * maxAlpha;
    } else {
      //this.redOverlay.alpha = 0;
      this.ticker.remove(update);
      return;
    }
    frame++;
  };

  this.ticker.add(update);
  }

  private tweenBlackOverlay() {
    if (!this.blackOverlay) return;

    const duration = 100;
    let frame = 0;
    const maxAlpha = 1;

    const update = () => {
      if (!this.blackOverlay) return;
      if (frame < duration) {
        this.blackOverlay.alpha = (frame / duration) * maxAlpha;
      } else if (frame < duration * 2) {
        this.blackOverlay.alpha = ((duration * 2 - frame) / duration) * maxAlpha;
      } else {
        //this.blackOverlay.alpha = 0;
        this.ticker.remove(update);
        return;
      }
      frame++;
    };

    this.ticker.add(update);
    }

    private fadeOutAndRemove(container: PIXI.Container, onComplete: () => void) {
      let alpha = 1.0;
      const step = 0.01;

      const fade = () => {
        alpha -= step;
        container.alpha = alpha;
        if (alpha <= 0) {
          this.removeChild(container);
          onComplete();
        } else {
          requestAnimationFrame(fade);
        }
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