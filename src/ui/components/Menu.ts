import Phaser from 'phaser';
import { UIConstants } from '../UIConstants';

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
 * 選択可能なメニューUIコンポーネント
 * 状態管理と入力処理をカプセル化する
 */
export default class Menu extends Phaser.GameObjects.Container {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private options: string[];
  private config: Required<Omit<MenuConfig, 'x' | 'y'>>;

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
  }

  private setupInputHandlers(): void {
    this.scene.input.keyboard!.on('keydown-UP', this.moveSelection.bind(this, -1));
    this.scene.input.keyboard!.on('keydown-DOWN', this.moveSelection.bind(this, 1));
    this.scene.input.keyboard!.on('keydown-ENTER', this.confirmSelection.bind(this));
  }

  private moveSelection(delta: number): void {
    this.selectedIndex = (this.selectedIndex + delta + this.options.length) % this.options.length;
    this.updateSelection();
  }

  private confirmSelection(): void {
    this.emit('selected', this.selectedIndex, this.options[this.selectedIndex]);
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, index) => {
      const isSelected = index === this.selectedIndex;
      item.setText(`${isSelected ? '▶ ' : ''}${this.options[index]}`);
      item.setStyle({
        backgroundColor: isSelected ? this.config.highlightColor : 'transparent',
        color: isSelected ? this.config.highlightTextColor : UIConstants.Color.White,
        padding: { x: 10, y: 5 }
      });
    });
  }

  // シーン終了時にキーボードイベントをクリーンアップする
  public destroy(fromScene?: boolean): void {
    this.scene.input.keyboard!.off('keydown-UP', this.moveSelection);
    this.scene.input.keyboard!.off('keydown-DOWN', this.moveSelection);
    this.scene.input.keyboard!.off('keydown-ENTER', this.confirmSelection);
    super.destroy(fromScene);
  }
}
