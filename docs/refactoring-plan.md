# オオカミ工場 リファクタリング計画

## 目的

現在の PixiJS 中心の実装を、段階的に React + DOM + CSS Animation + Canvas Overlay 構成へ移行する。

最終的には、ゲーム状態と画面遷移を React 側で管理し、キャラ・カード・ログ・ボタン・吹き出しなどの読ませる UI は DOM で表示する。軽い動きは CSS Animation に任せ、斬撃・爆発・集中線・衝撃波・ダメージ数字などの瞬間演出だけを Canvas Overlay で重ねる。

Canvas はゲーム状態を持たず、React 側から通知された演出イベントを描画するだけにする。

## 基本方針

- 一度に大規模変更しない。
- 既存挙動をできるだけ変えない。
- Phase ごとに小さく進める。
- 各 Phase ごとに `npm run build` が通る状態を維持する。
- PixiJS 削除は最後にする。
- `src/game/` 配下に `pixi.js` を import しない。
- Canvas に HP、勝敗、ターン、ログなどのゲーム状態を持たせない。
- React state を `requestAnimationFrame` で毎フレーム更新しない。
- 不明点は推測で大改造せず、TODO として明示する。

## 最終アーキテクチャ

### React / DOM

担当:

- ゲーム状態
- 画面遷移
- 作業フェーズ・告発フェーズ
- キャラ表示
- 名簿・ログ・ボタン
- HP または状態表示
- 吹き出し
- ショートストーリー
- リザルト
- アンロック表示

### CSS Animation

担当:

- キャラの軽い前進
- 被弾時の点滅
- 倒れ演出
- 選択中の強調
- 長押しゲージ
- 吹き出しのポップ表示
- 揺れ
- 擬音文字の震え
- フェードイン / フェードアウト

### Canvas Overlay

担当:

- 斬撃
- 爆発
- ヒット火花
- ダメージ数字
- 衝撃波
- 血しぶき
- 魔法陣
- 集中線
- スピード線
- 画面フラッシュ

## 現在の構造分析

### 起動とシーン管理

- `src/main.ts` が `PIXI.Application` を作成し、`SceneManager.changeScene("Title")` を呼ぶ。
- `src/core/SceneManager.ts` が `PIXI.Application` と現在の `PIXI.Container` を保持する。
- シーン切り替え時に現在シーンを `removeChild` し、`destroy({ children: true })` してから次の Pixi シーンを生成する。

### データ読み込み

- `src/core/ScenarioLoader.ts` が `/assets/scenarios/{id}.json` を `fetch` する。
- シナリオ JSON には作業日、選抜数、襲撃ルール、動物データ、セリフ、名簿コメントが含まれる。

### 永続化

- `src/core/StatsManager.ts` が `localStorage` にプレイ統計とクリア済みシナリオを保存する。
- シナリオ解放は `clearedScenarios` を参照している。

### 主要ゲームループ

1. `TitleScene` でシナリオ選択。
2. `OpeningScene` で指令文表示。
3. `GameScene` で作業員を選抜。
4. `GameScene` の作業開始 handler で襲撃判定、状態更新、日次ログ更新。
5. `ResultScene` で結果演出。
6. 生存なら次の日の `GameScene`、死亡なら `InjuryGameOverScene`。
7. `GameScene` から `AccuseScene` へ移動可能。
8. `AccuseScene` の長押しで告発確定。
9. 正解なら `WinScene`、不正解なら `LoseScene`。

## PixiJS 依存ファイル一覧

現行の主要依存:

- `src/main.ts`
- `src/core/SceneManager.ts`
- `src/scenes/TitleScene.ts`
- `src/scenes/OpeningScene.ts`
- `src/scenes/GameScene.ts`
- `src/scenes/ResultScene.ts`
- `src/scenes/AccuseScene.ts`
- `src/scenes/InjuryGameOverScene.ts`
- `src/scenes/JudgementGameOverScene.ts`
- `src/scenes/WinScene.ts`
- `src/scenes/LoseScene.ts`

注意:

- `src/scenes/GameScene.patched.ts` は現在 import されていないが、`tsconfig.json` の `include: ["src"]` により型チェック対象になる。今後、正式採用するか退避するかを決める。
- `src/scenes/*.ts.bak` は TypeScript の対象外だが、移行中の混乱を避けるため最終的には保管場所を整理したい。

## ゲーム状態を持っている主な箇所

### `SceneManager`

- `animalStateList`: 動物ごとの `normal / injured / dead`
- `injuryRecord`: 現状ほぼ未使用に見える
- `currentDay`: 現在日
- `animalLogs`: 日ごとの選抜・負傷ログ

### `GameScene`

- `scenario`
- `selected`
- `wolves`
- `injuryType`
- `allowSelfAttack`
- `animalStateList`
- `isLedgerOpen`

### `ResultScene`

- `healthyAnimals`
- `survivedInjuredAnimals`
- `newlyInjuredAnimals`
- `deadAnimals`
- `attackedQueue`
- `finished`
- `deathOccured`

### `AccuseScene`

- `selectedIdx`
- `wolves`
- `gauge`
- `isHolding`
- `accuseHoldFrame`
- `balloonMap`

### `StatsManager`

- `stats`
- `clearedScenarios`
- 勝利数、敗北数、告発数など

## 表示処理とロジックが混ざっている箇所

### `GameScene`

最も分離優先度が高い。

- 選抜 UI
- 選抜数チェック
- オオカミ有無判定
- 襲撃対象抽選
- 動物状態更新
- 日次ログ生成
- 結果シーン遷移
- 名簿表示
- 名簿コメント選択

これらが同じクラス内に集まっている。

### `ResultScene`

- 結果分類
- 被害者キュー生成
- ticker による演出進行
- 負傷・死亡ラベル更新
- セリフ選択
- 次の日 / ゲームオーバー判定

結果は先に確定しているが、演出中の `finished` や `deathOccured` が進行判定にも使われている。

### `AccuseScene`

- 長押し入力
- ゲージ更新
- 吹き出し段階
- 色変更
- 振動演出
- 告発確定
- 勝敗判定
- 統計更新
- シーン遷移

React 化時は、長押しゲージを CSS Animation に寄せ、確定イベントだけを React 側に通知する形にする。

### `WinScene` / `LoseScene` / `GameOverScene`

画面生成時に統計更新が走る箇所がある。

React の再レンダーと相性が悪いため、将来的には「画面を表示したから統計更新」ではなく「勝敗イベントが発生したから統計更新」に寄せる。

## 最初に分離すべき処理

優先順:

1. 作業日の解決ロジック
2. 日次ログ生成
3. オオカミ選定
4. 名簿コメント選択
5. 告発判定
6. 統計更新タイミング
7. 結果演出用の表示データ生成

最初の純粋関数候補:

```ts
resolveWorkDay(input) => {
  attackedNames,
  animalStateList,
  playerLost,
  logs
}
```

この関数は PixiJS に依存させない。

## Phase 計画

### Phase 1: 既存 PixiJS コードの調査

Status: Done

完了条件:

- 現在の構造分析がある。
- PixiJS 依存箇所が一覧化されている。
- ゲーム状態と表示依存が混ざっている箇所が特定されている。
- 変更リスクの高い箇所が特定されている。

成果物:

- このファイル。

### Phase 2: PixiJS 非依存の型定義を追加する

Status: Done

作業:

- `src/game/` を追加する。
- `src/game/battleTypes.ts` または `src/game/workTypes.ts` を追加する。
- 現在のゲーム内容に合わせて、`BattleState` より先に `WorkState` / `AnimalWorkState` のような名称を検討する。
- React 移行後の戦闘表現にもつなげられるよう、`UnitState` 型も用意してよい。

候補型:

- `AnimalCondition = "normal" | "injured" | "dead"`
- `AnimalWorkState`
- `DailyAnimalLog`
- `WorkDayResult`
- `GamePhase`
- `GameResult`
- `UnitState`
- `BattleState`
- `BattleLogEntry`

完了条件:

- `src/game/` 配下が存在する。
- `src/game/` 配下が `pixi.js` を import していない。
- 追加した状態型が `JSON.stringify` できる純粋データだけで構成されている。
- 既存画面はまだ動く。
- `npm run build` が通る。

