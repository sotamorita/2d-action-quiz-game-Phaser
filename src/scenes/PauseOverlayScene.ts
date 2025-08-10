import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';

export default class PauseOverlayScene extends Phaser.Scene {
  private stageId?: string;
  private mapPath?: string;
  private returnScene?: string;
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private menuOptions = ['コンティニュー', 'リトライ', 'タイトルへ戻る'];
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
    this.executeSelectedAction();
  };

  private onEscKey = () => {
    // ESCキーでコンティニュー（従来の動作を維持）
    this.executeAction(0);
  };

  private onRKey = () => {
    // Rキーでリトライ（従来の動作を維持）
    this.executeAction(1);
  };

  private onTKey = () => {
    // Tキーでタイトル（従来の動作を維持）
    this.executeAction(2);
  };

  constructor() {
    super('PauseOverlayScene');
  }

  init(data: { stageId?: string; mapPath?: string; returnScene?: string }) {
    // データを受け取り
    this.stageId = data.stageId;
    this.mapPath = data.mapPath;
    this.returnScene = data.returnScene;
    this.selectedIndex = 0;
  }

  create() {
    // レトロ風UIパネル作成
    const { overlay, panel } = RetroUI.createPanel(this, 320, 160, 350, 280, 0.7); // Y座標を160に調整
    this.panel = panel;

    // タイトルテキスト
    RetroUI.createTitle(this, this.panel, 'ポーズ', -80, '32px'); // Y座標を-80に調整

    // メニューアイテム作成
    this.menuItems = RetroUI.createMenuItems(
      this,
      this.menuOptions,
      this.panel,
      -20, // Y座標を-20に調整
      35,
      '20px'
    );

    // キー入力設定
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    upKey.on('down', this.onUpKey, this);
    downKey.on('down', this.onDownKey, this);
    enterKey.on('down', this.onEnterKey, this);
    escKey.on('down', this.onEscKey, this);
    rKey.on('down', this.onRKey, this);
    tKey.on('down', this.onTKey, this);

    // 初期ハイライト設定
    this.updateMenuHighlight();

    // 操作説明
    RetroUI.createInstructionText(
      this,
      this.panel,
      '↑/↓: 選択  Enter: 決定',
      80, // Y座標を80に調整
      '14px'
    );
    RetroUI.createInstructionText(
      this,
      this.panel,
      'ESC: コンティニュー  R: リトライ  T: タイトル',
      100, // Y座標を100に調整
      '14px'
    );

    // クリーンアップ設定
    this.events.once('shutdown', this.cleanup, this);
    this.events.once('destroy', this.cleanup, this);
  }

  private updateMenuHighlight() {
    RetroUI.updateSelection(this.menuItems, this.selectedIndex, this.menuOptions);
  }

  private executeSelectedAction() {
    this.executeAction(this.selectedIndex);
  }

  private executeAction(actionIndex: number) {
    switch (actionIndex) {
      case 0: // コンティニュー
        this.scene.resume('GameScene');
        this.scene.stop();
        break;
      case 1: // リトライ
        this.scene.resume('GameScene');
        this.scene.stop('GameScene');
        this.scene.stop();
        this.scene.start('GameScene', {
          stageId: this.stageId,
          mapPath: this.mapPath
        });
        break;
      case 2: // タイトルへ戻る
        this.scene.resume('GameScene');
        this.scene.stop('GameScene');
        this.scene.stop();
        this.scene.start('TitleScene');
        break;
    }
  }

  private cleanup() {
    // キー入力ハンドラーの解除
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    upKey.off('down', this.onUpKey, this);
    downKey.off('down', this.onDownKey, this);
    enterKey.off('down', this.onEnterKey, this);
    escKey.off('down', this.onEscKey, this);
    rKey.off('down', this.onRKey, this);
    tKey.off('down', this.onTKey, this);
  }
}
