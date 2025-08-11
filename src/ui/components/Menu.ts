import Phaser from 'phaser';
import { UIConstants } from '../UIConstants';

/**
 * メニューの設定オブジェクトのインターフェース
 */
export interface MenuConfig {
  x: number;
  y: number;
  options: string[];
  startY?: number;
  spacing?: number;
  fontSize?: string;
  highlightColor?: string;
  highlightTextColor?: string;
}

/**
 * キーボードで操作可能なメニューUIコンポーネント。
 * 選択状態の管理、入力処理、ハイライト表示などをすべてカプセル化する。
 * @extends Phaser.GameObjects.Container
 */
export default class Menu extends Phaser.GameObjects.Container {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private selector!: Phaser.GameObjects.Text;
  private highlightRect!: Phaser.GameObjects.Rectangle;
  private options: string[];
  private config: Required<Omit<MenuConfig, 'x' | 'y'>>;

  /**
   * @param scene - このメニューを追加するシーン
   * @param config - メニューの設定オブジェクト
   * @param config.x - メニューコンテナの中心X座標
   * @param config.y - メニューコンテナの中心Y座標
   * @param config.options - 表示する選択肢の文字列配列
   * @param config.startY - (オプション) コンテナ中心からのメニュー項目の初期Y座標オフセット
   * @param config.spacing - (オプション) 各メニュー項目の間隔
   * @param config.fontSize - (オプション) フォントサイズ
   * @param config.highlightColor - (オプション) 選択時の背景色
   * @param config.highlightTextColor - (オプション) 選択時の文字色
   */
  constructor(scene: Phaser.Scene, config: MenuConfig) {
    super(scene, config.x, config.y);

    this.options = config.options;
    this.config = {
      options: config.options,
      startY: config.startY ?? -50,
      spacing: config.spacing ?? 40,
      fontSize: config.fontSize ?? UIConstants.FontSize.Large,
      highlightColor: config.highlightColor ?? UIConstants.Color.Yellow,
      highlightTextColor: config.highlightTextColor ?? UIConstants.Color.Black,
    };

    this.createMenuItems();
    this.updateSelection();
    this.setupInputHandlers();

    scene.add.existing(this);
  }

  /**
   * メニュー項目とセレクター、ハイライト用のUI要素を作成する
   * @private
   */
  private createMenuItems(): void {
    this.options.forEach((option, index) => {
      const style = {
        fontSize: this.config.fontSize,
        fontFamily: UIConstants.FontFamily,
        color: UIConstants.Color.White,
      };
      const y = this.config.startY + (index * this.config.spacing);
      const menuItem = this.scene.add.text(0, y, option, style).setOrigin(0.5);
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
   * キーボード入力（UP, DOWN, ENTER）のハンドラを設定する
   * @private
   */
  private setupInputHandlers(): void {
    this.scene.input.keyboard!.on('keydown-UP', this.moveSelection.bind(this, -1));
    this.scene.input.keyboard!.on('keydown-DOWN', this.moveSelection.bind(this, 1));
    this.scene.input.keyboard!.on('keydown-ENTER', this.confirmSelection.bind(this));
  }

  /**
   * 選択項目を上下に移動させる
   * @param delta - 移動量 (-1 or 1)
   * @private
   */
  private moveSelection(delta: number): void {
    this.selectedIndex = (this.selectedIndex + delta + this.options.length) % this.options.length;
    this.updateSelection();
  }

  /**
   * 現在選択されている項目を決定し、'selected'イベントを発行する
   * @private
   */
  private confirmSelection(): void {
    this.emit('selected', this.selectedIndex, this.options[this.selectedIndex]);
  }

  /**
   * メニューのハイライト表示を更新する
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
   * シーン終了時にキーボードイベントをクリーンアップする
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