成果物:

- `src/game/battleTypes.ts`

実施内容:

- `src/game/` を追加。
- 現在の作業日ゲームに合わせた `AnimalCondition` / `AnimalWorkState` / `DailyAnimalLog` / `WorkDayInput` / `WorkDayResult` / `WorkGameState` を追加。
- React 移行後の戦闘画面に備えた `UnitState` / `BattleState` / `BattleLogEntry` / `AccuseState` を追加。
- `src/game/` 配下に PixiJS 依存がないことを確認。
- `npm run build` が通ることを確認。

### Phase 2.5: 移行前の未使用 TypeScript ファイル整理

Status: Done

背景:

- `src/scenes/GameScene.patched.ts` は現在 import されていないが、`tsconfig.json` の `include: ["src"]` により型チェック対象になる。
- 今後の Phase で build の失敗原因になりやすいため、Phase 3 以降の前に扱いを決める。

候補:

- `GameScene.ts` に統合する。
- `docs/archive/` など TypeScript 対象外へ退避する。
- 不要なら削除する。ただし削除前に差分確認する。

完了条件:

- `GameScene.patched.ts` の扱いが決まっている。
- `npm run build` が通る。

決定:

- `src/scenes/GameScene.ts` を正本として維持する。
- `src/scenes/GameScene.patched.ts` は採用しない。
- 参考資料として `docs/archive/GameScene.patched.ts` へ退避する。
- 理由: patched 版は未使用であり、デバッグログや途中パッチが多い。さらに現行 `GameScene.ts` にある `injuryType === "self"` の分岐が patched 版には欠けており、`dayX` 系の挙動を壊す可能性がある。

### Phase 3: 日次ログ処理を分離する

Status: Done

作業:

- `SceneManager.animalLogs` の形を型定義する。
- 日次ログ生成処理を `src/game/workLog.ts` などへ切り出す。
- `GameScene` はログデータを受け取り表示するだけに近づける。

完了条件:

- 日次ログ生成が PixiJS 非依存の関数になる。
- `BattleLogEntry[]` または `DailyAnimalLog[]` が導入されている。
- 既存画面が動く。
- `npm run build` が通る。

成果物:

- `src/game/workLog.ts`

実施内容:

- `WorkerDayLog` / `WorkerLogBook` を追加。
- `createInitialAnimalLogs` でシナリオ開始時のログ初期化を PixiJS 非依存にした。
- `createDailyAnimalLogs` で作業日ごとの構造化ログ `DailyAnimalLog[]` を生成できるようにした。
- `applyWorkDayLogs` で既存 `SceneManager.animalLogs` 形式への反映を PixiJS 非依存にした。
- `TitleScene` のログ初期化を helper 呼び出しへ変更。
- `GameScene` の当日ログ反映を helper 呼び出しへ変更。
- `SceneManager.animalLogs` に `WorkerLogBook` 型を適用。
- `src/game/` 配下に PixiJS 依存がないことを確認。
- `npm run build` が通ることを確認。

### Phase 4: 作業結果・勝敗判定を純粋関数へ寄せる

Status: Done

作業:

- `GameScene` の作業開始 handler から襲撃判定を切り出す。
- `selectedAnimals`, `wolves`, `previousAnimalStates`, `wolfAttackRule` から次状態を返す。
- `playerLost` の正本を戻り値にする。

完了条件:

- 負傷・死亡の正本が Pixi の Sprite / Container ではなく、純粋データになる。
- `GameScene` は結果を受け取って `SceneManager.changeScene("Result", data)` するだけに近づく。
- `src/game/` 配下が PixiJS 非依存である。
- 既存画面が動く。
- `npm run build` が通る。

成果物:

- `src/game/resolveWorkDay.ts`

実施内容:

- `pickAttackedNames` を追加し、オオカミ選抜有無、`maleOnly`、`self`、通常ランダム襲撃の対象決定を PixiJS 非依存にした。
- `resolveWorkDay` を追加し、選抜動物、オオカミ名、前回状態、襲撃ルールから `attackedNames` / `animalStateList` / `playerLost` を返すようにした。
- 既存挙動維持のため `Math.random` 相当の `random` 関数を注入可能にした。テスト時は固定乱数を渡せる。
- `GameScene` の作業開始 handler から襲撃判定、状態遷移、敗北判定を削除し、`resolveWorkDay` の戻り値を使う形に変更。
- `GameScene` は結果データを受け取り、ログ反映と `SceneManager.changeScene("Result", data)` を行うだけに近づいた。
- `src/game/` 配下に PixiJS 依存がないことを確認。
- `npm run build` が通ることを確認。

### Phase 5: 告発判定と長押し状態を分離する

Status: Done

作業:

- 告発対象がオオカミかどうかの判定を純粋関数へ切り出す。
- 長押しの進捗・確定・キャンセルを、Pixi ticker ではないモデルへ寄せる準備をする。

完了条件:

- 告発の勝敗判定が PixiJS 非依存になる。
- `AccuseScene` は判定関数を呼ぶだけに近づく。
- `npm run build` が通る。

成果物:

- `src/game/resolveAccuse.ts`

実施内容:

- `resolveAccusation` を追加し、告発対象がオオカミかどうかの判定と `win` / `lose` 決定を PixiJS 非依存にした。
- `advanceAccuseHold` を追加し、長押しのフレーム進行、進捗率、`start` / `hold1` / `hold2` / `confirm` の節目を PixiJS 非依存にした。
- `canCancelAccuseHold` を追加し、確定前ならキャンセル可能という判定を PixiJS 非依存にした。
- `AccuseScene` の `finishAccuse` を `resolveAccusation` 呼び出しへ変更。
- `AccuseScene` の ticker 内フレーム進行を `advanceAccuseHold` 呼び出しへ変更。
- 現段階では Pixi ticker 自体は残す。React 化時に CSS Animation / timeout ベースへ置き換える。
- `src/game/` 配下に PixiJS 依存がないことを確認。
- `npm run build` が通ることを確認。

### Phase 6: React 導入の土台を作る

Status: Done

作業:

- React と React DOM を導入する。
- `src/main.tsx` と `src/App.tsx` を追加する準備をする。
- 既存 PixiJS 版を壊さず、React 版を横に置ける入口を検討する。

完了条件:

- React がプロジェクトに導入される。
- PixiJS 版の起動を維持する。
- `npm run build` が通る。

成果物:

- `src/main.tsx`
- `src/App.tsx`

実施内容:

- `react` / `react-dom` / `@types/react` / `@types/react-dom` を追加。
- `tsconfig.json` に `jsx: "react-jsx"` を追加。
- `index.html` の入口を `/src/main.tsx` に変更し、React root 用の `<div id="root"></div>` を追加。
- `App.tsx` に `LegacyPixiGame` を追加し、既存 PixiJS ゲームを React コンポーネント内で起動するようにした。
- 既存 PixiJS の `SceneManager.changeScene("Title")` 起動は維持。
- `npm run build` が通ることを確認。

### Phase 7: React 版 BattleScreen / WorkScreen を横に作る

Status: Done

作業:

- `BattleScreen` または現在のゲーム内容に合わせて `WorkScreen` を作る。
- DOM で以下を表示する。
  - 動物一覧
  - 状態
  - 選択
  - ログ
  - 作業開始ボタン
  - 告発ボタン
  - 勝敗表示

完了条件:

- React DOM で状態確認できる。
- 既存 PixiJS 版はまだ壊れていない。
- `npm run build` が通る。

成果物:

- `src/components/WorkScreen.tsx`
- `src/components/UnitView.tsx`
- `src/components/HpBar.tsx`
- `src/components/CommandPanel.tsx`
- `src/components/LogPanel.tsx`
- `src/components/ResultPanel.tsx`
- `src/styles/work-screen.css`

実施内容:

- React DOM 版の作業画面 `WorkScreen` を追加。
- `?mode=react` の時だけ React DOM 版を表示し、通常 URL では既存 PixiJS 版を維持するようにした。
- `day1.json` を読み込み、動物一覧、状態、選択、作業ログ、作業開始、処分実行、結果表示を DOM で確認できるようにした。
- Phase 3 / Phase 4 / Phase 5 で分離した `applyWorkDayLogs` / `resolveWorkDay` / `resolveAccusation` を React DOM 版から利用するようにした。
- `npm run build` が通ることを確認。

