import * as PIXI from 'pixi.js';
import { Assets, ColorMatrixFilter } from 'pixi.js';
import type { ScenarioData } from '../core/types';
import { assetUrl } from '../core/assetPath';
import { SceneManager } from '../core/SceneManager';
import { GlowFilter } from '@pixi/filter-glow';
import type { AnimalData } from '../core/types';
import { applyWorkDayLogs } from '../game/workLog';
import { resolveWorkDay } from '../game/resolveWorkDay';

import {
  ANIMAL_SIZE, ANIMAL_PADDING_X, ANIMAL_PADDING_Y, ANIMAL_OFFSET_X, ANIMAL_OFFSET_Y,
  PROGRESS_BAR_X, PROGRESS_BAR_Y, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_RADIUS,
  PROGRESS_BAR_COLOR_FROM, PROGRESS_BAR_COLOR_TO, PROGRESS_BAR_BG_COLOR,
  LEDGER_BUTTON_WIDTH, LEDGER_BUTTON_HEIGHT, LEDGER_BUTTON_X, LEDGER_BUTTON_Y,
  LEDGER_WINDOW_X, LEDGER_WINDOW_Y, LEDGER_WINDOW_WIDTH, LEDGER_WINDOW_HEIGHT,
  TITLE_FONT_SIZE, STATUS_FONT_SIZE, STATUS_HIGHLIGHT_COLOR, STATUS_COMPLETE_COLOR,
  LEDGER_LABEL_FONT_SIZE,
  CONFIRM_BUTTON_X, CONFIRM_BUTTON_Y, CONFIRM_BUTTON_FONT_SIZE, CONFIRM_BUTTON_COLOR,
  ACCUSE_BUTTON_X, ACCUSE_BUTTON_Y, ACCUSE_BUTTON_FONT_SIZE, ACCUSE_BUTTON_COLOR,
} from './GameSceneDesign';

type StateType = "normal" | "injured" | "dead";

interface AnimalState {
  name: string;
  from: StateType;
  to: StateType;
}

const getCurrentDay = () => SceneManager.currentDay ?? 0;

