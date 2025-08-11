import Phaser from 'phaser';

// コールバック関数の型定義
export interface QuizInputCallbacks {
  onUp: () => void;
  onDown: () => void;
  onSelect: (index: number) => void;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * クイズシーンのキーボード・マウス入力を管理するクラス
 */
export default class QuizInputHandler {
  private keyHandlers = new Map<string, (event: KeyboardEvent) => void>();

  constructor(private scene: Phaser.Scene) {}

  /**
   * 問題回答中の入力ハンドラを設定する
   * @param callbacks - 実行するコールバック関数のセット
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
   * 結果表示中の入力ハンドラを設定する
   * @param callbacks - 実行するコールバック関数のセット
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
   * すべての入力ハンドラを解除する
   */
  public cleanup(): void {
    this.keyHandlers.forEach((handler, event) => {
      this.scene.input.keyboard!.off(event, handler);
    });
    this.keyHandlers.clear();
    // 'pointerdown'イベントもクリアする必要がある場合があるが、
    // onceで登録しているので、一度実行されれば自動で消える
  }

  private register(event: string, callback: () => void): void {
    const handler = (e: KeyboardEvent) => {
      // 他の入力フィールドにフォーカスがある場合などは何もしない、などの制御も可能
      callback();
    };
    this.scene.input.keyboard!.on(event, handler);
    this.keyHandlers.set(event, handler);
  }
}
