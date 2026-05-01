import * as PIXI from 'pixi.js';
import { assetUrl } from '../core/assetPath';
import { SceneManager } from '../core/SceneManager';
import { loadScenario } from '../core/ScenarioLoader';
import { StatsManager } from '../core/StatsManager';
import { createInitialAnimalLogs } from '../game/workLog';

export class TitleScene extends PIXI.Container {
  constructor() {
    super();

    // 背景画像の追加
    const bgTexture = PIXI.Texture.from(assetUrl('assets/backgrounds/titlebg.png'));
    const bg = new PIXI.Sprite(bgTexture);
    bg.anchor.set(0.5);
    bg.x = 360; // 画面中央 (720/2)
    bg.y = 640; // 画面中央 (1280/2)

    // アスペクト比を維持して画面を覆うように拡大（cover）
    const scaleX = 720 / bg.width;
    const scaleY = 1280 / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.scale.set(scale); // テクスチャ読み込み前はサイズ0の可能性があるので注意が必要だが、PixiJSは非同期ロード後更新してくれる

    // 画像がロードされたらリサイズする処理を一応入れておく
    bgTexture.baseTexture.on('loaded', () => {
      const sX = 720 / bgTexture.width;
      const sY = 1280 / bgTexture.height;
      const s = Math.max(sX, sY);
      bg.scale.set(s);
    });

    this.addChild(bg);

    // タイトルテキストの背景を少し暗くして読みやすくする
    const overlay = new PIXI.Graphics();
    overlay.beginFill(0x000000, 0.4);
    overlay.drawRect(0, 0, 720, 1280);
    overlay.endFill();
    this.addChild(overlay);

    const title = new PIXI.Text("オオカミ工場", {
      fontSize: 80, // 少し大きく
      fill: 0xffffff,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
      fontFamily: 'Helvetica', // フォントも指定（あれば）
      fontWeight: 'bold'
    });
    title.anchor.set(0.5);
    title.position.set(360, 300); // 座標調整
    this.addChild(title);

    const scenarios = [
      { id: 'day1', label: '第1作業日', prev: null },
      { id: 'day2', label: '第2作業日 - 狙われた性別', prev: 'day1' },
      { id: 'dayX', label: '特別作業日 - オオカミの咆哮', prev: 'day2' }
    ];

    scenarios.forEach((scenario, index) => {
      // ロック判定：前のシナリオがあり、かつそれがクリアされていない場合はボタンを表示しない
      if (scenario.prev && !StatsManager.isScenarioCleared(scenario.prev)) {
        return;
      }

      const btn = new PIXI.Text(scenario.label, {
        fontSize: 36,
        fill: 0x00ff00,
        dropShadow: true,
        dropShadowColor: '#000000',
        dropShadowBlur: 4,
        dropShadowDistance: 4,
        stroke: '#003300',
        strokeThickness: 4,
      });
      btn.anchor.set(0.5);
      btn.position.set(360, 600 + index * 120); // 位置を下にずらす
      btn.interactive = true;
      btn.cursor = 'pointer';
      btn.on('pointerdown', async () => {
        // ★ここでNewGame系の初期化！
        SceneManager.currentDay = 0;           // ←必ずリセット！
        SceneManager.injuryRecord = {};        // すでにリセット済み

        // 他にも初期化したいものがあればここに追加

        console.log("読み込もうとしているシナリオID:", scenario.id);
        const data = await loadScenario(scenario.id);

        // --- ↓ ここで初期化するのが安全 ---
        const maxDays = data.maxDays ?? 3;
        SceneManager.animalLogs = createInitialAnimalLogs(data.availableAnimals, maxDays);
        // -----------------------------------

        SceneManager.changeScene('Opening', data);
      });
      this.addChild(btn);
    });

    // ▼ 操作説明書ボタン（左下に配置）
    const manualBtn = new PIXI.Text("操作説明書", {
      fontSize: 24,
      fill: 0xcccccc,
      fontWeight: 'bold',
      stroke: '#333333',
      strokeThickness: 2
    });
    manualBtn.anchor.set(0, 1);
    manualBtn.position.set(20, 1260);
    manualBtn.interactive = true;
    manualBtn.cursor = 'pointer';

    manualBtn.on('pointerdown', () => {
      window.open(assetUrl('manual/index.html'), '_blank');
    });

    this.addChild(manualBtn);

    // ▼ データ初期化ボタン（右下に配置）
    const resetBtn = new PIXI.Text("データ初期化", {
      fontSize: 24,
      fill: 0xff6666, // 赤っぽい色で警告感
      fontWeight: 'bold',
      stroke: '#330000',
      strokeThickness: 2
    });
    resetBtn.anchor.set(1, 1);
    resetBtn.position.set(700, 1260); // 右下マージンあり
    resetBtn.interactive = true;
    resetBtn.cursor = 'pointer';

    resetBtn.on('pointerdown', () => {
      // 確認ダイアログ用のコンテナを作成
      const dialogContainer = new PIXI.Container();

      // 1. 背景（操作ブロック用の半透明黒）
      const dialogBg = new PIXI.Graphics();
      dialogBg.beginFill(0x000000, 0.8);
      dialogBg.drawRect(0, 0, 720, 1280); // 画面全体
      dialogBg.endFill();
      dialogBg.interactive = true; // 下の要素をクリックさせない
      dialogContainer.addChild(dialogBg);

      // 2. メッセージテキスト
      const message = new PIXI.Text("本当にデータを初期化しますか？\nこの操作は取り消せません。", {
        fontSize: 32,
        fill: 0xffffff,
        align: 'center',
        fontWeight: 'bold'
      });
      message.anchor.set(0.5);
      message.position.set(360, 500);
      dialogContainer.addChild(message);

      // 3. 「はい（初期化）」ボタン
      const yesBtn = new PIXI.Text("初期化する", {
        fontSize: 40,
        fill: 0xff4444, // 赤文字
        stroke: '#ffffff',
        strokeThickness: 2,
        fontWeight: 'bold'
      });
      yesBtn.anchor.set(0.5);
      yesBtn.position.set(360, 700);
      yesBtn.interactive = true;
      yesBtn.cursor = 'pointer';

      yesBtn.on('pointerdown', () => {
        StatsManager.resetStats();
        this.removeChild(dialogContainer);

        // 完了メッセージを一瞬出すなどの処理もあってもいいが、ひとまずアラートで
        // もしここもカスタムにするなら修正可能。今回はwindow.alertだけ残すか、それも消すか。
        // ユーザー体験的には「初期化しました」と出たほうが親切。
        // ここではテキストを変えて完了を表示し、少し待ってから閉じる演出にする。

        message.text = "データを初期化しました。";
        yesBtn.visible = false;
        noBtn.visible = false;

        setTimeout(() => {
          if (dialogContainer.parent) {
            this.removeChild(dialogContainer);
          }
          // 画面の状態（シナリオ解放など）を更新するため、タイトル画面を再読み込み
          SceneManager.changeScene('Title');
        }, 1500);
      });
      dialogContainer.addChild(yesBtn);

      // 4. 「キャンセル」ボタン
      const noBtn = new PIXI.Text("キャンセル", {
        fontSize: 32,
        fill: 0xffffff,
      });
      noBtn.anchor.set(0.5);
      noBtn.position.set(360, 850);
      noBtn.interactive = true;
      noBtn.cursor = 'pointer';

      noBtn.on('pointerdown', () => {
        this.removeChild(dialogContainer);
      });
      dialogContainer.addChild(noBtn);

      this.addChild(dialogContainer);
    });

    this.addChild(resetBtn);
  }
}