### Phase 7.5: React 版を既存仕様に寄せる

Status: In Progress

目的:

- React DOM 版が簡易プロトタイプに見えすぎないよう、既存 PixiJS 版で気に入っている導線と雰囲気を段階的に戻す。

作業:

- タイトル画面を React DOM で追加する。
- `day1` / `day2` / `dayX` のシナリオ選択を復元する。
- クリア済みシナリオによるロック解除を復元する。
- 指令書風オープニングを React DOM で追加する。
- `WorkScreen` を固定 `day1` ではなく、選択されたシナリオで起動するようにする。

完了条件:

- `?mode=react` でタイトル画面から始まる。
- シナリオ選択後、指令書を経由して作業画面へ進む。
- 通常 URL の PixiJS 版は維持される。
- `npm run build` が通る。

成果物:

- `src/components/ReactGame.tsx`
- `src/components/TitleScreen.tsx`
- `src/components/OpeningScreen.tsx`

実施内容:

- React DOM 版のタイトル画面を追加し、既存のタイトル背景、タイトル文言、緑のシナリオボタン、操作説明書、データ初期化を復元。
- React DOM 版の指令書画面を追加。
- `WorkScreen` を props で受け取った `ScenarioData` から初期化する形に変更。
- `?mode=react` では `ReactGame` が `title` / `opening` / `work` の画面遷移を管理するようにした。
- `npm run build` が通ることを確認。

### Phase 8: CSS Animation を追加する

Status: Done

作業:

- `visualState` に応じて className を切り替える。
- 軽い演出を CSS に移す。

完了条件:

- 選択中、被弾、死亡、長押し中などが CSS で視覚化される。
- React state を毎フレーム更新していない。
- `npm run build` が通る。

成果物:

- `src/components/WorkScreen.tsx`
- `src/components/UnitView.tsx`
- `src/styles/work-screen.css`

実施内容:

- React DOM 版の `WorkScreen` に一時的な `visualStateByName` を追加。
- `UnitView` に `UnitVisualState` を渡し、`unit-view--visual-*` class を切り替えるようにした。
- 選択中は `selectedPulse`、作業参加者は `unitAttack`、被害者は `unitDamaged` / `damageFlash`、死亡時は `unitDown` / `downImage` を CSS Animation で表現。
- React state は作業開始時と 720ms 後のリセット時だけ更新し、毎フレーム更新しない。
- `prefers-reduced-motion: reduce` ではアニメーションを止めるようにした。
- `npm run build` が通ることを確認。

### Phase 9: HoldConfirmButton と SpeechBubble を追加する

Status: Todo

作業:

- 長押し確定 UI を DOM/CSS で作る。
- 長押し中の吹き出しを DOM/CSS で表示する。

完了条件:

- `pointerdown` / `pointerup` / `pointercancel` / `pointerleave` に対応する。
- 一定時間で `onConfirm` が 1 回だけ発火する。
- キャンセルで吹き出しとゲージが消える。
- `npm run build` が通る。

### Phase 10: Canvas Overlay を追加する

Status: Todo

作業:

- `src/effects/effectTypes.ts`
- `src/effects/effectBus.ts`
- `src/effects/EffectCanvasLayer.tsx`
- `src/effects/canvasEffects.ts`

完了条件:

- 攻撃時や被弾時に Canvas エフェクトが出る。
- Canvas は `pointer-events: none`。
- Canvas にゲーム状態がない。
- `npm run build` が通る。

### Phase 11: StoryScene / MangaPanelScene を追加する

Status: Todo

作業:

- React / DOM で短いストーリー表示を作る。
- 必要に応じて Canvas で集中線やフラッシュを出す。

完了条件:

- クリック / タップで進む。
- スキップできる。
- `npm run build` が通る。

### Phase 12: PixiJS 削除

Status: Todo

作業:

- React 版でタイトルからリザルトまで動くことを確認する。
- PixiJS import を削除する。
- `package.json` から `pixi.js` と `@pixi/filter-glow` を削除する。
- Pixi シーン管理を削除する。

