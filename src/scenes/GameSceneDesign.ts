// src/scenes/GameSceneDesign.ts

// ▼▼ 動物アイコンの配置とサイズ関係 ▼▼
export const ANIMAL_SIZE = 250;              // 動物アイコン1体の正方形サイズ(px)
export const ANIMAL_PADDING_X = 300;         // 動物の横並び間隔(px)
export const ANIMAL_PADDING_Y = 270;         // 動物の縦並び間隔(px)
export const ANIMAL_OFFSET_X = 90;           // 動物配置：左端の余白(px)
export const ANIMAL_OFFSET_Y = 220;          // 動物配置：上端の余白(px)

// ▼▼ プログレスバー関係 ▼▼
export const PROGRESS_BAR_X = 210;           // プログレスバーのX座標（左端）
export const PROGRESS_BAR_Y = 175;           // プログレスバーのY座標（上端）
export const PROGRESS_BAR_WIDTH = 300;       // プログレスバーの横幅
export const PROGRESS_BAR_HEIGHT = 22;       // プログレスバーの高さ
export const PROGRESS_BAR_RADIUS = 4;        // プログレスバーの角丸半径
export const PROGRESS_BAR_COLOR_FROM = 0x00ccff;   // プログレスバーの左端グラデ色
export const PROGRESS_BAR_COLOR_TO = 0x2288ff;     // プログレスバーの右端グラデ色
export const PROGRESS_BAR_BG_COLOR = 0x444444;     // プログレスバー背景色

// ▼▼ 台帳ボタン関係 ▼▼
export const LEDGER_BUTTON_WIDTH = 600;      // 台帳ボタン画像の幅
export const LEDGER_BUTTON_HEIGHT = 100;     // 台帳ボタン画像の高さ
export const LEDGER_BUTTON_X = 360;          // 台帳ボタンのX座標（中央寄せ推奨）
export const LEDGER_BUTTON_Y = 1280 - 150;   // 台帳ボタンのY座標（上端からのオフセット）

// ▼▼ 文字サイズや強調色 ▼▼
export const TITLE_FONT_SIZE = 40;           // タイトル（日数・工区名など）フォントサイズ
export const STATUS_FONT_SIZE = 28;          // ステータスメッセージの標準フォントサイズ
export const STATUS_HIGHLIGHT_COLOR = 0xff0000; // ステータスメッセージの強調用カラー（赤）
export const STATUS_COMPLETE_COLOR = 0x44ff88;  // ステータスメッセージの選択完了カラー（緑系）
export const LEDGER_LABEL_FONT_SIZE = 28;    // 台帳ラベルのフォントサイズ

// ▼ 作業開始ボタン（confirmButton）のデザインパラメータ
/** 「作業開始」ボタンのX座標（画面右端付近） */
export const CONFIRM_BUTTON_X = 680;
/** 「作業開始」ボタンのY座標（画面下部） */
export const CONFIRM_BUTTON_Y = 1160;
/** 「作業開始」ボタンのフォントサイズ */
export const CONFIRM_BUTTON_FONT_SIZE = 32;
/** 「作業開始」ボタンの文字色（黄色） */
export const CONFIRM_BUTTON_COLOR = 0xffff00;

// ▼ 告発ボタン（accuseButton）のデザインパラメータ
/** 「処分実行」ボタンのX座標（画面左端付近） */
export const ACCUSE_BUTTON_X = 40;
/** 「処分実行」ボタンのY座標（画面下部） */
export const ACCUSE_BUTTON_Y = 1160;
/** 「処分実行」ボタンのフォントサイズ */
export const ACCUSE_BUTTON_FONT_SIZE = 32;
/** 「処分実行」ボタンの文字色（赤） */
export const ACCUSE_BUTTON_COLOR = 0xff4444;


// ======== 台帳ウィンドウ本体 ========
export const LEDGER_WINDOW_X = 60;            // ウィンドウ左端
export const LEDGER_WINDOW_Y = 270;           // ウィンドウ上端
export const LEDGER_WINDOW_WIDTH = 600;       // 幅
export const LEDGER_WINDOW_HEIGHT = 650;     // 高さ
export const LEDGER_WINDOW_RADIUS = 16;       // 角丸
export const LEDGER_WINDOW_BG_COLOR = 0x000000;
export const LEDGER_WINDOW_BG_ALPHA = 0.9;

// ======== 台帳ウィンドウ内:動物アイコン ========
export const LEDGER_ICON_WIDTH = 80;
export const LEDGER_ICON_HEIGHT = 80;
export const LEDGER_ICON_X = 80;
export const LEDGER_ICON_Y_START = 120;
export const LEDGER_ROW_HEIGHT = 100;

// ======== 台帳ウィンドウ内:状態ラベル ========
export const LEDGER_STATE_FONT_SIZE = 22;
export const LEDGER_STATE_NORMAL_COLOR = 0x00ffcc;
export const LEDGER_STATE_INJURED_COLOR = 0xff4444;
export const LEDGER_STATE_DEAD_COLOR = 0xcccccc;
export const LEDGER_STATE_FONT_WEIGHT = "bold";

// ======== 台帳ウィンドウ内:コメント ========
export const LEDGER_COMMENT_FONT_SIZE = 18;
export const LEDGER_COMMENT_COLOR = 0xffffff;
export const LEDGER_COMMENT_WIDTH = 400;

// ======== その他（必要なら拡張） ========
// 例：台帳ウィンドウタイトル、クローズボタン位置 など