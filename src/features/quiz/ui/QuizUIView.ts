import Phaser from 'phaser';
import { RetroUI } from '../../../ui/styles/RetroUI';
import { QuizData } from '../QuizDataManager';
import { UIConstants } from '../../../ui/styles/UIConstants';
import Menu from '../../../ui/components/Menu';

/**
 * @class QuizUIView
 * @description
 * クイズシーンの視覚的要素（UI）の構築、表示、更新をすべて担当するビュークラスです。
 * このクラスは、クイズのロジック（状態管理やデータ）からUIの具体的な実装を分離します。
 *
 * [設計思想]
 * - **ビューの分離 (Separated View)**: MVC (Model-View-Controller) やMVP (Model-View-Presenter)
 *   アーキテクチャの「ビュー」の役割を担います。シーン本体（`QuizScene`）がコントローラーとして振る舞い、
 *   この`QuizUIView`にUIの表示更新を指示します。これにより、シーン本体はUIの複雑な描画コードから
 *   解放され、クイズのロジックに集中できます。
 * - **コンポーネントの利用**: 選択肢の表示には、再利用可能な`Menu`コンポーネントを活用しています。
 *   これにより、一貫性のあるUIを効率的に構築し、コードの重複を避けています。
 * - **状態に応じた表示切り替え**: `showQuestion`と`showResult`という2つの主要なメソッドを持ち、
 *   クイズの状態（問題表示中か、結果表示中か）に応じて、表示するパネルや情報を完全に切り替えます。
 *   これにより、UIの状態管理がシンプルになります。
 * - **責務の集約**: パネルの生成、テキストの配置、結果の表示、出典情報のレイアウトなど、
 *   UIに関するすべての責務をこのクラスに集約しています。UIのレイアウトやデザインを変更したい場合、
 *   このファイルのみを修正すればよいため、保守性が向上します。
 */
export default class QuizUIView {
  private overlay!: Phaser.GameObjects.Rectangle;
  private questionPanel!: Phaser.GameObjects.Container;
  private resultPanel!: Phaser.GameObjects.Container;
  public menu!: Menu;

  /**
   * QuizUIViewのインスタンスを生成します。
   * コンストラクタ内で、クイズに必要なUIパネル（問題用と結果用）の初期化を行います。
   * @param scene - このビューが属するPhaserシーン。
   */
  constructor(private scene: Phaser.Scene) {
    this.createPanels();
  }

  /**
   * クイズで使用するすべての主要なUIパネル（オーバーレイ、問題パネル、結果パネル）を生成し、初期設定を行います。
   * @private
   */
  private createPanels(): void {
    const centerX = this.scene.cameras.main.width / 2;
    const centerY = this.scene.cameras.main.height / 2;

    this.overlay = this.scene.add.rectangle(
      centerX,
      centerY,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height,
      UIConstants.Overlay.BgColor,
      UIConstants.Overlay.BgAlpha
    );

    this.questionPanel = this.createPanel(centerX, centerY, 500, 250);
    this.resultPanel = this.createPanel(centerX, centerY, 550, 300);
    this.resultPanel.setVisible(false);
  }

