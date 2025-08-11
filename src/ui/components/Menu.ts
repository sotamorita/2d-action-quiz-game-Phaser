import Phaser from 'phaser';
import { UIConstants } from '../styles/UIConstants';

/**
 * @interface MenuConfig
 * @description
 * Menuクラスのコンストラクタに渡す設定オブジェクトの型定義です。
 * これにより、メニューの見た目や挙動を柔軟にカスタマイズできます。
 */
export interface MenuConfig {
  x: number;
  y: number;
  options: string[];
  startY?: number;
  spacing?: number;
  lineSpacing?: number;
  fontSize?: string;
  highlightColor?: string;
  highlightTextColor?: string;
  // 特定のインデックスのアイテムに適用するカスタムスタイル
  overrideStyles?: { [index: number]: Partial<Phaser.Types.GameObjects.Text.TextStyle> };
}

/**
 * @class Menu
 * @description
 * キーボード操作に完全に対応した、再利用可能なUIメニューコンポーネントです。
 * このクラスは、メニュー項目の表示、選択状態の管理、カーソル移動、決定処理といった、
 * メニュー機能に必要なすべてのロジックを自己完結してカプセル化しています。
 *
 * [設計思想]
 * - **コンポーネント化**: Phaser.GameObjects.Containerを継承し、メニューに関連するすべてのUI要素
 *   （テキスト、セレクター、ハイライト背景）を一つのまとまりとして扱えるように設計されています。
 *   これにより、どのシーンでも `new Menu(...)` とするだけで、簡単に高機能なメニューを設置できます。
 * - **設定オブジェクト(Config Pattern)**: コンストラクタに設定オブジェクトを渡すことで、
 *   位置、選択肢、スタイルなどを柔軟にカスタマイズできます。これにより、コードの可読性が向上し、
 *   将来的なオプションの追加も容易になります。
 * - **イベント駆動**: 選択が決定された際には、'selected'イベントを発行します。
 *   これにより、Menuクラス自体は「何が選択されたか」を知る必要がなく、
 *   呼び出し元のシーンがイベントをリッスンして具体的な処理（シーン遷移など）を実装できます。
 *   これは、クラスの責務を明確に分離し、再利用性を高めるための重要な設計です。
 *
 * @extends Phaser.GameObjects.Container
 */
export default class Menu extends Phaser.GameObjects.Container {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private selector!: Phaser.GameObjects.Text;
  private highlightRect!: Phaser.GameObjects.Rectangle;
  private options: string[];
  private config: Required<Omit<MenuConfig, 'x' | 'y' | 'overrideStyles'>> & Pick<MenuConfig, 'overrideStyles'>;

  /**
   * Menuクラスのインスタンスを生成します。
   * @param scene - このメニューコンポーネントが所属するシーン。
   * @param config - メニューの外観や挙動を定義する設定オブジェクト。
   */
  constructor(scene: Phaser.Scene, config: MenuConfig) {
    super(scene, config.x, config.y);

    this.options = config.options;
    this.config = {
      options: config.options,
      startY: config.startY ?? -50,
      spacing: config.spacing ?? 40,
      lineSpacing: config.lineSpacing ?? 0,
      fontSize: config.fontSize ?? UIConstants.FontSize.Large,
      highlightColor: config.highlightColor ?? UIConstants.Color.Yellow,
      highlightTextColor: config.highlightTextColor ?? UIConstants.Color.Black,
      overrideStyles: config.overrideStyles,
    };

    this.createMenuItems();
    this.updateSelection();
    this.setupInputHandlers();

    scene.add.existing(this);
  }

  /**
   * メニューのUI要素（テキスト、セレクター、ハイライト背景）を初期化し、組み立てます。
   * このメソッドはコンストラクタから一度だけ呼び出されます。
   * @private
   */
  private createMenuItems(): void {
    this.options.forEach((option, index) => {
      // 基本スタイルを定義
      const baseStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        fontSize: this.config.fontSize,
        fontFamily: UIConstants.FontFamily,
        color: UIConstants.Color.White,
      };

      // 特定のインデックスに対する上書きスタイルを取得
      const overrideStyle = this.config.overrideStyles?.[index] ?? {};

      // 基本スタイルと上書きスタイルをマージ
      const finalStyle = { ...baseStyle, ...overrideStyle };

      const y = this.config.startY + (index * (this.config.spacing + this.config.lineSpacing));
      const menuItem = this.scene.add.text(0, y, option, finalStyle)
        .setOrigin(0.5);
      this.add(menuItem);
      this.menuItems.push(menuItem);
    });

