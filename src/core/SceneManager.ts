import * as PIXI from 'pixi.js';
import { TitleScene } from '../scenes/TitleScene';
import { OpeningScene } from '../scenes/OpeningScene';
import { GameScene } from '../scenes/GameScene';
import { ResultScene } from '../scenes/ResultScene';
import { InjuryGameOverScene } from '../scenes/InjuryGameOverScene';
import { AccuseScene } from '../scenes/AccuseScene';
import { WinScene } from '../scenes/WinScene';
import { LoseScene } from '../scenes/LoseScene';
import type { ScenarioData } from './types';
import type { AnimalData } from './types';

type SceneName = 'Title' | 'Opening' | 'Game' | 'Result' | 'InjuryGameOver' | 'Accuse' | 'Win' | 'Lose';
type StateType = "normal" | "injured" | "dead";

interface AnimalState {
  name: string;
  from: StateType;
  to: StateType;
}

export interface WinLoseData {
  animalName: string;
}

export interface ResultData {
  selected: AnimalData[];
  animalStateList: AnimalState[];
  wolves: string[];
  scenario: ScenarioData;
  playerLost?: boolean;
}

interface InjuryGameOverData {
  animal: string;
}

export class SceneManager {
  private static app: PIXI.Application;
  private static currentScene: PIXI.Container;

  static animalStateList: AnimalState[] = [];
  static injuryRecord: Record<string, any> = {};
  static currentDay: number = 0;

  static animalLogs: {
    [animalName: string]: Array<{
      selected: boolean | null;
      injured: boolean;
    }>;
  } = {};

  static async init(app: PIXI.Application) {
    this.app = app;
  }

  static async changeScene(
    name: SceneName,
    data?: ScenarioData | ResultData | InjuryGameOverData | WinLoseData,
    wolves?: string[]
  ) {
    console.log(`[SceneManager] changeScene called: name=${name}`);
    console.log(`[SceneManager] data:`, data);
    console.log(`[SceneManager] wolves:`, wolves);

    if (this.currentScene) {
      this.app.stage.removeChild(this.currentScene);
      this.currentScene.destroy({ children: true });
    }

    if (name === 'Title') {
      // 🔁 状態初期化を追加（ゲームオーバー後の再開にも対応）
      this.animalStateList = [];
      this.injuryRecord = {};
      this.animalLogs = {};
      this.currentDay = 0;

      this.currentScene = new TitleScene();

    } else if (name === 'Opening' && data && 'opening' in data) {
      this.currentScene = new OpeningScene(data as ScenarioData);

    } else if (name === 'Game' && data && 'availableAnimals' in data) {
      const animalStates = (data as any).animalStateList ?? this.animalStateList;
      this.currentScene = new GameScene(data as ScenarioData, wolves, animalStates);

    } else if (name === 'Result' && data && 'selected' in data) {
      this.currentScene = new ResultScene(this.app, data as ResultData);
      this.animalStateList = (data as ResultData).animalStateList;

    } else if (name === 'InjuryGameOver' && data && 'animal' in data) {
      this.currentScene = new InjuryGameOverScene((data as InjuryGameOverData).animal);

    } else if (name === 'Accuse' && data && 'scenario' in data) {
      this.currentScene = new AccuseScene(data as ResultData);

    } else if (name === 'Win' && data && 'animalName' in data) {
      this.currentScene = new WinScene({ animalName: String((data as any).animalName) });

    } else if (name === 'Lose' && data && 'animalName' in data) {
      this.currentScene = new LoseScene({ animalName: String((data as any).animalName) });

    } else {
      throw new Error("シーン名または渡されたデータが不正です");
    }

    this.app.stage.addChild(this.currentScene);
  }
}