function stableRandomIndex(animalName: string, state: string, day: number, arrayLength: number): number {
  if (arrayLength === 0) return 0;
  let str = `${animalName}:${state}:${day}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % arrayLength;
}

function createGradientBarTexture(width: number, height: number, colorStart: number, colorEnd: number): PIXI.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, width, 0);
  grad.addColorStop(0, `#${colorStart.toString(16).padStart(6, '0')}`);
  grad.addColorStop(1, `#${colorEnd.toString(16).padStart(6, '0')}`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  return PIXI.Texture.from(canvas);
}

export class GameScene extends PIXI.Container {
  private maxDays: number;
  private scenario!: ScenarioData;
  private selected: Set<string> = new Set();
  private selectCount: number;
  private confirmButton!: PIXI.Text;
  private statusText!: PIXI.Container;
  private wolves: string[] = [];
  private injuryType: string;
  private allowSelfAttack: boolean;
  private ledgerButton!: PIXI.Sprite;
  private ledgerLabel!: PIXI.Text;
  private accuseButton!: PIXI.Text;
  private isLedgerOpen: boolean = false;
  private ledgerWindow?: PIXI.Container;
  private dayText!: PIXI.Text;
  private remainingDaysLabel!: PIXI.Text;

  private progressBarBg!: PIXI.Graphics;
  private progressBarSprite!: PIXI.Sprite;
  private progressBarFrame!: PIXI.Graphics;
  private progressLabel!: PIXI.Text;

  private selectedLabels: { [name: string]: PIXI.Text } = {};
  private animalStateList: AnimalState[] = [];

  constructor(scenario: ScenarioData, wolves?: string[], animalStateList?: AnimalState[]) {
    super();
    this.scenario = scenario;
    this.maxDays = scenario.maxDays ?? 3;

    this.wolves = wolves ?? this.pickWolves(scenario.availableAnimals, 1);
    this.selectCount = scenario.selectCount;
    this.injuryType = scenario.wolfAttackRule?.injuryType ?? 'random';
    this.allowSelfAttack = scenario.wolfAttackRule?.allowWolfSelfAttack ?? false;

    if (animalStateList && animalStateList.length > 0) {
      this.animalStateList = animalStateList;
    } else {
      this.animalStateList = scenario.availableAnimals.map(animal => ({
        name: animal.name,
        from: "normal" as StateType,
        to: "normal" as StateType,
      }));
    }
    SceneManager.animalStateList = this.animalStateList;

    this.renderBackground();

    this.dayText = new PIXI.Text('', {
      fill: 0xffffff,
      fontSize: TITLE_FONT_SIZE,
      fontWeight: "bold"
    });
    this.dayText.anchor.set(0.5, 0);
    this.dayText.x = 360;
    this.dayText.y = 60;
    this.addChild(this.dayText);
    this.updateDayText();

    this.statusText = new PIXI.Container();
    this.statusText.x = 0;
    this.statusText.y = 200;
    this.addChild(this.statusText);

    this.progressBarBg = new PIXI.Graphics();
    this.progressBarBg.beginFill(PROGRESS_BAR_BG_COLOR);
    this.progressBarBg.drawRoundedRect(PROGRESS_BAR_X, PROGRESS_BAR_Y, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_RADIUS);
    this.progressBarBg.endFill();
    this.addChild(this.progressBarBg);

    const gradTex = createGradientBarTexture(PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_COLOR_FROM, PROGRESS_BAR_COLOR_TO);
    this.progressBarSprite = new PIXI.Sprite(gradTex);
    this.progressBarSprite.x = PROGRESS_BAR_X;
    this.progressBarSprite.y = PROGRESS_BAR_Y;
    this.progressBarSprite.width = 0;
    this.progressBarSprite.height = PROGRESS_BAR_HEIGHT;
    this.addChild(this.progressBarSprite);

    this.progressBarFrame = new PIXI.Graphics();
    this.progressBarFrame.lineStyle(3, 0xffffff);
    this.progressBarFrame.drawRoundedRect(PROGRESS_BAR_X, PROGRESS_BAR_Y, PROGRESS_BAR_WIDTH, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_RADIUS);
    this.addChild(this.progressBarFrame);

    // 残り日数ラベル
    this.remainingDaysLabel = new PIXI.Text('', {
      fill: 0xffffff,
      fontSize: 22,
      fontWeight: "bold",
      stroke: 0x000000,
      strokeThickness: 3
    });
    this.remainingDaysLabel.anchor.set(0.5, 0);
    this.remainingDaysLabel.x = PROGRESS_BAR_X + PROGRESS_BAR_WIDTH / 2;
    this.remainingDaysLabel.y = PROGRESS_BAR_Y + PROGRESS_BAR_HEIGHT + 12;
    this.addChild(this.remainingDaysLabel);
    this.updateRemainingDaysLabel();

    this.progressLabel = new PIXI.Text('', {
      fill: 0xffffff,
      fontSize: 18,
      fontWeight: "bold"
    });
    this.progressLabel.anchor.set(0.5, 0.5);
    this.progressLabel.x = PROGRESS_BAR_X + PROGRESS_BAR_WIDTH / 2;
    this.progressLabel.y = PROGRESS_BAR_Y + PROGRESS_BAR_HEIGHT / 2;
    this.addChild(this.progressLabel);

    this.ledgerButton = PIXI.Sprite.from(assetUrl('assets/icons/ledgerButton.png'));
    this.ledgerButton.width = LEDGER_BUTTON_WIDTH;
    this.ledgerButton.height = LEDGER_BUTTON_HEIGHT;
    this.ledgerButton.anchor?.set?.(0.5, 1);
    this.ledgerButton.x = LEDGER_BUTTON_X;
    this.ledgerButton.y = LEDGER_BUTTON_Y;
    this.ledgerButton.cursor = 'pointer';
    this.ledgerButton.eventMode = 'static';
    this.ledgerButton.on('pointertap', () => {
      if (this.isLedgerOpen) {
        this.hideLedger();
      } else {
        this.showLedger();
      }
    });

    this.addChild(this.ledgerButton);

    this.ledgerLabel = new PIXI.Text('作業員名簿を開く', {
      fill: 0xffffff,
      fontSize: LEDGER_LABEL_FONT_SIZE,
      fontWeight: "bold",
      stroke: 0x000000,
      strokeThickness: 4
    });
    this.ledgerLabel.anchor?.set?.(0.5, 1);
    this.ledgerLabel.x = LEDGER_BUTTON_X;
    this.ledgerLabel.y = LEDGER_BUTTON_Y - 25;
    this.addChild(this.ledgerLabel);

    this.updateStatusText();
    this.updateProgressBar();

    // ▼ 画像をまとめて事前ロード（内部並列）
    (async () => {
      const urls = this.scenario.availableAnimals.map(a => assetUrl(`assets/animals/${a.image}`));
      try {
        await Assets.load(urls);
      } catch (err) {
        console.warn("一部の動物アセットの読み込みに失敗しました。フォールバック表示を使用します。", err);
      }

      for (let [index, animal] of this.scenario.availableAnimals.entries()) {
        const col = index % 2;
        const row = Math.floor(index / 2);

        const container = new PIXI.Container();
        container.x = ANIMAL_OFFSET_X + col * ANIMAL_PADDING_X;
        container.y = ANIMAL_OFFSET_Y + row * ANIMAL_PADDING_Y;
        container.hitArea = new PIXI.Rectangle(0, 0, ANIMAL_SIZE, ANIMAL_SIZE);

        const imageUrl = assetUrl(`assets/animals/${animal.image}`);
        let sprite: PIXI.Sprite | PIXI.Graphics;

        try {
          const loaded = PIXI.Sprite.from(imageUrl);
          loaded.width = ANIMAL_SIZE;
          loaded.height = ANIMAL_SIZE;
          loaded.anchor.set(0.5);
          loaded.x = ANIMAL_SIZE / 2;
          loaded.y = ANIMAL_SIZE / 2;
          loaded.alpha = 0.4;

          const animalState = this.getAnimalState(animal.name);
          if (animalState?.to === "injured") {
            const colorFilter = new ColorMatrixFilter();
            colorFilter.matrix = [
              1.2, 0.2, 0.1, 0, 0,
              0.1, 0.5, 0.1, 0, 0,
              0.1, 0.1, 0.5, 0, 0,
              0, 0, 0, 1, 0
            ];
            loaded.filters = [colorFilter];
          } else if (animalState?.to === "dead") {
            const colorFilter = new ColorMatrixFilter();
            colorFilter.matrix = [
              0.4, 0.4, 0.4, 0, 0,
              0.4, 0.4, 0.4, 0, 0,
              0.4, 0.4, 0.4, 0, 0,
              0, 0, 0, 1, 0
            ];
            loaded.filters = [colorFilter];
          }
          sprite = loaded;
        } catch (e) {
          const fallback = new PIXI.Graphics();
          fallback.beginFill(0x999999);
          fallback.drawRect(0, 0, ANIMAL_SIZE, ANIMAL_SIZE);
          fallback.endFill();
          fallback.alpha = 0.4;
          sprite = fallback;
        }

        container.addChild(sprite);

        const logs = SceneManager.animalLogs[animal.name] || [];
        logs.slice(0, 3).forEach((log, dayIdx) => {
          let emoji = "⬜";
          if (log.selected === null) emoji = "🐾";
          else if (log.selected && log.injured) emoji = "💥";
          else if (log.selected) emoji = "🔧";
          else emoji = "💤";

          const emojiLabel = new PIXI.Text(emoji, {
            fontSize: 24,
            fontWeight: "bold"
          });
          emojiLabel.x = 10 + dayIdx * 32;
          emojiLabel.y = ANIMAL_SIZE - 36;
          container.addChild(emojiLabel);
        });

        const animalState = this.getAnimalState(animal.name);
        if (animalState?.to === "injured") {
          const injuryLabel = new PIXI.Text('負傷', {
            fill: 0xff0000,
            fontSize: 20,
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 4,
          });
          injuryLabel.anchor.set(0.5);
          injuryLabel.x = ANIMAL_SIZE / 2;
          injuryLabel.y = ANIMAL_SIZE / 2;
          container.addChild(injuryLabel);
        }

        const selectedLabel = new PIXI.Text('投入', {
          fill: 0xffff00,
          fontSize: 26,
          fontWeight: 'bold',
          fontStyle: 'italic',
          fontFamily: 'Georgia, "Times New Roman", serif',
          stroke: 0x333333,
          strokeThickness: 5,
        });
        selectedLabel.anchor.set(0.5, 0.5);
        selectedLabel.x = ANIMAL_SIZE / 2;
        selectedLabel.y = 40;
        selectedLabel.visible = false;
        container.addChild(selectedLabel);
        this.selectedLabels[animal.name] = selectedLabel;

        selectedLabel.filters = [
          new GlowFilter({
            color: 0xffee55,
            distance: 6,
            outerStrength: 4,
            innerStrength: 0,
            quality: 0.5
          })
        ];

        const border = new PIXI.Graphics();
        border.lineStyle(6, 0xffffff, 0.5);
        border.drawRoundedRect(0, 0, ANIMAL_SIZE, ANIMAL_SIZE, 50);
        border.filters = [
          new GlowFilter({
            color: 0xffff00,
            distance: 30,
            outerStrength: 4,
            innerStrength: 0,
            quality: 0.5
          })
        ];
        border.visible = false;
        container.addChild(border);

        (container as any).border = border;
        (container as any).sprite = sprite;

        container.eventMode = 'static';
        container.cursor = 'pointer';

        container.on('pointertap', () => {
          if (this.isLedgerOpen) return;
          if (this.getRemainingDays() === 0) return;
          if (this.selected.has(animal.name)) {
            this.selected.delete(animal.name);
            border.visible = false;
            (sprite as any).alpha = 0.4;
            selectedLabel.visible = false;
          } else {
            if (this.selected.size < this.selectCount) {
              this.selected.add(animal.name);
              border.visible = true;
              (sprite as any).alpha = 1.0;
              selectedLabel.visible = true;
            }
          }
          this.updateConfirmButton();
          this.updateStatusText();
          this.updateProgressBar();
        });

        this.addChild(container);
      }
    })();

    this.confirmButton = new PIXI.Text('作業開始 ▶', {
      fill: CONFIRM_BUTTON_COLOR,
      fontSize: CONFIRM_BUTTON_FONT_SIZE,
    });
    this.confirmButton.anchor.set(1);
    this.confirmButton.x = CONFIRM_BUTTON_X;
    this.confirmButton.y = CONFIRM_BUTTON_Y;
    this.confirmButton.alpha = 0.3;
    this.confirmButton.interactive = false;
    this.confirmButton.cursor = 'pointer';
    this.confirmButton.on('pointertap', () => {
      if (this.isLedgerOpen) return;

      const selectedArray: AnimalData[] = [...this.selected].map(name => {
        const animal = this.scenario.availableAnimals.find(a => a.name === name);
        if (!animal) throw new Error(`動物データが見つかりません: ${name}`);
        return animal;
      });

      if (!SceneManager.animalStateList) {
        SceneManager.animalStateList = this.scenario.availableAnimals.map(animal => ({
          name: animal.name,
          from: "normal" as StateType,
          to: "normal" as StateType,
        }));
      }
      const prevStateList = SceneManager.animalStateList;

      // ▼ 当日ログの初期化／上書き（共通）
      const dayIdx = SceneManager.currentDay ?? 0;

      const applyTodayLogs = (stateList: AnimalState[]) => {
        SceneManager.animalLogs = applyWorkDayLogs({
          currentLogs: SceneManager.animalLogs,
          animals: this.scenario.availableAnimals,
          stateList,
          selectedNames: [...this.selected],
          day: dayIdx,
        });
      };

      const result = resolveWorkDay({
        allAnimals: this.scenario.availableAnimals,
        selectedAnimals: selectedArray,
        previousStateList: prevStateList,
        wolfNames: this.wolves,
        attackRule: {
          injuryType: this.scenario.wolfAttackRule?.injuryType,
          attackCount: this.scenario.wolfAttackRule?.attackCount,
          allowWolfSelfAttack: this.allowSelfAttack,
        },
      });

      const newAnimalStateList = result.animalStateList;
      SceneManager.animalStateList = newAnimalStateList;

      const playerLost = result.playerLost;

      // ログ反映
      applyTodayLogs(newAnimalStateList);

      SceneManager.changeScene('Result', {
        selected: selectedArray,
        wolves: this.wolves,
        playerLost,
        scenario: this.scenario,
        animalStateList: newAnimalStateList,
      });
    });

    this.addChild(this.confirmButton);

    this.accuseButton = new PIXI.Text('◀ 処分実行', {
      fill: ACCUSE_BUTTON_COLOR,
      fontSize: ACCUSE_BUTTON_FONT_SIZE,
    });
    this.accuseButton.anchor.set(0, 1);
    this.accuseButton.x = ACCUSE_BUTTON_X;
    this.accuseButton.y = ACCUSE_BUTTON_Y;
    this.accuseButton.eventMode = 'static';
    this.accuseButton.cursor = 'pointer';
    this.accuseButton.on('pointertap', async () => {
      if (this.isLedgerOpen) return;
      try {
        await SceneManager.changeScene('Accuse', {
          selected: [],
          scenario: this.scenario,
          wolves: this.wolves,
          animalStateList: this.animalStateList,
        });
      } catch (err) {
        console.error("❌ 告発シーンへの遷移中にエラー", err);
      }
    });
    this.addChild(this.accuseButton);
  }

  private updateDayText() {
    const sectionTitle = this.scenario.sectionTitle || "作業A工区";
    const day = (SceneManager.currentDay ?? 0) + 1;
    const maxDays = this.scenario.maxDays ?? 3;

    if (day > maxDays) {
      this.dayText.text = `${sectionTitle}　工場閉鎖日`;
    } else {
      this.dayText.text = `${sectionTitle}　第${day}稼働日`;
    }
  }

  private updateStatusText() {
    this.statusText.removeChildren();
    const remaining = Math.max(this.selectCount - this.selected.size, 0);
    const remainingDays = this.getRemainingDays();
    let messageHead = '工場に配置する動物を残り ';
    let messageTail = ' 選択してください';
    const unit = '匹';

    if (remainingDays === 0) {
      const msg = new PIXI.Text("作業は終了しました。告発に進んでください", {
        fill: 0xff4444,
        fontSize: STATUS_FONT_SIZE + 8,
        fontWeight: "bold",
      });
      msg.x = 0; msg.y = 50;
      this.statusText.addChild(msg);
      this.statusText.x = (720 - this.statusText.width) / 2;
      this.statusText.y = 80;
      return;
    }

    const label1 = new PIXI.Text(messageHead, { fill: 0xffffff, fontSize: STATUS_FONT_SIZE });
    const label2 = new PIXI.Text(`${remaining}${unit}`, { fill: STATUS_HIGHLIGHT_COLOR, fontSize: STATUS_FONT_SIZE + 8, fontWeight: "bold" });
    const label3 = new PIXI.Text(messageTail, { fill: 0xffffff, fontSize: STATUS_FONT_SIZE });

    if (remaining === 0) {
      label1.text = "問題なければ作業開始を選択してください";
      (label1.style as any).fill = STATUS_COMPLETE_COLOR;
      label2.text = "";
      label3.text = "";
    }

    label1.x = 0; label2.x = label1.width; label3.x = label1.width + label2.width;
    label1.y = label3.y = 50; label2.y = label1.y - 5;
    this.statusText.addChild(label1, label2, label3);

    this.statusText.x = (720 - this.statusText.width) / 2;
    this.statusText.y = 80;
  }

  private updateProgressBar() {
    const selectedCount = this.selected.size;
    const maxCount = this.selectCount;
    const ratio = Math.min(selectedCount / maxCount, 1);
    const percent = Math.round(ratio * 100);
    this.progressBarSprite.width = PROGRESS_BAR_WIDTH * ratio;
    this.progressLabel.text = `作業進捗 ${percent} %`;
  }

  private showLedger() {
    if (this.isLedgerOpen) return;
    this.isLedgerOpen = true;
    if (this.ledgerLabel) this.ledgerLabel.text = '作業員名簿を閉じる';

    const window = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.9);
    bg.drawRect(LEDGER_WINDOW_X, LEDGER_WINDOW_Y, LEDGER_WINDOW_WIDTH, LEDGER_WINDOW_HEIGHT);
    bg.endFill();
    window.addChild(bg);

    const animals = this.scenario.availableAnimals;
    const day = getCurrentDay();

    const stateLabelMap = { normal: "健康", injured: "負傷", dead: "死亡" } as const;

    animals.forEach((animal, index) => {
      const row = Math.floor(index);
      const icon = PIXI.Sprite.from(assetUrl(`assets/animals/${animal.image}`));
      icon.width = 90; icon.height = 90;
      icon.x = 80; icon.y = LEDGER_WINDOW_Y + row * 110;
      window.addChild(icon);

      const animalState = this.getAnimalState(animal.name);
      const state = (animalState ? animalState.to : "normal") as StateType;

      let commentArray: string[] | undefined = (animal as any).ledgerComments?.[state];
      if (!Array.isArray(commentArray) || commentArray.length === 0) {
        if (state === "normal") commentArray = ["特に異常は見られない。"];
        else if (state === "injured") commentArray = ["負傷しているようだ。"]; else commentArray = ["死亡している。"];
      }
      const idx = stableRandomIndex(animal.name, state, day, commentArray.length);
      const comment = commentArray[idx];

      let stateColor = 0x00ffcc;
      if (state === "injured") stateColor = 0xff4444;
      if (state === "dead") stateColor = 0xcccccc;

      const stateText = new PIXI.Text(`状態：${stateLabelMap[state]}`, {
        fill: stateColor, fontSize: 22, fontWeight: "bold"
      });
      stateText.x = 180; stateText.y = LEDGER_WINDOW_Y * 1.05 + row * 110;

      const commentText = new PIXI.Text(comment, {
        fill: 0xffffff, fontSize: 18, wordWrap: true, wordWrapWidth: 400
      });
      commentText.x = 180; commentText.y = LEDGER_WINDOW_Y * 1.2 + row * 110;

      window.addChild(stateText);
      window.addChild(commentText);
    });

    this.ledgerWindow = window;
    this.addChild(window);
    this.updateConfirmButton();
  }

  private hideLedger() {
    if (this.ledgerWindow) {
      this.removeChild(this.ledgerWindow);
      this.ledgerWindow = undefined;
      this.isLedgerOpen = false;
      if (this.ledgerLabel) this.ledgerLabel.text = '作業員名簿を開く';
      this.updateConfirmButton();
    }
  }

  private renderBackground() {
    Assets.load(assetUrl('assets/backgrounds/gamebg.png')).then(bgTexture => {
      const bgSprite = new PIXI.Sprite(bgTexture);
      bgSprite.width = 720;
      bgSprite.height = 1280;
      bgSprite.x = 0;
      bgSprite.y = 0;
      this.addChildAt(bgSprite, 0);
    }).catch(() => {
      console.warn('背景画像の読み込みに失敗しました');
    });
  }

  private getAnimalState(name: string): AnimalState | undefined {
    return SceneManager.animalStateList?.find(a => a.name === name);
  }

  private updateConfirmButton() {
    const isReady = this.selected.size === this.selectCount && !this.isLedgerOpen;
    this.confirmButton.alpha = isReady ? 1.0 : 0.3;
    this.confirmButton.interactive = isReady;
    this.confirmButton.cursor = isReady ? 'pointer' : 'default';
    if (this.getRemainingDays() === 0) {
      this.confirmButton.alpha = 0.1;
      this.confirmButton.interactive = false;
      this.confirmButton.cursor = 'default';
    } else {
      this.confirmButton.visible = true;
    }
  }

  private pickWolves(animals: { name: string, canBeWolf?: boolean }[], count: number): string[] {
    const candidates = animals.filter(a => a.canBeWolf);
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(a => a.name);
  }

  private updateRemainingDaysLabel() {
    const current = (SceneManager.currentDay ?? 0);
    const remain = Math.max(0, this.maxDays - current);
    if (remain > 1) {
      this.remainingDaysLabel.text = `残り日数：${remain}日`;
      (this.remainingDaysLabel.style as any).fill = 0xffffff;
    } else if (remain === 1) {
      this.remainingDaysLabel.text = "本日が作業最終日です";
      (this.remainingDaysLabel.style as any).fill = 0xffbb00;
    } else {
      this.remainingDaysLabel.text = "これ以上の作業は認められていません";
      (this.remainingDaysLabel.style as any).fill = 0xff4444;
    }
    this.remainingDaysLabel.visible = true;
  }

  private getRemainingDays(): number {
    const current = (SceneManager.currentDay ?? 0);
    const maxDays = this.scenario.maxDays ?? 3;
    return Math.max(0, maxDays - current);
  }
}
