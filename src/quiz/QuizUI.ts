import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';
import { QuizData } from './QuizDataManager';
import { UIConstants } from '../ui/UIConstants';
import Menu from '../ui/components/Menu';

/**
 * クイズシーンのUI要素の作成と更新を担当するクラス
 */
export default class QuizUI {
  private overlay!: Phaser.GameObjects.Rectangle;
  private questionPanel!: Phaser.GameObjects.Container;
  private resultPanel!: Phaser.GameObjects.Container;
  public menu!: Menu;

  constructor(private scene: Phaser.Scene) {
    this.createPanels();
  }

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

  private createPanel(x: number, y: number, width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const bg = this.scene.add.rectangle(0, 0, width, height, UIConstants.Panel.BgColor, UIConstants.Panel.BgAlpha);
    const border = this.scene.add.rectangle(0, 0, width, height, 0, 0).setStrokeStyle(UIConstants.Panel.BorderWidth, UIConstants.Panel.BorderColor);
    container.add([bg, border]);
    return container;
  }

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
      x: this.questionPanel.x,
      y: this.questionPanel.y,
      options: question.choices.map((choice, index) => `${index + 1}. ${choice}`),
      fontSize: UIConstants.FontSize.Normal,
      startY: -10, // パネル中心からの固定オフセット
      spacing: 30,
    });
    this.menu.on('selected', onChoiceSelected);
  }

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
      fontFamily: UIConstants.FontFamily.Main, // 12px未満のため通常フォント
      color: UIConstants.Color.DarkGrey
    }).setOrigin(0.5);
    this.resultPanel.add(separator);

    // スクロール可能なテキストエリア
    this.createScrollableText(sourceChunk);
  }

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

  private clearPanel(panel: Phaser.GameObjects.Container): void {
    const childrenToRemove = panel.list.slice(2);
    panel.remove(childrenToRemove, true);
  }

  public destroy(): void {
    this.overlay.destroy();
    this.questionPanel.destroy();
    this.resultPanel.destroy();
    if (this.menu) this.menu.destroy();
  }
}
