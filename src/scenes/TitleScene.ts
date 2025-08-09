import Phaser from 'phaser';
import { CommonBackground } from '../ui/CommonBackground';

export default class TitleScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private menuOptions = ['ゲームスタート'];

  // キー入力ハンドラー（クリーンアップ用）
  private onUpKey = () => {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    this.updateMenuHighlight();
  };

  private onDownKey = () => {
    this.selectedIndex = Math.min(this.menuOptions.length - 1, this.selectedIndex + 1);
    this.updateMenuHighlight();
  };

  private onEnterKey = () => {
    if (this.selectedIndex === 0) {
      // ゲームスタート
      this.scene.start('StageSelectScene');
    }
  };

  constructor() {
    super('TitleScene');
  }

  preload() {
    // 共通背景アセットを読み込み
    CommonBackground.preloadBackgroundAssets(this);
  }

  create() {
    // 初期化：配列をクリア
    this.menuItems = [];
    this.selectedIndex = 0;

    // 共通背景描画
    CommonBackground.drawGameBackground(this);

    // タイトルテキスト
    const titleText = this.add.text(320, 150, 'レトロ・クイズ・アクション', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5).setScrollFactor(0);

    // メニュー作成
    this.createMenu();

    // キー入力設定
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    upKey.on('down', this.onUpKey, this);
    downKey.on('down', this.onDownKey, this);
    enterKey.on('down', this.onEnterKey, this);

    // 初期ハイライト設定（メニュー作成後に実行）
    this.updateMenuHighlight();

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  private createMenu() {
    const startY = 250;
    const spacing = 40;

    this.menuOptions.forEach((option, index) => {
      const menuText = this.add.text(320, startY + (index * spacing), option, {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5).setScrollFactor(0);

      this.menuItems.push(menuText);
    });
  }

  private updateMenuHighlight() {
    // メニューアイテムが存在しない場合は何もしない
    if (!this.menuItems || this.menuItems.length === 0) {
      return;
    }

    this.menuItems.forEach((item, index) => {
      // アイテムが有効かチェック
      if (!item || !item.active) {
        return;
      }

      if (index === this.selectedIndex) {
        // 選択中：黄色背景 + 黒文字
        item.setStyle({
          fontSize: '24px',
          color: '#000000',
          backgroundColor: '#ffff00',
          padding: { x: 10, y: 5 }
        });
      } else {
        // 非選択：白文字
        item.setStyle({
          fontSize: '24px',
          color: '#ffffff',
          backgroundColor: 'transparent',
          padding: { x: 0, y: 0 }
        });
      }
    });
  }

  private cleanup() {
    // キー入力ハンドラーの解除
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    upKey.off('down', this.onUpKey, this);
    downKey.off('down', this.onDownKey, this);
    enterKey.off('down', this.onEnterKey, this);
  }
}