完了条件:

- `pixi.js` import が存在しない。
- `npm run build` が通る。
- タイトルからリザルトまで到達できる。
- 長押し確定、吹き出し、Canvas Overlay が動く。

### Phase 13: GitHub Pages 公開対応

Status: Todo

作業:

- `vite.config.ts` の `base` を設定する。
- GitHub Actions の deploy workflow を追加する。
- `npm run build` と `dist/` 生成を確認する。

完了条件:

- GitHub Pages で公開できる。
- 公開 URL でタイトル画面が開く。
- スマホでタップと長押しが動く。

## 変更リスクの高い箇所

### `src/scenes/GameScene.ts`

作業開始 handler にゲーム結果の正本が集中している。

最初に壊しやすい箇所:

- 襲撃対象抽選
- `maleOnly` / `self` / `allowWolfSelfAttack`
- `SceneManager.animalLogs` の上書き
- `playerLost` 判定

### `src/core/SceneManager.ts`

static 状態が React state と二重管理になりやすい。

移行時は、いきなり消さずに、純粋関数の結果を受ける互換レイヤーとして使う。

### `src/scenes/ResultScene.ts`

ticker 演出と次シーン判定が結合している。

React 化時は、結果確定済みのデータを受け取り、演出完了後に次へ進むだけにする。

### `src/scenes/AccuseScene.ts`

Pixi ticker で長押しゲージを進めている。

React 化時は CSS Animation と timeout ベースの確定イベントへ移す。

### `src/core/StatsManager.ts`

シーン生成時に統計更新が発生する。

React 化時は、画面表示ではなく勝敗イベントや開始イベントで一度だけ更新する形にする。

### `src/scenes/GameScene.patched.ts`

未使用に見えるが TypeScript の対象。

今後の候補:

- 正式採用して `GameScene.ts` と統合する。
- `docs/archive/` など TypeScript 対象外へ退避する。
- 不要なら削除する。ただし削除前に差分確認する。

## 作業ログ

### 2026-05-01

