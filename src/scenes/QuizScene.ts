import Phaser from 'phaser';
import QuizDataManager, { QuizData } from '../quiz/QuizDataManager';
import QuizUI from '../quiz/QuizUI';
import QuizInputHandler, { QuizInputCallbacks } from '../quiz/QuizInputHandler';

// クイズシーンの状態を管理するenum
enum QuizState {
  LOADING,
  QUESTION,
  RESULT,
  CLOSING
}

export default class QuizScene extends Phaser.Scene {
  // 状態管理
  private currentState = QuizState.LOADING;

  // 選択肢と回答
  private selectedIndex = 0;
  private currentQuestion?: QuizData;
  private isCorrect = false;

  // ヘルパークラス
  private dataManager!: QuizDataManager;
  private ui!: QuizUI;
  private inputHandler!: QuizInputHandler;

  // 呼び出し元シーンの情報
  private returnSceneKey!: string;
  private category?: string;

  constructor() {
    super({ key: 'QuizScene' });
  }

  init(data: { category?: string; returnSceneKey: string }) {
    this.returnSceneKey = data.returnSceneKey;
    this.category = data.category;

    // ヘルパークラスのインスタンス化
    this.dataManager = new QuizDataManager(this);
    this.ui = new QuizUI(this);
    this.inputHandler = new QuizInputHandler(this);

    // 状態のリセット
    this.selectedIndex = 0;
    this.isCorrect = false;
    this.currentQuestion = undefined;
  }

  preload() {
    this.load.json('quiz_db', 'assets/quiz/quiz_db.json');
  }

  create() {
    // preload完了後にデータをロード
    if (!this.dataManager.load('quiz_db', this.category)) {
      this.safeExit();
      return;
    }

    this.input.keyboard!.enabled = true;
    this.transitionToState(QuizState.QUESTION);
    this.events.once('shutdown', this.cleanup, this);
  }

  /**
   * 状態を遷移させ、各状態で必要な処理を実行する
   * @param newState - 新しい状態
   */
  private transitionToState(newState: QuizState): void {
    if (this.currentState === newState) return;
    this.currentState = newState;

    switch (this.currentState) {
      case QuizState.QUESTION:
        this.currentQuestion = this.dataManager.getRandomQuestion();
        if (!this.currentQuestion) {
          this.safeExit();
          return;
        }
        this.ui.showQuestion(this.currentQuestion, (index) => {
          this.selectedIndex = index;
          this.confirmAnswer();
        });
        this.ui.updateSelection(this.selectedIndex, this.currentQuestion.choices);
        this.setupQuestionInput();
        break;

      case QuizState.RESULT:
        this.ui.showResult(
          this.isCorrect,
          this.currentQuestion!.choices[this.selectedIndex],
          this.currentQuestion!.answer,
          this.currentQuestion!.source_metadata,
          this.currentQuestion!.source_chunk
        );
        this.setupResultInput();
        break;

      case QuizState.CLOSING:
        this.closeQuiz();
        break;
    }
  }

  private setupQuestionInput(): void {
    const callbacks: QuizInputCallbacks = {
      onUp: () => this.updateChoice(-1),
      onDown: () => this.updateChoice(1),
      onSelect: (index) => {
        this.selectedIndex = index;
        this.ui.updateSelection(this.selectedIndex, this.currentQuestion!.choices);
      },
      onConfirm: () => this.confirmAnswer(),
      onClose: () => {} // QUESTION stateでは何もしない
    };
    this.inputHandler.setupQuestionInput(callbacks);
  }

  private setupResultInput(): void {
    const callbacks: QuizInputCallbacks = {
      onUp: () => {},
      onDown: () => {},
      onSelect: () => {},
      onConfirm: () => {},
      onClose: () => this.transitionToState(QuizState.CLOSING)
    };
    this.inputHandler.setupResultInput(callbacks);
  }

  private updateChoice(delta: number): void {
    if (!this.currentQuestion) return;
    const numChoices = this.currentQuestion.choices.length;
    this.selectedIndex = (this.selectedIndex + delta + numChoices) % numChoices;
    this.ui.updateSelection(this.selectedIndex, this.currentQuestion.choices);
  }

  private confirmAnswer(): void {
    if (!this.currentQuestion) return;
    this.isCorrect = this.currentQuestion.choices[this.selectedIndex] === this.currentQuestion.answer;
    this.transitionToState(QuizState.RESULT);
  }

  private closeQuiz(): void {
    // GameSceneに結果を一度だけ通知
    const targetScene = this.scene.get(this.returnSceneKey);
    if (targetScene) {
      targetScene.events.emit('quiz-completed', this.isCorrect);
    }
    this.scene.stop();
  }

  private safeExit(): void {
    console.warn('QuizScene: Safe exit due to data loading/validation failure.');
    const targetScene = this.scene.get(this.returnSceneKey);
    if (targetScene) {
      targetScene.events.emit('quiz-completed', false); // 失敗時は不正解として扱う
    }
    this.scene.stop();
  }

  private cleanup(): void {
    this.inputHandler.cleanup();
    this.ui.destroy();
  }
}
