# Style Guide for 2D Game Project

このプロジェクトでは、可読性・保守性・バグの予防性を高めるため、以下のスタイルガイドに従って開発を行います。

---

## ✅ 命名規則（Naming Conventions）

- クラス名：**パスカルケース**（例: `PlayerController`）
- メソッド・変数：**キャメルケース**（例: `handleInput`, `currentHealth`）
- 定数：**アッパースネークケース**（例: `MAX_HEALTH`, `GRAVITY_CONSTANT`）
- ファイル名：
  - UI/ユーティリティ：キャメルケース可（例: `fontLoader.ts`）
  - シーン・オブジェクト：パスカルケース推奨（例: `GameScene.ts`）

---

## ✅ コーディング規則（Coding Guidelines）

### マジックナンバーの禁止

- すべての数値定数に名前を与える（例: `const GRAVITY = 300`）
- 定数は `src/constants/` などに集約されることが望ましい

### 条件分岐の簡素化

- 複雑な `if` 文（AND/OR混在やネスト）は関数に抽出
- SRP（単一責務の原則）を徹底する

### ネスト制限

- **3階層以上のネストは禁止**
- 可能な限り `early return` を用いてネストを浅く保つ

### 副作用の管理

- サウンド再生・UI描画・エフェクトなどの副作用は専用関数に隔離する

---

## ✅ エラーハンドリング（Error Handling）

- `try/catch` を活用し、クラッシュを防ぐ
- `catch` ブロックではエラーをログ出力しつつ、アプリケーションの継続性を確保する処理を行う

---

## ✅ ログ・デバッグ（Logging）

- `console.log()` の直接使用は禁止
- `debug()` 関数等を通すか、開発中のみ `// debug:` とコメント明記

---

## ✅ コメントとドキュメント（Documentation）

- クラス・パブリックメソッドには JSDoc を必ず記載
- コメントは **「なぜ」その処理を行うのか** を中心に記述する
  ```ts
  /**
   * プレイヤーの当たり判定処理
   * なぜこの順序で処理する必要があるか：
   * 敵と同時に接触する可能性があるため
   */
````

---

## ✅ レビューコメントの形式（Gemini Review Format）

Gemini Code Assist による自動レビューでは、以下の形式でコメントを出力してください。

### 🔁 差分出力の必須化（Diff Inclusion Required）

* **Before**: 問題のあるコードスニペットを明示
* **After**: 修正提案のコードを提示
* **理由**: その修正が必要な理由を端的に記述

#### 💡 例

```ts
// Before
if (x === 1 || x === 2 || x === 3) {
  handleValue(x);
}

// After
const validXValues = [1, 2, 3];
if (validXValues.includes(x)) {
  handleValue(x);
}

// 理由：マジックナンバーを排除し、拡張性と可読性を向上させるため
```

> ✅ Gemini Bot は、すべてのレビューコメントでこの形式に従うようにしてください

---

## ✅ ファイル構成ガイド（Project Structure）

* `src/objects/`：ゲーム内の物体（Coin, Key, Enemyなど）
* `src/scenes/`：シーン遷移（GameScene, QuizSceneなど）
* `public/assets/`：画像・マップなどのリソース
* 定数や共通関数は `src/utils/` または `src/constants/` に集約

---

## ✅ コーディングスタイルの補足

* 行末セミコロンは省略せず使用
* import 文は `外部ライブラリ > 内部モジュール > ローカルパス` の順で整理
* 1ファイルあたりの行数が 300行を超える場合は分割を検討

---

## ✅ 非推奨パターン（Anti-patterns）

* `any` 型の多用
* `setTimeout` で状態管理をするような時間制御
* `try/catch` のネスト（関数に分離する）