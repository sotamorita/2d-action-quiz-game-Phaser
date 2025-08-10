import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';

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
    this.overlay = this.add.rectangle(320, 160, 640, 320, 0x000000, 0.6); // Y座標を160に、高さを320に調整

    // 問題表示用パネル（中央、太枠・直角）
    this.questionPanel = this.add.container(320, 160); // Y座標を160に調整

    const panelBg = this.add.rectangle(0, 0, 500, 250, 0x000000, 0.8); // 高さを250に調整
    const panelBorder = this.add.rectangle(0, 0, 500, 250, 0xffffff, 0); // 高さを250に調整
    panelBorder.setStrokeStyle(4, 0xffffff);

    this.questionPanel.add([panelBg, panelBorder]);

    // 結果表示用パネル
    this.resultPanel = this.add.container(320, 160); // Y座標を160に調整
    this.resultPanel.setVisible(false);

    const resultBg = this.add.rectangle(0, 0, 550, 300, 0x000000, 0.9); // 高さを300に調整
    const resultBorder = this.add.rectangle(0, 0, 550, 300, 0xffffff, 0); // 高さを300に調整
    resultBorder.setStrokeStyle(4, 0xffffff);

    this.resultPanel.add([resultBg, resultBorder]);
  }

  private selectRandomQuestion(): void {
    const randomIndex = Math.floor(Math.random() * this.quizData.length);
    this.currentQuestion = this.quizData[randomIndex];
  }

  private showQuestion(): void {
    if (!this.currentQuestion) return;

    this.currentState = QuizState.QUESTION;

    // 問題文表示
    this.questionText = RetroUI.createSimpleText(this, 0, -60, this.currentQuestion.question, { // Y座標を-60に調整
      fontSize: '16px', // フォントサイズを16pxに縮小
      align: 'center',
      wordWrap: { width: 480, useAdvancedWrap: true } // wordWrapWidthを480に調整
    }).setOrigin(0.5);

    this.questionPanel.add(this.questionText);

    // 選択肢表示
    this.choiceTexts = [];
    this.currentQuestion.choices.forEach((choice, index) => {
      const choiceText = RetroUI.createSimpleText(this, 0, -20 + index * 30, `${index + 1}. ${choice}`, { // Y座標を-20に調整, 行間を30に調整
        fontSize: '14px', // フォントサイズを14pxに縮小
        backgroundColor: 'rgba(0,0,0,0)',
        padding: { x: 10, y: 5 }
        // wordWrapはRetroUI.createSimpleTextのデフォルトを使用
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true }); // タップ可能にする

      choiceText.on('pointerdown', () => {
        if (this.inputLocked || this.currentState !== QuizState.QUESTION) return;
        this.selectedIndex = index;
        this.updateSelection();
        this.confirmAnswer(); // タップで即時決定
      });

      this.choiceTexts.push(choiceText);
      this.questionPanel.add(choiceText);
    });

    this.updateSelection();
  }

  private updateSelection(): void {
    this.choiceTexts.forEach((text, index) => {
      if (!text.scene || !text.active) return;

      // 現在のスタイルを保持
      const currentStyle = text.style;

      if (index === this.selectedIndex) {
        // 選択中：黄色背景＋黒文字＋先頭に「▶」
        text.setText(`▶ ${index + 1}. ${this.currentQuestion!.choices[index]}`);
        text.setStyle({
          ...currentStyle, // 既存のスタイルをコピー
          backgroundColor: '#ffff00',
          color: '#000000'
        });
      } else {
        // 非選択：透明背景＋白文字
        text.setText(`${index + 1}. ${this.currentQuestion!.choices[index]}`);
        text.setStyle({
          ...currentStyle, // 既存のスタイルをコピー
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

    const resultText = RetroUI.createSimpleText(this, 0, -100, resultMessage, { // Y座標を-100に調整
      fontSize: '20px', // フォントサイズを20pxに縮小
      color: resultColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.resultPanel.add(resultText);

    // 中段：選択と正解表示
    const choiceInfo = `選択：${this.userAnswer}\n正解：${this.currentQuestion.answer}`;
    const choiceText = RetroUI.createSimpleText(this, 0, -50, choiceInfo, { // Y座標を-50に調整
      fontSize: '14px', // フォントサイズを14pxに縮小
      align: 'center'
    }).setOrigin(0.5);

    this.resultPanel.add(choiceText);

    // 下段：出典情報
    this.showSourceInfo();

    // 操作説明
    const instructionText = RetroUI.createSimpleText(this, 0, 130, 'Enter / Space / Esc キーで閉じる', { // Y座標を130に調整
      fontSize: '12px', // フォントサイズを12pxに縮小
      color: '#cccccc', // デフォルトの白ではなく、灰色を指定
      wordWrap: { width: 534 } // useAdvancedWrapを削除
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

    const sourceText = RetroUI.createSimpleText(this, 0, -25, sourceInfo, { // Y座標を-25に調整
      fontSize: '12px' // フォントサイズを12pxに縮小
    }).setOrigin(0.5);

    this.resultPanel.add(sourceText);

    // 区切り線
    const separator = RetroUI.createSimpleText(this, 0, -10, '─'.repeat(40), { // Y座標を-10に調整
      fontSize: '10px', // フォントサイズを10pxに縮小
      color: '#666666'
    }).setOrigin(0.5);

    this.resultPanel.add(separator);

    // source_chunk（300-500字に整形）
    let chunk = this.currentQuestion.source_chunk;
    // \n, \r, \t, \ のエスケープ処理を削除し、Phaserが改行として解釈するようにする
    if (chunk.length > 500) {
      chunk = chunk.substring(0, 497) + '...';
    }

    // スクロール可能なテキストエリアの定義
    const scrollAreaWidth = 500;
    const scrollAreaHeight = 100;
    const scrollAreaYOffset = 50; // resultPanelの中心からのオフセットを50に調整

    // テキストコンテナ
    const textContainer = this.add.container(0, scrollAreaYOffset);
    this.resultPanel.add(textContainer);

    // チャンクの背景色
    const chunkBg = this.add.rectangle(0, 0, scrollAreaWidth, scrollAreaHeight, 0x1a1a1a, 0.8).setOrigin(0.5); // 微妙に異なる背景色
    textContainer.add(chunkBg);

    // チャンクテキスト
    const chunkText = this.add.text(
      -scrollAreaWidth / 2, // コンテナの左端に配置
      -scrollAreaHeight / 2, // コンテナの上端に配置
      chunk,
      {
        fontSize: '12px',
        fontFamily: 'DotGothic16, sans-serif',
        color: '#dddddd',
        align: 'left',
        wordWrap: { width: scrollAreaWidth, useAdvancedWrap: true },
        lineSpacing: 5
      }
    ).setOrigin(0); // 左上を原点に

    textContainer.add(chunkText);

    // マスクの作成
    const maskGraphics = this.make.graphics({}).setScrollFactor(0);
    maskGraphics.fillRect(
      this.resultPanel.x - scrollAreaWidth / 2,
      this.resultPanel.y + scrollAreaYOffset - scrollAreaHeight / 2,
      scrollAreaWidth,
      scrollAreaHeight
    );
    textContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, maskGraphics));

    // スクロールロジック
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: Phaser.GameObjects.GameObject[], deltaX: number, deltaY: number, deltaZ: number) => {
      if (this.currentState === QuizState.RESULT && this.resultPanel.visible) {
        // マウスカーソルがスクロールエリア内にあるかチェック
        const bounds = new Phaser.Geom.Rectangle(
          this.resultPanel.x - scrollAreaWidth / 2,
          this.resultPanel.y + scrollAreaYOffset - scrollAreaHeight / 2,
          scrollAreaWidth,
          scrollAreaHeight
        );
        if (bounds.contains(pointer.x, pointer.y)) {
          textContainer.y -= deltaY * 0.1; // スクロール速度調整

          // スクロール範囲の制限
          const maxScrollY = scrollAreaYOffset; // 上限はtextContainerの初期Y座標
          const minScrollY = scrollAreaYOffset + scrollAreaHeight - chunkText.displayHeight; // 下限

          if (textContainer.y > maxScrollY) {
            textContainer.y = maxScrollY;
          } else if (textContainer.y < minScrollY) {
            textContainer.y = minScrollY;
          }
        }
      }
    });
  }

  private setupResultInputHandlers(): void {
    // Enter/Space/Escキーで閉じる
    this.registerKeyHandler('keydown-ENTER', () => this.closeQuiz());
    this.registerKeyHandler('keydown-SPACE', () => this.closeQuiz());
    this.registerKeyHandler('keydown-ESC', () => this.closeQuiz());

    // 任意のタップで閉じる
    this.input.once('pointerdown', () => this.closeQuiz(), this);
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