    // セレクターを作成
    this.selector = this.scene.add.text(0, 0, '▶', {
      fontSize: this.config.fontSize,
      fontFamily: UIConstants.FontFamily,
      color: UIConstants.Color.White,
    }).setOrigin(0.5);
    this.add(this.selector);

    // ハイライト用の長方形を作成
    this.highlightRect = this.scene.add.rectangle(0, 0, 0, 0, 0xffffff).setVisible(false);
    this.add(this.highlightRect);
    // 他のすべての要素の背後に表示
    this.sendToBack(this.highlightRect);
  }

  /**
   * メニュー操作に必要なキーボード入力（上、下、決定）のイベントリスナーを設定します。
   * `bind(this)` を使用して、コールバック関数内の `this` がMenuインスタンスを指すように固定しています。
   * @private
   */
  private setupInputHandlers(): void {
    this.scene.input.keyboard!.on('keydown-UP', this.moveSelection.bind(this, -1));
    this.scene.input.keyboard!.on('keydown-DOWN', this.moveSelection.bind(this, 1));
    this.scene.input.keyboard!.on('keydown-ENTER', this.confirmSelection.bind(this));
  }

  /**
   * メニューの選択項目を上下に移動させます。
   * 配列のインデックス計算により、選択がリストの端に達した際にループするように（例: 一番下からさらに下へ行くと一番上へ戻る）設計されています。
   * @param delta - 移動方向と量。上なら-1、下なら1。
   * @private
   */
  private moveSelection(delta: number): void {
    this.selectedIndex = (this.selectedIndex + delta + this.options.length) % this.options.length;
    this.updateSelection();
  }

  /**
   * 現在選択されている項目を「決定」として処理します。
   * 'selected' イベントを発行し、選択された項目のインデックスとテキストを通知します。
   * これにより、呼び出し元のシーンは、このイベントを捕捉して具体的なアクション（例: シーン遷移）を実行できます。
   * @private
   */
  private confirmSelection(): void {
    this.emit('selected', this.selectedIndex, this.options[this.selectedIndex]);
  }

  /**
   * 選択状態の変更に応じて、メニューの視覚的な表示（ハイライト）を更新します。
   * テキストの色、セレクター（▶）の位置、背景ハイライトの位置とサイズを調整します。
   * @private
   */
  private updateSelection(): void {
    this.menuItems.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      item.setStyle({
        color: isSelected ? this.config.highlightTextColor : UIConstants.Color.White,
      });
    });

    const selectedItem = this.menuItems[this.selectedIndex];

    // --- レイアウト微調整用の定数 ---
    const PADDING_X = 35; // ハイライトの左右の余白
    const PADDING_Y = 5; // ハイライトの上下の余白
    const SELECTOR_MARGIN = 15; // セレクター(▶)とテキストの間のスペース

    // ハイライト用の長方形の位置とサイズを更新
    this.highlightRect.setVisible(true);
    this.highlightRect.setPosition(selectedItem.x - 10, selectedItem.y);
    this.highlightRect.setSize(selectedItem.width + this.selector.width + PADDING_X, selectedItem.height + PADDING_Y);
    this.highlightRect.setFillStyle(Phaser.Display.Color.ValueToColor(this.config.highlightColor).color, 1);

    // セレクターの位置を更新
    this.selector.y = selectedItem.y;
    const textWidth = selectedItem.getBounds().width;
    this.selector.x = selectedItem.x - (textWidth / 2) - SELECTOR_MARGIN;
    this.selector.setColor(this.config.highlightTextColor);
  }

  /**
   * このメニューオブジェクトが破棄される際に、設定したキーボードイベントリスナーをすべて削除します。
   * これを怠ると、シーンを切り替えた後も古いイベントリスナーが残り続け、メモリリークや予期せぬバグの原因となります。
   * Phaserのライフサイクル管理において非常に重要なクリーンアップ処理です。
   * @param fromScene - シーンのシャットダウンに伴う破棄の場合はtrue。
   */
  public destroy(fromScene?: boolean): void {
    if (this.scene && this.scene.input && this.scene.input.keyboard) {
      this.scene.input.keyboard.off('keydown-UP', this.moveSelection);
      this.scene.input.keyboard.off('keydown-DOWN', this.moveSelection);
      this.scene.input.keyboard.off('keydown-ENTER', this.confirmSelection);
    }
    super.destroy(fromScene);
  }
}
