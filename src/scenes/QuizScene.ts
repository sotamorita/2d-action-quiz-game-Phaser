import Phaser from 'phaser';
import QuizDataManager, { QuizData } from '../features/quiz/QuizDataManager';
import QuizUIView from '../features/quiz/ui/QuizUIView';

/**
 * @enum {QuizState}
 * @description クイズシーン内部の状態を管理するための列挙型。
 * - LOADING: データ読み込み中。
 * - QUESTION: 問題表示と回答受付中。
 * - RESULT: 正解・不正解の結果表示中。
 * - CLOSING: シーンを閉じる処理中。
 */
enum QuizState {
  LOADING,
  QUESTION,
  RESULT,
  CLOSING
}

/**
 * @class QuizScene
 * @extends Phaser.Scene
 * @description
 * クイズの出題、回答、結果表示を行うシーン。
 * GameSceneなど、他のシーンから「モーダル」のように呼び出されることを想定しています。
 *
 * 設計思想:
 * このシーンは、クイズに関連する一連の処理を完全にカプセル化しています。
 * 1. **状態管理**: `QuizState`というステートマシンを用いて、シーン内の複雑な状態遷移
 *    （問題表示→結果表示→終了）を管理し、コードの見通しを良くしています。
 * 2. **責務の分離**:
 *    - `QuizDataManager`: クイズデータの読み込みと選択ロジックを担当。
 *    - `QuizUIView`: UIの表示と更新を担当。
 *    - `QuizScene`: これらを統括し、シーン全体の流れを制御する。
 * 3. **疎結合**: `GameScene`などの呼び出し元シーンとは、イベント（'quiz-completed'）を
 *    介してのみ通信します。これにより、クイズの内部実装が他のシーンに影響を与えることなく、
 *    独立して変更・拡張できます。
 */
export default class QuizScene extends Phaser.Scene {
  // --- プロパティ定義 ---

  // 状態管理
  private currentState = QuizState.LOADING;

  // クイズデータと回答
  private currentQuestion?: QuizData; // 現在表示中の問題
  private userAnswer?: string; // ユーザーが選択した回答
  private isCorrect = false; // 正解したかどうか

  // ヘルパークラス
  private dataManager!: QuizDataManager; // データ管理クラス
  private ui!: QuizUIView; // UI管理クラス

  // 呼び出し元シーンの情報
  private returnSceneKey!: string; // クイズ終了後に戻るシーンのキー
  private category?: string; // クイズのカテゴリ

  constructor() {
    super({ key: 'QuizScene' });
  }

  /**
   * シーンの初期化処理。呼び出し元シーンからデータを受け取ります。
   * @param {{ category?: string; returnSceneKey: string }} data
   */
  init(data: { category?: string; returnSceneKey: string }) {
    this.returnSceneKey = data.returnSceneKey;
    this.category = data.category;

    this.dataManager = new QuizDataManager(this);
    this.ui = new QuizUIView(this);

    // 状態をリセット
    this.isCorrect = false;
    this.currentQuestion = undefined;
  }

  /**
   * アセットのプリロード。ここではクイズデータ(JSON)を読み込みます。
   */
  preload() {
    this.load.json('quiz_db', 'assets/quiz/quiz_db.json');
  }

  /**
   * シーンの生成処理。
   */
  create() {
    // クイズデータをロードし、失敗した場合は安全にシーンを終了します。
    if (!this.dataManager.load('quiz_db', this.category)) {
      this.safeExit();
      return;
    }

    this.input.keyboard!.enabled = true;
    this.transitionToState(QuizState.QUESTION); // 問題表示状態に遷移
    this.events.once('shutdown', this.cleanup, this); // シーン終了時のクリーンアップを登録
  }

  /**
   * シーンの状態を遷移させます。
   * @param {QuizState} newState - 遷移先の新しい状態。
   */
  private transitionToState(newState: QuizState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;

    switch (this.currentState) {
      case QuizState.QUESTION:
        // 新しい問題を取得して表示
        this.currentQuestion = this.dataManager.getRandomQuestion();
        if (!this.currentQuestion) {
          this.safeExit(); // 問題が取得できなければ終了
          return;
        }
        this.ui.showQuestion(this.currentQuestion, (index) => {
          this.confirmAnswer(index); // 回答ボタンが押されたときのコールバック
        });
        break;

      case QuizState.RESULT:
        // 回答結果を表示
        this.ui.showResult(
          this.isCorrect,
          this.userAnswer!,
          this.currentQuestion!.answer,
          this.currentQuestion!.source_metadata,
          this.currentQuestion!.source_chunk
        );
        this.setupResultInput(); // 結果画面を閉じるための入力を設定
        break;

      case QuizState.CLOSING:
        // シーンを閉じる
        this.closeQuiz();
        break;
    }
  }

  /**
   * 結果表示画面で、シーンを閉じるための入力（キーボード、マウスクリック）を設定します。
   */
  private setupResultInput(): void {
    const closeHandler = () => {
      // 一度だけ実行されるように、すべてのリスナーを解除
      this.input.keyboard!.off('keydown-ENTER', closeHandler);
      this.input.keyboard!.off('keydown-SPACE', closeHandler);
      this.input.keyboard!.off('keydown-ESC', closeHandler);
      this.input.off('pointerdown', closeHandler);
      this.transitionToState(QuizState.CLOSING);
    };

    this.input.keyboard!.on('keydown-ENTER', closeHandler);
    this.input.keyboard!.on('keydown-SPACE', closeHandler);
    this.input.keyboard!.on('keydown-ESC', closeHandler);
    this.input.once('pointerdown', closeHandler);
  }

  /**
   * ユーザーの回答を確定し、正誤を判定します。
   * @param {number} selectedIndex - ユーザーが選択した選択肢のインデックス。
   */
  private confirmAnswer(selectedIndex: number): void {
    if (!this.currentQuestion) return;
    this.userAnswer = this.currentQuestion.choices[selectedIndex];
    this.isCorrect = this.userAnswer === this.currentQuestion.answer;
    this.transitionToState(QuizState.RESULT); // 結果表示状態に遷移
  }

  /**
   * クイズシーンを終了し、呼び出し元のシーンに結果を通知します。
   */
  private closeQuiz(): void {
    // 呼び出し元がカテゴリ選択シーンの場合は、そこに戻る
    if (this.returnSceneKey === 'QuizCategorySelectScene') {
      this.scene.start('QuizCategorySelectScene');
    } else {
      // それ以外（通常はGameScene）の場合は、イベントで結果を通知してからシーンを停止
      const targetScene = this.scene.get(this.returnSceneKey);
      if (targetScene) {
        targetScene.events.emit('quiz-completed', this.isCorrect);
      }
      this.scene.stop();
    }
  }

  /**
   * データロード失敗など、予期せぬ問題が発生した際に安全にシーンを終了します。
   */
  private safeExit(): void {
    console.warn('QuizScene: Safe exit due to data loading/validation failure.');
    // 常に「不正解」として扱う
    if (this.returnSceneKey === 'QuizCategorySelectScene') {
      this.scene.start('QuizCategorySelectScene');
    } else {
      const targetScene = this.scene.get(this.returnSceneKey);
      if (targetScene) {
        targetScene.events.emit('quiz-completed', false);
      }
      this.scene.stop();
    }
  }

  /**
   * シーン終了時にUIリソースをクリーンアップします。
   */
  private cleanup(): void {
    this.ui.destroy();
  }
}
