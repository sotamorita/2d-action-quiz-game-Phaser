import Phaser from 'phaser';
import { RetroUI } from '../ui/RetroUI';

interface ClearSceneData {
  stageId: string;
  mapPath: string;
  score: number;
}

export default class ClearScene extends Phaser.Scene {
  private stageId!: string;
  private mapPath!: string;
  private score!: number;
  private selectedIndex = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private menuOptions = ['再挑戦', 'タイトルへ戻る'];
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

  private onRKey = () => {
    // Rキーで再挑戦（従来の動作を維持）
    this.executeAction(0);
  };

  private onTKey = () => {
    // Tキーでタイトル（従来の動作を維持）
    this.executeAction(1);
  };

  constructor() {
    super('ClearScene');
  }

  init(data: any) {
    // データの型安全性チェック
    if (!data || typeof data.stageId !== 'string' || typeof data.mapPath !== 'string' || typeof data.score !== 'number') {
      console.warn('ClearScene: Invalid data received', data);
      // デフォルト値設定
      this.stageId = 'level1';
      this.mapPath = 'assets/maps/level1.json';
      this.score = 0;
    } else {
      this.stageId = data.stageId;
      this.mapPath = data.mapPath;
      this.score = data.score;
    }
    this.selectedIndex = 0;
  }

  create() {
    // レトロ風UIパネル作成
    const { overlay, panel } = RetroUI.createPanel(this, 320, 200, 400, 320);
    this.panel = panel;

    // メインタイトル「STAGE CLEAR!」
    RetroUI.createTitle(this, this.panel, 'STAGE CLEAR!', -120, '36px', '#00ff00');

    // スコア表示
    this.add.text(0, -70, `SCORE: ${this.score}`, {
      fontSize: '28px',
      color: '#ffff00'
    }).setOrigin(0.5);
    this.panel.add(this.panel.list[this.panel.list.length - 1]);

    // メニューアイテム作成
    this.menuItems = RetroUI.createMenuItems(
      this,
      this.menuOptions,
      this.panel,
      -10,
      35,
      '20px'
    );

    // キー入力設定
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    upKey.on('down', this.onUpKey, this);
    downKey.on('down', this.onDownKey, this);
    enterKey.on('down', this.onEnterKey, this);
    rKey.on('down', this.onRKey, this);
    tKey.on('down', this.onTKey, this);

    // 初期ハイライト設定
    this.updateMenuHighlight();

    // 操作説明
    RetroUI.createInstructionText(
      this,
      this.panel,
      '↑/↓: 選択  Enter: 決定\nR: 再挑戦  T: タイトル',
      100,
      '12px'
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
      case 0: // 再挑戦
        this.scene.start('GameScene', {
          stageId: this.stageId,
          mapPath: this.mapPath
        });
        break;
      case 1: // タイトルへ戻る
        this.scene.start('TitleScene');
        break;
    }
  }

  private cleanup() {
    // キー入力ハンドラーの解除
    const upKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    const downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    const enterKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    const rKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const tKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.T);

    upKey.off('down', this.onUpKey, this);
    downKey.off('down', this.onDownKey, this);
    enterKey.off('down', this.onEnterKey, this);
    rKey.off('down', this.onRKey, this);
    tKey.off('down', this.onTKey, this);
  }
}
