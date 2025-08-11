import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';
import { QuizData } from './QuizDataManager';

// UIのレイアウトやスタイルに関する定数
const UIConstants = {
  PANEL_WIDTH: 500,
  PANEL_HEIGHT: 250,
  RESULT_PANEL_WIDTH: 550,
  RESULT_PANEL_HEIGHT: 300,
  CENTER_X: 320,
  CENTER_Y: 160,

  QUESTION_FONT_SIZE: '16px',
  CHOICE_FONT_SIZE: '14px',
  RESULT_FONT_SIZE: '20px',
  SOURCE_FONT_SIZE: '12px',

  COLOR_WHITE: '#ffffff',
  COLOR_BLACK: '#000000',
  COLOR_YELLOW: '#ffff00',
  COLOR_GREEN: '#00ff00',
  COLOR_RED: '#ff0000',
  COLOR_GREY: '#cccccc',
  COLOR_DARK_GREY: '#666666',
  BG_COLOR_ALPHA: 0.6,
  PANEL_BG_ALPHA: 0.8,
};

/**
 * クイズシーンのUI要素の作成と更新を担当するクラス
 */
export default class QuizUI {
  private overlay!: Phaser.GameObjects.Rectangle;
  private questionPanel!: Phaser.GameObjects.Container;
  private resultPanel!: Phaser.GameObjects.Container;
  private choiceTexts: Phaser.GameObjects.Text[] = [];

  constructor(private scene: Phaser.Scene) {
    this.createPanels();
  }

  private createPanels(): void {
    // 半透明黒のオーバーレイ
    this.overlay = this.scene.add.rectangle(
      UIConstants.CENTER_X,
      UIConstants.CENTER_Y,
      640,
      320,
      0x000000,
      UIConstants.BG_COLOR_ALPHA
    );

    // 問題表示用パネル
    this.questionPanel = this.createPanel(UIConstants.PANEL_WIDTH, UIConstants.PANEL_HEIGHT);

    // 結果表示用パネル
    this.resultPanel = this.createPanel(UIConstants.RESULT_PANEL_WIDTH, UIConstants.RESULT_PANEL_HEIGHT);
    this.resultPanel.setVisible(false);
  }

  private createPanel(width: number, height: number): Phaser.GameObjects.Container {
    const container = this.scene.add.container(UIConstants.CENTER_X, UIConstants.CENTER_Y);
    const bg = this.scene.add.rectangle(0, 0, width, height, 0x000000, UIConstants.PANEL_BG_ALPHA);
    const border = this.scene.add.rectangle(0, 0, width, height, 0xffffff, 0);
    border.setStrokeStyle(4, 0xffffff);
    container.add([bg, border]);
    return container;
  }

  public showQuestion(question: QuizData, onChoiceSelected: (index: number) => void): void {
    this.questionPanel.setVisible(true);
    this.resultPanel.setVisible(false);
    this.clearPanel(this.questionPanel); // 前の問題をクリア

    // 問題文
    const questionText = RetroUI.createSimpleText(this.scene, 0, -60, question.question, {
      fontSize: UIConstants.QUESTION_FONT_SIZE,
      align: 'center',
      wordWrap: { width: UIConstants.PANEL_WIDTH - 20, useAdvancedWrap: true }
    }).setOrigin(0.5);
    this.questionPanel.add(questionText);

    // 選択肢
    this.choiceTexts = [];
    question.choices.forEach((choice, index) => {
      const choiceText = RetroUI.createSimpleText(this.scene, 0, -20 + index * 30, `${index + 1}. ${choice}`, {
        fontSize: UIConstants.CHOICE_FONT_SIZE,
      }).setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => onChoiceSelected(index));

      this.choiceTexts.push(choiceText);
      this.questionPanel.add(choiceText);
    });
  }

  public updateSelection(selectedIndex: number, choices: string[]): void {
    this.choiceTexts.forEach((text, index) => {
      if (!text.scene || !text.active) return;
      const isSelected = index === selectedIndex;
      text.setText(`${isSelected ? '▶ ' : ''}${index + 1}. ${choices[index]}`);
      text.setStyle({
        backgroundColor: isSelected ? UIConstants.COLOR_YELLOW : 'transparent',
        color: isSelected ? UIConstants.COLOR_BLACK : UIConstants.COLOR_WHITE
      });
    });
  }

  public showResult(isCorrect: boolean, userAnswer: string, correctAnswer: string, source?: QuizData['source_metadata'], sourceChunk?: string): void {
    this.questionPanel.setVisible(false);
    this.resultPanel.setVisible(true);
    this.clearPanel(this.resultPanel);

    const resultMessage = isCorrect ? '正解！' : '不正解…';
    const resultColor = isCorrect ? UIConstants.COLOR_GREEN : UIConstants.COLOR_RED;

    // 正解/不正解
    const resultText = RetroUI.createSimpleText(this.scene, 0, -100, resultMessage, {
      fontSize: UIConstants.RESULT_FONT_SIZE,
      color: resultColor,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.resultPanel.add(resultText);

    // 回答
    const choiceInfo = `選択：${userAnswer}\n正解：${correctAnswer}`;
    const choiceText = RetroUI.createSimpleText(this.scene, 0, -50, choiceInfo, {
      fontSize: UIConstants.CHOICE_FONT_SIZE,
      align: 'center'
    }).setOrigin(0.5);
    this.resultPanel.add(choiceText);

    // 出典
    if (source || sourceChunk) {
      this.showSourceInfo(source, sourceChunk);
    }

    // 操作説明
    const instructionText = RetroUI.createSimpleText(this.scene, 0, 130, 'Enter / Space / Esc キーで閉じる', {
      fontSize: UIConstants.SOURCE_FONT_SIZE,
      color: UIConstants.COLOR_GREY
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
      fontSize: UIConstants.SOURCE_FONT_SIZE
    }).setOrigin(0.5);
    this.resultPanel.add(sourceText);

    // 区切り線
    const separator = RetroUI.createSimpleText(this.scene, 0, -10, '─'.repeat(40), {
      fontSize: '10px',
      color: UIConstants.COLOR_DARK_GREY
    }).setOrigin(0.5);
    this.resultPanel.add(separator);

    // スクロール可能なテキストエリア
    this.createScrollableText(sourceChunk);
  }

  private createScrollableText(chunk: string): void {
    const scrollAreaWidth = UIConstants.RESULT_PANEL_WIDTH - 20;
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
        fontSize: UIConstants.SOURCE_FONT_SIZE,
        fontFamily: 'DotGothic16, sans-serif',
        color: UIConstants.COLOR_GREY,
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
    // パネルの子要素を削除（背景とボーダーは除く）
    const childrenToRemove = panel.list.slice(2);
    panel.remove(childrenToRemove, true);
  }

  public destroy(): void {
    this.overlay.destroy();
    this.questionPanel.destroy();
    this.resultPanel.destroy();
  }
}
