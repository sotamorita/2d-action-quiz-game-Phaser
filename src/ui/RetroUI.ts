import Phaser from 'phaser';
import { UIConstants } from './UIConstants';

export class RetroUI {
  /**
   * レトロ風パネルを作成（半透明黒オーバーレイ + 中央パネル（太枠・直角））
   */
  static createPanel(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number
  ): { overlay: Phaser.GameObjects.Rectangle; panel: Phaser.GameObjects.Container } {
    // 半透明黒のオーバーレイ
    const overlay = scene.add.rectangle(
      scene.cameras.main.width / 2,
      scene.cameras.main.height / 2,
      scene.cameras.main.width,
      scene.cameras.main.height,
      UIConstants.Overlay.BgColor,
      UIConstants.Overlay.BgAlpha
    );
    overlay.setScrollFactor(0);

    // 中央パネル（太枠・直角）
    const panel = scene.add.container(x, y);
    const panelBg = scene.add.rectangle(0, 0, width, height, UIConstants.Panel.BgColor, UIConstants.Panel.BgAlpha);
    const panelBorder = scene.add.rectangle(0, 0, width, height, UIConstants.Panel.BorderColor, 0);
    panelBorder.setStrokeStyle(UIConstants.Panel.BorderWidth, UIConstants.Panel.BorderColor);

    panel.add([panelBg, panelBorder]);
    panel.setScrollFactor(0);

    return { overlay, panel };
  }

  /**
   * タイトルテキストを作成
   */
  static createTitle(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    text: string,
    y: number = -100
  ): Phaser.GameObjects.Text {
    const titleText = scene.add.text(0, y, text, {
      fontSize: UIConstants.FontSize.Title,
      fontFamily: UIConstants.FontFamily,
      color: UIConstants.Color.White
    }).setOrigin(0.5);

    container.add(titleText);
    return titleText;
  }

  /**
   * 説明テキストを作成
   */
  static createInstructionText(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    text: string,
    y: number = 100,
    wordWrapWidth?: number
  ): Phaser.GameObjects.Text {
    const style: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: UIConstants.FontSize.Small,
      fontFamily: UIConstants.FontFamily,
      color: UIConstants.Color.Grey,
      align: 'center'
    };

    if (wordWrapWidth) {
      style.wordWrap = { width: wordWrapWidth, useAdvancedWrap: true };
    }

    const instructionText = scene.add.text(0, y, text, style).setOrigin(0.5);
    container.add(instructionText);
    return instructionText;
  }

  /**
   * 汎用的なテキストを作成（DotGothic16フォントをデフォルトで適用）
   */
  static createSimpleText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: UIConstants.FontFamily,
      color: UIConstants.Color.White,
      fontSize: UIConstants.FontSize.Normal,
      lineSpacing: 5
    };
    const mergedStyle = { ...defaultStyle, ...style };

    // 12px未満のフォントはデフォルトのsans-serifを使用
    if (mergedStyle.fontSize && parseInt(String(mergedStyle.fontSize)) < 12) {
      delete mergedStyle.fontFamily;
    }

    return scene.add.text(x, y, text, mergedStyle);
  }
}
