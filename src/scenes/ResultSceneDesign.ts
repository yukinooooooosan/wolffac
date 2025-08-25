// src/scenes/ResultSceneDesign.ts

// =========================
// 画面全体サイズ
// =========================
export const RESULT_BG_WIDTH = 720;    // 結果画面の横幅（px）
export const RESULT_BG_HEIGHT = 1280;  // 結果画面の縦幅（px）

// =========================
// タイトル
// =========================
export const RESULT_TITLE_FONT_SIZE = 34;       // タイトル文字サイズ
export const RESULT_TITLE_COLOR = 0xffffff;     // タイトル文字色（白）
export const RESULT_TITLE_Y = 80;               // タイトルY座標（画面上部からどれだけ下げるか）

// =========================
// 動物アイコン
// =========================
export const RESULT_ANIMAL_ICON_SIZE = 180;     // 動物アイコンの1辺（正方形サイズ）
export const RESULT_ANIMAL_ICON_X = 160;         // アイコンのX座標（画面左からの距離）

// =========================
// 動物リスト配置
// =========================
export const RESULT_START_Y = 240;              // 最初の動物のY座標（画面上部から）
export const RESULT_SPACING_Y = 180;            // 動物アイコン間の縦方向スペース

// =========================
// 名前ラベル
// =========================
export const RESULT_LABEL_FONT_SIZE = 20;       // 動物名ラベルの文字サイズ
export const RESULT_LABEL_COLOR = 0xffffff;     // 動物名ラベルの色（白）

// =========================
// 吹き出しバブル
// =========================
export const RESULT_BUBBLE_WIDTH = 400;         // 吹き出しの横幅
export const RESULT_BUBBLE_HEIGHT = 70;         // 吹き出しの高さ
export const RESULT_BUBBLE_RADIUS = 14;         // 吹き出しの角丸半径

// 吹き出しのオフセット（アイコンからの相対位置）
export const RESULT_BUBBLE_OFFSET_X = 100;   // アイコンの中心から右へ20px
export const RESULT_BUBBLE_OFFSET_Y = -30;  // アイコン中心から上へ30px

export const RESULT_BUBBLE_COLOR_NORMAL = 0xffffff; // 吹き出し：通常時の色（白）
export const RESULT_BUBBLE_COLOR_INJURED = 0xff9999; // 吹き出し：負傷時の色（薄赤）
export const RESULT_BUBBLE_COLOR_DEAD = 0xcccccc;    // 吹き出し：死亡時の色（グレー）

// セリフテキストの表示位置オフセット（吹き出し左上基準）
export const RESULT_TEXT_OFFSET_X = 150;  // 例: 吹き出しのXオフセット
export const RESULT_TEXT_OFFSET_Y = -10; // 例: 吹き出しのYオフセット
export const RESULT_TEXT_WIDTH = 240;    // テキストの横幅（ワードラップ用）

// =========================
// 吹き出し内テキスト
// =========================
export const RESULT_TEXT_FONT_SIZE = 20;        // セリフの文字サイズ
export const RESULT_TEXT_COLOR = 0x000000;      // セリフの文字色（黒）

// =========================
// 「次へ」ボタン
// =========================
export const RESULT_NEXT_BTN_X = 680;           // ボタンのX座標（画面右寄せ用）
export const RESULT_NEXT_BTN_Y = 1220;          // ボタンのY座標（画面下部）
export const RESULT_NEXT_BTN_COLOR = 0xffff00;  // ボタン文字色（黄色）
export const RESULT_NEXT_BTN_FONT_SIZE = 24;    // ボタン文字サイズ

// =========================
// 状態ラベル（負傷・死亡の表示）
// =========================
export const LABEL_FONT_SIZE = 24;              // 状態ラベル（負傷・死亡）の文字サイズ
export const LABEL_POS_X = 160;                  // ラベルのX座標（アイコンの中心に重ねる推奨）
export const LABEL_POS_Y = 10;                 // ラベルのY座標（アイコン上部に配置推奨）
export const LABEL_INJURED_COLOR = 0xff4444;    // 負傷時のラベル色（赤）
export const LABEL_DEAD_COLOR = 0xaaaaaa;       // 死亡時のラベル色（グレー）



export const RESULT_FLY_LABEL_START_X = 720 * 0.5;      // X座標
export const RESULT_FLY_LABEL_START_Y = 540;            // Y座標
export const RESULT_FLY_LABEL_START_SCALE = 10;         // 開始スケール
export const RESULT_FLY_LABEL_END_SCALE = 1.0;           // 終了スケール
export const RESULT_FLY_LABEL_FONT_SIZE = 54;
export const RESULT_FLY_LABEL_COLOR = 0xaaaaaa;
export const RESULT_FLY_LABEL_STROKE = 0xffffff;
export const RESULT_FLY_LABEL_STROKE_THICKNESS = 8;
// --- 追加のパーツや演出もここで管理すると全体統一感が出ます！ --- 