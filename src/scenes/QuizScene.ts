import Phaser from 'phaser';

interface QuizData {
  question: string;
  choices: string[];
  answer: string;
  category?: string;
  source_chunk?: string;
  source_metadata?: {
    file?: string;
    page?: number;
  };
}

enum QuizState {
  LOADING,
  QUESTION,
  RESULT,
  CLOSING
}

export default class QuizScene extends Phaser.Scene {
  private currentState = QuizState.LOADING;
  private selectedIndex = 0;
  private inputLocked = false;

  // データ
  private quizData: QuizData[] = [];
  private currentQuestion?: QuizData;
  private userAnswer?: string;
  private isCorrect = false;

  // UI要素
  private overlay!: Phaser.GameObjects.Rectangle;
  private questionPanel!: Phaser.GameObjects.Container;
  private resultPanel!: Phaser.GameObjects.Container;
  private questionText!: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];

  // シーンデータ
  private category?: string;
  private returnSceneKey!: string;

  // キーハンドラ管理（他のシーンと一貫性のある方式）
  private onUpKey = () => {
    if (this.inputLocked || this.currentState !== QuizState.QUESTION) return;
    this.selectedIndex = (this.selectedIndex + this.choiceTexts.length - 1) % this.choiceTexts.length;
    this.updateSelection();
  };

  private onDownKey = () => {
    if (this.inputLocked || this.currentState !== QuizState.QUESTION) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.choiceTexts.length;
    this.updateSelection();
  };

  private onEnterKey = () => {
    if (this.currentState === QuizState.QUESTION && !this.inputLocked) {
      this.confirmAnswer();
    } else if (this.currentState === QuizState.RESULT) {
      this.closeQuiz();
    }
  };

  private onSpaceKey = () => {
    if (this.currentState === QuizState.RESULT) {
      this.closeQuiz();
    }
  };

  private onEscKey = () => {
    if (this.currentState === QuizState.RESULT) {
      this.closeQuiz();
    }
  };

  private onKey1 = () => this.selectChoice(0);
  private onKey2 = () => this.selectChoice(1);
  private onKey3 = () => this.selectChoice(2);
  private onKey4 = () => this.selectChoice(3);

  // キーハンドラ管理（復元）
  private keyHandlers = new Map<string, () => void>();

  constructor() {
    super({ key: 'QuizScene' });
  }

  init(data: { category?: string; returnSceneKey: string }) {
    // データ初期化
    this.category = data.category;
    this.returnSceneKey = data.returnSceneKey;

    // 状態リセット
    this.currentState = QuizState.LOADING;
    this.selectedIndex = 0;
    this.inputLocked = false;
    this.quizData = [];
    this.currentQuestion = undefined;
    this.userAnswer = undefined;
    this.isCorrect = false;
    this.choiceTexts = [];

    // キーハンドラクリア
    this.cleanupKeyHandlers();
  }

  preload() {
    // クイズデータの読み込み
    this.load.json('quiz_db', 'assets/quiz/quiz_db.json');
  }

  create() {
    // 入力有効化
    this.input.keyboard!.enabled = true;

    // データ読み込みと検証
    if (!this.loadAndValidateQuizData()) {
      this.safeExit();
      return;
    }

    // UI作成
    this.createUI();

    // 問題選択と表示
    this.selectRandomQuestion();
    this.showQuestion();

    // 入力ハンドラ設定
    this.setupQuestionInputHandlers();

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  private loadAndValidateQuizData(): boolean {
    try {
      const data = this.cache.json.get('quiz_db');

      if (!data || !Array.isArray(data)) {
        console.warn('QuizScene: Invalid quiz data format');
        return false;
      }

      // カテゴリフィルタリング
      if (this.category) {
        this.quizData = data.filter(item =>
          item.category === this.category ||
          (this.category === 'general' && !item.category)
        );
      } else {
        this.quizData = data;
      }

      if (this.quizData.length === 0) {
        console.warn(`QuizScene: No questions found for category: ${this.category || 'all'}`);
        return false;
      }

      return true;
    } catch (error) {
      console.warn('QuizScene: Failed to load quiz data', error);
      return false;
    }
  }

  private createUI(): void {
    // 半透明黒のオーバーレイ
    this.overlay = this.add.rectangle(320, 200, 640, 400, 0x000000, 0.6);

    // 問題表示用パネル（中央、太枠・直角）
    this.questionPanel = this.add.container(320, 200);

    const panelBg = this.add.rectangle(0, 0, 500, 300, 0x000000, 0.8);
    const panelBorder = this.add.rectangle(0, 0, 500, 300, 0xffffff, 0);
    panelBorder.setStrokeStyle(4, 0xffffff);

    this.questionPanel.add([panelBg, panelBorder]);

    // 結果表示用パネル
    this.resultPanel = this.add.container(320, 200);
    this.resultPanel.setVisible(false);

    const resultBg = this.add.rectangle(0, 0, 550, 350, 0x000000, 0.9);
    const resultBorder = this.add.rectangle(0, 0, 550, 350, 0xffffff, 0);
    resultBorder.setStrokeStyle(4, 0xffffff);

    this.resultPanel.add([resultBg, resultBorder]);
  }

  private selectRandomQuestion(): void {
    const randomIndex = Math.floor(Math.random() * this.quizData.length);
    this.currentQuestion = this.quizData[randomIndex];
  }

  private formatQuestionText(question: string): string {
    const MAX_QUESTION_LENGTH = 120; // 約3-4行に収まる文字数

    if (question.length <= MAX_QUESTION_LENGTH) {
      return question;
    }

    // 文字数制限を超える場合は切り詰めて「...」を追加
    return question.substring(0, MAX_QUESTION_LENGTH - 3) + '...';
  }

  private formatChoiceText(choice: string): string {
    const MAX_CHOICE_LENGTH = 40; // 1行に収まる文字数

    if (choice.length <= MAX_CHOICE_LENGTH) {
      return choice;
    }

    return choice.substring(0, MAX_CHOICE_LENGTH - 3) + '...';
  }

  private showQuestion(): void {
    if (!this.currentQuestion) return;

    this.currentState = QuizState.QUESTION;

    // 問題文を制限内に収める
    const formattedQuestion = this.formatQuestionText(this.currentQuestion.question);

    // 問題文表示
    this.questionText = this.add.text(0, -100, formattedQuestion, {
      fontSize: '18px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 450 }
    }).setOrigin(0.5);

    this.questionPanel.add(this.questionText);

    // 選択肢表示
    this.choiceTexts = [];
    this.currentQuestion.choices.forEach((choice, index) => {
      const formattedChoice = this.formatChoiceText(choice);
      const choiceText = this.add.text(0, -20 + index * 35, `${index + 1}. ${formattedChoice}`, {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0)',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5);

      this.choiceTexts.push(choiceText);
      this.questionPanel.add(choiceText);
    });

    this.updateSelection();
  }

  private updateSelection(): void {
    this.choiceTexts.forEach((text, index) => {
      if (!text.scene || !text.active) return;

      if (index === this.selectedIndex) {
        // 選択中：黄色背景＋黒文字＋先頭に「▶」
        const formattedChoice = this.formatChoiceText(this.currentQuestion!.choices[index]);
        text.setText(`▶ ${index + 1}. ${formattedChoice}`);
        text.setStyle({
          backgroundColor: '#ffff00',
          color: '#000000'
        });
      } else {
        // 非選択：透明背景＋白文字
        const formattedChoice = this.formatChoiceText(this.currentQuestion!.choices[index]);
        text.setText(`${index + 1}. ${formattedChoice}`);
        text.setStyle({
          backgroundColor: 'rgba(0,0,0,0)',
          color: '#ffffff'
        });
      }
    });
  }

  private selectChoice(choiceIndex: number): void {
    if (this.inputLocked || this.currentState !== QuizState.QUESTION) return;
    if (choiceIndex < 0 || choiceIndex >= this.choiceTexts.length) return;

    this.selectedIndex = choiceIndex;
    this.updateSelection();
  }

  private setupQuestionInputHandlers(): void {
    // ↑/↓キー
    this.registerKeyHandler('keydown-UP', () => {
      if (this.inputLocked || this.currentState !== QuizState.QUESTION) return;
      this.selectedIndex = (this.selectedIndex + this.choiceTexts.length - 1) % this.choiceTexts.length;
      this.updateSelection();
    });

    this.registerKeyHandler('keydown-DOWN', () => {
      if (this.inputLocked || this.currentState !== QuizState.QUESTION) return;
      this.selectedIndex = (this.selectedIndex + 1) % this.choiceTexts.length;
      this.updateSelection();
    });

    // 1-4キー（直接選択）
    for (let i = 1; i <= 4; i++) {
      this.registerKeyHandler(`keydown-${i}`, () => {
        if (this.inputLocked || this.currentState !== QuizState.QUESTION) return;
        if (i - 1 < this.choiceTexts.length) {
          this.selectedIndex = i - 1;
          this.updateSelection();
        }
      });
    }

    // Enterキー（決定）
    this.registerKeyHandler('keydown-ENTER', () => {
      if (this.inputLocked || this.currentState !== QuizState.QUESTION) return;
      this.confirmAnswer();
    });
  }

  private confirmAnswer(): void {
    if (this.inputLocked || !this.currentQuestion) return;

    this.inputLocked = true;
    this.currentState = QuizState.RESULT;

    // 回答判定
    this.userAnswer = this.currentQuestion.choices[this.selectedIndex];
    this.isCorrect = this.userAnswer === this.currentQuestion.answer;

    // 問題入力ハンドラを解除
    this.cleanupKeyHandlers();

    // 結果表示
    this.showResult();

    // 結果画面用入力ハンドラ設定
    this.setupResultInputHandlers();
  }

  private showResult(): void {
    if (!this.currentQuestion) return;

    // 問題パネルを非表示
    this.questionPanel.setVisible(false);

    // 結果パネルを表示
    this.resultPanel.setVisible(true);

    // 上段：正解/不正解表示
    const resultColor = this.isCorrect ? '#00ff00' : '#ff0000';
    const resultMessage = this.isCorrect ? '正解！' : '不正解…';

    const resultText = this.add.text(0, -140, resultMessage, {
      fontSize: '24px',
      color: resultColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.resultPanel.add(resultText);

    // 中段：選択と正解表示
    const choiceInfo = `選択：${this.userAnswer}\n正解：${this.currentQuestion.answer}`;
    const choiceText = this.add.text(0, -80, choiceInfo, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);

    this.resultPanel.add(choiceText);

    // 下段：出典情報
    this.showSourceInfo();

    // 操作説明
    const instructionText = this.add.text(0, 140, 'Enter / Space / Esc キーで閉じる', {
      fontSize: '14px',
      color: '#cccccc'
    }).setOrigin(0.5);

    this.resultPanel.add(instructionText);
  }

  private showSourceInfo(): void {
    if (!this.currentQuestion?.source_metadata || !this.currentQuestion?.source_chunk) return;

    const { file, page } = this.currentQuestion.source_metadata;

    // 出典表示
    let sourceInfo = '出典：';
    if (file) {
      sourceInfo += file;
      if (page) {
        sourceInfo += `(p.${page})`;
      }
    } else {
      sourceInfo += '不明';
    }

    const sourceText = this.add.text(0, -20, sourceInfo, {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.resultPanel.add(sourceText);

    // 区切り線
    const separator = this.add.text(0, 0, '─'.repeat(40), {
      fontSize: '12px',
      color: '#666666'
    }).setOrigin(0.5);

    this.resultPanel.add(separator);

    // source_chunk（300-500字に整形）
    let chunk = this.currentQuestion.source_chunk;
    if (chunk.length > 500) {
      chunk = chunk.substring(0, 497) + '...';
    }

    const chunkText = this.add.text(0, 60, chunk, {
      fontSize: '12px',
      color: '#dddddd',
      align: 'center',
      wordWrap: { width: 480 }
    }).setOrigin(0.5);

    this.resultPanel.add(chunkText);
  }

  private setupResultInputHandlers(): void {
    // Enter/Space/Escキーで閉じる
    this.registerKeyHandler('keydown-ENTER', () => this.closeQuiz());
    this.registerKeyHandler('keydown-SPACE', () => this.closeQuiz());
    this.registerKeyHandler('keydown-ESC', () => this.closeQuiz());
  }

  private closeQuiz(): void {
    if (this.currentState === QuizState.CLOSING) return;

    this.currentState = QuizState.CLOSING;

    // キーハンドラ解除
    this.cleanupKeyHandlers();

    // GameSceneに結果を一度だけ通知
    const targetScene = this.scene.get(this.returnSceneKey);
    if (targetScene) {
      targetScene.events.emit('quiz-completed', this.isCorrect);
    }

    // シーンを閉じる
    this.scene.stop();
  }

  private safeExit(): void {
    console.warn('QuizScene: Safe exit due to data loading failure');

    // GameSceneに失敗を通知（falseとして扱う）
    const targetScene = this.scene.get(this.returnSceneKey);
    if (targetScene) {
      targetScene.events.emit('quiz-completed', false);
    }

    this.scene.stop();
  }

  private registerKeyHandler(keyCode: string, handler: () => void): void {
    this.keyHandlers.set(keyCode, handler);
    this.input.keyboard!.on(keyCode, handler, this);
  }

  private cleanupKeyHandlers(): void {
    this.keyHandlers.forEach((handler, keyCode) => {
      this.input.keyboard!.off(keyCode, handler, this);
    });
    this.keyHandlers.clear();
  }

  private cleanup(): void {
    // キーハンドラクリーンアップ
    this.cleanupKeyHandlers();

    // 状態リセット
    this.currentState = QuizState.LOADING;
    this.inputLocked = false;
  }
}
