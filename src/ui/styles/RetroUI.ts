import Phaser from 'phaser';
import { UIConstants } from './UIConstants';

/**
 * @class RetroUI
 * @description
 * ゲーム全体で一貫したレトロ風のUIコンポーネントを生成するための静的ユーティリティクラスです。
 * このクラスは、インスタンスを作成せず、静的メソッド（`RetroUI.createPanel()`など）を直接呼び出して使用します。
 *
 * [設計思想]
 * - **ユーティリティクラス**: UI要素の生成という共通の関心事を一箇所に集約しています。
 *   静的メソッドのみで構成することで、状態を持たず、どこからでも安全に呼び出せるようにしています。
 *   これにより、各シーンのコードがUIの具体的な描画ロジックで煩雑になるのを防ぎ、
 *   「どのようなUIを生成するか」という宣言的な記述に集中できます。
 * - **一貫性の強制**: `UIConstants`からフォント、色、サイズなどの定義を一元的に参照することで、
 *   ゲーム全体のUIに統一感を持たせています。UIのスタイルを修正したい場合、
 *   `UIConstants.ts` を変更するだけで、このクラスを通じて生成されるすべてのUIに一括で反映されます。
 * - **再利用性の促進**: パネルやタイトル、説明文といった頻繁に使用されるUI部品の生成ロジックをメソッド化することで、
 *   コードの重複を削減し、開発効率を向上させています。
 */
export class RetroUI {
  /**
   * ポーズ画面や結果表示などで使用する、画面中央の基本的なUIパネルを生成します。
   * 背景を暗くする半透明のオーバーレイと、コンテンツを表示する本体パネルで構成されます。
   * @param scene - このUIを描画する対象のPhaserシーン。
   * @param x - パネルの中心X座標。
   * @param y - パネルの中心Y座標。
   * @param width - パネルの幅。
   * @param height - パネルの高さ。
   * @returns {object} 生成されたオーバーレイとパネル本体（コンテナ）を含むオブジェクト。
   *                   `overlay`はシーン全体を覆い、`panel`はその上に表示されるコンテンツの土台となります。
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
   * パネルやシーンのタイトルとして使用する、大きめのテキストオブジェクトを生成します。
   * スタイルは`UIConstants`で定義されたデフォルト値に基づきますが、個別に上書きも可能です。
   * @param scene - 対象のPhaserシーン。
   * @param container - このテキストオブジェクトを追加する親コンテナ。
   * @param text - 表示する文字列。
   * @param y - 親コンテナ内でのY座標のオフセット。
   * @param style - (任意) デフォルトのスタイルを上書きするためのPhaserテキストスタイルオブジェクト。
   * @returns {Phaser.GameObjects.Text} 生成されたテキストオブジェクト。
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
   * 操作説明や補足情報など、小さめのテキストを生成します。
   * デフォルトでは少しグレーがかった色で表示され、主要な情報と視覚的に区別されます。
   * @param scene - 対象のPhaserシーン。
   * @param container - このテキストオブジェクトを追加する親コンテナ。
   * @param text - 表示する文字列。改行を含めることも可能です。
   * @param y - 親コンテナ内でのY座標のオフセット。
   * @param style - (任意) デフォルトのスタイルを上書きするためのPhaserテキストスタイルオブジェクト。
   * @returns {Phaser.GameObjects.Text} 生成されたテキストオブジェクト。
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
   * 特定のコンテナに属さない、汎用的なテキストオブジェクトを生成します。
   * スコア表示など、UIの特定の位置に固定で表示するテキストに適しています。
   * @param scene - 対象のPhaserシーン。
   * @param x - シーン内での絶対X座標。
   * @param y - シーン内での絶対Y座標。
   * @param text - 表示する文字列。
   * @param style - (任意) デフォルトのスタイルを上書きするためのPhaserテキストスタイルオブジェクト。
   * @returns {Phaser.GameObjects.Text} 生成されたテキストオブジェクト。
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