  /**
   * UIの基礎となる、背景と枠線を持つコンテナパネルを生成します。
   * @param x - パネルの中心X座標。
   * @param y - パネルの中心Y座標。
   * @param width - パネルの幅。
   * @param height - パネルの高さ。
   * @returns {Phaser.GameObjects.Container} 生成されたパネルコンテナ。
   * @private
   */
  private createPanel(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, width, height, UIConstants.Panel.BgColor, UIConstants.Panel.BgAlpha);
    const border = this.scene.add.rectangle(0, 0, width, height, 0, 0).setStrokeStyle(UIConstants.Panel.BorderWidth, UIConstants.Panel.BorderColor);
    container.add([bg, border]);
    return container;
  }

  /**
   * 問題文と選択肢を画面に表示します。
   * 内部で`Menu`コンポーネントを生成し、選択肢の表示と操作を委譲します。
   * @param question - 表示する問題のデータ。
   * @param onChoiceSelected - 選択肢が選ばれたときに実行されるコールバック関数。選択されたインデックスが渡されます。
   */
  public showQuestion(question: QuizData, onChoiceSelected: (index: number) => void): void {
    this.questionPanel.setVisible(true);
    this.resultPanel.setVisible(false);
    this.clearPanel(this.questionPanel);

    const questionText = RetroUI.createSimpleText(this.scene, 0, -80, question.question, {
      fontSize: UIConstants.FontSize.Normal,
      align: 'center',
      wordWrap: { width: 480, useAdvancedWrap: true }
    }).setOrigin(0.5);
    this.questionPanel.add(questionText);

    // Menuコンポーネントを使って選択肢を作成
    this.menu = new Menu(this.scene, {
      x: this.questionPanel.x,      // X座標
      y: this.questionPanel.y,      // Y座標
      options: question.choices.map((choice, index) => `${index + 1}. ${choice}`),
      fontSize: UIConstants.FontSize.Normal, // フォントサイズ
      startY: -10,                  // 開始Y座標（コンテナ中心からのオフセット）
      spacing: 30,                  // 各項目の間隔
    });
    this.menu.on('selected', onChoiceSelected);
  }

  /**
   * クイズの回答結果（正解・不正解）を表示します。
   * 問題パネルを非表示にし、結果パネルに必要な情報をレイアウトして表示します。
   * @param isCorrect - 正解だったかどうか。
   * @param userAnswer - ユーザーが選択した回答。
   * @param correctAnswer - 正しい回答。
   * @param source - (任意) 問題の出典メタデータ。
   * @param sourceChunk - (任意) 問題の出典に関する詳細なテキスト。
   */
  public showResult(isCorrect: boolean, userAnswer: string, correctAnswer: string, source?: QuizData['source_metadata'], sourceChunk?: string): void {
    if (this.menu) this.menu.destroy();
    this.questionPanel.setVisible(false);
    this.resultPanel.setVisible(true);
    this.clearPanel(this.resultPanel);

    const resultMessage = isCorrect ? '正解！' : '不正解…';
    const resultColor = isCorrect ? UIConstants.Color.Green : UIConstants.Color.Red;

    const resultText = RetroUI.createSimpleText(this.scene, 0, -100, resultMessage, {
      fontSize: UIConstants.FontSize.Large,
      color: resultColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.resultPanel.add(resultText);

    const choiceInfo = `選択：${userAnswer}\n正解：${correctAnswer}`;
    const choiceText = RetroUI.createSimpleText(this.scene, 0, -50, choiceInfo, {
      fontSize: UIConstants.FontSize.Small,
      align: 'center'
    }).setOrigin(0.5);
    this.resultPanel.add(choiceText);

    if (source || sourceChunk) {
      this.showSourceInfo(source, sourceChunk);
    }

    const instructionText = RetroUI.createSimpleText(this.scene, 0, 130, 'Enter / Space / Esc キーで閉じる', {
      fontSize: UIConstants.FontSize.Small,
      color: UIConstants.Color.Grey
    }).setOrigin(0.5);
    this.resultPanel.add(instructionText);
  }

  /**
   * 問題の出典元に関する情報を結果パネル内に表示します。
   * @param source - 出典のメタデータ（ファイル名やページ番号など）。
   * @param sourceChunk - 出典の具体的なテキスト内容。
   * @private
   */
  private showSourceInfo(source?: QuizData['source_metadata'], sourceChunk?: string): void {
    if (!source || !sourceChunk) return;

    // 出典表示
    let sourceInfo = '出典：';
    if (source.file) {
      sourceInfo += source.file;
      if (source.page) {
        sourceInfo += `(p.${source.page})`;
      }
    } else {
      sourceInfo += '不明';
    }

    const sourceText = RetroUI.createSimpleText(this.scene, 0, -25, sourceInfo, {
      fontSize: UIConstants.FontSize.Small
    }).setOrigin(0.5);
    this.resultPanel.add(sourceText);

    // 区切り線
    const separator = RetroUI.createSimpleText(this.scene, 0, -10, '─'.repeat(40), {
      fontSize: '10px',
      fontFamily: UIConstants.FontFamily, // 12px未満のため通常フォント
      color: UIConstants.Color.DarkGrey
    }).setOrigin(0.5);
    this.resultPanel.add(separator);

    // スクロール可能なテキストエリア
    this.createScrollableText(sourceChunk);
  }

  /**
   * マウスホイールでスクロール可能なテキストエリアを作成し、出典の本文などを表示します。
   * マスク機能を使って、指定された領域内でのみテキストが表示されるように制御します。
   * @param chunk - 表示する長文テキスト。
   * @private
   */
  private createScrollableText(chunk: string): void {
    const scrollAreaWidth = 530;
    const scrollAreaHeight = 100;
    const scrollAreaYOffset = 50;

    const textContainer = this.scene.add.container(0, scrollAreaYOffset);
    this.resultPanel.add(textContainer);

    const chunkBg = this.scene.add.rectangle(0, 0, scrollAreaWidth, scrollAreaHeight, 0x1a1a1a, 0.8).setOrigin(0.5);
    textContainer.add(chunkBg);

    const chunkText = this.scene.add.text(
      -scrollAreaWidth / 2 + 5,
      -scrollAreaHeight / 2 + 5,
      chunk,
      {
        fontSize: UIConstants.FontSize.Small,
        fontFamily: UIConstants.FontFamily,
        color: UIConstants.Color.Grey,
        align: 'left',
        wordWrap: { width: scrollAreaWidth - 10, useAdvancedWrap: true },
        lineSpacing: 5
      }
    ).setOrigin(0);
    textContainer.add(chunkText);

    const maskGraphics = this.scene.make.graphics({});
    maskGraphics.fillRect(
      this.resultPanel.x - scrollAreaWidth / 2,
      this.resultPanel.y + scrollAreaYOffset - scrollAreaHeight / 2,
      scrollAreaWidth,
      scrollAreaHeight
    );
    textContainer.setMask(new Phaser.Display.Masks.GeometryMask(this.scene, maskGraphics));

    this.scene.input.on('wheel', (pointer: Phaser.Input.Pointer) => {
      const bounds = new Phaser.Geom.Rectangle(
        this.resultPanel.x - scrollAreaWidth / 2,
        this.resultPanel.y + scrollAreaYOffset - scrollAreaHeight / 2,
        scrollAreaWidth,
        scrollAreaHeight
      );
      if (bounds.contains(pointer.x, pointer.y)) {
        textContainer.y -= pointer.deltaY * 0.1;
        const maxScrollY = scrollAreaYOffset;
        const minScrollY = scrollAreaYOffset + scrollAreaHeight - chunkText.displayHeight - 10;
        textContainer.y = Phaser.Math.Clamp(textContainer.y, minScrollY, maxScrollY);
      }
    });
  }

  /**
   * 指定されたパネル（コンテナ）から、動的に追加されたUI要素（テキストなど）をすべて削除します。
   * パネルの背景と枠線（リストの最初の2要素）は残します。
   * @param panel - クリーンアップする対象のパネル。
   * @private
   */
  private clearPanel(panel: Phaser.GameObjects.Container): void {
    const childrenToRemove = panel.list.slice(2);
    panel.remove(childrenToRemove, true);
  }

  /**
   * このビューが保持しているすべてのUIゲームオブジェクトを破棄します。
   * シーンが終了する際に呼び出され、メモリリークを防ぎます。
   */
  public destroy(): void {
    this.overlay.destroy();
    this.questionPanel.destroy();
    this.resultPanel.destroy();
    if (this.menu) this.menu.destroy();
  }
}
