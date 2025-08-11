import Phaser from 'phaser';
import QuizDataManager, { QuizData } from '../features/quiz/QuizDataManager';
import QuizUIView from '../features/quiz/ui/QuizUIView';

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

  // 回答
  private currentQuestion?: QuizData;
  private userAnswer?: string;
  private isCorrect = false;

  // ヘルパークラス
  private dataManager!: QuizDataManager;
  private ui!: QuizUIView;

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
    this.ui = new QuizUIView(this);

    // 状態のリセット
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
          this.confirmAnswer(index);
        });
        break;

      case QuizState.RESULT:
        this.ui.showResult(
          this.isCorrect,
          this.userAnswer!,
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

  private setupResultInput(): void {
    const closeHandler = () => {
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

  private confirmAnswer(selectedIndex: number): void {
    if (!this.currentQuestion) return;
    this.userAnswer = this.currentQuestion.choices[selectedIndex];
    this.isCorrect = this.userAnswer === this.currentQuestion.answer;
    this.transitionToState(QuizState.RESULT);
  }

  private closeQuiz(): void {
    if (this.returnSceneKey === 'QuizCategorySelectScene') {
      this.scene.start('QuizCategorySelectScene');
    } else {
      const targetScene = this.scene.get(this.returnSceneKey);
      if (targetScene) {
        targetScene.events.emit('quiz-completed', this.isCorrect);
      }
      this.scene.stop();
    }
  }

  private safeExit(): void {
    console.warn('QuizScene: Safe exit due to data loading/validation failure.');
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

  private cleanup(): void {
    this.ui.destroy();
  }
}
