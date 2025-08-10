import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';

export default class TitleScene extends Phaser.Scene {
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private menuOptions = ['ゲームスタート'];
  private panel!: Phaser.GameObjects.Container;

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

  create() {
    // 初期化：配列をクリア
    this.menuItems = [];
    this.selectedIndex = 0;

    // レトロ風UIパネル作成
    const { overlay, panel } = RetroUI.createPanel(this, 320, 200, 400, 250);
    this.panel = panel;

    // タイトルテキスト
    RetroUI.createTitle(this, this.panel, 'レトロ・クイズ・アクション', -80, '28px');

    // メニューアイテム作成
    this.menuItems = RetroUI.createMenuItems(
      this,
      this.menuOptions,
      this.panel,
      -20,
      40,
      '24px'
    );

    // キー入力設定
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    upKey.on('down', this.onUpKey, this);
    downKey.on('down', this.onDownKey, this);
    enterKey.on('down', this.onEnterKey, this);

    // 初期ハイライト設定
    this.updateMenuHighlight();

    // 操作説明
    RetroUI.createInstructionText(
      this,
      this.panel,
      '↑/↓: 選択  Enter: 決定',
      60,
      '14px'
    );

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  private updateMenuHighlight() {
    RetroUI.updateSelection(this.menuItems, this.selectedIndex, this.menuOptions);
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
