import Phaser from 'phaser';
import { UIConstants } from './UIConstants';

/**
 * ゲーム全体で共通して使用されるUI部品を作成するためのユーティリティクラス
 * 静的メソッドのみで構成される
 */
export class RetroUI {
  /**
   * 半透明のオーバーレイと中央パネルを持つ、基本的なUIパネルを作成します。
   * @param scene - 対象のシーン
   * @param x - パネルの中心X座標
   * @param y - パネルの中心Y座標
   * @param width - パネルの幅
   * @param height - パネルの高さ
   * @returns 作成されたオーバーレイとパネルのオブジェクト
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
   * タイトル用の大きなテキストを作成します。
   * @param scene - 対象のシーン
   * @param container - テキストを追加するコンテナ
   * @param text - 表示するテキスト
   * @param y - コンテナ内のY座標
   * @param style - デフォルトのスタイルを上書きするスタイルオブジェクト (例: { color: '#ff0000', fontSize: '40px' })
   * @returns 作成されたテキストオブジェクト
   */
  static createTitle(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    text: string,
    y: number = -100,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: UIConstants.FontSize.Title,
      fontFamily: UIConstants.FontFamily,
      color: UIConstants.Color.White,
    };
    const mergedStyle = { ...defaultStyle, ...style };
    const titleText = scene.add.text(0, y, text, mergedStyle).setOrigin(0.5);

    container.add(titleText);
    return titleText;
  }

  /**
   * 説明文用の小さなテキストを作成します。
   * @param scene - 対象のシーン
   * @param container - テキストを追加するコンテナ
   * @param text - 表示するテキスト
   * @param y - コンテナ内のY座標
   * @param style - デフォルトのスタイルを上書きするスタイルオブジェクト (例: { lineSpacing: 10 })
   * @returns 作成されたテキストオブジェクト
   */
  static createInstructionText(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    text: string,
    y: number = 100,
    style?: Phaser.Types.GameObjects.Text.TextStyle
  ): Phaser.GameObjects.Text {
    const defaultStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: UIConstants.FontSize.Small,
      fontFamily: UIConstants.FontFamily,
      color: UIConstants.Color.Grey,
      align: 'center',
      lineSpacing: UIConstants.Text.LineSpacing,
    };
    const mergedStyle = { ...defaultStyle, ...style };
    const instructionText = scene.add.text(0, y, text, mergedStyle).setOrigin(0.5);

    container.add(instructionText);
    return instructionText;
  }

  /**
   * 汎用的なテキストを作成します。
   * @param scene - 対象のシーン
   * @param x - X座標
   * @param y - Y座標
   * @param text - 表示するテキスト
   * @param style - デフォルトのスタイルを上書きするスタイルオブジェクト
   * @returns 作成されたテキストオブジェクト
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
      lineSpacing: UIConstants.Text.LineSpacing
    };
    const mergedStyle = { ...defaultStyle, ...style };

    // 12px未満のフォントはデフォルトのsans-serifを使用
    if (mergedStyle.fontSize && parseInt(String(mergedStyle.fontSize)) < 12) {
      delete mergedStyle.fontFamily;
    }

    return scene.add.text(x, y, text, mergedStyle);
  }
}