- Phase 1 の分析を実施。
- `docs/refactoring-plan.md` を追加。
- Phase 2 として `src/game/battleTypes.ts` を追加。
- `src/game/` 配下に PixiJS 依存がないことを確認。
- `npm run build` が通ることを確認。
- Phase 2.5 として `src/scenes/GameScene.patched.ts` を `docs/archive/GameScene.patched.ts` へ退避。
- `src/scenes/GameScene.ts` を正本として維持する方針を決定。
- Phase 3 として `src/game/workLog.ts` を追加。
- 日次ログ初期化と当日ログ反映を PixiJS 非依存 helper へ分離。
- `npm run build` が通ることを確認。
- Phase 4 として `src/game/resolveWorkDay.ts` を追加。
- 襲撃対象決定、状態遷移、敗北判定を PixiJS 非依存関数へ分離。
- `GameScene` の作業開始 handler を `resolveWorkDay` 呼び出しへ差し替え。
- `npm run build` が通ることを確認。
- Phase 5 として `src/game/resolveAccuse.ts` を追加。
- 告発判定と長押しの進捗・節目判定を PixiJS 非依存 helper へ分離。
- `AccuseScene` を `resolveAccusation` / `advanceAccuseHold` / `canCancelAccuseHold` 呼び出しへ差し替え。
- `npm run build` が通ることを確認。
- Phase 6 として React と React DOM を導入。
- `src/main.tsx` / `src/App.tsx` を追加し、既存 PixiJS ゲームを React コンポーネント内でホストする形に変更。
- `index.html` を React root 経由の起動に変更。
- `npm run build` が通ることを確認。
- Phase 7 として React DOM 版 `WorkScreen` と周辺コンポーネントを追加。
- `?mode=react` で React DOM 版、通常 URL で既存 PixiJS 版を表示する横置き構成にした。
- `npm run build` が通ることを確認。
- Phase 8 として React DOM 版に `visualState` class と CSS Animation を追加。
- 選択、作業参加、被弾、死亡の軽い演出を CSS で表現。
- `npm run build` が通ることを確認。
- React 版を既存仕様に寄せる調整として `ReactGame` / `TitleScreen` / `OpeningScreen` を追加。
- `?mode=react` でタイトルからシナリオ選択、指令書、作業画面へ進む導線を追加。
- `npm run build` が通ることを確認。
- React 版をさらに既存仕様に寄せる調整として `ResultScreen` を追加。
- 作業開始後に作業画面内パネルで済ませず、作業報告画面を挟んで次の日へ進む導線に変更。
- `WorkScreen` の状態を `ReactGame` に持ち上げ、作業報告後も日数、動物状態、ログを維持する形にした。
- `npm run build` が通ることを確認。
- React 版をさらに既存仕様に寄せる調整として `AccuseScreen` / `AccuseOutcomeScreen` を追加。
- 作業画面で1匹選んで処分実行すると、独立した告発画面へ遷移し、長押しゲージと吹き出しを経由して勝敗判定する導線に変更。
- 告発後は `resolveAccusation` の結果を使い、勝利時はクリア済みシナリオとして記録するようにした。
- `npm run build` が通ることを確認。
- React 版を既存仕様に寄せる調整として `LedgerPanel` を追加。
- 作業画面から作業員名簿を開き、現在状態と名簿コメントを確認できるようにした。
- React 版の作業画面を旧UIに寄せる調整として、進捗バー、残り日数表示、作業指示文、作業員カード内の日別ログ、投入/負傷ラベルを追加。
- React 版の作業結果画面を旧UIに寄せる調整として、大きい動物表示、吹き出し型セリフ、負傷/死亡ラベル、赤/黒フラッシュ、飛び込みラベル演出を追加。
- React 版の処分画面を旧UIに寄せる調整として、中央対象表示、危険ビネット、長押し中のUI退避、位置が変わる吹き出し、処分ゲージの圧を追加。
- React 版の結果画面を画面クリック/タップで次へ進めるようにし、告発後の勝敗画面も旧UI寄りの黒背景・大見出し・補足文へ調整。
- Canvas Overlay の土台として `effects/` 配下に `effectBus`、`EffectCanvasLayer`、Canvas描画関数、演出イベント型を追加。
- 作業開始時にReact側から `slash` / `hit` / `explosion` / `damageNumber` / `focusLines` の演出イベントだけをCanvasへ通知するようにした。
- 作業結果画面と処分画面にも `EffectCanvasLayer` を接続し、被害者表示・長押し開始・処分確定時にCanvas演出イベントを出すようにした。
- Phase 10 の土台として React DOM 版 `StoryScene` を追加し、タイトル後の指令書を短いコマ進行のショートストーリーに置き換えた。
- Phase 12 として GitHub Pages 公開対応を開始。
- `vite.config.ts` に `base: "/wolffac/"` を追加し、JS/TS側のpublicアセット参照を `assetUrl()` 経由に変更。
- `.github/workflows/deploy.yml` を追加し、mainブランチへのpushで `dist/` をGitHub Pagesへデプロイする構成にした。
- `.gitignore` を追加し、`node_modules/`、`dist/`、`.DS_Store` などをコミット対象外にした。
- production preview を `http://127.0.0.1:4173/wolffac/?mode=react` で確認し、タイトル、マニュアルリンク、シナリオ読込、作業画面表示が通ることを確認。
- 公開URLをクエリなしで開いたときはReact版を表示し、旧PixiJS版は `?mode=legacy` で確認できるようにした。
- React 版の作業画面を PixiJS 時代のUIへ戻す第一歩として、作業員表示を常時2列の大きな動物カードに変更。
- 作業画面を720px前後の縦長ゲーム画面に寄せ、選択ラベル、負傷ラベル、日別ログチップを大きくして、旧版の「動物を直接選ぶ」感触に近づけた。
- GitHub Pages 上で背景画像が抜けないよう、CSS内の背景画像パスを公開先のbase配下でも解決できる相対パスに変更。
- React 版の下部操作エリアを旧UIに寄せ、DAY / SELECT のステータス板、大きい作業開始ボタン、押し込み感のある操作ボタン、色付き作業ログマスを追加。
