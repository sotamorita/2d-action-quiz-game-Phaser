import Phaser from 'phaser';

/**
 * @interface QuizInputCallbacks
 * @description
 * `QuizInputHandler`が受け取るコールバック関数群の型定義です。
 * クイズの各操作（カーソル移動、選択、決定など）に対応する処理を、
 * 呼び出し元（主に`QuizScene`）が注入するために使用します。
 */
export interface QuizInputCallbacks {
  onUp: () => void;
  onDown: () => void;
  onSelect: (index: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * @class QuizInputHandler
 * @description
 * クイズシーンにおけるキーボードおよびポインティングデバイスからの入力を専門に扱うクラスです。
 * クイズの状態（問題回答中、結果表示中など）に応じて、有効にするキーやイベントを動的に切り替えます。
 *
 * [設計思想]
 * - **責務の分離 (SoC)**: 入力処理のロジックを、シーンのメインロジックから完全に分離しています。
 *   `QuizScene`は「何が入力されたか」を知る必要がなく、このクラスから通知されるイベント
 *   （`onUp`, `onConfirm`など）に応じて自身の状態を更新するだけで済みます。
 *   これにより、`QuizScene`のコードはよりシンプルで可読性の高いものになります。
 * - **ストラテジーパターン（簡易版）**: `setupQuestionInput`と`setupResultInput`という2つのメソッドは、
 *   クイズの異なる「状態」に対する入力処理の「戦略」を定義しています。
 *   シーンは自身の状態に合わせて適切なセットアップメソッドを呼び出すだけで、
 *   入力ハンドラの登録と解除を安全に行うことができます。
 * - **コールバックベースのイベント通知**: 呼び出し元から渡されたコールバック関数を、
 *   適切な入力イベントが発生した際に実行することで、イベントを通知します。
 *   これにより、`QuizInputHandler`と`QuizScene`の間の結合度を低く保っています。
 * - **クリーンアップ処理**: `cleanup`メソッドにより、登録したイベントリスナーを確実に解除する
 *   仕組みを提供しています。これにより、シーン遷移時などに古いリスナーが残り、
 *   意図しない動作やメモリリークを引き起こすのを防ぎます。
 */
export default class QuizInputHandler {
  private keyHandlers = new Map<string, (event: KeyboardEvent) => void>();

  constructor(private scene: Phaser.Scene) {}

  /**
   * クイズの問題に回答している最中の入力ハンドラをセットアップします。
   * 上下キーでの選択肢移動、Enterキーでの決定、数字キーでの直接選択を有効にします。
   * @param callbacks - 各入力に対応して実行される処理をまとめたオブジェクト。
   */
  public setupQuestionInput(callbacks: QuizInputCallbacks): void {
    this.cleanup(); // 既存のハンドラをクリア

    this.register('keydown-UP', callbacks.onUp);
    this.register('keydown-DOWN', callbacks.onDown);
    this.register('keydown-ENTER', callbacks.onConfirm);

    // 1-4キーでの直接選択
    for (let i = 1; i <= 4; i++) {
      this.register(`keydown-${i}`, () => callbacks.onSelect(i - 1));
    }
  }

  /**
   * 正解・不正解の結果を表示している最中の入力ハンドラをセットアップします。
   * Enterキー、Spaceキー、Escキー、または画面クリックでクイズを閉じる操作を有効にします。
   * @param callbacks - 各入力に対応して実行される処理をまとめたオブジェクト。
   */
  public setupResultInput(callbacks: QuizInputCallbacks): void {
    this.cleanup(); // 既存のハンドラをクリア

    this.register('keydown-ENTER', callbacks.onClose);
    this.register('keydown-SPACE', callbacks.onClose);
    this.register('keydown-ESC', callbacks.onClose);

    // 画面のどこかをタップしても閉じる
    this.scene.input.once('pointerdown', callbacks.onClose, this);
  }

  /**
   * 現在登録されているすべてのキーボードおよびポインティングデバイスのイベントリスナーを解除します。
   * 新しい入力ハンドラを設定する前や、シーンが破棄される際に呼び出すことで、
   * イベントの重複登録やメモリリークを防ぐための重要なメソッドです。
   */
  public cleanup(): void {
    this.keyHandlers.forEach((handler, event) => {
      this.scene.input.keyboard!.off(event, handler);
    });
    this.keyHandlers.clear();
    // 'pointerdown'イベントもクリアする必要がある場合があるが、
    // onceで登録しているので、一度実行されれば自動で消える
  }

  /**
   * 指定されたキーイベントに対して、コールバック関数をハンドラとして登録します。
   * 登録したハンドラは`keyHandlers`マップに保存され、後で`cleanup`メソッドによって
   * 一括で解除できるようになります。
   * @param event - Phaserが認識するキーイベント名 (例: 'keydown-UP')。
   * @param callback - イベント発生時に実行するコールバック関数。
   * @private
   */
  private register(event: string, callback: () => void): void {
    const handler = (e: KeyboardEvent) => {
      // 将来的に、特定の条件下で入力を無効化するような制御（例: テキスト入力中はキー操作を無効化）を
      // ここに追加することも可能です。
      callback();
    };
    this.scene.input.keyboard!.on(event, handler);
    this.keyHandlers.set(event, handler);
  }
}
